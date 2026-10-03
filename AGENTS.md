# AGENTS.md

Research-prototype monorepo for TOONFORGE: a Python FastAPI serialization engine
(`apps/api`) + a Next.js 14 dashboard (`apps/web`) + an empirical benchmark suite
(`benchmarks/`). OS is Windows / PowerShell 5.1 — **no `&&` in commands**; chain
with `; if ($?) { ... }`. All commands must run from the repo root (`toonforge/`),
never from inside `apps/api` (module and data paths depend on CWD).

## Commands

```powershell
# Backend tests (full suite = 46 tests)
python -m pytest apps/api/tests/ -v
# Single test file / test
python -m pytest apps/api/tests/benchmarks/test_step6_reproducibility.py -v
python -m pytest apps/api/tests/benchmarks/test_step6_reproducibility.py::test_name -v

# API server (port 8000)
python -m uvicorn apps.api.main:app --port 8000

# Web dashboard (port 3000; run from apps/web)
npm run dev
# Web typecheck
npx tsc --noEmit -p tsconfig.json   # run from apps/web

# Benchmarks (canonical = --size 200 --seed 200)
python benchmarks/run_benchmark.py --size 200 --seed 200
python benchmarks/analyze_results.py --dir benchmarks/results
python benchmarks/learned_router_eval.py --size 200 --seed 200
python benchmarks/adversarial_cases.py   # prints only; use run_adversarial_trace.py to persist JSON

# Benchmark evidence scripts (untracked, canonical 200/200); each writes JSON
python benchmarks/paired_significance.py --size 200 --seed 200
python benchmarks/run_adversarial_trace.py
python benchmarks/run_downstream_proxy.py
python benchmarks/tokenizer_audit.py
```

There is **no Python linter/formatter config** and no CI. Verification for any
numeric or claim change is: full pytest → canonical benchmark rerun → web `tsc`.

## Gotchas

