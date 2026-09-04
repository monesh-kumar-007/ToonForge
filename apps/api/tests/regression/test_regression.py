"""Regression tests verifying zero-tolerance against silent corruption."""
import pytest
from apps.api.services.router import exhaustive_router
from apps.api.services.validator import validator
from apps.api.serializers.serialization_manager import SerializationManager


def test_numeric_string_safety():
    """Ensure formats that coerce numeric strings to ints/floats are rejected."""
    payload = [
        {"zip": "02138", "code": "00451", "rate": "0.50"},
        {"zip": "90210", "code": "00012", "rate": "1.00"},
    ]
    res = exhaustive_router.route(payload)
    cand_map = {c.format_id: c for c in res.candidates}

    # The selected candidate MUST pass strict validation
    selected_cand = cand_map[res.selected_format]
    valid, err = validator.validate(payload, selected_cand.decoded)
    assert valid, f"Selected format {res.selected_format} produced corrupted output: {err}"


def test_boolean_string_safety():
    """Ensure literal 'true' / 'false' strings are not coerced into booleans."""
    payload = [
        {"flag_str": "true", "val": "null"},
        {"flag_str": "false", "val": "undefined"},
    ]
    res = exhaustive_router.route(payload)
    cand_map = {c.format_id: c for c in res.candidates}
    selected_cand = cand_map[res.selected_format]
    valid, err = validator.validate(payload, selected_cand.decoded)
    assert valid, f"Selected format {res.selected_format} failed: {err}"


def test_missing_vs_explicit_null():
    """Missing key in one record vs explicit None in another."""
    payload = [
        {"id": 1, "name": "A"},
        {"id": 2, "name": "B", "extra": None},
    ]
    res = exhaustive_router.route(payload)
    cand_map = {c.format_id: c for c in res.candidates}
    selected_cand = cand_map[res.selected_format]
    valid, err = validator.validate(payload, selected_cand.decoded)
    assert valid, f"Validation failed: {err}"


def test_heterogeneous_types():
    """Array containing mixed types."""
    payload = {"data": [1, "two", 3.14, True, None]}
    res = exhaustive_router.route(payload)
    assert res.selected_format in ["JSON", "Compact JSON", "ONTO", "JTON", "TOON"]
    cand_map = {c.format_id: c for c in res.candidates}
    selected_cand = cand_map[res.selected_format]
    valid, err = validator.validate(payload, selected_cand.decoded)
    assert valid
