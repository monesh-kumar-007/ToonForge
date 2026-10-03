"""Run the downstream retrievability proxy over the canonical corpus.

benchmarks/downstream_proxy.py defines the DownstreamRetrievabilityProxy class
only — it has no CLI runner and accepts no size/seed arguments (the shipped
file ends at evaluate_payload). This wrapper drives the UNCHANGED proxy
class across the canonical N=200/seed=200 corpus, aggregates per-format
retrievability rates, and persists to
benchmarks/results/downstream_proxy_current.json.

Note: the proxy only generates retrieval queries for list-of-dict tabular
payloads and for dict payloads (shallow + one nested level). Payloads with no
extractable queries are skipped by the proxy itself (evaluate_payload returns
{}), never counted as 0.0.
"""
from __future__ import annotations

import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from benchmarks.downstream_proxy import DownstreamRetrievabilityProxy
from benchmarks.generate_corpus import generate_benchmark_corpus

FORMAT_ORDER = ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]


def aggregate(
    per_payload: list[dict[str, Any]],
) -> dict[str, Any]:
    per_format: dict[str, list[dict[str, Any]]] = {f: [] for f in FORMAT_ORDER}
    for row in per_payload:
        for fmt in FORMAT_ORDER:
            if fmt in row["scores"]:
                per_format[fmt].append(row["scores"][fmt])

    agg: dict[str, Any] = {}
    total_with_queries = 0
    zero_by_no_queries = 0
    for fmt in FORMAT_ORDER:
        rows = per_format[fmt]
        if not rows:
            agg[fmt] = {"payloads_scored": 0}
            continue
        eligible = sum(1 for r in rows if r["eligible"])
        valid = sum(1 for r in rows if r["valid"])
        q_total = sum(r["total_queries"] for r in rows)
        q_ok = sum(r["successful_queries"] for r in rows)
        rate_all = statistics.mean(r["retrieval_rate"] for r in rows)
        valid_rows = [r for r in rows if r["eligible"] and r["valid"]]
        rate_valid_only = (
            statistics.mean(r["retrieval_rate"] for r in valid_rows) if valid_rows else 0.0
        )
        agg[fmt] = {
            "payloads_scored": len(rows),
            "eligible_payloads": eligible,
            "valid_payloads": valid,
            "total_queries": q_total,
            "successful_queries": q_ok,
            "success_rate_pct": round(100.0 * q_ok / q_total, 2) if q_total else 0.0,
            "mean_retrieval_rate_all": round(rate_all, 4),
            "mean_retrieval_rate_valid_only": round(rate_valid_only, 4),
        }
    return agg


def main(
    size: int = 200,
    seed: int = 200,
    output: str = "benchmarks/results/downstream_proxy_current.json",
) -> Path:
    corpus = generate_benchmark_corpus(size=size, seed=seed)
    proxy = DownstreamRetrievabilityProxy()

    per_payload: list[dict[str, Any]] = []
    for item in corpus:
        scores = proxy.evaluate_payload(item["payload"])
        per_payload.append({
            "item_id": item["id"],
            "category": item["category"],
            "queries_generated": any(scores.values()),
            "scores": scores,
        })

    total_with_queries = sum(1 for p in per_payload if p["queries_generated"])

    body = {
        "metadata": {
            "title": "Downstream Structural Retrievability Proxy — canonical corpus run",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "corpus_size": size,
            "random_seed": seed,
            "source": "benchmarks/downstream_proxy.py::DownstreamRetrievabilityProxy (unchanged class)",
            "note": "retrieval_rate is gated by StrictValidator: ineligible/invalid candidates score 0.0",
        },
        "per_format": aggregate(per_payload),
        "coverage": {
            "payloads_total": len(corpus),
            "payloads_with_queries": total_with_queries,
            "payloads_without_queries": len(corpus) - total_with_queries,
        },
        "per_payload": per_payload,
    }

    out = Path(output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(body, indent=2), encoding="utf-8")

    print("=" * 78)
    print("DOWNSTREAM RETRIEVABILITY PROXY (canonical N=200, seed=200)")
    print("=" * 78)
    print(f"  payloads with queries: {total_with_queries}/{len(corpus)}")
    print(f"  {'format':<14} | {'valid':>5} | {'all rate':>9} | {'valid-only rate':>15} | {'success':>8}")
    print("-" * 78)
    for fmt, a in body["per_format"].items():
        print(
            f"  {fmt:<14} | {a.get('valid_payloads', 0):>5} | "
            f"{a.get('mean_retrieval_rate_all', 0):>9.4f} | "
            f"{a.get('mean_retrieval_rate_valid_only', 0):>15.4f} | "
            f"{a.get('success_rate_pct', 0):>7.2f}%"
        )
    print("=" * 78)
    print(f"[+] Wrote proxy results: {out}")
    return out


if __name__ == "__main__":
    main()
    sys.exit(0)