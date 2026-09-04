"""Application settings loaded from environment variables."""
from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # toonforge/

class Settings:
    # API
    APP_TITLE: str = "TOONFORGE API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = (
        "Adaptive Structure-Aware Routing for LLM Context Serialization: "
        "An Implemented and Empirically Benchmarked Architecture Unifying "
        "JSON, TOON, JTON, and ONTO"
    )
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ]

    # Benchmark
    BENCHMARK_RESULTS_DIR: Path = BASE_DIR / "benchmarks" / "results"
    BENCHMARK_RAW_DIR: Path = BENCHMARK_RESULTS_DIR / "raw"
    BENCHMARK_AGGREGATED_DIR: Path = BENCHMARK_RESULTS_DIR / "aggregated"

    # Tokenizer
    TOKEN_PROXY_MODEL: str = os.getenv("TOKEN_PROXY_MODEL", "gpt2")
    # Fallback: character-based estimate if tiktoken unavailable
    CHAR_PER_TOKEN_FALLBACK: float = 4.0

    # Learned Router
    LEARNED_ROUTER_MODEL_PATH: Path = BASE_DIR / "apps" / "api" / "models" / "learned_router.pkl"

    # Corpus
    CORPUS_SEED: int = int(os.getenv("CORPUS_SEED", "200"))
    CORPUS_SIZE: int = int(os.getenv("CORPUS_SIZE", "200"))


settings = Settings()
