"""TOONFORGE Python SDK Data Models."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class CandidateResult:
    format_id: str
    status: str
    eligible: bool
    valid: bool
    encoded: Optional[str] = None
    estimated_tokens: Optional[int] = None
    rejection_reason: Optional[str] = None
    pipeline_latency_ms: float = 0.0


@dataclass
class StructuralProfile:
    top_level_type: str
    node_count: int
    object_count: int
    array_count: int
    scalar_count: int
    null_count: int
    max_depth: int
    avg_depth: float
    record_count: int
    schema_uniformity: float
    heterogeneity_index: float
    is_tabular: bool
    tabular_score: float
    estimated_savings_vs_json: float


@dataclass
class RoutingResult:
    selected_format: Optional[str]
    serialized_output: Optional[str]
    profile: StructuralProfile
    candidates: list[CandidateResult]
    valid_candidates: list[str]
    rejected_candidates: list[str]
    ineligible_candidates: list[str]
    token_counts: dict[str, int]
    token_savings_vs_json: Optional[float]
    json_token_baseline: Optional[int]
    routing_latency_ms: float
    final_fallback_used: bool
    fallback_reason: Optional[str]
    routing_signals: list[str] = field(default_factory=list)
