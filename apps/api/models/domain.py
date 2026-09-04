"""Domain model dataclasses for TOONFORGE research engine."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class FormatID(str, Enum):
    JSON = "JSON"
    COMPACT_JSON = "Compact JSON"
    TOON = "TOON"
    JTON = "JTON"
    ONTO = "ONTO"


class CandidateStatus(str, Enum):
    VALID = "VALID"
    REJECTED = "REJECTED"          # Failed round-trip validation
    INELIGIBLE = "INELIGIBLE"      # Format not applicable to this payload structure
    ENCODE_ERROR = "ENCODE_ERROR"  # Could not encode
    DECODE_ERROR = "DECODE_ERROR"  # Could not decode


@dataclass
class StructuralProfile:
    """Complete structural profile of a JSON payload."""
    # Top-level
    top_level_type: str = "unknown"          # object | array | scalar

    # Counts
    node_count: int = 0
    object_count: int = 0
    array_count: int = 0
    scalar_count: int = 0
    null_count: int = 0

    # Depth
    max_depth: int = 0
    avg_depth: float = 0.0

    # Record / tabular
    record_count: int = 0                    # uniform objects in root array
    avg_object_width: float = 0.0            # avg keys per object

    # Key analysis
    unique_key_count: int = 0
    total_key_occurrences: int = 0
    key_repetition_ratio: float = 0.0        # total_key_occurrences / unique_key_count
    key_set_consistency: float = 0.0         # fraction of objects sharing same keyset

    # Schema
    schema_uniformity: float = 0.0           # 0–1, fraction structurally identical objects
    heterogeneity_index: float = 0.0         # 1 - schema_uniformity

    # Type distribution
    string_ratio: float = 0.0
    number_ratio: float = 0.0
    bool_ratio: float = 0.0
    null_ratio: float = 0.0
    object_ratio: float = 0.0
    array_ratio: float = 0.0

    # Tabular / specialised
    is_tabular: bool = False                 # root is array of uniform objects
    tabular_score: float = 0.0              # 0–1 how tabular-compatible
    is_deeply_nested: bool = False
    is_small_scalar: bool = False            # tiny payload

    # Routing hints
    estimated_savings_vs_json: float = 0.0  # rough estimate before serialization
    key_entropy_bits_per_key: float = 0.0


@dataclass
class CandidateResult:
    """Result of attempting a single format candidate."""
    format_id: str
    status: CandidateStatus
    eligible: bool = False
    encoded: Optional[str] = None
    decoded: Optional[Any] = None
    valid: bool = False
    rejection_reason: Optional[str] = None
    estimated_tokens: Optional[int] = None
    encode_error: Optional[str] = None
    decode_error: Optional[str] = None
    pipeline_latency_ms: float = 0.0


@dataclass
class RoutingResult:
    """Complete adaptive routing result."""
    selected_format: Optional[str]
    profile: StructuralProfile
    candidates: list[CandidateResult] = field(default_factory=list)
    valid_candidates: list[str] = field(default_factory=list)
    rejected_candidates: list[str] = field(default_factory=list)
    ineligible_candidates: list[str] = field(default_factory=list)
    token_counts: dict[str, int] = field(default_factory=dict)
    token_savings_vs_json: Optional[float] = None  # percentage
    routing_latency_ms: float = 0.0
    final_fallback_used: bool = False
    fallback_reason: Optional[str] = None
    routing_signals: list[str] = field(default_factory=list)
    serialized_output: Optional[str] = None
    json_token_baseline: Optional[int] = None
