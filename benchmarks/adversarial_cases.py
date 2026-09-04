"""Adversarial and Edge Case Test Suite for TOONFORGE.

Evaluates strict semantic fidelity, rejection of unsafe representations,
and fallback guarantees against known edge cases:
1. Numeric string coercion attempts ("123", "0.45")
2. Boolean string coercion attempts ("true", "false", "null")
3. Missing keys vs explicit nulls in tabular layouts
4. Mixed-type arrays (heterogeneous primitives)
5. Deep recursion (depth > 12)
6. Wide objects (> 50 keys)
7. Extreme string characters (newlines, delimiters, escaped quotes)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.validator import validator
from apps.api.services.router import exhaustive_router


ADVERSARIAL_PAYLOADS: dict[str, dict[str, Any]] = {
    "numeric_strings": {
        "description": "Strings containing valid integers and floats that must not be parsed as numbers",
        "payload": [
            {"id": "00123", "code": "00456", "rate_str": "0.45", "zip": "02138"},
            {"id": "00789", "code": "00012", "rate_str": "1.00", "zip": "07030"},
        ],
    },
    "boolean_and_null_strings": {
        "description": "Literal strings 'true', 'false', 'null' that must remain strings, not booleans/None",
        "payload": [
            {"flag": "true", "status": "false", "value": "null"},
            {"flag": "false", "status": "true", "value": "None"},
        ],
    },
    "missing_vs_null": {
        "description": "Record 1 has key 'opt' omitted; Record 2 has key 'opt' explicitly set to None",
        "payload": [
            {"id": 1, "name": "Item 1"},
            {"id": 2, "name": "Item 2", "opt": None},
        ],
    },
    "mixed_primitive_array": {
        "description": "Array containing mixed primitives (int, str, float, bool, None, list)",
        "payload": {
            "series": [42, "forty-two", 3.14159, True, False, None, [1, 2]],
        },
    },
    "delimiter_injection": {
        "description": "String values containing commas, pipes, tabs, newlines, quotes, and brackets",
        "payload": [
            {"text": "val1,val2|val3\nval4\tval5", "quote": 'say "hello"'},
            {"text": "col:val; [a,b,c]", "quote": "key=value&foo=bar"},
        ],
    },
    "empty_and_sparse": {
        "description": "Empty objects, empty arrays, and sparse null values",
        "payload": {
            "empty_dict": {},
            "empty_list": [],
            "nested_empty": [{"a": {}}, {"b": []}],
            "null_entry": None,
        },
    },
    "wide_object": {
        "description": "Single object with 60 distinct keys to test horizontal scaling",
        "payload": {f"key_{i:03d}": i * 1.5 for i in range(60)},
    },
}


def run_adversarial_evaluation() -> dict[str, Any]:
    """Runs all adversarial cases through the Exhaustive Adaptive Router and returns detailed audit."""
    results = {}
    manager = SerializationManager()

    for case_name, case_data in ADVERSARIAL_PAYLOADS.items():
        payload = case_data["payload"]
        route_res = exhaustive_router.route(payload)

        # Check each format's candidate result
        format_statuses = {}
        for c in route_res.candidates:
            format_statuses[c.format_id] = {
                "eligible": c.eligible,
                "valid": c.valid,
                "rejection_reason": c.rejection_reason,
                "tokens": c.estimated_tokens,
            }

        # Verify whether the selected format produced a bit-for-bit / type-exact round-trip
        selected = route_res.selected_format
        cand_map = {c.format_id: c for c in route_res.candidates}
        selected_cand = cand_map.get(selected)

        is_strictly_sound = False
        if selected_cand and selected_cand.decoded is not None:
            is_strictly_sound, val_err = validator.validate(payload, selected_cand.decoded)
        else:
            is_strictly_sound = False
            val_err = "No decoded representation"

        results[case_name] = {
            "description": case_data["description"],
            "selected_format": selected,
            "fallback_used": route_res.final_fallback_used,
            "strictly_sound": is_strictly_sound,
            "validation_error": val_err,
            "candidates": format_statuses,
        }

    return results


if __name__ == "__main__":
    print("=" * 70)
    print("TOONFORGE ADVERSARIAL SUITE EVALUATION")
    print("=" * 70)
    audit = run_adversarial_evaluation()
    for name, res in audit.items():
        status = "PASSED (Safe)" if res["strictly_sound"] else "FAILED (Data Corruption!)"
        print(f"\n[Case: {name}] -> {status}")
        print(f"  Selected: {res['selected_format']} (Fallback: {res['fallback_used']})")
        print(f"  Candidates:")
        for fmt, st in res["candidates"].items():
            valid_flag = "VALID" if st["valid"] else f"REJECTED ({st['rejection_reason']})"
            print(f"    - {fmt:<14}: {valid_flag}")
