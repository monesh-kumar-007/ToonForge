# Benchmark Methodology

## Evaluation Framework

The empirical evaluation of TOONFORGE adheres to strict reproducibility standards:
- **Corpus Size**: $N = 200$ synthetic payloads (40 per category)
- **Deterministic Seed**: `seed = 200`
- **Token Proxy**: OpenAI `cl100k_base` (GPT-4 / GPT-3.5 tokenization) via `tiktoken`
- **Metrics Collected**:
  - Token Reduction Relative to Pretty JSON: $\frac{\text{Tokens}_{\text{JSON}} - \text{Tokens}_{\text{Candidate}}}{\text{Tokens}_{\text{JSON}}} \times 100$
  - Round-Trip Validity Rate: $\%$ of payloads successfully recovered without loss
  - Fallback Rate: $\%$ of instances requiring fallback to preserve safety
  - Latency: CPU execution time for serialization and validation

---

## Structural Categories

1. **Flat Tabular ($N=40$)**: Homogeneous array of object records with identical key signatures and primitive values.
2. **Nested Objects ($N=40$)**: Multi-layered configuration structures with sub-objects and arrays.
3. **Deep Nested ($N=40$)**: Deep parent-child hierarchies with depth $\ge 5$.
4. **Heterogeneous ($N=40$)**: Polymorphic collections containing distinct record schemas.
5. **Key-Sparse Tabular ($N=40$)**: Tabular records with absent or null attributes.

---

## Empirical Benchmark Findings (N=200, seed=200)

Mean/median/std reduction are computed over **strictly valid samples only** (no
artificial 0.0 dilution); applicability/reliability rates use the full corpus as
the denominator against `N=200`.
Final figures (Steps 2–6 applied: strict downstream validation, ONTO root-array
fidelity fix, valid-only efficiency, candidate rejection ≠ final fallback):

| Strategy | Mean Reduction (%) | Median (%) | Validity Rate (%) | Ineligible/Rejected | Fallback Rate (%) | Classification |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Canonical JSON** | 0.00% | 0.00% | 100.0% (200) | 0 / 0 | 0.0% | `BASELINE` |
| **Compact JSON** | 40.47% | 41.88% | 100.0% (200) | 0 / 0 | 0.0% | `OPTIMAL LEADER` |
| **TOON** | **63.43%** | **63.67%** | 20.0% (40) | 160 / 0 | 0.0% | `OPTIMAL LEADER` |
| **JTON** | 61.06% | 61.45% | 20.0% (40) | 120 / 40 | 0.0% | `OPTIMAL LEADER` |
| **ONTO** | 4.27% | 1.96% | 60.0% (120) | 80 / 0 | 0.0% | `BASELINE` |
| **Adaptive Router** | **46.26%** | **42.66%** | **100.0%** (200) | 0 / 0 | **0.0%** | `OPTIMAL LEADER` |

> Correction history: pre-Step-4 numbers (TOON 12.69%, 80% "fallback"; JTON
> 12.21%, 80%; ONTO 2.53%, 60%) counted noise-free zeros as savings and
> mislabeled ineligibility/rejection as fallback. After the fixes the true
> valid-only means are TOON **63.43%**, JTON **61.06%**, ONTO **4.27%**; genuine
> final-fallback rate is **0.0%** for every strategy. ONTO validity rose from
> 40% to 60% and median to 1.96% following the Step-3 root-array fidelity fix.

