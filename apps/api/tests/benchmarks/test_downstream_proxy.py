"""Focused regression tests for DownstreamRetrievabilityProxy.

Verifies:
1. Homogeneous tabular payloads do not falsely report valid=False / retrieval_rate=0.0.
2. Plain JSON and Compact JSON receive valid=True and non-zero retrieval rates.
3. Strict semantic mismatches (e.g. numeric/boolean string coercion) do not receive
   downstream retrieval credit, proving retrievability is gated by StrictValidator.
"""
from __future__ import annotations

import pytest
from benchmarks.downstream_proxy import DownstreamRetrievabilityProxy


def test_downstream_proxy_tabular_validity_not_zero():
    """TEST 1: Homogeneous tabular payload must not falsely report valid=False for all formats."""
    proxy = DownstreamRetrievabilityProxy()
    payload = [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"},
    ]

    results = proxy.evaluate_payload(payload)

    # Must contain results for standard formats
    assert "JSON" in results
    assert "Compact JSON" in results

    # At least one format must be valid and have non-zero retrieval rate
    valid_formats = [fmt for fmt, data in results.items() if data["valid"]]
    assert len(valid_formats) > 0, "No format was marked valid for a clean tabular payload"

    retrieval_successes = [fmt for fmt, data in results.items() if data["retrieval_rate"] > 0.0]
    assert len(retrieval_successes) > 0, "No format achieved non-zero retrieval rate for a clean tabular payload"


def test_downstream_proxy_plain_and_compact_json_valid_and_retrieval():
    """TEST 2: Plain JSON and Compact JSON must round-trip losslessly with valid=True and retrieval_rate > 0."""
    proxy = DownstreamRetrievabilityProxy()
    payload = [
        {"id": 101, "name": "Alice", "role": "admin"},
        {"id": 102, "name": "Bob", "role": "viewer"},
    ]

    results = proxy.evaluate_payload(payload)

    # Plain JSON checks
    assert results["JSON"]["eligible"] is True
    assert results["JSON"]["valid"] is True
    assert results["JSON"]["retrieval_rate"] == 1.0
    assert results["JSON"]["successful_queries"] == results["JSON"]["total_queries"]
    assert results["JSON"]["total_queries"] > 0

    # Compact JSON checks
    assert results["Compact JSON"]["eligible"] is True
    assert results["Compact JSON"]["valid"] is True
    assert results["Compact JSON"]["retrieval_rate"] == 1.0
    assert results["Compact JSON"]["successful_queries"] == results["Compact JSON"]["total_queries"]


def test_downstream_proxy_gated_by_strict_validator():
    """TEST 3: Candidates with strict semantic mismatches must NOT receive downstream retrieval credit."""
    proxy = DownstreamRetrievabilityProxy()

    # Numeric strings with leading zeros: TOON unquoted values coerce "00123" -> 123
    adversarial_payload = [
        {"id": "00123", "code": "00456"},
        {"id": "00789", "code": "00012"},
    ]

    results = proxy.evaluate_payload(adversarial_payload)

    # Plain JSON and Compact JSON safely preserve string types
    assert results["JSON"]["valid"] is True
    assert results["JSON"]["retrieval_rate"] == 1.0
    assert results["Compact JSON"]["valid"] is True
    assert results["Compact JSON"]["retrieval_rate"] == 1.0

    # TOON experiences numeric type coercion on decode -> strict validator rejects it
    assert results["TOON"]["eligible"] is True
    assert results["TOON"]["valid"] is False
    assert results["TOON"]["retrieval_rate"] == 0.0
    assert results["TOON"]["successful_queries"] == 0
