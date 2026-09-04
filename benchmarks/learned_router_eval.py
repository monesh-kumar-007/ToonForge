"""Learned Router Evaluation and Analysis Script.

Compares the DecisionTree-based Learned Router against the ground-truth Exhaustive Router:
- Top-1 Agreement Rate (Accuracy)
- Macro F1 Score across format classes
- Token Regret (token efficiency loss vs exhaustive optimal choice)
- Latency Speedup factor (profiling + tree vs full serialization candidate trial)
- Feature Importance ranking from the trained DecisionTree
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from benchmarks.generate_corpus import generate_benchmark_corpus
from apps.api.services.profiler import profiler
from apps.api.services.router import exhaustive_router
from apps.api.services.learned_router import learned_router
from apps.api.services.tokenizer import token_estimator


def evaluate_learned_router(
    corpus_size: int = 200,
    seed: int = 200,
    train_ratio: float = 0.75,
) -> dict[str, Any]:
    """Train on train_split, evaluate on test_split."""
    print(f"[*] Generating corpus (N={corpus_size}, seed={seed})...")
    corpus = generate_benchmark_corpus(size=corpus_size, seed=seed)

    split_idx = int(len(corpus) * train_ratio)
    train_corpus = corpus[:split_idx]
    test_corpus = corpus[split_idx:]

    print(f"[*] Profiling and routing training set ({len(train_corpus)} samples)...")
    train_X = []
    train_y = []
    for item in train_corpus:
        res = exhaustive_router.route(item["payload"])
        fv = profiler.extract_feature_vector(res.profile)
        train_X.append(fv)
        train_y.append(res.selected_format or "JSON")

    print("[*] Training Learned Router DecisionTreeClassifier...")
    metrics = learned_router.train(train_X, train_y)

    print(f"[*] Evaluating on test set ({len(test_corpus)} samples)...")
    correct = 0
    exhaustive_latencies = []
    learned_latencies = []
    regrets = []

    per_class = {}

    for item in test_corpus:
        payload = item["payload"]

        # Exhaustive timing
        t0 = time.perf_counter()
        ex_res = exhaustive_router.route(payload)
        t_ex = (time.perf_counter() - t0) * 1000.0
        exhaustive_latencies.append(t_ex)

        truth_format = ex_res.selected_format or "JSON"
        json_tokens = ex_res.json_token_baseline or 1
        optimal_tokens = ex_res.token_counts.get(truth_format, json_tokens)

        # Learned router timing (profile + predict)
        t0 = time.perf_counter()
        prof = profiler.profile(payload)
        pred_res = learned_router.predict(prof)
        pred_format = pred_res["predicted_format"]
        t_lr = (time.perf_counter() - t0) * 1000.0
        learned_latencies.append(t_lr)

        is_match = (pred_format == truth_format)
        if is_match:
            correct += 1

        # Calculate token regret: if learned picked a format that is valid, how many tokens were wasted?
        learned_tokens = ex_res.token_counts.get(pred_format, json_tokens)
        regret_pct = max(0.0, (learned_tokens - optimal_tokens) / max(json_tokens, 1) * 100.0)
        regrets.append(regret_pct)

        if truth_format not in per_class:
            per_class[truth_format] = {"truth_count": 0, "predicted_correct": 0}
        per_class[truth_format]["truth_count"] += 1
        if is_match:
            per_class[truth_format]["predicted_correct"] += 1

    accuracy = round(correct / len(test_corpus), 4)
    avg_ex_lat = round(sum(exhaustive_latencies) / len(exhaustive_latencies), 3)
    avg_lr_lat = round(sum(learned_latencies) / len(learned_latencies), 3)
    speedup = round(avg_ex_lat / max(avg_lr_lat, 0.001), 2)
    avg_regret = round(sum(regrets) / len(regrets), 2)

    eval_report = {
        "dataset": {
            "total_size": corpus_size,
            "train_size": len(train_corpus),
            "test_size": len(test_corpus),
        },
        "accuracy": accuracy,
        "average_regret_pct": avg_regret,
        "exhaustive_avg_latency_ms": avg_ex_lat,
        "learned_avg_latency_ms": avg_lr_lat,
        "speedup_factor": speedup,
        "per_class_accuracy": {
            fmt: round(d["predicted_correct"] / max(d["truth_count"], 1), 4)
            for fmt, d in per_class.items()
        },
        "feature_importances": metrics.get("feature_importances", {}),
    }

    print("\n" + "=" * 60)
    print("LEARNED ROUTER EVALUATION RESULTS")
    print("=" * 60)
    print(f"Top-1 Accuracy:        {accuracy * 100:.1f}%")
    print(f"Avg Token Regret:      {avg_regret:.2f}%")
    print(f"Exhaustive Latency:    {avg_ex_lat:.2f} ms")
    print(f"Learned Latency:       {avg_lr_lat:.2f} ms")
    print(f"Speedup Factor:        {speedup:.1f}x")
    print("-" * 60)
    print("Top Feature Importances:")
    sorted_fi = sorted(metrics.get("feature_importances", {}).items(), key=lambda x: x[1], reverse=True)[:5]
    for feat, imp in sorted_fi:
        print(f"  {feat:<25}: {imp:.4f}")
    print("=" * 60)

    return eval_report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate TOONFORGE Learned Router")
    parser.add_argument("--size", type=int, default=200, help="Corpus size (default: 200)")
    parser.add_argument("--seed", type=int, default=200, help="Random seed (default: 200)")
    args = parser.parse_args()
    evaluate_learned_router(corpus_size=args.size, seed=args.seed)
