"""Pydantic request and response schemas for the TOONFORGE API."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─── Requests ────────────────────────────────────────────────────────────────

class ProfileRequest(BaseModel):
    payload: Any = Field(..., description="Arbitrary JSON payload to profile")


class SerializeRequest(BaseModel):
    payload: Any = Field(..., description="JSON payload to serialize")
    format: str = Field(..., description="Format ID: JSON | Compact JSON | TOON | JTON | ONTO")


class SerializeAllRequest(BaseModel):
    payload: Any = Field(..., description="JSON payload to serialize across all candidate formats")


class RouteRequest(BaseModel):
    payload: Any = Field(..., description="JSON payload to route adaptively")


class BenchmarkRequest(BaseModel):
    corpus_size: int = Field(200, ge=10, le=2000, description="Number of synthetic payloads")
    seed: int = Field(200, description="Random seed for reproducibility")
    categories: Optional[List[str]] = Field(None, description="Payload categories to include")


class LearnedRouterPredictRequest(BaseModel):
    payload: Any = Field(..., description="JSON payload to predict format for")


class AdversarialRequest(BaseModel):
    case_ids: Optional[List[str]] = Field(None, description="Specific case IDs to run (None = all)")


# ─── Sub-schemas ─────────────────────────────────────────────────────────────

class StructuralProfileSchema(BaseModel):
    top_level_type: str
    node_count: int
    object_count: int
    array_count: int
    scalar_count: int
    null_count: int
    max_depth: int
    avg_depth: float
    record_count: int
    avg_object_width: float
    unique_key_count: int
    total_key_occurrences: int
    key_repetition_ratio: float
    key_set_consistency: float
    schema_uniformity: float
    heterogeneity_index: float
    string_ratio: float
    number_ratio: float
    bool_ratio: float
    null_ratio: float
    object_ratio: float
    array_ratio: float
    is_tabular: bool
    tabular_score: float
    is_deeply_nested: bool
    is_small_scalar: bool
    estimated_savings_vs_json: float
    key_entropy_bits_per_key: float


class CandidateResultSchema(BaseModel):
    format_id: str
    status: str
    eligible: bool
    encoded: Optional[str] = None
    valid: bool
    rejection_reason: Optional[str] = None
    estimated_tokens: Optional[int] = None
    encode_error: Optional[str] = None
    decode_error: Optional[str] = None
    pipeline_latency_ms: float


class RoutingSignal(BaseModel):
    signal: str
    description: str
    value: Optional[str] = None


# ─── Responses ────────────────────────────────────────────────────────────────

class ProfileResponse(BaseModel):
    profile: StructuralProfileSchema
    routing_signals: List[RoutingSignal]
    archetype_label: str


class SerializeResponse(BaseModel):
    format_id: str
    encoded: str
    estimated_tokens: int
    eligible: bool
    valid: bool
    rejection_reason: Optional[str] = None
    latency_ms: float


class SerializeAllResponse(BaseModel):
    candidates: List[CandidateResultSchema]



class RouteResponse(BaseModel):
    selected_format: Optional[str]
    serialized_output: Optional[str]
    profile: StructuralProfileSchema
    candidates: List[CandidateResultSchema]
    valid_candidates: List[str]
    rejected_candidates: List[str]
    ineligible_candidates: List[str]
    token_counts: Dict[str, int]
    token_savings_vs_json: Optional[float]
    json_token_baseline: Optional[int]
    routing_latency_ms: float
    final_fallback_used: bool
    fallback_reason: Optional[str]
    routing_signals: List[str]


class BenchmarkResultSummary(BaseModel):
    strategy: str
    mean_reduction: float
    median_reduction: float
    std_dev: float
    fallback_rate: float
    routing_grade: str
    sample_count: int
    validity_rate: Optional[float] = None
    ineligibility_rate: Optional[float] = None
    rejection_rate: Optional[float] = None
    valid_count: Optional[int] = None
    ineligible_count: Optional[int] = None
    rejected_count: Optional[int] = None
    final_fallback_count: Optional[int] = None


class BenchmarkResponse(BaseModel):
    run_id: str
    seed: int
    corpus_size: int
    results: List[BenchmarkResultSummary]
    category_breakdown: Dict[str, Any]
    completed_at: str
    duration_seconds: float


class BenchmarkResultsResponse(BaseModel):
    available: bool
    run_id: Optional[str] = None
    results: Optional[List[BenchmarkResultSummary]] = None
    category_breakdown: Optional[Dict[str, Any]] = None
    completed_at: Optional[str] = None
    message: Optional[str] = None


class LearnedRouterPredictResponse(BaseModel):
    predicted_format: str
    exhaustive_format: Optional[str]
    agreement: bool
    confidence: float
    token_regret: Optional[int]
    learned_latency_ms: float
    exhaustive_latency_ms: float
    feature_vector: Dict[str, float]
    model_trained: bool
    optimal_selection: Optional[bool] = None
    invalid_selection: Optional[bool] = None
    regret_tokens: Optional[int] = None
    regret_pct: Optional[float] = None


class LearnedRouterMetricsResponse(BaseModel):
    model_trained: bool
    decision_agreement_rate: Optional[float]
    mean_token_regret: Optional[float]
    fallback_rate: Optional[float]
    learned_latency_ms: Optional[float]
    exhaustive_latency_ms: Optional[float]
    training_corpus_size: Optional[int]
    model_depth: Optional[int]
    message: Optional[str] = None
    exact_match_rate: Optional[float] = None
    median_regret_tokens: Optional[float] = None
    mean_regret_pct: Optional[float] = None
    p95_regret_pct: Optional[float] = None
    min_regret_pct: Optional[float] = None
    max_regret_pct: Optional[float] = None
    invalid_selection_rate: Optional[float] = None
    ineligible_selection_rate: Optional[float] = None
    rejected_selection_rate: Optional[float] = None
    eligible_selection_rate: Optional[float] = None
    evaluation_corpus_size: Optional[int] = None
    eval_random_seed: Optional[int] = None


class AdversarialCaseResult(BaseModel):
    case_id: str
    name: str
    description: str
    original_payload: Any
    toon_encoded: Optional[str]
    toon_decoded: Optional[Any]
    validation_passed: bool
    rejection_reason: Optional[str]
    candidate_rejected: bool
    alternative_format: Optional[str]
    final_fallback_used: bool
    routing_result: Optional[RouteResponse]


class AdversarialResponse(BaseModel):
    cases: List[AdversarialCaseResult]
    total_cases: int
    rejection_count: int
    fallback_count: int


class HealthResponse(BaseModel):
    status: str
    version: str
    formats_available: int
    validation_enabled: bool
    learned_router_trained: bool


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
