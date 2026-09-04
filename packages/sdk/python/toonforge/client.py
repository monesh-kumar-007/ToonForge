"""TOONFORGE Python SDK HTTP Client."""
from __future__ import annotations

from typing import Any, Optional
import requests

from .models import RoutingResult, StructuralProfile, CandidateResult


class ToonForgeClient:
    """Client for communicating with the TOONFORGE research engine."""

    def __init__(self, base_url: str = "http://localhost:8000", timeout: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def health(self) -> dict[str, Any]:
        """Check API service health status."""
        resp = self.session.get(f"{self.base_url}/health", timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()

    def route(self, payload: Any) -> RoutingResult:
        """Execute full adaptive serialization routing pipeline on a payload."""
        resp = self.session.post(
            f"{self.base_url}/api/route",
            json={"payload": payload},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        data = resp.json()

        prof_data = data["profile"]
        profile = StructuralProfile(
            top_level_type=prof_data.get("top_level_type", ""),
            node_count=prof_data.get("node_count", 0),
            object_count=prof_data.get("object_count", 0),
            array_count=prof_data.get("array_count", 0),
            scalar_count=prof_data.get("scalar_count", 0),
            null_count=prof_data.get("null_count", 0),
            max_depth=prof_data.get("max_depth", 0),
            avg_depth=prof_data.get("avg_depth", 0.0),
            record_count=prof_data.get("record_count", 0),
            schema_uniformity=prof_data.get("schema_uniformity", 0.0),
            heterogeneity_index=prof_data.get("heterogeneity_index", 0.0),
            is_tabular=prof_data.get("is_tabular", False),
            tabular_score=prof_data.get("tabular_score", 0.0),
            estimated_savings_vs_json=prof_data.get("estimated_savings_vs_json", 0.0),
        )

        candidates = [
            CandidateResult(
                format_id=c["format_id"],
                status=c["status"],
                eligible=c["eligible"],
                valid=c["valid"],
                encoded=c.get("encoded"),
                estimated_tokens=c.get("estimated_tokens"),
                rejection_reason=c.get("rejection_reason"),
                pipeline_latency_ms=c.get("pipeline_latency_ms", 0.0),
            )
            for c in data.get("candidates", [])
        ]

        return RoutingResult(
            selected_format=data.get("selected_format"),
            serialized_output=data.get("serialized_output"),
            profile=profile,
            candidates=candidates,
            valid_candidates=data.get("valid_candidates", []),
            rejected_candidates=data.get("rejected_candidates", []),
            ineligible_candidates=data.get("ineligible_candidates", []),
            token_counts=data.get("token_counts", {}),
            token_savings_vs_json=data.get("token_savings_vs_json"),
            json_token_baseline=data.get("json_token_baseline"),
            routing_latency_ms=data.get("routing_latency_ms", 0.0),
            final_fallback_used=data.get("final_fallback_used", False),
            fallback_reason=data.get("fallback_reason"),
            routing_signals=data.get("routing_signals", []),
        )

    def serialize(self, payload: Any, format_id: str) -> dict[str, Any]:
        """Serialize payload into a specific target format."""
        resp = self.session.post(
            f"{self.base_url}/api/serialize",
            json={"payload": payload, "format": format_id},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        return resp.json()
