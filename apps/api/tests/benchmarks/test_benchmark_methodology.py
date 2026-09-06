"""Focused regression tests for benchmark methodology and metric semantics.

Verifies (STEP 4):
1. Ineligible samples do NOT dilute valid-only token-efficiency means.
2. Structural ineligibility and post-eligibility rejection are tracked separately.
3. Validity/applicability rates use the FULL corpus as denominator while
   efficiency uses only strictly-valid samples.
4. Baseline ineligibility/rejection never increments a "final fallback" metric.
5. Adaptive Router genuine final-fallback semantics are preserved unchanged.
6. Zero valid samples produce no crash and no misleading efficiency mean.
"""
from __future__ import annotations

import statistics
from pathlib import Path

import pytest

from benchmarks.run_benchmark import run_benchmark_suite
from apps.api.models.domain import CandidateStatus
from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.router import exhaustive_router
from apps.api.services.tokenizer import token_estimator
from apps.api.services.validator import validator

FORMATS = ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]

# ── Deterministic payloads (classification verified against real formats) ────

TABULAR_A = [
    {"record_id": "rec_1", "user_id": "usr_1", "action": "read", "latency_ms": 1.2, "status_code": 200, "is_cached": True},
    {"record_id": "rec_2", "user_id": "usr_2", "action": "write", "latency_ms": 3.4, "status_code": 201, "is_cached": False},
]
TABULAR_B = [
    {"record_id": "rec_9", "user_id": "usr_9", "action": "query", "latency_ms": 9.9, "status_code": 404, "is_cached": True},
    {"record_id": "rec_10", "user_id": "usr_10", "action": "delete", "latency_ms": 0.5, "status_code": 204, "is_cached": False},
]
DEEP_A = {
    "entity": "hierarchy_root", "level": 0,
    "child": {"entity": "node_level_1", "level": 1,
              "child": {"entity": "node_level_2", "level": 2,
                        "child": {"entity": "node_level_3", "level": 3, "weight": 0.42}}},
}
DEEP_B = {
    "entity": "root2", "level": 0,
    "child": {"entity": "mid_1", "level": 1,
              "child": {"entity": "mid_2", "level": 2,
                        "child": {"entity": "leaf", "level": 3, "weight": 0.88}}},
}
SHALLOW = {"key": "alpha", "value": 42, "ok": True}
LEADING_ZERO = [{"id": "00123", "code": "00456"}, {"id": "00789", "code": "00012"}]


def _item(name: str, payload) -> dict:
    return {"id": f"item_{name}", "category": name.split("_")[0], "payload": payload}


def _run(corpus, tmp_path: Path) -> dict:
    return run_benchmark_suite(
        corpus_size=len(corpus),
        seed=123,
        output_dir=tmp_path,
        corpus=corpus,
    )


def _valid_savings_per_format(corpus) -> dict[str, list[float]]:
    """Independently reproduce the benchmark's per-format STRICTLY VALID savings."""
    manager = SerializationManager()
    collected: dict[str, list[float]] = {fmt: [] for fmt in FORMATS}
    for item in corpus:
        payload = item["payload"]
        route = exhaustive_router.route(payload)
        json_tokens = route.json_token_baseline or 1
        for fmt in FORMATS:
            cand = manager.serialize_one(payload, fmt)
            if cand.status == CandidateStatus.INELIGIBLE:
                continue
            if cand.encoded is None or cand.decoded is None:
                continue
            ok, _ = validator.validate(payload, cand.decoded)
            if not ok:
                continue
            tokens = token_estimator.estimate(cand.encoded)
            collected[fmt].append(token_estimator.estimate_savings_pct(json_tokens, tokens))
    return collected


def _row(report: dict, name: str) -> dict:
    return next(r for r in report["strategies"] if r["strategy"] == name)


def test_ineligible_samples_do_not_dilute_valid_only_savings(tmp_path):
    """2 valid + 1 ineligible for ONTO: mean uses only the valid samples."""
    corpus = [_item("deep_a", DEEP_A), _item("deep_b", DEEP_B), _item("shallow", SHALLOW)]
    report = _run(corpus, tmp_path)
    row = _row(report, "ONTO")

    expected = _valid_savings_per_format(corpus)["ONTO"]
    assert len(expected) == 2
    expected_mean = round(statistics.mean(expected), 2)

    # Valid-only efficiency — NOT diluted by the ineligible sample's 0.0
    assert row["mean_reduction_pct"] == pytest.approx(expected_mean, abs=0.01)
    diluted = round(statistics.mean([*expected, 0.0]), 2)
    assert round(row["mean_reduction_pct"], 2) != round(diluted, 2)

    # Applicability uses the full corpus
    assert row["valid_count"] == 2
    assert row["ineligible_count"] == 1
    assert row["rejected_count"] == 0
    assert row["validity_rate"] == round(2 / 3, 4)
    assert row["ineligibility_rate"] == round(1 / 3, 4)
    assert row["rejection_rate"] == 0.0


