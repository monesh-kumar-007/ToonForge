"""Serialize and Profile API routers."""
from __future__ import annotations

import time
from fastapi import APIRouter, HTTPException

from apps.api.models.requests import (
    ProfileRequest, ProfileResponse, SerializeRequest, SerializeResponse,
    SerializeAllRequest, SerializeAllResponse, CandidateResultSchema,
    StructuralProfileSchema, RoutingSignal,
)
from apps.api.serializers.serializer_factory import get_format, UnknownFormatError
from apps.api.serializers.serialization_manager import serialization_manager
from apps.api.services.profiler import profiler as structural_profiler
from apps.api.services.validator import validator
from apps.api.services.tokenizer import token_estimator
from apps.api.formats.base import FormatError

router = APIRouter(prefix="/api", tags=["Serialization"])


@router.post("/profile", response_model=ProfileResponse)
async def profile_payload(request: ProfileRequest):
    """Profile the structural topology of a JSON payload."""
    try:
        profile = structural_profiler.profile(request.payload)
        signals_raw = structural_profiler.generate_routing_signals(profile)
        archetype = structural_profiler.archetype_label(profile)

        routing_signals = [
            RoutingSignal(signal=s.split("—")[0].strip(), description=s)
            for s in signals_raw
        ]

        return ProfileResponse(
            profile=StructuralProfileSchema(**profile.__dict__),
            routing_signals=routing_signals,
            archetype_label=archetype,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Profiling failed: {exc}")


@router.post("/serialize", response_model=SerializeResponse)
async def serialize_payload(request: SerializeRequest):
    """Serialize a payload in the specified format."""
    t0 = time.perf_counter()
    try:
        fmt = get_format(request.format)
    except UnknownFormatError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Check eligibility
    eligible, ineligible_reason = fmt.is_eligible(request.payload)

    if not eligible:
        elapsed = (time.perf_counter() - t0) * 1000
        return SerializeResponse(
            format_id=request.format,
            encoded="",
            estimated_tokens=0,
            eligible=False,
            valid=False,
            rejection_reason=ineligible_reason,
            latency_ms=round(elapsed, 3),
        )

    # Encode
    try:
        encoded = fmt.encode(request.payload)
    except FormatError as exc:
        elapsed = (time.perf_counter() - t0) * 1000
        return SerializeResponse(
            format_id=request.format,
            encoded="",
            estimated_tokens=0,
            eligible=True,
            valid=False,
            rejection_reason=str(exc),
            latency_ms=round(elapsed, 3),
        )

    # Decode and validate
    try:
        decoded = fmt.decode(encoded)
    except FormatError as exc:
        elapsed = (time.perf_counter() - t0) * 1000
        return SerializeResponse(
            format_id=request.format,
            encoded=encoded,
            estimated_tokens=token_estimator.estimate(encoded),
            eligible=True,
            valid=False,
            rejection_reason=f"Decode error: {exc}",
            latency_ms=round(elapsed, 3),
        )

    valid, reason = validator.validate(request.payload, decoded)
    tokens = token_estimator.estimate(encoded)
    elapsed = (time.perf_counter() - t0) * 1000

    return SerializeResponse(
        format_id=request.format,
        encoded=encoded,
        estimated_tokens=tokens,
        eligible=True,
        valid=valid,
        rejection_reason=reason if not valid else None,
        latency_ms=round(elapsed, 3),
    )


@router.post("/serialize-all", response_model=SerializeAllResponse)
async def serialize_all_candidates(request: SerializeAllRequest):
    """Serialize payload across all 5 registered candidates."""
    candidates = serialization_manager.serialize_all(request.payload)
    output = []
    for c in candidates:
        output.append(CandidateResultSchema(
            format_id=c.format_id,
            status=c.status.value if hasattr(c.status, "value") else str(c.status),
            eligible=c.eligible,
            encoded=c.encoded,
            valid=c.valid,
            rejection_reason=c.rejection_reason,
            estimated_tokens=c.estimated_tokens,
            encode_error=c.encode_error,
            decode_error=c.decode_error,
            pipeline_latency_ms=c.pipeline_latency_ms,
        ))
    return SerializeAllResponse(candidates=output)

