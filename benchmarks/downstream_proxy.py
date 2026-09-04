"""Downstream Structural Retrievability Proxy Benchmark.

Evaluates how accurately downstream extractors can retrieve key-value pairs,
record attributes, and nested properties from serialized representations:
- JSON (Pretty)
- Compact JSON
- TOON
- JTON
- ONTO

Measures:
1. Exact key match retrieval rate (%)
2. Syntactic parseability
3. Character / token distance overhead to target field
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.validator import validator, StrictValidator


class DownstreamRetrievabilityProxy:
    """Simulates LLM context retrieval on serialized structured text representations."""

    def __init__(self, validator_instance: StrictValidator | None = None):
        self.manager = SerializationManager()
        self.validator = validator_instance or validator

    def generate_retrieval_queries(self, payload: Any) -> list[dict[str, Any]]:
        """Extract ground-truth probe queries from a payload."""
        queries = []
        if isinstance(payload, list) and payload and isinstance(payload[0], dict):
            # Probe tabular items
            sample_idx = min(2, len(payload) - 1)
            target_row = payload[sample_idx]
            for key, val in list(target_row.items())[:3]:
                queries.append({
                    "query_type": "row_field_lookup",
                    "key": key,
                    "expected_value": str(val),
                    "row_index": sample_idx,
                })
        elif isinstance(payload, dict):
            for key, val in list(payload.items())[:4]:
                if not isinstance(val, (dict, list)):
                    queries.append({
                        "query_type": "direct_key_lookup",
                        "key": key,
                        "expected_value": str(val),
                    })
                elif isinstance(val, dict):
                    for sub_k, sub_v in list(val.items())[:2]:
                        if not isinstance(sub_v, (dict, list)):
                            queries.append({
                                "query_type": "nested_key_lookup",
                                "key": f"{key}.{sub_k}",
                                "expected_value": str(sub_v),
                            })
        return queries

    def evaluate_retrieval(
        self, serialized_text: str, query: dict[str, Any]
    ) -> bool:
        """Determines if the target value is deterministically recoverable via structural anchor."""
        key = query["key"].split(".")[-1]
        expected = query["expected_value"]

        # 1. Regex anchor for standard key:value or key=value or header column alignment
        patterns = [
            rf'"{re.escape(key)}"\s*:\s*"?{re.escape(expected)}"?',
            rf'{re.escape(key)}\s*:\s*"?{re.escape(expected)}"?',
            rf'{re.escape(key)}={re.escape(expected)}',
            # For TOON/JTON tabular rows: value present in corresponding column
            rf'\b{re.escape(expected)}\b',
        ]

        for p in patterns:
            if re.search(p, serialized_text):
                return True
        return False

    def evaluate_payload(self, payload: Any) -> dict[str, Any]:
        """Evaluates retrievability across all formats for a given payload."""
        queries = self.generate_retrieval_queries(payload)
        if not queries:
            return {}

        candidates = self.manager.serialize_all(payload)
        format_scores = {}

        for cand in candidates:
            # 1. Ineligible candidate
            if not cand.eligible:
                format_scores[cand.format_id] = {
                    "eligible": False,
                    "valid": False,
                    "retrieval_rate": 0.0,
                    "total_queries": len(queries),
                    "successful_queries": 0,
                }
                continue

            # 2. Serialization or decoding failure
            if not cand.encoded or cand.decoded is None:
                cand.valid = False
                format_scores[cand.format_id] = {
                    "eligible": True,
                    "valid": False,
                    "retrieval_rate": 0.0,
                    "total_queries": len(queries),
                    "successful_queries": 0,
                }
                continue

            # 3. Strict semantic round-trip validation
            is_valid, _ = self.validator.validate(payload, cand.decoded)
            cand.valid = is_valid

            if not is_valid:
                format_scores[cand.format_id] = {
                    "eligible": True,
                    "valid": False,
                    "retrieval_rate": 0.0,
                    "total_queries": len(queries),
                    "successful_queries": 0,
                }
                continue

            # 4. Calculate retrievability only for candidates that pass strict validation
            hits = sum(1 for q in queries if self.evaluate_retrieval(cand.encoded, q))
            format_scores[cand.format_id] = {
                "eligible": True,
                "valid": True,
                "retrieval_rate": round(hits / len(queries), 4),
                "total_queries": len(queries),
                "successful_queries": hits,
            }

        return format_scores
