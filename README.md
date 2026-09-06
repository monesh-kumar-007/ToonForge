# TOONFORGE

**Adaptive Structure-Aware Routing for LLM Context Serialization: An Implemented and Empirically Benchmarked Architecture Unifying JSON, TOON, JTON, and ONTO**

---

## Architecture

TOONFORGE is a full-stack research prototype evaluating dynamic serialization strategies for LLM prompt context optimization. It implements:
- **Formats**: JSON (Baseline), Compact JSON, TOON, JTON, ONTO
- **Structural Profiler**: 19-dimensional topological feature vector extractor
- **Strict Validator**: Byte-level and type-exact semantic validation preventing silent data corruption
- **Exhaustive Router**: Validates all eligible candidates and selects minimal token cost
- **Learned Router**: Decision tree approximation achieving ~3.6–3.9× speedup with 100% agreement on the deterministic evaluation corpus
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
│   ├── datasets/        # Corpora generated in-memory on demand (deterministic, seed=200)
│   ├── results/         # Benchmark execution summaries (raw runs are ephemeral)
│   ├── generate_corpus.py
│   ├── run_benchmark.py
│   ├── learned_router_eval.py
│   └── adversarial_cases.py
├── packages/
│   └── sdk/             # Python & TypeScript client SDKs
└── docs/                # Architecture, API & empirical methodology docs
```

**Final canonical results & methodology live in [`docs/benchmark_methodology.md`](docs/benchmark_methodology.md) — treat that file as the single source of truth for all benchmark numbers.**

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
python benchmarks/learned_router_eval.py --size 200 --seed 200
```

### 4. Run Adversarial Edge Case Suite
```bash
cd toonforge
python benchmarks/adversarial_cases.py
```

---

## Development Notes

- **Run everything from the repo root** (`toonforge/`). Module and data paths
  (e.g. `apps.api.main`, `apps/api/models/learned_router.pkl`) resolve relative
  to the working directory — never `cd` into `apps/api`.
- `apps/api/models/learned_router.pkl` is a committed binary model artifact.
  Running the test suite or router eval **retrains and overwrites it**; revert
  with `git checkout -- apps/api/models/learned_router.pkl` after running tests.
- `npx tsc --noEmit` in `apps/web` writes `tsconfig.tsbuildinfo` (the tsconfig is
  `incremental`) — delete it before committing.
- Token estimates use tiktoken **`cl100k_base`** (pinned v0.13.0); do not switch
  to `o200k_base`.
- No Python linter is configured — verification is `pytest` + the canonical
  benchmark run (`--size 200 --seed 200`).
