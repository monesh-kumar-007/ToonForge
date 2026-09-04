"""Deterministic Synthetic Benchmark Corpus Generator for TOONFORGE.

Generates reproducible corpora across 5 structural categories with deterministic random seeds.
Default evaluation corpus: N=200 instances, seed=200.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path
from typing import Any

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from benchmarks.taxonomy import StructuralCategory


def generate_payload(category: StructuralCategory, rng: random.Random) -> Any:
    """Generate a single synthetic payload belonging to the specified structural category."""
    if category == StructuralCategory.FLAT_TABULAR:
        n_records = rng.randint(8, 45)
        actions = ["read", "write", "update", "delete", "query", "sync"]
        regions = ["us-east-1", "us-west-2", "eu-central-1", "ap-northeast-1"]
        return [
            {
                "record_id": f"rec_{rng.randint(10000, 99999)}",
                "user_id": f"usr_{rng.randint(1000, 9999)}",
                "action": rng.choice(actions),
                "region": rng.choice(regions),
                "latency_ms": round(rng.uniform(1.2, 240.5), 2),
                "status_code": rng.choice([200, 201, 204, 400, 404, 500]),
                "is_cached": rng.choice([True, False]),
            }
            for _ in range(n_records)
        ]

    elif category == StructuralCategory.NESTED_OBJECTS:
        return {
            "service": rng.choice(["auth", "billing", "gateway", "indexer"]),
            "environment": rng.choice(["production", "staging", "development"]),
            "cluster_config": {
                "nodes": rng.randint(3, 16),
                "max_concurrency": rng.randint(100, 5000),
                "timeout_ms": rng.randint(500, 5000),
                "tls_enabled": True,
            },
            "rate_limits": {
                "per_minute": rng.randint(60, 6000),
                "burst": rng.randint(10, 500),
            },
            "metrics": [
                {
                    "metric_name": name,
                    "value": round(rng.uniform(10.0, 99.9), 2),
                    "unit": unit,
                }
                for name, unit in [
                    ("cpu_utilization", "percent"),
                    ("memory_usage_mb", "megabytes"),
                    ("error_rate", "rate"),
                    ("active_connections", "count"),
                ][: rng.randint(2, 4)]
            ],
            "deployed_at": rng.randint(1700000000, 1735000000),
        }

    elif category == StructuralCategory.DEEP_NESTED:
        depth = rng.randint(5, 10)
        root: dict[str, Any] = {
            "entity": "hierarchy_root",
            "level": 0,
            "hash": f"h_{rng.randint(1000, 9999)}",
        }
        curr = root
        for lvl in range(1, depth + 1):
            child = {
                "entity": f"node_level_{lvl}",
                "level": lvl,
                "weight": round(rng.uniform(0.01, 1.0), 3),
                "flags": [f"f_{rng.randint(1, 5)}" for _ in range(rng.randint(1, 3))],
            }
            curr["child"] = child
            curr = child
        return root

    elif category == StructuralCategory.HETEROGENEOUS:
        count = rng.randint(6, 20)
        items = []
        for i in range(count):
            choice = rng.randint(1, 4)
            if choice == 1:
                items.append({
                    "kind": "log_event",
                    "severity": rng.choice(["INFO", "WARN", "ERROR"]),
                    "msg": f"event_{i} dispatched",
                    "code": rng.randint(100, 999),
                })
            elif choice == 2:
                items.append({
                    "kind": "metric_point",
                    "reading": round(rng.uniform(0.0, 1.0), 4),
                    "tags": ["prod", f"v_{rng.randint(1, 3)}"],
                })
            elif choice == 3:
                items.append({
                    "kind": "user_ref",
                    "uid": rng.randint(100, 9999),
                    "roles": ["admin"] if rng.random() > 0.8 else ["viewer"],
                    "verified": rng.choice([True, False]),
                    "meta": None,
                })
            else:
                items.append({
                    "kind": "blob",
                    "bytes": [rng.randint(0, 255) for _ in range(rng.randint(2, 5))],
                })
        return items

    elif category == StructuralCategory.KEY_SPARSE:
        n_rows = rng.randint(10, 35)
        all_possible_keys = [
            "id", "name", "email", "phone", "department", "salary",
            "bonus", "hire_date", "termination_date", "manager_id", "office", "notes"
        ]
        records = []
        for i in range(n_rows):
            rec: dict[str, Any] = {"id": f"emp_{i:04d}"}
            for k in all_possible_keys[1:]:
                # high probability of absence or None
                roll = rng.random()
                if roll < 0.35:
                    pass  # absent key
                elif roll < 0.55:
                    rec[k] = None
                else:
                    if "date" in k:
                        rec[k] = "2024-01-15"
                    elif "salary" in k or "bonus" in k:
                        rec[k] = rng.randint(50000, 150000)
                    elif "email" in k or "name" in k:
                        rec[k] = f"{k}_{i}"
                    else:
                        rec[k] = f"val_{rng.randint(1, 10)}"
            records.append(rec)
        return records

    raise ValueError(f"Unknown structural category: {category}")


def generate_benchmark_corpus(
    size: int = 200,
    seed: int = 200,
    output_path: str | Path | None = None,
) -> list[dict[str, Any]]:
    """Generate a structured corpus containing equal distributions across 5 categories."""
    rng = random.Random(seed)
    categories = list(StructuralCategory)
    per_category = size // len(categories)
    remainder = size % len(categories)

    dataset: list[dict[str, Any]] = []
    idx = 0

    for cat in categories:
        target_count = per_category + (1 if remainder > 0 else 0)
        if remainder > 0:
            remainder -= 1

        for _ in range(target_count):
            payload = generate_payload(cat, rng)
            dataset.append({
                "id": f"item_{idx:04d}",
                "category": cat.value,
                "payload": payload,
            })
            idx += 1

    if output_path:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        with open(out_p, "w", encoding="utf-8") as f:
            json.dump(dataset, f, indent=2)
        print(f"Saved {len(dataset)} items to {out_p}")

    return dataset


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic benchmark corpus")
    parser.add_argument("--size", type=int, default=200, help="Total items to generate (default: 200)")
    parser.add_argument("--seed", type=int, default=200, help="Random seed (default: 200)")
    parser.add_argument(
        "--output",
        type=str,
        default="benchmarks/datasets/corpus_200.json",
        help="Destination path for JSON dataset",
    )
    args = parser.parse_args()
    generate_benchmark_corpus(size=args.size, seed=args.seed, output_path=args.output)
