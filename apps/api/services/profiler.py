"""Structural profiler — extracts structural features from JSON payloads.

Used by:
    - Exhaustive adaptive router (routing decisions)
    - Learned router (feature vector)
    - Frontend explanation UI (routing signals)
"""
from __future__ import annotations

import math
from collections import Counter
from typing import Any

from apps.api.models.domain import StructuralProfile


def _count_nodes(obj: Any, depth: int = 0) -> tuple[int, int, int, int, int, int, list[int]]:
    """
    Recursively count all nodes.
    Returns: (total, objects, arrays, scalars, nulls, max_depth, all_depths)
    """
    if isinstance(obj, dict):
        all_depths = [depth]
        obj_count = 1
        arr_count = 0
        scl_count = 0
        nul_count = 0
        max_d = depth
        for v in obj.values():
            t, o, a, s, n, md, ds = _count_nodes(v, depth + 1)
            obj_count += o
            arr_count += a
            scl_count += s
            nul_count += n
            max_d = max(max_d, md)
            all_depths.extend(ds)
        total = 1 + sum(
            _count_nodes(v, depth + 1)[0] for v in obj.values()
        )
        return total, obj_count, arr_count, scl_count, nul_count, max_d, all_depths

    elif isinstance(obj, list):
        all_depths = [depth]
        obj_count = 0
        arr_count = 1
        scl_count = 0
        nul_count = 0
        max_d = depth
        for v in obj:
            t, o, a, s, n, md, ds = _count_nodes(v, depth + 1)
            obj_count += o
            arr_count += a
            scl_count += s
            nul_count += n
            max_d = max(max_d, md)
            all_depths.extend(ds)
        total = 1 + sum(_count_nodes(v, depth + 1)[0] for v in obj)
        return total, obj_count, arr_count, scl_count, nul_count, max_d, all_depths

    else:
        is_null = obj is None
        return 1, 0, 0, 1, (1 if is_null else 0), depth, [depth]


def _collect_all_keys(obj: Any) -> list[str]:
    """Collect every dict key (recursive)."""
    keys: list[str] = []
    if isinstance(obj, dict):
        keys.extend(obj.keys())
        for v in obj.values():
            keys.extend(_collect_all_keys(v))
    elif isinstance(obj, list):
        for v in obj:
            keys.extend(_collect_all_keys(v))
    return keys


def _key_entropy(key_counts: Counter) -> float:
    """Shannon entropy of key distribution in bits per key."""
    total = sum(key_counts.values())
    if total == 0:
        return 0.0
    entropy = 0.0
    for count in key_counts.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)
    return entropy


def _type_ratios(obj: Any) -> dict[str, float]:
    """Compute value-type distribution ratios (for scalars)."""
    counts: dict[str, int] = {
        "string": 0, "number": 0, "bool": 0, "null": 0,
        "object": 0, "array": 0,
    }

    def _walk(v: Any) -> None:
        if isinstance(v, dict):
            counts["object"] += 1
            for val in v.values():
                _walk(val)
        elif isinstance(v, list):
            counts["array"] += 1
            for val in v:
                _walk(val)
        elif v is None:
            counts["null"] += 1
        elif isinstance(v, bool):
            counts["bool"] += 1
        elif isinstance(v, (int, float)):
            counts["number"] += 1
        elif isinstance(v, str):
            counts["string"] += 1

    _walk(obj)
    total = sum(counts.values()) or 1
    return {k: v / total for k, v in counts.items()}


