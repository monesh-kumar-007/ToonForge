"""Benchmark and Learned Router API endpoints."""
from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from apps.api.models.requests import (
    BenchmarkRequest, BenchmarkResponse, BenchmarkResultsResponse,
    BenchmarkResultSummary, LearnedRouterPredictRequest,
    LearnedRouterPredictResponse, LearnedRouterMetricsResponse,
)
from apps.api.models.domain import CandidateStatus
from apps.api.services.router import exhaustive_router
from apps.api.services.profiler import profiler as structural_profiler
from apps.api.services.learned_router import learned_router
from apps.api.services.learned_router_eval import (
    oracle_for,
    classify_prediction,
    evaluate_samples,
    split_dataset,
)
from apps.api.services.tokenizer import token_estimator
from apps.api.config.settings import settings

benchmark_router = APIRouter(prefix="/api/benchmark", tags=["Benchmark"])
learned_router_router = APIRouter(prefix="/api/learned-router", tags=["Learned Router"])

# ─── Corpus Generation ────────────────────────────────────────────────────────
#
# NOTE (STEP 6): The API benchmark uses the SAME canonical, deterministic
# corpus generator as the CLI benchmark (benchmarks/generate_corpus.py). The
# previous inline generator produced a DIFFERENT corpus for the same N/seed
# (its 5th category was "small_scalar", and its payload templates diverged),
# which made CLI and API headline numbers disagree (e.g. TOON 63.43% CLI vs
# 62.01% API at N=200 seed=200). Aligning to one generator guarantees parity.

def _generate_corpus(size: int, seed: int) -> list[dict[str, Any]]:
    """Generate the canonical deterministic benchmark corpus (CLI-compatible).

    Delegates to ``benchmarks.generate_corpus.generate_benchmark_corpus`` so
    API and CLI results are produced from the identical corpus.
    """
    from benchmarks.generate_corpus import generate_benchmark_corpus

    return generate_benchmark_corpus(size=size, seed=seed)