- **Device Guard / AppControl intermittently blocks CPython executables.** In one
  session every interpreter failed — `.venv\Scripts\python.exe`, the
  `C:\Users\monis\AppData\Local\Programs\Python\Python314` install, `pythonw.exe`,
  `py`, and even uv's cached Python (`os error 4551`), all on `--version`. It
  later worked again, so retry `python --version` once before assuming it is
  permanently blocked. When blocked, the **Microsoft Store Python 3.11.9** alias
  still runs: `C:\Users\monis\AppData\Local\Microsoft\WindowsApps\python3.11.exe`
  (its packages are separate; builds isolated tooling in a throwaway venv). Temp
  dirs are wiped between sessions — never rely on a path under
  `C:\Users\monis\AppData\Local\Temp\opencode\`.

- **`benchmarks/adversarial_cases.py` prints a table but never persists JSON**
  (and omits token counts); **`benchmarks/downstream_proxy.py` is class-only with
  no runner** (147 lines, ends at `evaluate_payload`). Don't re-discover this —
  the untracked wrappers `benchmarks/run_adversarial_trace.py` and
  `benchmarks/run_downstream_proxy.py` call the unchanged suite/proxy and dump
  full JSON. `benchmarks/paired_significance.py` (per-payload Router-vs-Compact
  valid-only reductions + Wilcoxon + 95% CI) exists because `run_benchmark.py`
  has **no raw per-payload mode**. `benchmarks/tokenizer_audit.py` is the
  cross-tokenizer cl100k self-check. None of these are in any protected list.

- **`FILE_MAP.md` (repo root) documents what every file does** — read it before
  exploring.

- **`apps/api/models/learned_router.pkl` is a committed binary.** Running the
  test suite or router eval **retrains and overwrites it**. Always
  `git checkout -- apps/api/models/learned_router.pkl` after running tests.
- **`npx tsc --noEmit` writes `apps/web/tsconfig.tsbuildinfo`** (tsconfig has
  `incremental: true`). It is not gitignored — delete it after typechecking.
- **`benchmarks/results/raw/run_*.json`, `aggregated/latest.json`, and the
  evidence JSONs from the scripts above are ephemeral outputs**, not tracked
  inputs. The only canonical tracked artifact is
  `benchmarks/results/benchmark_summary_n200_s200.json`.
- The `benchmarks/datasets/` dir is empty/absent by design — the corpus is
  generated in-memory on every run (deterministic, seed=200).
- Token estimates use tiktoken **`cl100k_base` pinned at v0.13.0**; do not switch
  to `o200k_base`.
- **`learned_router.pkl` is sklearn-version-sensitive**: it was trained under
  scikit-learn 1.8.0. A fresh env may resolve 1.9.0+ and emit
  `InconsistentVersionWarning` when unpickling before the suite retrains it.
  Retrain or match versions; never treat a cross-version unpickle as
  authoritative.
- **`requirements.txt` uses floor pins (`>=`), not exact versions.** A fresh
  `pip install` on Python 3.14 resolved tiktoken 0.14.0, scikit-learn 1.9.0,
  pandas 3.0.5, fastapi 0.141.1 — newer than the documented env (tiktoken
  0.13.0, sklearn 1.8.0). Deterministic outputs reproduced in that verified
  fresh env (Step 8), but regenerated numbers can shift under version drift.
- **`docker-compose.yml` references `apps/api/Dockerfile` + `apps/web/Dockerfile`
  which are not in the repo** (known non-blocking limitation, Step 8). The
  validated runtime path is `uvicorn apps.api.main:app --port 8000` + `npm run
  dev`.

## Number integrity rules

- **`docs/benchmark_methodology.md` is the single source of truth** for all
  benchmark numbers. Update it *first*; the README and web pages must match it.
- Never invent or interpolate measurements. Latency figures are
  environment-dependent and must be reported as observed ranges (e.g.
  `≈3.2–3.9×` speedup across CLI runs), never universal constants.
- Canonical corpus: N=200, seed=200, **40 samples per category**
  (`flat_tabular`, `nested_objects`, `deep_nested`, `heterogeneous`,
  `key_sparse`), generated by `benchmarks/generate_corpus.py`.
- Strict semantics — do not conflate: **valid ≠ eligible ≠ fallback**
  (`final_fallback_used` is the fallback signal; a rejected candidate is not
  "ineligible"). Mean token reduction is valid-only.
- Known corpus facts: TOON/JTON are valid only on `flat_tabular`; ONTO
  round-trips everywhere but loses to JSON on `deep_nested`; the learned router
  (depth-1 decision stump on `tabular_score`) picks TOON on flat_tabular and
  Compact elsewhere — canonical AR = 46.26 vs Compact 40.47.

## Web pages: claims vs demos

- **Experiment/claim pages** (carry validated numbers, about pages; fix them if
  stale): `app/benchmark`, `app/learned-router`, `app/research`, and the
  `app/page.tsx` hero. `STATIC_RESULTS` in the benchmark page mirrors the
  canonical run.
- **Interactive demo pages — do NOT "correct" their numbers** (they are demo
  labels/animations, not measurements): `app/analyze`, `app/router`,
  `app/reliability`, `app/compare`. `MOCK_PAYLOADS` in `app/page.tsx` is
  animation-only.

## Protect these files

Research-integrity invariants held across Steps 1–8. Do not change without
explicit instruction: `apps/api/formats/*`, `services/router.py`, `validator.py`,
`tokenizer.py`, `profiler.py`, `benchmarks/generate_corpus.py`, and the ONTO
efficiency logic, methodology semantics (docs/benchmark_methodology.md), and
exhaustive-router oracle/regret semantics.

## Layout notes

- `apps/api/routers/` = API routes; `apps/api/services/` = router/validator/
  profiler/tokenizer; `apps/api/serializers/` = format dispatch.
- `benchmarks/*.py` are the evaluation entry points; `docs/` holds the
  paper-facing docs (`api.md`, `architecture.md`, `benchmark_methodology.md`,
  `limitations.md`, `reliability.md`).
- `packages/sdk/{python,typescript}` are client SDKs; rarely touched by research
  work.