def _analyze_root_array(payload: list) -> dict:
    """Detailed analysis for root-level arrays."""
    dict_items = [x for x in payload if isinstance(x, dict)]
    if not dict_items:
        return {"record_count": 0, "is_tabular": False, "tabular_score": 0.0,
                "key_set_consistency": 0.0, "avg_object_width": 0.0,
                "schema_uniformity": 0.0}

    # Key-set analysis
    key_sets = [frozenset(d.keys()) for d in dict_items]
    key_set_counter = Counter(key_sets)
    dominant_keyset = key_set_counter.most_common(1)[0][0]
    consistent_count = key_set_counter[dominant_keyset]
    key_set_consistency = consistent_count / len(dict_items)

    # Unique keys & repetition
    all_keys_flat = [k for d in dict_items for k in d.keys()]
    unique_keys = set(all_keys_flat)

    # Average object width
    avg_width = sum(len(d) for d in dict_items) / len(dict_items)

    # Schema uniformity: fraction of records matching dominant key-set
    schema_uniformity = key_set_consistency

    # Tabular score: high uniformity + regular width
    tabular_score = schema_uniformity * min(1.0, avg_width / max(avg_width, 1))
    is_tabular = key_set_consistency >= 0.8 and len(dict_items) >= 2

    return {
        "record_count": len(dict_items),
        "is_tabular": is_tabular,
        "tabular_score": round(tabular_score, 4),
        "key_set_consistency": round(key_set_consistency, 4),
        "avg_object_width": round(avg_width, 2),
        "schema_uniformity": round(schema_uniformity, 4),
        "dominant_key_count": len(dominant_keyset),
    }