### Key Insight
TOON and JTON are structurally applicable only to the Flat Tabular category in
this corpus (ineligible or rejected elsewhere); their 63.43% / 61.06% means are
valid-only. ONTO round-trips nested and deep structures but is *less* efficient
than plain JSON on this corpus's small deep trees (mean −8.12% on Deep Nested).
The Adaptive Router selects per payload the strict-valid format with the lowest
token count and therefore **dominates every fixed format** (≥ each format's
valid-only mean on that format's own valid set) while holding 100% validity and
0% fallback.

### Category-Level Results (Adaptive Router selections)

| Category | Best Fixed Mean | AR Mean | AR Selection |
|:---|:---:|:---:|:---|
| Flat Tabular (40) | TOON 63.43% | 63.43% | TOON (40/40) |
| Nested Objects (40) | Compact 41.99%, ONTO 20.78% | 41.99% | Compact JSON (40/40) |
| Deep Nested (40) | Compact 42.71%, ONTO −8.12% | 42.71% | Compact JSON (40/40) |
| Heterogeneous (40) | Compact 48.48%, ONTO 0.13% | 48.48% | Compact JSON (40/40) |
| Key-Sparse Tabular (40) | Compact 34.70%, JTON rejected | 34.70% | Compact JSON (40/40) |

### Adaptive Router vs. Best Fixed Format (on the fixed format's own valid set)

| Fixed Format | Valid N | Fixed Mean | AR Mean (same set) | Δ (AR − fixed) |
|:---|:---:|:---:|:---:|:---:|
| Canonical JSON | 200 | 0.00% | 46.26% | +46.26pt |
| Compact JSON | 200 | 40.47% | 46.26% | +5.79pt |
| TOON | 40 | 63.43% | 63.43% | 0.00pt |
| JTON | 40 | 61.06% | 63.43% | +2.37pt |
| ONTO | 120 | 4.27% | 44.39% | +40.12pt |

Overall, AR (46.26%) exceeds the best fixed general-purpose format
(Compact JSON, 40.47%, the only ≥20%-savings format with 100% validity) by
**+5.79 points** — and that gap is realized only after the Step-4/Step-5
methodology corrections brought specialized-format numbers to their true values.

### Reproducibility (Step 6 protocol)
- Canonical corpus: `benchmarks/generate_corpus.py` — `generate_benchmark_corpus(200, 200)`,
  40 samples per category (flat_tabular, nested_objects, deep_nested,
  heterogeneous, key_sparse), deterministic via `random.Random(seed)`.
- The API benchmark uses the **same** canonical generator (CLI/API parity:
  identical counts and means at N=200, seed=200; former API discrepancy 62.01%
  eliminated).
- Two identical `(N=200, seed=200)` runs reproduce every deterministic metric
  bit-for-bit; only latency/timing (`mean_latency_ms`, duration) vary and are
  reported as ranges.
- Token proxy: `tiktoken` `cl100k_base` (pinned v0.13.0) — deterministic for the
  pinned version.
- Regression guards: `apps/api/tests/benchmarks/test_step6_reproducibility.py`.

---

## Final Canonical Source of Truth (Step 7)

**This document is the single source of truth for all TOONFORGE benchmark
numbers.** README, architecture/limitations docs, backend docstrings, and any
frontend dashboard point to this file; where a displayed figure diverges, it is
either an explicitly labeled demo/illustration or a defect to correct against
this table.

Canonical experiment definition:
- **Corpus**: `generate_benchmark_corpus(size=200, seed=200)` from
  `benchmarks/generate_corpus.py` — the ONE canonical generator used by both
  CLI and API benchmark paths (parity enforced by tests).
- **Structure**: 5 categories, 40 samples each: `flat_tabular`,
  `nested_objects`, `deep_nested`, `heterogeneous`, `key_sparse`.
- **Semantics**:
  - Efficiency (mean/median/std token reduction) → **strictly valid samples only** (validity before efficiency).
  - Applicability/reliability → **full corpus**: `validity_rate`,
    `ineligibility_rate`, `rejection_rate`.
  - Structural ineligibility ≠ candidate rejection ≠ final fallback.
  - `fallback_rate` is only genuine `route_result.final_fallback_used` events.
- **Token proxy**: `tiktoken` `cl100k_base` (pinned v0.13.0).

### Learned Router — Final Recorded Results

| Metric | CLI eval (positional 150/50, seed 200) | API holdout (random 160/40, seed 42) |
|:---|:---:|:---:|
| Top-1 / exact-match agreement | 100.0% | 100.0% |
| Mean / median / p95 token regret | 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 |
| Invalid / ineligible / rejected / fallback | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 |
| Exhaustive latency (measured, across Step 7–8 runs) | ~2.2–2.4 ms | ~1.7 ms / ~2.7 ms |
| Learned latency (measured, across Step 7–8 runs) | ~0.58–0.74 ms | ~0.04 / ~0.15 ms (in-process) |
| Speedup (observed, across runs) | ~3.2–3.9× | ~17.7× (in-process timing only) |

Measured observations used for the ranges above (Step 7 env, Python 3.14.2):
Step-8 CLI run — exhaustive 2.38 ms, learned 0.74 ms, **3.2×**; Step-8 API run —
exhaustive 2.669 ms, learned 0.151 ms in-process. Note the API figure is
**prediction-only in-process timing** and not directly comparable to the CLI
full decision-timing basis; report latency per-run and never across altered
timing bases.

Limitations:
- The CLI positional split is **not category-stratified** and falls entirely on
  the last categories (heterogeneous + key-sparse); do not present it as the
  sole generalization result. The API random holdout is the more representative
  estimate.
- The current trained tree is a depth-1 stump keyed on `tabular_score`; 100%
  agreement holds **on this deterministic corpus**, not universally.
- Latency is machine/run dependent — report as observed ranges, never fixed
  constants.

---

## Reproducibility Protocol

Environment as exercised in this repository: Windows, Python 3.14.2, pytest
9.1.1, `tiktoken` 0.13.0. Results are expected to reproduce on any environment
with `cl100k_base` v0.13.0; version differences in the tokenizer change token
counts.

```bash
# 1. Canonical CLI benchmark (overwrites benchmarks/results/benchmark_summary_n200_s200.json)
python benchmarks/run_benchmark.py --size 200 --seed 200

# 2. Reproducibility rerun (compare deterministic fields; timing will differ)
python benchmarks/run_benchmark.py --size 200 --seed 200 --output benchmarks/results/rerun_check

# 3. Full test suite (46 tests incl. Step-4 method, Step-5 eval, Step-6 parity/repro)
python -m pytest apps/api/tests/

# 4. Learned Router evaluation (positional 150/50; allowed to overwrite models/learned_router.pkl)
python benchmarks/learned_router_eval.py --size 200 --seed 200

# 5. API benchmark parity check (requires uvicorn on :8000)
python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000
#   POST /api/benchmark  {"corpus_size":200,"seed":200}  -> must equal CLI table below
```

Deterministic (must reproduce bit-for-bit for identical seed):

- corpus & category counts
- token counts and mean/median/std reduction
- validity / ineligibility / rejection / final-fallback counts and rates
- routing grades

Nondeterministic / timing-dependent (report as ranges, never bit-for-bit):

- `mean_latency_ms` per strategy
- benchmark total duration
- any wall-clock measurement

---

## Step 8 — Final Independent Evaluation

Independent release audit of the frozen commit `1142e7b`, executed against the
committed code without any source changes. **Verdict: APPROVED WITH
NON-BLOCKING LIMITATIONS** — the repository can be finalized as the V1 research
artifact; the limitation list is maintained in `docs/limitations.md` and does
not block release.

### Phase results (all observed, all reproducible)

| Phase | Check | Result |
|:---|:---|:---|
| B — Tests (working env) | `pytest apps/api/tests/` | **46 passed**, 1 warning (Starlette deprecation), exit 0 |
| B — Tests (fresh venv) | `pytest apps/api/tests/` on Python 3.14 venv from `requirements.txt` | **46 passed**, 3 warnings (Starlette deprecation + 2× sklearn `InconsistentVersionWarning`), exit 0 |
| C — Reproducibility | two independent CLI runs to temp dirs | all **deterministic fields identical**; only latency/duration vary; run1 == run2 == committed `benchmark_summary_n200_s200.json` |
| C2 — Category verification | per-category × per-format valid-only re-computation | every §4 expectation reproduced (incl. flat→TOON 63.43, JTON rejected 40/40 on key-sparse, ONTO −8.12 on deep) |
| D — CLI/API parity | `POST /api/benchmark {"corpus_size":200,"seed":200}` (run `run_d85861d8_seed200`) | **0 strategy mismatches, 0 category mismatches** (all 14 deterministic fields × 6 strategies); API stop verified, pkl reverted |
| E — Learned router | `learned_router_eval.py` + artifact metrics | depth-1 stump, 2 leaves, `tabular_score` importance 1.0, agreement 1.0, training 150; 100% tie-aware / 0 regret / 0 invalid / 0 fallback on the 50-sample holdout; no leakage (index-disjoint splits; internal train split is metric-only) |
| F — Claim sweep | regex over all repo text | only HISTORICAL hits — legacy `12.69%`/`12.21%`/`80%` inside the labelled "Correction history" note; **zero stale claim numbers** in experiment-facing content |
| G — Clean env | fresh venv (Python 3.14, pip 25.3) | install OK; import smoke OK; focused subset 35 passed; full suite 46 passed |

### Verified environment

| Component | Working env (documented) | Fresh venv (resolved by floor pins, Step 8) |
|:---|:---|---:|
| Python | 3.14.2 | 3.14.2 |
| tiktoken | 0.13.0 | 0.14.0 |
| scikit-learn | 1.8.0 | 1.9.0 |
| pytest | 9.1.1 | 9.1.1 |
| fastapi / uvicorn | (docs env) | 0.141.1 / 0.52.4 |
| pandas | declared, unused | 3.0.5 (still unused) |

Deterministic outputs reproduce across both environments; the differences
confirm that requirements are **floor pins** and that only the documented
reset (aligned the methodology above) pins the exact research run.

### Non-blocking limitations (documented in `docs/limitations.md`)

1. `docker-compose.yml` references `Dockerfile`s that do not exist in the repo
   (validate via the native `uvicorn`/`npm` path).
2. Dependency and Python versions are floor/unpinned; token counts are
   pinned-tokenizer dependent.
3. The committed `learned_router.pkl` is sklearn-1.8.0-trained and warns under
   sklearn ≥ 1.9 before retrain.
4. `pandas` is declared but never imported.
