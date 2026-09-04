"""Reliability and adversarial validation router."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from typing import Optional

from apps.api.models.requests import (
    AdversarialRequest, AdversarialResponse, AdversarialCaseResult,
    RouteResponse, CandidateResultSchema, StructuralProfileSchema,
)
from apps.api.models.domain import CandidateStatus
from apps.api.services.router import exhaustive_router
from apps.api.formats.toon import TOONFormat
from apps.api.services.validator import validator

router = APIRouter(prefix="/api/reliability", tags=["Reliability"])

_toon = TOONFormat()


def _build_route_response(result) -> Optional[RouteResponse]:
    """Convert RoutingResult to RouteResponse schema."""
    try:
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
        return RouteResponse(
            selected_format=result.selected_format,
            serialized_output=result.serialized_output,
            profile=StructuralProfileSchema(**result.profile.__dict__),
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
    except Exception:
        return None


# ─── Adversarial Case Definitions ────────────────────────────────────────────

ADVERSARIAL_CASES = [
    {
        "case_id": "ADV-001",
        "name": "Number-Looking String",
        "description": (
            "String '00123' must NOT be coerced to integer 123. "
            "TOON encodes strings unquoted, causing type coercion on decode. "
            "The validator must detect this and reject the TOON candidate."
        ),
        "payload": [{"code": "00123", "label": "alpha"}],
    },
    {
        "case_id": "ADV-002",
        "name": "Boolean-Looking String",
        "description": (
            "String 'true' must remain distinct from boolean true. "
            "String 'false' must remain distinct from boolean false."
        ),
        "payload": [{"flag": "true", "active": False, "mode": "false"}],
    },
    {
        "case_id": "ADV-003",
        "name": "Null vs Missing Key",
        "description": (
            "Explicit null must be preserved as a key with null value. "
            "A format that silently drops null-valued keys corrupts the schema."
        ),
        "payload": {"name": "Alice", "score": None, "rank": 1},
    },
    {
        "case_id": "ADV-004",
        "name": "Mixed-Type Array",
        "description": (
            "Array containing mixed types (string, int, null, bool) "
            "must round-trip without any type coercion."
        ),
        "payload": {"values": ["hello", 42, None, True, "00099", False]},
    },
    {
        "case_id": "ADV-005",
        "name": "Leading Zero String Preservation",
        "description": (
            "ZIP codes, IDs, and codes with leading zeros must survive serialization. "
            "e.g. '00418' != 418."
        ),
        "payload": [{"zip": "00418", "city": "test", "pop": 1234}],
    },
    {
        "case_id": "ADV-006",
        "name": "Deeply Nested Structure",
        "description": (
            "Deeply nested object with 6 levels. "
            "ONTO should be eligible; round-trip must preserve exact structure."
        ),
        "payload": {
            "a": {"b": {"c": {"d": {"e": {"f": "leaf_value", "g": 42}}}}}
        },
    },
]


@router.post("/adversarial", response_model=AdversarialResponse)
async def run_adversarial(request: AdversarialRequest):
    """Run adversarial reliability cases to demonstrate semantic preservation."""
    cases_to_run = ADVERSARIAL_CASES
    if request.case_ids:
        cases_to_run = [c for c in ADVERSARIAL_CASES if c["case_id"] in request.case_ids]

    results: list[AdversarialCaseResult] = []
    total_rejections = 0
    total_fallbacks = 0

    for case in cases_to_run:
        payload = case["payload"]

        # Attempt TOON encoding specifically (it's the main adversarial target)
        toon_encoded: Optional[str] = None
        toon_decoded = None
        toon_valid = True
        toon_rejection_reason: Optional[str] = None
        candidate_rejected = False

        eligible, elig_reason = _toon.is_eligible(payload)
        if eligible:
            try:
                toon_encoded = _toon.encode(payload)
                toon_decoded = _toon.decode(toon_encoded)
                toon_valid, toon_rejection_reason = validator.validate(payload, toon_decoded)
                if not toon_valid:
                    candidate_rejected = True
                    total_rejections += 1
            except Exception as exc:
                toon_valid = False
                toon_rejection_reason = str(exc)
                candidate_rejected = True
                total_rejections += 1

        # Run full routing to determine alternative and final status
        routing_result = exhaustive_router.route(payload)
        if routing_result.final_fallback_used:
            total_fallbacks += 1

        results.append(AdversarialCaseResult(
            case_id=case["case_id"],
            name=case["name"],
            description=case["description"],
            original_payload=payload,
            toon_encoded=toon_encoded,
            toon_decoded=toon_decoded,
            validation_passed=toon_valid,
            rejection_reason=toon_rejection_reason,
            candidate_rejected=candidate_rejected,
            alternative_format=routing_result.selected_format,
            final_fallback_used=routing_result.final_fallback_used,
            routing_result=_build_route_response(routing_result),
        ))

    return AdversarialResponse(
        cases=results,
        total_cases=len(results),
        rejection_count=total_rejections,
        fallback_count=total_fallbacks,
    )