def _run_benchmark_task(size: int, seed: int, run_id: str) -> dict:
    """Run the full benchmark pipeline synchronously."""
    corpus = _generate_corpus(size, seed)
    t_start = time.perf_counter()

    strategies = ["JSON", "Compact JSON", "TOON", "JTON", "ONTO", "Adaptive Router"]
    strategy_results: dict[str, list[float]] = {s: [] for s in strategies}
    fallback_counts: dict[str, int] = {s: 0 for s in strategies}
    valid_counts: dict[str, int] = {s: 0 for s in strategies}
    ineligible_counts: dict[str, int] = {s: 0 for s in strategies}
    rejected_counts: dict[str, int] = {s: 0 for s in strategies}
    category_breakdown: dict[str, dict] = {}
    training_X: list[dict] = []
    training_y: list[str] = []
    routing_latencies: list[float] = []
    routing_results: list = []

    for item in corpus:
        payload = item["payload"]
        category = item["category"]

        # Run adaptive router (ground truth)
        route_result = exhaustive_router.route(payload)
        selected = route_result.selected_format or "JSON"
        json_tokens = route_result.json_token_baseline or 1
        routing_latencies.append(route_result.routing_latency_ms)
        routing_results.append(route_result)

        # Store for learned router training
        profile = route_result.profile
        fv = structural_profiler.extract_feature_vector(profile)
        training_X.append(fv)
        training_y.append(selected)

        # Adaptive Router savings
        adaptive_tokens = route_result.token_counts.get(selected, json_tokens)
        savings_pct = token_estimator.estimate_savings_pct(json_tokens, adaptive_tokens)
        strategy_results["Adaptive Router"].append(savings_pct)
        valid_counts["Adaptive Router"] += 1
        if route_result.final_fallback_used:
            fallback_counts["Adaptive Router"] += 1

        # Category tracking
        if category not in category_breakdown:
            category_breakdown[category] = {
                "count": 0,
                "adaptive_savings": [],
                "selected_formats": {},
            }
        category_breakdown[category]["count"] += 1
        category_breakdown[category]["adaptive_savings"].append(savings_pct)
        fmt_counts = category_breakdown[category]["selected_formats"]
        fmt_counts[selected] = fmt_counts.get(selected, 0) + 1

        # Fixed strategies
        for fmt_id in ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]:
            from apps.api.serializers.serialization_manager import SerializationManager
            mgr = SerializationManager()
            cand = mgr.serialize_one(payload, fmt_id)
            if cand.status == CandidateStatus.INELIGIBLE:
                # Structurally not applicable (the format's own eligibility logic).
                ineligible_counts[fmt_id] += 1
                continue
            if cand.encoded is None or cand.decoded is None:
                # Eligible but encode/decode failed -> candidate rejection.
                rejected_counts[fmt_id] += 1
                continue
            from apps.api.services.validator import validator as v
            valid, _ = v.validate(payload, cand.decoded)
            if valid:
                tokens = token_estimator.estimate(cand.encoded)
                savings = token_estimator.estimate_savings_pct(json_tokens, tokens)
                strategy_results[fmt_id].append(savings)
                valid_counts[fmt_id] += 1
            else:
                # Eligible, encoded/decoded, but strict validation failed.
                rejected_counts[fmt_id] += 1

    # Train learned router on a DETERMINISTIC 80% holdout; evaluate on the
    # never-seen 20% (Step 5 — no train/test overlap, real holdout metrics).
    learned_router_eval = None
    if len(training_X) >= 10:
        try:
            train_idx, eval_idx = split_dataset(
                len(corpus), test_size=0.2, random_state=42
            )
            learned_router.train(
                [training_X[i] for i in train_idx],
                [training_y[i] for i in train_idx],
            )

            eval_results = []
            eval_lr_latencies = []
            eval_ex_latencies = []
            for i in eval_idx:
                oracle = oracle_for(routing_results[i])
                prediction = learned_router.predict(training_X[i])
                eval_results.append(
                    classify_prediction(prediction["predicted_format"], oracle)
                )
                eval_lr_latencies.append(prediction.get("learned_latency_ms", 0.0))
                eval_ex_latencies.append(routing_latencies[i])
            agg = evaluate_samples(eval_results)
            agg.update({
                "evaluation_corpus_size": len(eval_idx),
                "training_corpus_size": len(train_idx),
                "eval_random_seed": 42,
                "learned_latency_ms": round(
                    sum(eval_lr_latencies) / max(len(eval_lr_latencies), 1), 3
                ),
                "exhaustive_latency_ms": round(
                    sum(eval_ex_latencies) / max(len(eval_ex_latencies), 1), 3
                ),
            })
            learned_router.record_evaluation(agg)
            learned_router_eval = {k: agg[k] for k in (
                "evaluation_corpus_size", "training_corpus_size", "eval_random_seed",
                "exact_match_rate", "mean_token_regret", "median_regret_tokens",
                "mean_regret_pct", "p95_regret_pct", "min_regret_pct", "max_regret_pct",
                "invalid_selection_rate", "ineligible_selection_rate",
                "rejected_selection_rate", "eligible_selection_rate",
                "final_fallback_rate", "learned_latency_ms", "exhaustive_latency_ms",
            )}
        except Exception as exc:
            pass  # Non-fatal; router metrics will reflect untrained state

    # Aggregate results
    import statistics

    def _grade(mean: float, fallback_rate: float) -> str:
        if fallback_rate > 0.3:
            return "HIGH DEFECT"
        if mean >= 30:
            return "OPTIMAL LEADER"
        if mean >= 20:
            return "STABLE"
        if mean >= 10:
            return "SPECIALIZED"
        if mean >= 0:
            return "BASELINE"
        return "HIGH VOLATILITY"

    results = []
    for strategy, savings_list in strategy_results.items():
        total = len(corpus)
        valid_cnt = valid_counts[strategy]
        ineligible_cnt = ineligible_counts[strategy]
        rejected_cnt = rejected_counts[strategy]
        fb_cnt = fallback_counts[strategy]

        # Valid-only compression efficiency (no artificial 0.0 dilution).
        if savings_list:
            mean = round(statistics.mean(savings_list), 2)
            median = round(statistics.median(savings_list), 2)
            std = round(statistics.stdev(savings_list) if len(savings_list) > 1 else 0.0, 2)
        else:
            mean = median = std = 0.0

        # Full-corpus applicability/reliability rates; fallback_rate is a
        # genuine final-fallback metric, never an ineligibility/rejection label.
        fallback_rate = round(fb_cnt / max(total, 1), 4)
        validity_rate = round(valid_cnt / max(total, 1), 4)
        ineligibility_rate = round(ineligible_cnt / max(total, 1), 4)
        rejection_rate = round(rejected_cnt / max(total, 1), 4)
        results.append({
            "strategy": strategy,
            "mean_reduction": mean,
            "median_reduction": median,
            "std_dev": std,
            "fallback_rate": fallback_rate,
            "routing_grade": _grade(mean, fallback_rate),
            "sample_count": total,
            "validity_rate": validity_rate,
            "ineligibility_rate": ineligibility_rate,
            "rejection_rate": rejection_rate,
            "valid_count": valid_cnt,
            "ineligible_count": ineligible_cnt,
            "rejected_count": rejected_cnt,
            "final_fallback_count": fb_cnt,
        })

    # Summarize category breakdown
    cat_summary = {}
    for cat, data in category_breakdown.items():
        sav = data["adaptive_savings"]
        cat_summary[cat] = {
            "count": data["count"],
            "mean_adaptive_savings": round(statistics.mean(sav) if sav else 0.0, 2),
            "selected_formats": data["selected_formats"],
        }

    duration = round(time.perf_counter() - t_start, 3)
    output = {
        "run_id": run_id,
        "seed": seed,
        "corpus_size": size,
        "results": results,
        "category_breakdown": cat_summary,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "duration_seconds": duration,
        "learned_router_eval": learned_router_eval,
    }

    # Persist results
    raw_path = settings.BENCHMARK_RAW_DIR / f"{run_id}.json"
    agg_path = settings.BENCHMARK_AGGREGATED_DIR / "latest.json"
    settings.BENCHMARK_RAW_DIR.mkdir(parents=True, exist_ok=True)
    settings.BENCHMARK_AGGREGATED_DIR.mkdir(parents=True, exist_ok=True)
    with open(raw_path, "w") as f:
        json.dump(output, f, indent=2)
    with open(agg_path, "w") as f:
        json.dump(output, f, indent=2)

    return output


