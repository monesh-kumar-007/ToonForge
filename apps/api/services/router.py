"""Exhaustive Adaptive Router — the core research contribution.

Selection Priority (NON-NEGOTIABLE):
    1. VALIDITY   — data must round-trip safely
    2. STRUCTURAL SUITABILITY — format must match payload structure
    3. TOKEN EFFICIENCY — minimize tokens strictly among valid candidates

Pipeline:
    Payload
        → Structural Profiling
        → Feature Extraction
        → Candidate Selection (all formats)
        → Serialization (encode)
        → Deserialization (decode)
        → Strict Round-Trip Validation
        → Candidate Rejection (if validation fails)
        → Token Estimation (valid candidates only)
        → Best Valid Format Selection
        → Final Fallback (only if NO valid candidate found)
        → Explainable Result

IMPORTANT DISTINCTIONS:
    - Candidate Rejection: a format failed validation → excluded from selection.
      This is NOT a system fallback event. Other valid candidates can still win.
    - Final Fallback: occurs ONLY when the entire routing process cannot find
      any valid candidate. The safe recovery format (Plain JSON) is invoked.
      This is a genuine reliability event and must be flagged distinctly.
"""
from __future__ import annotations

import time
from typing import Any, Optional

from apps.api.models.domain import (
    CandidateResult,
    CandidateStatus,
    RoutingResult,
    StructuralProfile,
)
from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.profiler import StructuralProfiler
from apps.api.services.validator import StrictValidator
from apps.api.services.tokenizer import TokenEstimator
from apps.api.formats.json_format import JSONFormat

_FINAL_FALLBACK_FORMAT = "JSON"  # Safe recovery format


class ExhaustiveRouter:
    """
    Evaluates ALL format candidates and selects the best valid one.

    Returns full routing metadata for research transparency.
    """

    def __init__(
        self,
        profiler: Optional[StructuralProfiler] = None,
        validator: Optional[StrictValidator] = None,
        tokenizer: Optional[TokenEstimator] = None,
        manager: Optional[SerializationManager] = None,
    ):
        self.profiler = profiler or StructuralProfiler()
        self.validator = validator or StrictValidator()
        self.tokenizer = tokenizer or TokenEstimator()
        self.manager = manager or SerializationManager()
        self._fallback_fmt = JSONFormat()

    def route(self, payload: Any) -> RoutingResult:
        """
        Execute the full adaptive routing pipeline.

        Returns a RoutingResult with complete explainable metadata.
        """
        t_start = time.perf_counter()

        # ── Step 1: Structural Profiling ──────────────────────────────────────
        profile = self.profiler.profile(payload)
        routing_signals = self.profiler.generate_routing_signals(profile)

        # ── Step 2: Serialize all candidates ─────────────────────────────────
        candidates: list[CandidateResult] = self.manager.serialize_all(payload)

        # ── Step 3: Validate each encoded candidate ───────────────────────────
        valid_candidates: list[str] = []
        rejected_candidates: list[str] = []
        ineligible_candidates: list[str] = []
        token_counts: dict[str, int] = {}
        json_token_baseline: Optional[int] = None

        for cand in candidates:
            if cand.status == CandidateStatus.INELIGIBLE:
                ineligible_candidates.append(cand.format_id)
                continue

            if cand.status in (CandidateStatus.ENCODE_ERROR, CandidateStatus.DECODE_ERROR):
                # Treat encode/decode errors as rejection
                cand.status = CandidateStatus.REJECTED
                cand.valid = False
                cand.rejection_reason = (
                    cand.encode_error or cand.decode_error or "Encode/decode error"
                )
                rejected_candidates.append(cand.format_id)
                continue

            # Strict round-trip validation
            valid, reason = self.validator.validate(payload, cand.decoded)
            cand.valid = valid

            if not valid:
                # ── CANDIDATE REJECTION (NOT a final fallback) ─────────────
                cand.status = CandidateStatus.REJECTED
                cand.rejection_reason = reason
                rejected_candidates.append(cand.format_id)
            else:
                # Estimate tokens for valid candidates only
                tokens = self.tokenizer.estimate(cand.encoded or "")
                cand.estimated_tokens = tokens
                token_counts[cand.format_id] = tokens
                valid_candidates.append(cand.format_id)

                if cand.format_id == "JSON":
                    json_token_baseline = tokens

        # ── Step 4: Select best valid candidate ───────────────────────────────
        final_fallback_used = False
        fallback_reason: Optional[str] = None
        selected_format: Optional[str] = None
        serialized_output: Optional[str] = None
        token_savings: Optional[float] = None

        if valid_candidates:
            # Select the valid candidate with the minimum estimated token count
            selected_format = min(
                valid_candidates,
                key=lambda fid: token_counts.get(fid, float("inf")),
            )
            # Retrieve the selected candidate's encoded output
            for cand in candidates:
                if cand.format_id == selected_format:
                    serialized_output = cand.encoded
                    break

            # Compute token savings vs JSON baseline
            if json_token_baseline is not None and selected_format in token_counts:
                selected_tokens = token_counts[selected_format]
                token_savings = self.tokenizer.estimate_savings_pct(
                    json_token_baseline, selected_tokens
                )
            elif valid_candidates:
                # JSON was not valid (unusual); compute vs any valid baseline
                all_tokens = list(token_counts.values())
                if all_tokens:
                    max_tokens = max(all_tokens)
                    selected_tokens = token_counts.get(selected_format, max_tokens)
                    token_savings = self.tokenizer.estimate_savings_pct(
                        max_tokens, selected_tokens
                    )
        else:
            # ── FINAL FALLBACK ─────────────────────────────────────────────
            # No valid candidate found → invoke safe recovery (Plain JSON)
            final_fallback_used = True
            fallback_reason = (
                "No valid candidate passed strict round-trip validation. "
                "Falling back to Plain JSON as the guaranteed-safe representation."
            )
            try:
                fallback_encoded = self._fallback_fmt.encode(payload)
                selected_format = _FINAL_FALLBACK_FORMAT
                serialized_output = fallback_encoded
                fallback_tokens = self.tokenizer.estimate(fallback_encoded)
                token_counts[_FINAL_FALLBACK_FORMAT] = fallback_tokens
                json_token_baseline = fallback_tokens
                token_savings = 0.0
            except Exception as exc:
                fallback_reason += f" Fallback also failed: {exc}"
                selected_format = None
                serialized_output = None

        t_elapsed = (time.perf_counter() - t_start) * 1000

        return RoutingResult(
            selected_format=selected_format,
            profile=profile,
            candidates=candidates,
            valid_candidates=valid_candidates,
            rejected_candidates=rejected_candidates,
            ineligible_candidates=ineligible_candidates,
            token_counts=token_counts,
            token_savings_vs_json=token_savings,
            routing_latency_ms=round(t_elapsed, 3),
            final_fallback_used=final_fallback_used,
            fallback_reason=fallback_reason,
            routing_signals=routing_signals,
            serialized_output=serialized_output,
            json_token_baseline=json_token_baseline,
        )


exhaustive_router = ExhaustiveRouter()
