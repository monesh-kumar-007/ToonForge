"""Shared Learned Router evaluation helpers (STEP 5).

Ground-truth oracle semantics (validity FIRST):
    The oracle of a routing result is derived ONLY from candidates that
    survived strict round-trip validation (``RoutingResult.token_counts``).
    Ineligible, encode/decode-failed and strictly-rejected candidates never
    enter the oracle — token efficiency is evaluated strictly among valid
    candidates, mirroring the exhaustive router's selection priority.

Tie handling:
    Every valid candidate that achieves the minimum token count is optimal.
    ``optimal_formats`` is therefore a SET (the router's ``min()`` picks one
    arbitrarily; the oracle must not).

Regret semantics:
    Token regret is defined against the ORACLE-OPTIMAL token count (never the
    JSON baseline) and only for predictions that are themselves valid
    candidates: ``regret = learned_tokens - optimal_tokens`` (always >= 0).
    An INVALID prediction is never assigned a ``json_tokens`` fallback cost —
    it must not masquerade as a mere efficiency loss. It is reported separately
    as an invalid / ineligible / rejected selection.
"""
from __future__ import annotations

import statistics
from typing import Any, Optional

Oracle = dict[str, Any]
Prediction = dict[str, Any]


def oracle_for(routing_result) -> Oracle:
    """Snapshot the ground-truth oracle of an exhaustive routing result.

    ``valid_tokens`` comes from ``RoutingResult.token_counts`` which, by
    construction, contains ONLY strictly-valid candidates.
    """
    token_counts = dict(routing_result.token_counts or {})
    if token_counts:
        optimal_tokens = min(token_counts.values())
        optimal_formats = {
            fmt for fmt, tokens in token_counts.items() if tokens == optimal_tokens
        }
    else:
        optimal_tokens = None
        optimal_formats = set()

    return {
        "valid_tokens": token_counts,
        "optimal_tokens": optimal_tokens,
        "optimal_formats": optimal_formats,
        "json_baseline": getattr(routing_result, "json_token_baseline", None),
        "final_fallback_used": bool(
            getattr(routing_result, "final_fallback_used", False)
        ),
        "ineligible_formats": set(
            getattr(routing_result, "ineligible_candidates", None) or []
        ),
        "rejected_formats": set(
            getattr(routing_result, "rejected_candidates", None) or []
        ),
    }


def classify_prediction(predicted: Optional[str], oracle: Oracle) -> dict[str, Any]:
    """Classify one prediction against the oracle.

    Invalid predictions are recorded with ``regret_tokens=None`` — they are
    never assigned a JSON fallback token cost.
    """
    if predicted is None:
        return {
            "predicted": predicted,
            "is_valid_candidate": False,
            "is_optimal": False,
            "invalid_selection": True,
            "nonvalid_reason": "unknown",
            "regret_tokens": None,
            "regret_pct": None,
            "fallback_used": oracle["final_fallback_used"],
        }

    valid_tokens = oracle["valid_tokens"]
    is_valid = predicted in valid_tokens
    is_optimal = predicted in oracle["optimal_formats"]

    if is_valid:
        optimal_tokens = oracle["optimal_tokens"]
        regret_tokens = valid_tokens[predicted] - optimal_tokens
        regret_pct = (
            round(regret_tokens / optimal_tokens * 100.0, 4)
            if optimal_tokens
            else None
        )
        nonvalid_reason = None
    else:
        regret_tokens = None
        regret_pct = None
        if predicted in oracle["ineligible_formats"]:
            nonvalid_reason = "ineligible"
        elif predicted in oracle["rejected_formats"]:
            nonvalid_reason = "rejected"
        else:
            nonvalid_reason = "unknown"

    return {
        "predicted": predicted,
        "is_valid_candidate": is_valid,
        "is_optimal": is_optimal,
        "invalid_selection": not is_valid,
        "nonvalid_reason": nonvalid_reason,
        "regret_tokens": regret_tokens,
        "regret_pct": regret_pct,
        "fallback_used": oracle["final_fallback_used"],
    }


def _p95(values: list[float]) -> Optional[float]:
    if not values:
        return None
    ordered = sorted(values)
    idx = min(len(ordered) - 1, round(0.95 * (len(ordered) - 1)))
    return round(ordered[idx], 4)


def evaluate_samples(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate classified predictions into the Step-5 evaluation report.

    Regret statistics are computed ONLY over valid predictions. Invalid
    selections are reported as rates (invalid / ineligible / rejected);
    ``final_fallback_rate`` reflects genuine oracle fallback events only.
    """
    n = len(results)
    if n == 0:
        return {"sample_count": 0}

    valid = [r for r in results if r["is_valid_candidate"]]
    n_valid = len(valid)
    n_invalid = n - n_valid
    n_ineligible = sum(1 for r in results if r["nonvalid_reason"] == "ineligible")
    n_rejected = sum(1 for r in results if r["nonvalid_reason"] == "rejected")

    exact_matches = sum(1 for r in results if r["is_optimal"])
    regret_tokens = [r["regret_tokens"] for r in valid if r["regret_tokens"] is not None]
    regret_pcts = [r["regret_pct"] for r in valid if r["regret_pct"] is not None]
    fallback_events = sum(1 for r in results if r.get("fallback_used"))

    return {
        "sample_count": n,
        "exact_match_rate": round(exact_matches / n, 4),
        "mean_token_regret": (
            round(statistics.mean(regret_tokens), 2) if regret_tokens else None
        ),
        "median_regret_tokens": (
            round(statistics.median(regret_tokens), 2) if regret_tokens else None
        ),
        "mean_regret_pct": (
            round(statistics.mean(regret_pcts), 2) if regret_pcts else None
        ),
        "p95_regret_pct": _p95(regret_pcts) if len(regret_pcts) >= 20 else None,
        "min_regret_pct": round(min(regret_pcts), 4) if regret_pcts else None,
        "max_regret_pct": round(max(regret_pcts), 4) if regret_pcts else None,
        "invalid_selection_rate": round(n_invalid / n, 4),
        "ineligible_selection_rate": round(n_ineligible / n, 4),
        "rejected_selection_rate": round(n_rejected / n, 4),
        "eligible_selection_rate": round(n_valid / n, 4),
        "final_fallback_rate": round(fallback_events / n, 4),
    }


def split_dataset(
    n: int, test_size: float = 0.2, random_state: int = 42
) -> tuple[list[int], list[int]]:
    """Deterministic, disjoint train/test index split.

    Identical semantics to ``LearnedRouter.train()`` (same sklearn util, random
    seed 42) but applied at the corpus level so the eval indices are NEVER part
    of the model's training set.
    """
    from sklearn.model_selection import train_test_split

    train_idx, test_idx = train_test_split(
        list(range(n)), test_size=test_size, random_state=random_state
    )
    return list(train_idx), list(test_idx)