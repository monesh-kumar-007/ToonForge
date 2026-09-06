"""Step 6 — Final Empirical Benchmark & Research Results Validation.

Guards the three reproducibility pillars established in Step 6:
  1. The canonical benchmark corpus is fully deterministic for a given
     (size, seed).
  2. The API benchmark uses the SAME canonical corpus as the CLI benchmark
     (CLI/API parity after removing the divergent inline API generator).
  3. The benchmark suite's deterministic metrics are fully reproducible across
     repeated runs of identical corpus/seed (timing fields are variable and
     therefore not asserted).

All assertions use the repository's canonical N=200, seed=200 convention.
"""
from __future__ import annotations

import pytest

from benchmarks.generate_corpus import generate_benchmark_corpus
from benchmarks.run_benchmark import run_benchmark_suite

from apps.api.routers.benchmark import _generate_corpus


CANONICAL_SIZE = 200
CANONICAL_SEED = 200

DETERMINISTIC_FIELDS = [
    "mean_reduction_pct",
    "median_reduction_pct",
    "std_reduction_pct",
    "validity_rate",
    "ineligibility_rate",
    "rejection_rate",
    "fallback_rate",
    "routing_grade",
    "sample_count",
    "valid_count",
    "ineligible_count",
    "rejected_count",
    "final_fallback_count",
]


def test_canonical_corpus_deterministic():
    """The canonical corpus generator must be bit-for-bit deterministic."""
    a = generate_benchmark_corpus(size=CANONICAL_SIZE, seed=CANONICAL_SEED)
    b = generate_benchmark_corpus(size=CANONICAL_SIZE, seed=CANONICAL_SEED)

    assert len(a) == len(b) == CANONICAL_SIZE
    assert [item["id"] for item in a] == [item["id"] for item in b]
    assert [item["category"] for item in a] == [item["category"] for item in b]
    assert [item["payload"] for item in a] == [item["payload"] for item in b]


def test_api_corpus_matches_canonical():
    """The API benchmark corpus must equal the CLI canonical corpus.

    Regression guard for the Step-6 fix that replaced the API's DIVERGENT
    inline corpus generator (5th category 'small_scalar', different templates)
    with the canonical ``generate_benchmark_corpus``.
    """
    api_corpus = _generate_corpus(size=CANONICAL_SIZE, seed=CANONICAL_SEED)
    canonical = generate_benchmark_corpus(size=CANONICAL_SIZE, seed=CANONICAL_SEED)

    assert api_corpus == canonical
    assert {item["category"] for item in api_corpus} == {
        "flat_tabular",
        "nested_objects",
        "deep_nested",
        "heterogeneous",
        "key_sparse",
    }
    assert "small_scalar" not in {item["category"] for item in api_corpus}


def test_benchmark_suite_reproducible_metrics(tmp_path):
    """Deterministic benchmark metrics must be identical across repeated runs.

    Timing (mean_latency_ms / total_duration_seconds) is expected to vary.
    """
    corpus = generate_benchmark_corpus(size=CANONICAL_SIZE, seed=CANONICAL_SEED)

    run1 = run_benchmark_suite(
        corpus_size=CANONICAL_SIZE,
        seed=CANONICAL_SEED,
        output_dir=tmp_path / "run1",
        corpus=corpus,
    )
    run2 = run_benchmark_suite(
        corpus_size=CANONICAL_SIZE,
        seed=CANONICAL_SEED,
        output_dir=tmp_path / "run2",
        corpus=corpus,
    )

    by_name1 = {s["strategy"]: s for s in run1["strategies"]}
    by_name2 = {s["strategy"]: s for s in run2["strategies"]}

    assert by_name1.keys() == by_name2.keys()
    for strategy, s1 in by_name1.items():
        s2 = by_name2[strategy]
        for field in DETERMINISTIC_FIELDS:
            assert s1[field] == s2[field], (
                f"{strategy}.{field} not reproducible: {s1[field]} != {s2[field]}"
            )

    assert run1["metadata"]["corpus_size"] == run2["metadata"]["corpus_size"] == CANONICAL_SIZE
    assert run1["metadata"]["random_seed"] == run2["metadata"]["random_seed"] == CANONICAL_SEED
    assert run1["categories"] == run2["categories"]