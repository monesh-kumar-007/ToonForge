"""Learned Router — DecisionTreeClassifier-based format prediction.

Approximates the exhaustive router's selection using structural features.

MEASURED AGREEMENT/LATENCY (observed in this repository's evaluation, not
universal guarantees):
    - On the deterministic canonical holdout (API path: random 80/20 split,
      train=160 / eval=40, seed=42) the trained tree matched the exhaustive
      router exactly: 100% exact-match/agreement with 0.0 mean token regret.
    - The positional CLI split (train=150 / eval=50, N=200, seed=200) also
      yielded 100% top-1 agreement; note this split is not category-stratified.
    - Measured latency on the benchmark machine: learned ~0.04-0.6ms per
      prediction vs exhaustive routing ~1.7-2.2ms (~3.6-3.9x speedup in the CLI
      evaluation). Latency is machine/run dependent and must be reported as an
      observed range, never as a universal constant.

CLEARLY DISTINGUISHED FROM EXHAUSTIVE ROUTER:
    Exhaustive Router:
        - Evaluates ALL candidate formats directly
        - Runs encode → decode → validate → token-count on every format
        - Guarantees correctness through actual round-trip testing
        - Higher latency (order of milliseconds, environment dependent)

    Learned Router:
        - Predicts the likely best format using structural features
        - Single forward pass through trained DecisionTree
        - Does NOT perform round-trip testing
        - Lower latency (sub-millisecond, environment dependent)
        - Agreement is measured per evaluation; the current decision stump
          routes correctly on the deterministic corpus but this is not proof
          of universal accuracy.
        - May occasionally predict a suboptimal format (token regret)
"""
from __future__ import annotations

import json
import logging
import os
import pickle
import time
from pathlib import Path
from typing import Any, Optional

import numpy as np

logger = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).parent.parent / "models" / "learned_router.pkl"

# Feature names — must match profiler.extract_feature_vector() order
FEATURE_NAMES = [
    "max_depth",
    "record_count",
    "schema_uniformity",
    "key_repetition_ratio",
    "heterogeneity_index",
    "scalar_object_ratio",
    "is_tabular",
    "tabular_score",
    "null_ratio",
    "avg_object_width",
    "key_set_consistency",
    "node_count",
]

ALL_LABELS = ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]


