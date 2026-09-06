"""Focused regression tests for Learned Router evaluation integrity (STEP 5).

Verifies:
1. The oracle is built from STRICTLY VALID candidates only — a token-efficient
   but rejected/ineligible prediction can never masquerade as a valid tradeoff
   (no silent ``json_tokens`` fallback cost).
2. Predicting an oracle-optimal format yields zero regret.
3. Regret is normalized against the ORACLE-OPTIMAL token count, not the JSON
   baseline, and is never clipped to conceal losses.
4. Ties are handled: every valid candidate at the minimum token count is
   optimal (single-format ``min()`` oracle is insufficient).
5. Aggregate evaluation separates invalid selections from valid regret stats.
6. Candidate rejection is tracked as an invalid selection but NEVER as a final
   fallback event.
7. Deterministic, disjoint train/test splitting (no train/test overlap), and
   the real benchmark pipeline trains on an explicit holdout and evaluates held-
   out samples only.
"""
from __future__ import annotations

import pytest

from apps.api.routers.benchmark import _run_benchmark_task, settings
from apps.api.services.learned_router import learned_router
from apps.api.services.learned_router_eval import (
    oracle_for,
    classify_prediction,
    evaluate_samples,
    split_dataset,
)
from apps.api.services.router import exhaustive_router
from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.tokenizer import token_estimator
from apps.api.tests.benchmarks.test_benchmark_methodology import (
    TABULAR_A,
    TABULAR_B,
    LEADING_ZERO,
    SHALLOW,
)


def _oracle(payload):
    return oracle_for(exhaustive_router.route(payload))


# ── TEST 1: validity-first oracle ─────────────────────────────────────────────

def test_oracle_excludes_token_efficient_but_invalid():
    """LEADING_ZERO: TOON is strictly REJECTED (leading zeros) yet token-cheap.
    It must be excluded from the oracle and never receive a JSON fallback cost."""
    oracle = _oracle(LEADING_ZERO)

    assert "TOON" in oracle["rejected_formats"]
    assert "TOON" not in oracle["valid_tokens"]

    # TOON is token-efficient (>2x smaller than the JSON baseline) but invalid.
    cand = SerializationManager().serialize_one(LEADING_ZERO, "TOON")
    assert cand.encoded is not None
    toon_tokens = token_estimator.estimate(cand.encoded)
    assert toon_tokens < oracle["json_baseline"]

    classified = classify_prediction("TOON", oracle)
    assert classified["invalid_selection"] is True
    assert classified["nonvalid_reason"] == "rejected"
    assert classified["is_valid_candidate"] is False
    assert classified["is_optimal"] is False
    # The Step-5 bug signature: invalid prediction must NOT be assigned a
    # JSON-fallback token regret (the old `token_counts.get(f, json_tokens)`).
    assert classified["regret_tokens"] is None
    assert classified["regret_pct"] is None

    # Oracle sanity: optimal set derives from strictly-valid candidates only.
    assert oracle["optimal_tokens"] == min(oracle["valid_tokens"].values())
    assert oracle["optimal_formats"] <= set(oracle["valid_tokens"].keys())
    assert oracle["optimal_formats"]


# ── TEST 2: zero regret on optimal prediction ────────────────────────────────

def test_predicting_oracle_optimal_is_zero_regret():
    oracle = _oracle(TABULAR_A)
    optimal = min(oracle["optimal_formats"])

    classified = classify_prediction(optimal, oracle)
    assert classified["is_valid_candidate"] is True
    assert classified["is_optimal"] is True
    assert classified["invalid_selection"] is False
    assert classified["regret_tokens"] == 0
    assert classified["regret_pct"] == 0.0


# ── TEST 3: oracle-relative, unclipped positive regret ───────────────────────

def test_valid_suboptimal_prediction_has_oracle_relative_positive_regret():
    oracle = _oracle(TABULAR_B)
    suboptimal = next(
        f for f in oracle["valid_tokens"] if f not in oracle["optimal_formats"]
    )
    optimal_tokens = oracle["optimal_tokens"]
    json_baseline = oracle["json_baseline"]

    classified = classify_prediction(suboptimal, oracle)
    assert classified["is_valid_candidate"] is True
    assert classified["is_optimal"] is False
    assert classified["invalid_selection"] is False
    assert classified["regret_tokens"] > 0

    expected_pct = (oracle["valid_tokens"][suboptimal] - optimal_tokens) / optimal_tokens * 100.0
    assert classified["regret_pct"] == pytest.approx(expected_pct, abs=1e-3)
    # Normalized against the ORACLE, not against the JSON baseline.
    baseline_normalized = (
        (oracle["valid_tokens"][suboptimal] - optimal_tokens) / json_baseline * 100.0
    )
    assert classified["regret_pct"] != pytest.approx(baseline_normalized, abs=1e-3)


# ── TEST 4: tie handling ──────────────────────────────────────────────────────

