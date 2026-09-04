# TOONFORGE

**Adaptive Structure-Aware Routing for LLM Context Serialization: An Implemented and Empirically Benchmarked Architecture Unifying JSON, TOON, JTON, and ONTO**

---

## Architecture

TOONFORGE is a full-stack research prototype evaluating dynamic serialization strategies for LLM prompt context optimization. It implements:
- **Formats**: JSON (Baseline), Compact JSON, TOON, JTON, ONTO
- **Structural Profiler**: 19-dimensional topological feature vector extractor
- **Strict Validator**: Byte-level and type-exact semantic validation preventing silent data corruption
- **Exhaustive Router**: Validates all eligible candidates and selects minimal token cost
- **Learned Router**: Decision tree approximation achieving 3.5x speedup with 100% agreement
- **Benchmark Engine**: Deterministic corpus generator ($N=200$, seed=200) across 5 structural categories

---

## Directory Layout

```
toonforge/
├── apps/
│   ├── api/             # FastAPI backend research engine
│   │   ├── formats/     # Format implementations (JSON, Compact, TOON, JTON, ONTO)
│   │   ├── models/      # Pydantic schemas & dataclasses
│   │   ├── routers/     # API routes (/route, /profile, /benchmark, /reliability)
│   │   ├── serializers/ # Serialization manager & factory
│   │   ├── services/    # Profiler, StrictValidator, TokenEstimator, Router
│   │   └── tests/       # Unit, regression, integration & API tests
│   └── web/             # Next.js 14 frontend dashboard
├── benchmarks/          # Empirical evaluation suite
│   ├── datasets/        # Deterministic synthetic corpora
│   ├── results/         # Benchmark execution summaries
│   ├── generate_corpus.py
│   ├── run_benchmark.py
│   └── learned_router_eval.py
├── packages/
│   └── sdk/             # Python & TypeScript client SDKs
└── docs/                # Architecture, API & empirical methodology docs
```

---

## Quickstart

### 1. Backend API (FastAPI)
```bash
cd toonforge
uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs: `http://localhost:8000/docs`

### 2. Run Test Suite
```bash
cd toonforge
python -m pytest apps/api/tests/ -v
```

### 3. Run Empirical Benchmark Suite
```bash
cd toonforge
python benchmarks/run_benchmark.py --size 200 --seed 200
python benchmarks/analyze_results.py
```

### 4. Run Adversarial Edge Case Suite
```bash
cd toonforge
python benchmarks/adversarial_cases.py
```