# ─── Benchmark Endpoints ──────────────────────────────────────────────────────

@benchmark_router.post("", response_model=BenchmarkResponse)
async def run_benchmark(request: BenchmarkRequest, background_tasks: BackgroundTasks):
    """Run the full benchmark pipeline synchronously and return results."""
    run_id = f"run_{uuid.uuid4().hex[:8]}_seed{request.seed}"
    try:
        output = _run_benchmark_task(request.corpus_size, request.seed, run_id)
        return BenchmarkResponse(
            run_id=output["run_id"],
            seed=output["seed"],
            corpus_size=output["corpus_size"],
            results=[BenchmarkResultSummary(**r) for r in output["results"]],
            category_breakdown=output["category_breakdown"],
            completed_at=output["completed_at"],
            duration_seconds=output["duration_seconds"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {exc}")


@benchmark_router.get("/results", response_model=BenchmarkResultsResponse)
async def get_benchmark_results():
    """Return the latest available benchmark results."""
    agg_path = settings.BENCHMARK_AGGREGATED_DIR / "latest.json"
    if not agg_path.exists():
        return BenchmarkResultsResponse(
            available=False,
            message="No benchmark results available. Run POST /api/benchmark first.",
        )
    try:
        with open(agg_path) as f:
            data = json.load(f)
        return BenchmarkResultsResponse(
            available=True,
            run_id=data.get("run_id"),
            results=[BenchmarkResultSummary(**r) for r in data.get("results", [])],
            category_breakdown=data.get("category_breakdown"),
            completed_at=data.get("completed_at"),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load results: {exc}")


# ─── Learned Router Endpoints ─────────────────────────────────────────────────

@learned_router_router.post("/predict", response_model=LearnedRouterPredictResponse)
async def predict_format(request: LearnedRouterPredictRequest):
    """Predict format using learned router and compare to exhaustive router."""
    import time as _time

    # Exhaustive router for ground truth comparison
    t0 = _time.perf_counter()
    exhaustive_result = exhaustive_router.route(request.payload)
    exhaustive_latency = (_time.perf_counter() - t0) * 1000
    exhaustive_format = exhaustive_result.selected_format

    # Feature extraction
    profile = structural_profiler.profile(request.payload)
    fv = structural_profiler.extract_feature_vector(profile)

    # Learned router prediction
    prediction = learned_router.predict(fv, exhaustive_format)

    # Step 5: validity-first, tie-aware oracle comparison. Token regret is
    # oracle-relative and only defined for strictly-valid predictions.
    oracle = oracle_for(exhaustive_result)
    classified = classify_prediction(prediction["predicted_format"], oracle)
    token_regret = classified["regret_tokens"]

    return LearnedRouterPredictResponse(
        predicted_format=prediction["predicted_format"],
        exhaustive_format=exhaustive_format,
        agreement=prediction.get("agreement", False) or False,
        confidence=prediction.get("confidence", 0.0),
        token_regret=token_regret,
        learned_latency_ms=prediction.get("learned_latency_ms", 0.0),
        exhaustive_latency_ms=round(exhaustive_latency, 3),
        feature_vector=fv,
        model_trained=learned_router.is_trained,
        optimal_selection=classified["is_optimal"],
        invalid_selection=classified["invalid_selection"],
        regret_tokens=classified["regret_tokens"],
        regret_pct=classified["regret_pct"],
    )


@learned_router_router.get("/metrics", response_model=LearnedRouterMetricsResponse)
async def get_learned_router_metrics():
    """Return learned router evaluation metrics."""
    if not learned_router.is_trained:
        return LearnedRouterMetricsResponse(
            model_trained=False,
            message=(
                "Learned router not yet trained. "
                "Run POST /api/benchmark to train on a synthetic corpus."
            ),
        )
    m = learned_router.get_metrics() or {}
    return LearnedRouterMetricsResponse(
        model_trained=True,
        decision_agreement_rate=m.get("decision_agreement_rate"),
        mean_token_regret=m.get("mean_token_regret"),
        fallback_rate=m.get("final_fallback_rate", m.get("fallback_rate", 0.0)),
        learned_latency_ms=m.get("learned_latency_ms"),
        exhaustive_latency_ms=m.get("exhaustive_latency_ms"),
        training_corpus_size=m.get("training_corpus_size"),
        model_depth=m.get("model_depth"),
        exact_match_rate=m.get("exact_match_rate"),
        median_regret_tokens=m.get("median_regret_tokens"),
        mean_regret_pct=m.get("mean_regret_pct"),
        p95_regret_pct=m.get("p95_regret_pct"),
        min_regret_pct=m.get("min_regret_pct"),
        max_regret_pct=m.get("max_regret_pct"),
        invalid_selection_rate=m.get("invalid_selection_rate"),
        ineligible_selection_rate=m.get("ineligible_selection_rate"),
        rejected_selection_rate=m.get("rejected_selection_rate"),
        eligible_selection_rate=m.get("eligible_selection_rate"),
        evaluation_corpus_size=m.get("evaluation_corpus_size"),
        eval_random_seed=m.get("eval_random_seed"),
    )
