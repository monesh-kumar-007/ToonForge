"""Results Analysis and Aggregation Utility for TOONFORGE Benchmarks.

Reads raw benchmark execution outputs from `benchmarks/results/` and produces
clean markdown summary tables and metrics suitable for paper publication.
"""
from __future__ import annotations

import argparse
import glob
import json
from pathlib import Path
from typing import Any


def analyze_benchmark_files(results_dir: str = "benchmarks/results") -> None:
    """Analyze all benchmark summary files in the results directory."""
    files = glob.glob(f"{results_dir}/benchmark_summary_*.json")
    if not files:
        print(f"No benchmark files found in {results_dir}")
        return

    latest_file = max(files, key=lambda f: Path(f).stat().st_mtime)
    print(f"[*] Analyzing latest benchmark report: {latest_file}\n")

    with open(latest_file, "r", encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)

    meta = data.get("metadata", {})
    strategies = data.get("strategies", [])
    categories = data.get("categories", {})

    print("### Empirical Evaluation Summary")
    print(f"- **Corpus Size**: {meta.get('corpus_size')} samples")
    print(f"- **Random Seed**: {meta.get('random_seed')}")
    print(f"- **Benchmark Duration**: {meta.get('total_duration_seconds')} seconds")
    print()

    print("| Serialization Strategy | Mean Token Red. (%) | Median (%) | Validity Rate (%) | Fallback Rate (%) | Latency (ms) | Classification |")
    print("|:-----------------------|:-------------------:|:----------:|:-----------------:|:-----------------:|:------------:|:--------------|")
    for s in strategies:
        print(
            f"| {s['strategy']} "
            f"| {s['mean_reduction_pct']:.2f}% "
            f"| {s['median_reduction_pct']:.2f}% "
            f"| {s['validity_rate']*100:.1f}% "
            f"| {s['fallback_rate']*100:.1f}% "
            f"| {s['mean_latency_ms']:.2f} ms "
            f"| `{s['routing_grade']}` |"
        )
    print()

    print("### Structural Category Breakdown (Adaptive Router)")
    print("| Category | Samples | Mean Token Savings (%) | Dominant Selected Format |")
    print("|:---------|:-------:|:----------------------:|:-------------------------|")
    for cat, d in categories.items():
        formats = d.get("format_distribution", {})
        dominant = max(formats.items(), key=lambda x: x[1])[0] if formats else "None"
        print(
            f"| {cat.replace('_', ' ').title()} "
            f"| {d.get('sample_count')} "
            f"| {d.get('mean_adaptive_savings_pct'):.2f}% "
            f"| **{dominant}** ({formats.get(dominant, 0)}) |"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze TOONFORGE benchmark results")
    parser.add_argument("--dir", type=str, default="benchmarks/results", help="Directory with results")
    args = parser.parse_args()
    analyze_benchmark_files(args.dir)
