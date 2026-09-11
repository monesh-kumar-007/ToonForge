# TOONFORGE

**Adaptive Structure-Aware Routing for LLM Context Serialization: An Implemented and Empirically Benchmarked Architecture Unifying JSON, TOON, JTON, and ONTO**

---

## Architecture

TOONFORGE is a full-stack research prototype evaluating dynamic serialization strategies for LLM prompt context optimization. It implements:
- **Formats**: JSON (Baseline), Compact JSON, TOON, JTON, ONTO
- **Structural Profiler**: 19-dimensional topological feature vector extractor
- **Strict Validator**: Byte-level and type-exact semantic validation preventing silent data corruption
- **Exhaustive Router**: Validates all eligible candidates and selects minimal token cost
- **Learned Router**: Decision tree approximation achieving ≈3.2–3.9× speedup (observed, run/machine-dependent) with 100% agreement on the deterministic evaluation corpus
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

## Deployment

The web dashboard and the FastAPI backend deploy independently. All API calls
from the dashboard go through a single client (`apps/web/lib/api.ts`) that
reads `NEXT_PUBLIC_API_URL`.

### Frontend (Netlify)

Set the build-time environment variable on the Netlify site (Site settings →
Environment variables) and rebuild:

- `NEXT_PUBLIC_API_URL` — public URL of the deployed backend API, e.g.
  `https://toonforge-api-23n6.onrender.com`.

Without it, the dashboard falls back to `http://localhost:8000` and API calls
fail from the deployed site. `NEXT_PUBLIC_*` variables are inlined at build
time, so redeploy after changing them. Reference config (non-secret, local
development): `apps/web/.env.example`.

### Backend (Render / FastAPI)

Set on the backend service:

- `FRONTEND_URL` — public URL of the deployed dashboard (e.g.
  `https://<your-app>.netlify.app`). The API adds it to its explicit CORS
  allow-list (`apps/api/config/settings.py`) alongside the localhost origins.
  CORS is explicit-origin only — no wildcard is used.

`NEXT_PUBLIC_API_URL` must match the backend's public origin exactly, without a
trailing slash.

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
- `apps/api/requirements.txt` uses **floor pins** (`>=`), not exact versions. A
  fresh `pip install` on Python 3.14 resolves newer versions (tiktoken 0.14.0,
  scikit-learn 1.9.0, pandas 3.0.5) than the documented env; deterministic
  benchmark outputs reproduce across them, but token counts are
  pinned-tokenizer dependent.
- `apps/api/models/learned_router.pkl` was trained under scikit-learn 1.8.0;
  loading it with a newer sklearn prints `InconsistentVersionWarning`. Retrain
  (test suite / router eval) or match the sklearn version before trusting the
  binary.
- `docker-compose.yml` references `apps/api/Dockerfile` + `apps/web/Dockerfile`,
  which are **not present** in the repo; the validated runtime path is the
  `uvicorn` + `npm run dev`/`npm run build` commands above.

---

## Final Evaluation Status (Step 8)

An independent final evaluation of the frozen commit (`1142e7b`) was completed
and recorded in [`docs/benchmark_methodology.md`](docs/benchmark_methodology.md)
("Step 8 — Final Independent Evaluation").

- **Verdict: APPROVED WITH NON-BLOCKING LIMITATIONS** — safe to finalize the V1
  research artifact. Limitations (version pinning, missing Dockerfiles for
  Docker Compose, sklearn-version-sensitive `learned_router.pkl`) are
  documented in [`docs/limitations.md`](docs/limitations.md) and do not block
  release.
- **46/46 backend tests pass** in the working environment *and* in a fresh venv
  built from `apps/api/requirements.txt` (Python 3.14).
- Canonical benchmark (N=200, seed=200) reproduces **bit-for-bit** across runs
  and matches the committed
  `benchmarks/results/benchmark_summary_n200_s200.json`: Adaptive Router
  **46.26%** / 100% validity / **0% fallback** vs best universally-valid fixed
  baseline Compact JSON **40.47%** (Δ **+5.79 pp**).
- **CLI ↔ API parity: 0 mismatches** across all deterministic strategy and
  category fields.
- Learned router: depth-1 stump on `tabular_score`, 100% tie-aware agreement on
  the deterministic holdout (CLI 150/50; API 160/40, seed 42), 0 token regret,
  0 invalid, 0 fallback.
- Latency/speedup are run-dependent: the CLI router speedup measured **3.2×**
  (2.38 ms → 0.74 ms) on the evaluation run (earlier runs up to ~3.9×); API
  in-process decision timing ~0.151 ms vs ~2.67 ms exhaustive.