def test_ineligible_and_rejected_are_tracked_separately(tmp_path):
    """TOON: 1 valid, 1 strictly-rejected, 2 ineligible — all separate buckets."""
    corpus = [_item("tabular_a", TABULAR_A), _item("leading_zero", LEADING_ZERO),
              _item("shallow", SHALLOW), _item("deep_a", DEEP_A)]
    report = _run(corpus, tmp_path)
    row = _row(report, "TOON")

    assert row["valid_count"] == 1          # tabular_a strictly valid
    assert row["rejected_count"] == 1       # leading_zero eligible but strict validation fails
    assert row["ineligible_count"] == 2     # shallow / deep_a structurally not applicable
    assert row["validity_rate"] == round(1 / 4, 4)
    assert row["rejection_rate"] == round(1 / 4, 4)
    assert row["ineligibility_rate"] == round(2 / 4, 4)

    expected = _valid_savings_per_format(corpus)["TOON"]
    assert len(expected) == 1
    assert row["mean_reduction_pct"] == pytest.approx(round(expected[0], 2), abs=0.01)


def test_validity_rate_uses_full_corpus(tmp_path):
    """2 valid samples out of 5 -> validity_rate == 0.4 while efficiency uses only the 2."""
    corpus = [_item("tabular_a", TABULAR_A), _item("tabular_b", TABULAR_B),
              _item("deep_a", DEEP_A), _item("deep_b", DEEP_B), _item("shallow", SHALLOW)]
    report = _run(corpus, tmp_path)
    row = _row(report, "ONTO")

    expected = _valid_savings_per_format(corpus)["ONTO"]
    assert len(expected) == 2
    assert row["sample_count"] == 5
    assert row["valid_count"] == 2
    assert row["validity_rate"] == 0.4
    assert row["mean_reduction_pct"] == pytest.approx(
        round(statistics.mean(expected), 2), abs=0.01
    )
    # The two ineligible samples must not add zeroes into the efficiency mean
    assert row["mean_reduction_pct"] != pytest.approx(
        round(statistics.mean([*expected, 0.0, 0.0]), 2), abs=0.001
    )


def test_no_fake_baseline_final_fallback(tmp_path):
    """Baseline ineligibility/rejection never increments a final-fallback metric."""
    corpus = [_item("deep_a", DEEP_A), _item("deep_b", DEEP_B),
              _item("shallow", SHALLOW), _item("leading_zero", LEADING_ZERO)]
    report = _run(corpus, tmp_path)

    for strat_name in ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]:
        row = _row(report, strat_name)
        assert row["fallback_rate"] == 0.0
        assert row["final_fallback_count"] == 0

    # Explicit: ONTO with multiple ineligible samples still shows NO fallback.
    onto = _row(report, "ONTO")
    assert onto["ineligible_count"] >= 1
    assert onto["ineligibility_rate"] > 0.0
    assert onto["fallback_rate"] == 0.0

    # Explicit: TOON with a genuine strict-validation rejection shows NO fallback.
    toon = _row(report, "TOON")
    assert toon["rejected_count"] >= 1
    assert toon["rejection_rate"] > 0.0
    assert toon["fallback_rate"] == 0.0


def test_adaptive_router_fallback_invariant_preserved(tmp_path):
    """Step 4 must not alter genuine router final_fallback_used semantics."""
    corpus = [_item("tabular_a", TABULAR_A), _item("tabular_b", TABULAR_B),
              _item("deep_a", DEEP_A), _item("shallow", SHALLOW),
              _item("leading_zero", LEADING_ZERO)]
    report = _run(corpus, tmp_path)
    row = _row(report, "Adaptive Router")

    oracle_fallbacks = sum(
        1 for item in corpus if exhaustive_router.route(item["payload"]).final_fallback_used
    )
    assert row["fallback_rate"] == round(oracle_fallbacks / len(corpus), 4)
    assert row["final_fallback_count"] == oracle_fallbacks
    assert row["sample_count"] == len(corpus)
    assert row["valid_count"] == len(corpus)
    assert row["ineligible_count"] == 0
    assert row["rejected_count"] == 0


def test_zero_valid_samples_no_crash_no_misleading_mean(tmp_path):
    """A format with zero strictly-valid samples must not crash or fake efficiency."""
    corpus = [_item("tabular_a", TABULAR_A), _item("tabular_b", TABULAR_B),
              _item("leading_zero", LEADING_ZERO)]
    report = _run(corpus, tmp_path)

    onto = _row(report, "ONTO")  # ONTO is ineligible on all three depth-2 payloads
    assert onto["valid_count"] == 0
    assert onto["ineligible_count"] == 3
    assert onto["rejected_count"] == 0
    assert onto["validity_rate"] == 0.0
    assert onto["ineligibility_rate"] == 1.0
    assert onto["rejection_rate"] == 0.0
    assert onto["mean_reduction_pct"] == 0.0  # repository convention, transparent via valid_count

    # JSON must remain the intact reference baseline (always valid, zero self-savings).
    j = _row(report, "JSON")
    assert j["valid_count"] == 3
    assert j["validity_rate"] == 1.0
    assert j["mean_reduction_pct"] == 0.0

    # Persisted report file also carries the new methodology fields.
    written = next(Path(tmp_path).glob("benchmark_summary_*.json"))
    import json
    data = json.loads(written.read_text(encoding="utf-8"))
    onto_persisted = next(r for r in data["strategies"] if r["strategy"] == "ONTO")
    assert "ineligibility_rate" in onto_persisted
    assert "rejection_rate" in onto_persisted
    assert "valid_count" in onto_persisted