class StructuralProfiler:
    """Extracts a complete structural profile from any JSON payload."""

    def profile(self, payload: Any) -> StructuralProfile:
        # 1. Top-level type
        if isinstance(payload, dict):
            top_level_type = "object"
        elif isinstance(payload, list):
            top_level_type = "array"
        else:
            top_level_type = "scalar"

        # 2. Node counts
        node_count, obj_count, arr_count, scl_count, nul_count, max_depth, all_depths = (
            _count_nodes(payload)
        )
        avg_depth = round(sum(all_depths) / max(len(all_depths), 1), 2)

        # 3. Key analysis
        all_keys = _collect_all_keys(payload)
        key_counter = Counter(all_keys)
        unique_key_count = len(key_counter)
        total_key_occurrences = len(all_keys)
        key_repetition_ratio = (
            round(total_key_occurrences / unique_key_count, 4)
            if unique_key_count > 0 else 0.0
        )
        key_entropy = round(_key_entropy(key_counter), 4)

        # 4. Type ratios
        ratios = _type_ratios(payload)

        # 5. Root array analysis
        record_count = 0
        is_tabular = False
        tabular_score = 0.0
        key_set_consistency = 0.0
        avg_object_width = 0.0
        schema_uniformity = 0.0

        if isinstance(payload, list):
            arr_info = _analyze_root_array(payload)
            record_count = arr_info["record_count"]
            is_tabular = arr_info["is_tabular"]
            tabular_score = arr_info["tabular_score"]
            key_set_consistency = arr_info["key_set_consistency"]
            avg_object_width = arr_info["avg_object_width"]
            schema_uniformity = arr_info["schema_uniformity"]
        elif isinstance(payload, dict):
            avg_object_width = float(len(payload))
            key_set_consistency = 1.0
            schema_uniformity = 1.0

        # 6. Derived signals
        is_deeply_nested = max_depth >= 5
        is_small_scalar = node_count <= 5
        heterogeneity_index = round(1.0 - schema_uniformity, 4)

        # 7. Rough savings estimate
        # Based on key repetition and schema uniformity
        estimated_savings = 0.0
        if key_repetition_ratio > 1.5 and is_tabular:
            estimated_savings = min(0.5, (key_repetition_ratio - 1.0) * 0.15)

        # 8. JSON token baseline estimate (character-based proxy)
        import json
        json_chars = len(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))
        estimated_savings_vs_json = round(estimated_savings * 100, 1)

        return StructuralProfile(
            top_level_type=top_level_type,
            node_count=node_count,
            object_count=obj_count,
            array_count=arr_count,
            scalar_count=scl_count,
            null_count=nul_count,
            max_depth=max_depth,
            avg_depth=avg_depth,
            record_count=record_count,
            avg_object_width=avg_object_width,
            unique_key_count=unique_key_count,
            total_key_occurrences=total_key_occurrences,
            key_repetition_ratio=key_repetition_ratio,
            key_set_consistency=key_set_consistency,
            schema_uniformity=schema_uniformity,
            heterogeneity_index=heterogeneity_index,
            string_ratio=round(ratios["string"], 4),
            number_ratio=round(ratios["number"], 4),
            bool_ratio=round(ratios["bool"], 4),
            null_ratio=round(ratios["null"], 4),
            object_ratio=round(ratios["object"], 4),
            array_ratio=round(ratios["array"], 4),
            is_tabular=is_tabular,
            tabular_score=tabular_score,
            is_deeply_nested=is_deeply_nested,
            is_small_scalar=is_small_scalar,
            estimated_savings_vs_json=estimated_savings_vs_json,
            key_entropy_bits_per_key=key_entropy,
        )

    def extract_feature_vector(self, profile: StructuralProfile) -> dict[str, float]:
        """Extract a numerical feature vector for the learned router."""
        return {
            "max_depth": float(profile.max_depth),
            "record_count": float(profile.record_count),
            "schema_uniformity": profile.schema_uniformity,
            "key_repetition_ratio": profile.key_repetition_ratio,
            "heterogeneity_index": profile.heterogeneity_index,
            "scalar_object_ratio": (
                profile.scalar_count / max(profile.object_count, 1)
            ),
            "is_tabular": float(profile.is_tabular),
            "tabular_score": profile.tabular_score,
            "null_ratio": profile.null_ratio,
            "avg_object_width": profile.avg_object_width,
            "key_set_consistency": profile.key_set_consistency,
            "node_count": float(profile.node_count),
        }

    def generate_routing_signals(self, profile: StructuralProfile) -> list[str]:
        """Generate human-readable routing signals from profile."""
        signals: list[str] = []

        if profile.is_tabular:
            signals.append(
                f"Tabular Pattern detected — candidates: JTON, Compact JSON "
                f"(uniformity {profile.key_set_consistency:.0%})"
            )

        if profile.key_repetition_ratio >= 2.0:
            signals.append(
                f"Repeated Schema — Key Hoisting Eligible "
                f"(repetition ratio {profile.key_repetition_ratio:.2f}x)"
            )

        if profile.is_deeply_nested:
            signals.append(
                f"Deep Nesting depth={profile.max_depth} — ONTO candidate active"
            )

        if profile.max_depth <= 4:
            signals.append(
                f"Moderate Depth (≤ 4) — sub-millisecond serialization latency expected"
            )

        if profile.heterogeneity_index > 0.2:
            signals.append(
                f"Heterogeneous Fields ({profile.heterogeneity_index:.0%} variance) — "
                f"strict schema fallback validation required"
            )

        if profile.null_ratio > 0.1:
            signals.append(
                f"High Null Ratio ({profile.null_ratio:.0%}) — "
                f"null vs missing-key preservation enforced"
            )

        if profile.is_small_scalar:
            signals.append("Small/Scalar payload — low overhead; Compact JSON preferred")

        if not signals:
            signals.append("General-purpose payload — Compact JSON default candidate")

        return signals

    def archetype_label(self, profile: StructuralProfile) -> str:
        """Return a human-readable archetype label for the payload."""
        if profile.is_tabular and profile.record_count > 0:
            return f"Flat Tabular ({profile.record_count} records, uniform schema)"
        if profile.is_deeply_nested:
            return f"Deep-Nested (depth {profile.max_depth})"
        if profile.heterogeneity_index > 0.3:
            return "Heterogeneous Mixed"
        if profile.is_small_scalar:
            return "Small / Scalar-Dominated"
        if profile.object_count > 0 and profile.max_depth >= 3:
            return "Nested Objects"
        return "General Structured"


profiler = StructuralProfiler()
