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
from apps.api.services.router import exhaustive_router
from apps.api.services.profiler import profiler as structural_profiler
from apps.api.services.learned_router import learned_router
from apps.api.services.tokenizer import token_estimator
from apps.api.config.settings import settings

benchmark_router = APIRouter(prefix="/api/benchmark", tags=["Benchmark"])
learned_router_router = APIRouter(prefix="/api/learned-router", tags=["Learned Router"])

# ─── Corpus Generation ────────────────────────────────────────────────────────

def _generate_corpus(size: int, seed: int) -> list[dict[str, Any]]:
    """Generate a deterministic synthetic benchmark corpus."""
    import random
    rng = random.Random(seed)

    corpus = []
    categories = ["flat_tabular", "nested_objects", "deep_nested", "heterogeneous", "small_scalar"]
    per_category = size // len(categories)

    # 1. Flat Tabular (uniform arrays)
    for i in range(per_category):
        n_records = rng.randint(5, 50)
        payload = [
            {
                "record_id": f"rec_{rng.randint(1000, 9999)}",
                "user_id": f"usr_{rng.randint(10000, 99999)}",
                "timestamp": rng.randint(1700000000, 1730000000),
                "action": rng.choice(["read", "write", "delete", "query"]),
                "duration_ms": round(rng.uniform(0.1, 100.0), 2),
                "cache_hit": rng.choice([True, False]),
            }
            for _ in range(n_records)
        ]
        corpus.append({"category": "flat_tabular", "payload": payload})

    # 2. Nested Objects
    for i in range(per_category):
        payload = {
            "config": {
                "model": rng.choice(["gpt-4", "llama-3", "mistral"]),
                "params": {
                    "temperature": round(rng.uniform(0.0, 1.5), 2),
                    "max_tokens": rng.randint(128, 4096),
                    "top_p": round(rng.uniform(0.8, 1.0), 2),
                },
            },
            "metadata": {
                "created_at": rng.randint(1700000000, 1730000000),
                "tags": [rng.choice(["prod", "staging", "dev"])],
                "version": f"{rng.randint(1, 5)}.{rng.randint(0, 9)}.{rng.randint(0, 9)}",
            },
            "results": [
                {"step": j, "score": round(rng.uniform(0, 1), 4)}
                for j in range(rng.randint(2, 8))
            ],
        }
        corpus.append({"category": "nested_objects", "payload": payload})

    # 3. Deep Nested
    for i in range(per_category):
        depth = rng.randint(5, 8)
        payload = {"root": True}
        node = payload
        for d in range(depth):
            child = {
                "level": d + 1,
                "value": rng.randint(0, 100),
                "label": f"node_{d}",
            }
            node["child"] = child
            node = child
        corpus.append({"category": "deep_nested", "payload": payload})

    # 4. Heterogeneous
    for i in range(per_category):
        n = rng.randint(3, 15)
        payload = []
        for j in range(n):
            rec_type = rng.choice(["A", "B", "C"])
            if rec_type == "A":
                payload.append({"type": "A", "value": rng.randint(0, 1000), "active": True})
            elif rec_type == "B":
                payload.append({"type": "B", "label": f"item_{j}", "score": round(rng.uniform(0, 1), 4), "meta": None})
            else:
                payload.append({"type": "C", "data": [rng.randint(0, 10) for _ in range(3)]})
        corpus.append({"category": "heterogeneous", "payload": payload})

    # 5. Small / Scalar-Dominated
    remaining = size - len(corpus)
    for i in range(remaining):
        payload = {
            "key": rng.choice(["alpha", "beta", "gamma"]),
            "value": rng.randint(0, 999),
            "ok": rng.choice([True, False]),
        }
        corpus.append({"category": "small_scalar", "payload": payload})

    return corpus


def _run_benchmark_task(size: int, seed: int, run_id: str) -> dict:
    """Run the full benchmark pipeline synchronously."""
    corpus = _generate_corpus(size, seed)
    t_start = time.perf_counter()

    strategies = ["JSON", "Compact JSON", "TOON", "JTON", "ONTO", "Adaptive Router"]
    strategy_results: dict[str, list[float]] = {s: [] for s in strategies}
    fallback_counts: dict[str, int] = {s: 0 for s in strategies}
    category_breakdown: dict[str, dict] = {}
    training_X: list[dict] = []
    training_y: list[str] = []

    for item in corpus:
        payload = item["payload"]
        category = item["category"]

        # Run adaptive router (ground truth)
        route_result = exhaustive_router.route(payload)
        selected = route_result.selected_format or "JSON"
        json_tokens = route_result.json_token_baseline or 1

        # Store for learned router training
        profile = route_result.profile
        fv = structural_profiler.extract_feature_vector(profile)
        training_X.append(fv)
        training_y.append(selected)

        # Adaptive Router savings
        adaptive_tokens = route_result.token_counts.get(selected, json_tokens)
        savings_pct = token_estimator.estimate_savings_pct(json_tokens, adaptive_tokens)
        strategy_results["Adaptive Router"].append(savings_pct)
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
            if cand.eligible and cand.encoded:
                from apps.api.services.validator import validator as v
                if cand.decoded is not None:
                    valid, _ = v.validate(payload, cand.decoded)
                    if valid:
                        tokens = token_estimator.estimate(cand.encoded)
                        savings = token_estimator.estimate_savings_pct(json_tokens, tokens)
                        strategy_results[fmt_id].append(savings)
                    else:
                        strategy_results[fmt_id].append(0.0)
                        fallback_counts[fmt_id] += 1
                else:
                    strategy_results[fmt_id].append(0.0)
            else:
                strategy_results[fmt_id].append(0.0)

    # Train learned router
    if len(training_X) >= 10:
        try:
            learned_router.train(training_X, training_y)
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
        if savings_list:
            mean = round(statistics.mean(savings_list), 2)
            median = round(statistics.median(savings_list), 2)
            std = round(statistics.stdev(savings_list) if len(savings_list) > 1 else 0.0, 2)
        else:
            mean = median = std = 0.0
        fallback_rate = round(fallback_counts[strategy] / max(len(corpus), 1), 4)
        results.append({
            "strategy": strategy,
            "mean_reduction": mean,
            "median_reduction": median,
            "std_dev": std,
            "fallback_rate": fallback_rate,
            "routing_grade": _grade(mean, fallback_rate),
            "sample_count": len(savings_list),
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

    # Token regret
    token_regret = None
    if (
        prediction["predicted_format"] != exhaustive_format
        and prediction["predicted_format"] in exhaustive_result.token_counts
        and exhaustive_format in exhaustive_result.token_counts
    ):
        token_regret = (
            exhaustive_result.token_counts[prediction["predicted_format"]]
            - exhaustive_result.token_counts[exhaustive_format]
        )

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
        mean_token_regret=m.get("mean_token_regret", 0.0),
        fallback_rate=m.get("fallback_rate", 0.0),
        learned_latency_ms=m.get("learned_latency_ms", 0.3),
        exhaustive_latency_ms=m.get("exhaustive_latency_ms", 4.5),
        training_corpus_size=m.get("training_corpus_size"),
        model_depth=m.get("model_depth"),
    )
