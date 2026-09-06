"""Execution runner for the TOONFORGE Empirical Benchmark Suite.

Executes baseline formats and the Adaptive Router across the benchmark corpus,
recording token efficiency, compression ratios, latency, validity, and fallback rates.
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from benchmarks.generate_corpus import generate_benchmark_corpus
from apps.api.models.domain import CandidateStatus
from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.router import exhaustive_router
from apps.api.services.tokenizer import token_estimator
from apps.api.services.validator import validator


def run_benchmark_suite(
    corpus_size: int = 200,
    seed: int = 200,
    output_dir: str | Path = "benchmarks/results",
    corpus: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Execute the full benchmark experiment.

    Methodology (VALIDITY BEFORE EFFICIENCY):
        - Token-efficiency statistics (mean/median/std reduction) are computed
          over STRICTLY VALID samples only. Invalid/ineligible samples never
          contribute an artificial 0.0 savings value.
        - Applicability/reliability rates always use the FULL corpus as the
          denominator:
              validity_rate      = valid_count / total
              ineligibility_rate = ineligible_count / total
              rejection_rate     = rejected_count / total
        - `fallback_rate` reports genuine FINAL FALLBACK events only. Baseline
          formats never invoke a fallback mechanism, so ineligibility or
          rejection for them is never labeled as fallback.
    """
    if corpus is None:
        print(f"[*] Initializing corpus (N={corpus_size}, seed={seed})...")
        corpus = generate_benchmark_corpus(size=corpus_size, seed=seed)
    else:
        print(f"[*] Evaluating provided corpus (N={len(corpus)})...")

    strategies = ["JSON", "Compact JSON", "TOON", "JTON", "ONTO", "Adaptive Router"]
    savings_by_strategy: dict[str, list[float]] = {s: [] for s in strategies}
    tokens_by_strategy: dict[str, list[int]] = {s: [] for s in strategies}
    validity_by_strategy: dict[str, int] = {s: 0 for s in strategies}
    ineligible_by_strategy: dict[str, int] = {s: 0 for s in strategies}
    rejected_by_strategy: dict[str, int] = {s: 0 for s in strategies}
    fallback_counts: dict[str, int] = {s: 0 for s in strategies}
    latency_by_strategy: dict[str, list[float]] = {s: [] for s in strategies}

    manager = SerializationManager()
    category_breakdown: dict[str, dict[str, Any]] = {}

    start_time = time.perf_counter()

    for i, item in enumerate(corpus):
        payload = item["payload"]
        cat = item["category"]

        if cat not in category_breakdown:
            category_breakdown[cat] = {
                "count": 0,
                "adaptive_savings": [],
                "format_selection": {},
            }
        category_breakdown[cat]["count"] += 1

        # 1. Evaluate Adaptive Router
        t0 = time.perf_counter()
        route_res = exhaustive_router.route(payload)
        t_adaptive = (time.perf_counter() - t0) * 1000.0
        latency_by_strategy["Adaptive Router"].append(t_adaptive)

        selected = route_res.selected_format or "JSON"
        json_tokens = route_res.json_token_baseline or 1
        adaptive_tokens = route_res.token_counts.get(selected, json_tokens)
        adaptive_savings = token_estimator.estimate_savings_pct(json_tokens, adaptive_tokens)

        tokens_by_strategy["Adaptive Router"].append(adaptive_tokens)
        savings_by_strategy["Adaptive Router"].append(adaptive_savings)
        validity_by_strategy["Adaptive Router"] += 1
        if route_res.final_fallback_used:
            fallback_counts["Adaptive Router"] += 1

        category_breakdown[cat]["adaptive_savings"].append(adaptive_savings)
        f_counts = category_breakdown[cat]["format_selection"]
        f_counts[selected] = f_counts.get(selected, 0) + 1

        # 2. Evaluate Individual Formats
        for fmt in ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]:
            t0 = time.perf_counter()
            cand = manager.serialize_one(payload, fmt)
            t_ser = (time.perf_counter() - t0) * 1000.0
            latency_by_strategy[fmt].append(t_ser)

            if cand.status == CandidateStatus.INELIGIBLE:
                # Structurally not applicable (the format's own eligibility logic).
                # This is NOT validity, NOT rejection, and NOT a fallback event.
                ineligible_by_strategy[fmt] += 1
                continue

            if cand.encoded is None or cand.decoded is None:
                # Eligible but encode/decode failed -> candidate rejection.
                rejected_by_strategy[fmt] += 1
                continue

            is_valid, _ = validator.validate(payload, cand.decoded)
            if is_valid:
                tokens = token_estimator.estimate(cand.encoded)
                tokens_by_strategy[fmt].append(tokens)
                savings = token_estimator.estimate_savings_pct(json_tokens, tokens)
                savings_by_strategy[fmt].append(savings)
                validity_by_strategy[fmt] += 1
            else:
                # Eligible, encoded/decoded, but strict round-trip validation
                # failed -> candidate rejection (NOT a fallback event).
                rejected_by_strategy[fmt] += 1

    total_duration = time.perf_counter() - start_time
    total_samples = len(corpus)

    def _grade(mean_sav: float, fb_rate: float) -> str:
        if fb_rate > 0.35:
            return "HIGH DEFECT"
        if mean_sav >= 30:
            return "OPTIMAL LEADER"
        if mean_sav >= 20:
            return "STABLE"
        if mean_sav >= 10:
            return "SPECIALIZED"
        if mean_sav >= 0:
            return "BASELINE"
        return "HIGH VOLATILITY"

    summary_results = []
    for s in strategies:
        sav = savings_by_strategy[s]  # strictly valid samples only
        lats = latency_by_strategy[s]
        total = total_samples
        val_cnt = validity_by_strategy[s]
        inel_cnt = ineligible_by_strategy[s]
        rej_cnt = rejected_by_strategy[s]
        fb_cnt = fallback_counts[s]

        # Valid-only compression efficiency — no artificial 0.0 dilution.
        mean_sav = round(statistics.mean(sav) if sav else 0.0, 2)
        median_sav = round(statistics.median(sav) if sav else 0.0, 2)
        std_sav = round(statistics.stdev(sav) if len(sav) > 1 else 0.0, 2)

        # Full-corpus applicability/reliability rates.
        val_rate = round(val_cnt / total, 4)
        inel_rate = round(inel_cnt / total, 4)
        rej_rate = round(rej_cnt / total, 4)
        fb_rate = round(fb_cnt / total, 4)
        mean_lat = round(statistics.mean(lats) if lats else 0.0, 3)

        summary_results.append({
            "strategy": s,
            "mean_reduction_pct": mean_sav,
            "median_reduction_pct": median_sav,
            "std_reduction_pct": std_sav,
            "validity_rate": val_rate,
            "ineligibility_rate": inel_rate,
            "rejection_rate": rej_rate,
            "fallback_rate": fb_rate,
            "mean_latency_ms": mean_lat,
            "routing_grade": _grade(mean_sav, fb_rate),
            "sample_count": total,
            "valid_count": val_cnt,
            "ineligible_count": inel_cnt,
            "rejected_count": rej_cnt,
            "final_fallback_count": fb_cnt,
        })

    cat_summary = {}
    for cat, data in category_breakdown.items():
        s_list = data["adaptive_savings"]
        cat_summary[cat] = {
            "sample_count": data["count"],
            "mean_adaptive_savings_pct": round(statistics.mean(s_list) if s_list else 0.0, 2),
            "format_distribution": data["format_selection"],
        }

    report = {
        "metadata": {
            "title": "Adaptive Structure-Aware Routing for LLM Context Serialization",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "corpus_size": total_samples,
            "random_seed": seed,
            "total_duration_seconds": round(total_duration, 2),
        },
        "strategies": summary_results,
        "categories": cat_summary,
    }

    out_dir_path = Path(output_dir)
    out_dir_path.mkdir(parents=True, exist_ok=True)
    out_file = out_dir_path / f"benchmark_summary_n{total_samples}_s{seed}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n[+] Benchmark completed in {total_duration:.2f}s. Results written to: {out_file}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run TOONFORGE empirical benchmark suite")
    parser.add_argument("--size", type=int, default=200, help="Corpus size (default: 200)")
    parser.add_argument("--seed", type=int, default=200, help="Random seed (default: 200)")
    parser.add_argument(
        "--output",
        type=str,
        default="benchmarks/results",
        help="Output directory for benchmark reports",
    )
    args = parser.parse_args()
    report = run_benchmark_suite(corpus_size=args.size, seed=args.seed, output_dir=args.output)

    print("\n" + "=" * 90)
    print(f"{'Strategy':<20} | {'Mean Red (%)':<14} | {'Validity (%)':<14} | {'Fallback (%)':<14} | {'Grade':<16}")
    print("-" * 90)
    for st in report["strategies"]:
        print(
            f"{st['strategy']:<20} | {st['mean_reduction_pct']:<14} | {st['validity_rate']*100:<14.1f} | "
            f"{st['fallback_rate']*100:<14.1f} | {st['routing_grade']:<16}"
        )
    print("=" * 90)