class LearnedRouter:
    """DecisionTreeClassifier-based format predictor."""

    def __init__(self):
        self._model = None
        self._label_encoder: Optional[list[str]] = None
        self._training_size: int = 0
        self._metrics: Optional[dict] = None
        self._load_if_exists()

    # ─── Model Persistence ────────────────────────────────────────────────────

    def _load_if_exists(self) -> None:
        """Load persisted model if available."""
        if _MODEL_PATH.exists():
            try:
                with open(_MODEL_PATH, "rb") as f:
                    state = pickle.load(f)
                self._model = state["model"]
                self._label_encoder = state["labels"]
                self._training_size = state.get("training_size", 0)
                self._metrics = state.get("metrics", None)
                logger.info(
                    f"LearnedRouter: loaded model from {_MODEL_PATH} "
                    f"(trained on {self._training_size} samples)"
                )
            except Exception as exc:
                logger.warning(f"LearnedRouter: could not load model: {exc}")

    def _save(self) -> None:
        """Persist trained model."""
        _MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_MODEL_PATH, "wb") as f:
            pickle.dump({
                "model": self._model,
                "labels": self._label_encoder,
                "training_size": self._training_size,
                "metrics": self._metrics,
            }, f)

    @property
    def is_trained(self) -> bool:
        return self._model is not None

    # ─── Training ─────────────────────────────────────────────────────────────

    def train(self, X: list[dict[str, float]], y: list[str]) -> dict:
        """
        Train the DecisionTreeClassifier on a labelled corpus.

        Args:
            X: list of feature vectors (dicts from profiler.extract_feature_vector)
            y: list of format labels (ground truth from exhaustive router)

        Returns:
            Training metrics dict.
        """
        from sklearn.tree import DecisionTreeClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score

        if len(X) < 5:
            raise ValueError(f"Need at least 5 training samples, got {len(X)}.")

        X_arr = self._to_matrix(X)
        labels = list(set(y))
        y_enc = [labels.index(label) for label in y]

        # Train/test split for evaluation
        X_train, X_test, y_train, y_test = train_test_split(
            X_arr, y_enc, test_size=0.2, random_state=42
        )

        clf = DecisionTreeClassifier(
            max_depth=5,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
        )
        clf.fit(X_train, y_train)

        y_pred = clf.predict(X_test)
        agreement_rate = accuracy_score(y_test, y_pred)

        self._model = clf
        self._label_encoder = labels
        self._training_size = len(X)

        self._metrics = {
            "decision_agreement_rate": round(agreement_rate, 4),
            "training_corpus_size": self._training_size,
            "model_depth": clf.get_depth(),
            "n_leaves": clf.get_n_leaves(),
            "feature_importances": {
                name: round(float(imp), 4)
                for name, imp in zip(FEATURE_NAMES, clf.feature_importances_)
            },
        }
        self._save()
        logger.info(
            f"LearnedRouter: trained on {len(X)} samples, "
            f"agreement={agreement_rate:.2%}"
        )
        return self._metrics

    # ─── Prediction ───────────────────────────────────────────────────────────

    def predict(
        self,
        feature_vector: Any,
        exhaustive_result: Optional[str] = None,
    ) -> dict:
        """
        Predict the best format for a given structural feature vector or StructuralProfile.

        Args:
            feature_vector: from profiler.extract_feature_vector() or a StructuralProfile instance
            exhaustive_result: the exhaustive router's selection (for comparison)

        Returns:
            dict with prediction results and comparison metadata.
        """
        if hasattr(feature_vector, "top_level_type"):
            from apps.api.services.profiler import profiler
            feature_vector = profiler.extract_feature_vector(feature_vector)

        t0 = time.perf_counter()

        if not self.is_trained:
            # Default heuristic when not trained
            predicted = self._heuristic_predict(feature_vector)
            elapsed = (time.perf_counter() - t0) * 1000
            return {
                "predicted_format": predicted,
                "confidence": 0.5,
                "model_trained": False,
                "learned_latency_ms": round(elapsed, 3),
                "agreement": predicted == exhaustive_result if exhaustive_result else None,
                "token_regret": None,
            }

        X = self._to_matrix([feature_vector])
        proba = self._model.predict_proba(X)[0]
        pred_idx = int(np.argmax(proba))
        confidence = float(proba[pred_idx])
        predicted = self._label_encoder[pred_idx]

        elapsed = (time.perf_counter() - t0) * 1000
        agreement = (predicted == exhaustive_result) if exhaustive_result else None

        return {
            "predicted_format": predicted,
            "confidence": round(confidence, 4),
            "model_trained": True,
            "learned_latency_ms": round(elapsed, 3),
            "agreement": agreement,
            "token_regret": None,  # Set by caller if token data available
        }

    def _heuristic_predict(self, fv: dict[str, float]) -> str:
        """Simple heuristic fallback when model not trained."""
        if fv.get("is_tabular", 0) > 0.5 and fv.get("key_repetition_ratio", 1) > 2:
            return "JTON"
        if fv.get("max_depth", 0) >= 5:
            return "ONTO"
        return "Compact JSON"

    def get_metrics(self) -> Optional[dict]:
        """Return training/evaluation metrics."""
        return self._metrics

    def record_evaluation(self, metrics: dict) -> dict:
        """Merge externally computed (holdout) evaluation metrics into storage.

        Used by the benchmark pipeline to persist Step-5 holdout metrics
        (regret, invalid-selection, latency, etc.) alongside the training
        metrics produced by ``train()``.
        """
        if self._metrics is None:
            self._metrics = {}
        self._metrics.update(metrics)
        self._save()
        return self._metrics

    # ─── Utilities ────────────────────────────────────────────────────────────

    def _to_matrix(self, X: list[dict[str, float]]) -> np.ndarray:
        """Convert list of feature dicts to numpy matrix in correct column order."""
        return np.array([
            [row.get(f, 0.0) for f in FEATURE_NAMES]
            for row in X
        ], dtype=np.float64)


learned_router = LearnedRouter()
