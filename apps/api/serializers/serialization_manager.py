"""Serialization manager — orchestrates candidate serialization across all formats.

Responsible for:
    - Running encode for each registered format candidate
    - Running decode for each encoded candidate
    - Returning raw CandidateResult objects (without validation or token counting)

NOT responsible for:
    - Format-specific encoding logic (formats/)
    - Round-trip validation (services/validator.py)
    - Token estimation (services/tokenizer.py)
    - Final format selection (services/router.py)
"""
from __future__ import annotations

import time
from typing import Any

from apps.api.formats.base import FormatError, EligibilityError
from apps.api.models.domain import CandidateResult, CandidateStatus
from apps.api.serializers.registry import FORMAT_REGISTRY


class SerializationManager:
    """Coordinates encode/decode operations across all registered formats."""

    def serialize_all(self, payload: Any) -> list[CandidateResult]:
        """
        Attempt serialization of payload in every registered format.

        Returns a CandidateResult for each format regardless of success or failure.
        Validation and token estimation are NOT performed here.
        """
        results: list[CandidateResult] = []
        for format_id, fmt in FORMAT_REGISTRY.items():
            result = self._attempt_candidate(fmt, payload, format_id)
            results.append(result)
        return results

    def serialize_one(self, payload: Any, format_id: str) -> CandidateResult:
        """Attempt serialization of payload in a single format."""
        from apps.api.serializers.serializer_factory import get_format, UnknownFormatError
        try:
            fmt = get_format(format_id)
        except UnknownFormatError as exc:
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.INELIGIBLE,
                eligible=False,
                encode_error=str(exc),
            )
        return self._attempt_candidate(fmt, payload, format_id)

    def _attempt_candidate(self, fmt: Any, payload: Any, format_id: str) -> CandidateResult:
        t0 = time.perf_counter()

        # 1. Check eligibility
        try:
            eligible, reason = fmt.is_eligible(payload)
        except Exception as exc:
            elapsed = (time.perf_counter() - t0) * 1000
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.INELIGIBLE,
                eligible=False,
                encode_error=f"Eligibility check failed: {exc}",
                pipeline_latency_ms=elapsed,
            )

        if not eligible:
            elapsed = (time.perf_counter() - t0) * 1000
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.INELIGIBLE,
                eligible=False,
                rejection_reason=reason,
                pipeline_latency_ms=elapsed,
            )

        # 2. Encode
        try:
            encoded = fmt.encode(payload)
        except EligibilityError as exc:
            elapsed = (time.perf_counter() - t0) * 1000
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.INELIGIBLE,
                eligible=True,
                encode_error=str(exc),
                pipeline_latency_ms=elapsed,
            )
        except FormatError as exc:
            elapsed = (time.perf_counter() - t0) * 1000
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.ENCODE_ERROR,
                eligible=True,
                encode_error=str(exc),
                pipeline_latency_ms=elapsed,
            )
        except Exception as exc:
            elapsed = (time.perf_counter() - t0) * 1000
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.ENCODE_ERROR,
                eligible=True,
                encode_error=f"Unexpected encode error: {exc}",
                pipeline_latency_ms=elapsed,
            )

        # 3. Decode
        try:
            decoded = fmt.decode(encoded)
        except FormatError as exc:
            elapsed = (time.perf_counter() - t0) * 1000
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.DECODE_ERROR,
                eligible=True,
                encoded=encoded,
                decode_error=str(exc),
                pipeline_latency_ms=elapsed,
            )
        except Exception as exc:
            elapsed = (time.perf_counter() - t0) * 1000
            return CandidateResult(
                format_id=format_id,
                status=CandidateStatus.DECODE_ERROR,
                eligible=True,
                encoded=encoded,
                decode_error=f"Unexpected decode error: {exc}",
                pipeline_latency_ms=elapsed,
            )

        elapsed = (time.perf_counter() - t0) * 1000
        # Return candidate with encoded+decoded — validator will determine valid/rejected
        return CandidateResult(
            format_id=format_id,
            status=CandidateStatus.VALID,  # Tentative — validator may change to REJECTED
            eligible=True,
            encoded=encoded,
            decoded=decoded,
            pipeline_latency_ms=elapsed,
        )


serialization_manager = SerializationManager()
