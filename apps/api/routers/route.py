"""Adaptive routing API router."""
from __future__ import annotations

from dataclasses import asdict
from fastapi import APIRouter, HTTPException

from apps.api.models.requests import (
    RouteRequest, RouteResponse,
    CandidateResultSchema, StructuralProfileSchema,
)
from apps.api.models.domain import CandidateStatus
from apps.api.services.router import exhaustive_router

router = APIRouter(prefix="/api", tags=["Routing"])


@router.post("/route", response_model=RouteResponse)
async def route_payload(request: RouteRequest):
    """
    Run the full adaptive routing pipeline on a payload.

    Returns the selected format, all candidate results, and routing metadata.
    Clearly distinguishes candidate rejections from final fallback events.
    """
    try:
        result = exhaustive_router.route(request.payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Routing failed: {exc}")

    candidates_out = []
    for c in result.candidates:
        candidates_out.append(CandidateResultSchema(
            format_id=c.format_id,
            status=c.status.value if isinstance(c.status, CandidateStatus) else str(c.status),
            eligible=c.eligible,
            encoded=c.encoded,
            valid=c.valid,
            rejection_reason=c.rejection_reason,
            estimated_tokens=c.estimated_tokens,
            encode_error=c.encode_error,
            decode_error=c.decode_error,
            pipeline_latency_ms=c.pipeline_latency_ms,
        ))

    profile_dict = result.profile.__dict__
    return RouteResponse(
        selected_format=result.selected_format,
        serialized_output=result.serialized_output,
        profile=StructuralProfileSchema(**profile_dict),
        candidates=candidates_out,
        valid_candidates=result.valid_candidates,
        rejected_candidates=result.rejected_candidates,
        ineligible_candidates=result.ineligible_candidates,
        token_counts=result.token_counts,
        token_savings_vs_json=result.token_savings_vs_json,
        json_token_baseline=result.json_token_baseline,
        routing_latency_ms=result.routing_latency_ms,
        final_fallback_used=result.final_fallback_used,
        fallback_reason=result.fallback_reason,
        routing_signals=result.routing_signals,
    )
