"""Unit tests for core services: profiler, validator, tokenizer, router."""
import pytest
from apps.api.services.profiler import profiler
from apps.api.services.validator import validator
from apps.api.services.tokenizer import token_estimator
from apps.api.services.router import exhaustive_router


def test_profiler_metrics():
    payload = [
        {"id": 1, "name": "A", "val": 10.0},
        {"id": 2, "name": "B", "val": 20.0},
    ]
    prof = profiler.profile(payload)
    assert prof.record_count == 2
    assert prof.unique_key_count == 3
    assert prof.schema_uniformity == 1.0
    assert prof.max_depth == 2

    fv = profiler.extract_feature_vector(prof)
    assert "schema_uniformity" in fv
    assert "max_depth" in fv


def test_validator_strict_fidelity():
    original = {"a": 1, "b": "true", "c": None, "d": [1, 2]}

    # Exact match
    valid, err = validator.validate(original, {"a": 1, "b": "true", "c": None, "d": [1, 2]})
    assert valid
    assert err is None

    # Type coercion error: boolean true vs string "true"
    valid, err = validator.validate(original, {"a": 1, "b": True, "c": None, "d": [1, 2]})
    assert not valid
    assert "type mismatch" in err.lower() or "type" in err.lower()

    # Number vs numeric string
    valid, err = validator.validate({"code": "123"}, {"code": 123})
    assert not valid

    # Missing key vs None
    valid, err = validator.validate({"a": None}, {})
    assert not valid


def test_tokenizer_estimation():
    text = "The quick brown fox jumps over the lazy dog."
    cnt = token_estimator.estimate(text)
    assert cnt > 0
    savings = token_estimator.estimate_savings_pct(100, 70)
    assert savings == 30.0


def test_exhaustive_router():
    payload = [
        {"id": i, "val": i * 10, "label": f"item_{i}"}
        for i in range(15)
    ]
    res = exhaustive_router.route(payload)
    assert res.selected_format in ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]
    assert len(res.candidates) == 5
    assert not res.final_fallback_used