def test_tie_handling_all_minimum_candidates_are_optimal():
    oracle = {
        "valid_tokens": {"JSON": 100, "Compact JSON": 80, "TOON": 80},
        "optimal_tokens": 80,
        "optimal_formats": {"Compact JSON", "TOON"},
        "json_baseline": 100,
        "final_fallback_used": False,
        "ineligible_formats": set(),
        "rejected_formats": set(),
    }

    assert classify_prediction("Compact JSON", oracle)["is_optimal"] is True
    assert classify_prediction("Compact JSON", oracle)["regret_tokens"] == 0
    assert classify_prediction("TOON", oracle)["is_optimal"] is True
    assert classify_prediction("TOON", oracle)["regret_tokens"] == 0

    wrong = classify_prediction("JSON", oracle)
    assert wrong["is_valid_candidate"] is True
    assert wrong["is_optimal"] is False
    assert wrong["regret_tokens"] == 20
    assert wrong["regret_pct"] == 25.0


# ── TEST 5: aggregation separates invalid from valid regret ──────────────────

def test_aggregation_separates_invalid_from_valid_regret():
    tab_a = _oracle(TABULAR_A)
    tab_b = _oracle(TABULAR_B)
    lz = _oracle(LEADING_ZERO)

    optimal = min(tab_a["optimal_formats"])
    suboptimal = next(f for f in tab_b["valid_tokens"] if f not in tab_b["optimal_formats"])

    results = [
        classify_prediction(optimal, tab_a),          # valid, optimal, regret 0
        classify_prediction(suboptimal, tab_b),       # valid, suboptimal, regret > 0
        classify_prediction("TOON", lz),              # invalid (rejected)
    ]

    agg = evaluate_samples(results)
    assert agg["sample_count"] == 3
    assert agg["exact_match_rate"] == pytest.approx(1 / 3, abs=1e-4)
    assert agg["invalid_selection_rate"] == pytest.approx(1 / 3, abs=1e-4)
    assert agg["rejected_selection_rate"] == pytest.approx(1 / 3, abs=1e-4)
    assert agg["ineligible_selection_rate"] == 0.0
    assert agg["eligible_selection_rate"] == pytest.approx(2 / 3, abs=1e-4)
    assert agg["final_fallback_rate"] == 0.0

    # Regret statistics use ONLY the two valid predictions (invalid excluded).
    b_regret = tab_b["valid_tokens"][suboptimal] - tab_b["optimal_tokens"]
    assert agg["mean_token_regret"] == pytest.approx(b_regret / 2, abs=1e-2)
    assert agg["median_regret_tokens"] == pytest.approx((0 + b_regret) / 2, abs=1e-2)
    assert agg["mean_regret_pct"] is not None
    # p95 requires >= 20 valid samples to avoid a misleading single-number stat.
    assert agg["p95_regret_pct"] is None


# ── TEST 6: candidate rejection is NOT a final fallback ──────────────────────

def test_candidate_rejection_is_not_final_fallback():
    results = [
        classify_prediction("TOON", _oracle(LEADING_ZERO)),  # rejected
        classify_prediction("TOON", _oracle(SHALLOW)),       # ineligible
        classify_prediction("ONTO", _oracle(TABULAR_A)),     # ineligible
    ]
    agg = evaluate_samples(results)

    assert agg["rejected_selection_rate"] == pytest.approx(1 / 3, abs=1e-4)
    assert agg["ineligible_selection_rate"] == pytest.approx(2 / 3, abs=1e-4)
    assert agg["invalid_selection_rate"] == 1.0
    # A rejected/ineligible candidate is an invalid selection, NEVER a fallback.
    assert agg["final_fallback_rate"] == 0.0
    assert agg["mean_token_regret"] is None
    assert agg["mean_regret_pct"] is None


# ── TEST 7: deterministic, disjoint train/test split ─────────────────────────

def test_split_dataset_is_deterministic_and_disjoint():
    a_train, a_eval = split_dataset(100, test_size=0.2, random_state=42)
    b_train, b_eval = split_dataset(100, test_size=0.2, random_state=42)
    c_train, c_eval = split_dataset(100, test_size=0.2, random_state=7)

    assert len(a_train) == 80
    assert len(a_eval) == 20
    assert a_train == b_train and a_eval == b_eval
    assert set(a_train).isdisjoint(a_eval)
    assert c_train != a_train


# ── TEST 8: end-to-end pipeline trains on holdout, evaluates held-out only ───

def test_benchmark_pipeline_holdout_eval(tmp_path, monkeypatch):
    import apps.api.routers.benchmark as bm

    monkeypatch.setattr(learned_router, "_save", lambda: None)
    monkeypatch.setattr(settings, "BENCHMARK_RAW_DIR", tmp_path / "raw")
    monkeypatch.setattr(settings, "BENCHMARK_AGGREGATED_DIR", tmp_path / "agg")

    out = bm._run_benchmark_task(30, seed=7, run_id="step5_holdout")
    eval_ = out["learned_router_eval"]

    assert eval_ is not None
    assert eval_["training_corpus_size"] == 24
    assert eval_["evaluation_corpus_size"] == 6
    assert eval_["eval_random_seed"] == 42
    assert 24 + 6 == out["corpus_size"] == 30

    # All holdout stats were recorded on the router for /metrics.
    stored = learned_router.get_metrics()
    assert stored["training_corpus_size"] == 24
    assert stored["evaluation_corpus_size"] == 6
    assert 0.0 <= eval_["exact_match_rate"] <= 1.0
    assert 0.0 <= eval_["invalid_selection_rate"] <= 1.0
    assert eval_["final_fallback_rate"] >= 0.0
    assert eval_["rejected_selection_rate"] >= 0.0
    assert eval_["ineligible_selection_rate"] >= 0.0