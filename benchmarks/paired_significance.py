"""Paired significance test: Adaptive Router vs Compact JSON token reduction.

Regenerates the canonical corpus (N=200, seed=200), computes each payload's
valid-only token reduction % for the Adaptive Router selection and for Compact
JSON (mirroring the exact canonical formula used by run_benchmark.py), then
performs a paired Wilcoxon signed-rank test and a 95% CI for the mean paired
difference (Router - Compact JSON) using a t-distribution.

No raw per-payload output mode exists in benchmarks/run_benchmark.py, so this
standalone script is the source of the per-payload rows saved to
benchmarks/results/raw_per_payload_n200_s200.json.
"""
from __future__ import annotations

import argparse
import json
import statistics
import sys
from pathlib import Path

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scipy import stats as scipy_stats

from apps.api.models.domain import CandidateStatus
from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.router import exhaustive_router
from apps.api.services.tokenizer import token_estimator
from apps.api.services.validator import validator
from benchmarks.generate_corpus import generate_benchmark_corpus


def run_paired_significance(
    size: int = 200,
    seed: int = 200,
    raw_output: Path | None = None,
    stat_output: Path | None = None,
) -> dict:
    corpus = generate_benchmark_corpus(size=size, seed=seed)
    manager = SerializationManager()

    rows: list[dict] = []
    compact_reductions: list[float] = []
    router_reductions: list[float] = []
    diffs: list[float] = []

    for item in corpus:
        payload = item["payload"]

        route_res = exhaustive_router.route(payload)
        json_tokens = route_res.json_token_baseline or 1

        selected = route_res.selected_format or "JSON"
        router_tokens = route_res.token_counts.get(selected, json_tokens)
        router_red = token_estimator.estimate_savings_pct(json_tokens, router_tokens)

        compact_red = None
        compact_tokens = None
        compact_valid = False
        cand = manager.serialize_one(payload, "Compact JSON")
        if cand.status != CandidateStatus.INELIGIBLE and cand.encoded is not None and cand.decoded is not None:
            is_valid, _ = validator.validate(payload, cand.decoded)
            if is_valid:
                compact_tokens = token_estimator.estimate(cand.encoded)
                compact_red = token_estimator.estimate_savings_pct(json_tokens, compact_tokens)
                compact_valid = True

        rows.append({
            "item_id": item["id"],
            "category": item["category"],
            "json_tokens": json_tokens,
            "compact_tokens": compact_tokens,
            "compact_valid": compact_valid,
            "compact_reduction_pct": compact_red,
            "router_selected": selected,
            "router_tokens": router_tokens,
            "router_reduction_pct": round(router_red, 4),
            "diff_router_minus_compact_pct": round(router_red - compact_red, 4) if compact_red is not None else None,
        })

        if compact_red is not None:
            compact_reductions.append(compact_red)
            router_reductions.append(router_red)
            diffs.append(router_red - compact_red)

    n = len(diffs)
    mean_diff = statistics.mean(diffs)
    std_diff = statistics.stdev(diffs) if n > 1 else 0.0
    sem = std_diff / (n ** 0.5)
    t_crit = scipy_stats.t.ppf(0.975, df=n - 1) if n > 1 else 0.0

    w_stat, p_value = scipy_stats.wilcoxon(diffs)

    result = {
        "metadata": {
            "title": "Paired significance: Adaptive Router vs Compact JSON token reduction",
            "corpus_size": size,
            "random_seed": seed,
            "paired_n": n,
            "method": "valid-only per-payload reduction % (estimate_savings_pct vs JSON baseline)",
        },
        "n": n,
        "mean_diff": round(mean_diff, 4),
        "median_diff": round(statistics.median(diffs), 4),
        "std_diff": round(std_diff, 4),
        "ci_low": round(mean_diff - t_crit * sem, 4),
        "ci_high": round(mean_diff + t_crit * sem, 4),
        "wilcoxon_statistic": float(w_stat),
        "p_value": float(p_value),
        "sanity_anchors": {
            "compact_json_mean_reduction_pct": round(statistics.mean(compact_reductions), 2),
            "adaptive_router_mean_reduction_pct": round(statistics.mean(router_reductions), 2),
            "expected_goal": {
                "compact_json": 40.47,
                "adaptive_router": 46.26,
                "mean_diff": round(46.26 - 40.47, 2),
            },
        },
    }

    if raw_output:
        raw_output.parent.mkdir(parents=True, exist_ok=True)
        raw_output.write_text(
            json.dumps({
                "metadata": {
                    "corpus_size": size,
                    "random_seed": seed,
                    "source": "benchmarks/paired_significance.py (run_benchmark.py has no raw per-payload mode)",
                },
                "items": rows,
            }, indent=2),
            encoding="utf-8",
        )
        print(f"[+] Wrote raw per-payload rows: {raw_output}")

    if stat_output:
        stat_output.parent.mkdir(parents=True, exist_ok=True)
        stat_output.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(f"[+] Wrote significance result: {stat_output}")

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Paired significance: Router vs Compact JSON")
    parser.add_argument("--size", type=int, default=200)
    parser.add_argument("--seed", type=int, default=200)
    parser.add_argument(
        "--raw-output",
        type=str,
        default="benchmarks/results/raw_per_payload_n200_s200.json",
    )
    parser.add_argument(
        "--stat-output",
        type=str,
        default="benchmarks/results/paired_significance_n200_s200.json",
    )
    args = parser.parse_args()

    res = run_paired_significance(
        size=args.size,
        seed=args.seed,
        raw_output=Path(args.raw_output),
        stat_output=Path(args.stat_output),
    )

    print("\n" + "=" * 72)
    print("PAIRED SIGNIFICANCE: ADAPTIVE ROUTER vs COMPACT JSON")
    print("=" * 72)
    print(f"  paired samples (n)           : {res['n']}")
    print(f"  mean paired diff (%pts)      : {res['mean_diff']}")
    print(f"  median paired diff (%pts)    : {res['median_diff']}")
    print(f"  std paired diff (%pts)       : {res['std_diff']}")
    print(f"  95% CI (t-distribution)      : [{res['ci_low']}, {res['ci_high']}]")
    print(f"  Wilcoxon signed-rank stat    : {res['wilcoxon_statistic']}")
    print(f"  Wilcoxon p-value             : {res['p_value']}")
    print(f"  sanity - Compact mean red    : {res['sanity_anchors']['compact_json_mean_reduction_pct']}% (goal 40.47)")
    print(f"  sanity - Router mean red     : {res['sanity_anchors']['adaptive_router_mean_reduction_pct']}% (goal 46.26)")
    print("=" * 72)