# File Map — What Each File Does

TOONFORGE is a research-prototype monorepo: a Python FastAPI serialization engine
(`apps/api`), a Next.js 14 dashboard (`apps/web`), and an empirical benchmark suite
(`benchmarks/`). This file documents the purpose of every tracked source file.

---

## Root level

| File | Purpose |
|---|---|
| `README.md` | Project overview, headline benchmark claims, quick-start. |
| `AGENTS.md` | Agent operating instructions: commands, number-integrity rules, protected files, gotchas. |
| `docker-compose.yml` | Compose definition referencing `apps/api/Dockerfile` + `apps/web/Dockerfile` (not in repo; known non-blocking limitation). |
| `.gitignore` | Ignores `.venv`, `node_modules`, `.next`, `tsconfig.tsbuildinfo`, `*.env*.local`, ephemeral benchmark output dirs, etc. |
| `screen.png` | Repo root screenshot artifact (gitignored). |

---

## `apps/api` — FastAPI serialization engine (backend)

### Entry point

| File | Purpose |
|---|---|
| `main.py` | FastAPI app factory. Configures logging, CORS, global 500 handler, lifespan (logs token proxy label), mounts all routers. Exposes `/docs`, `/redoc`, `/health`. |

### Config

| File | Purpose |
|---|---|
| `config/settings.py` | Env-driven `Settings` singleton: app title/version, CORS origins, benchmark raw/aggregated result dirs, learned-router model path, corpus defaults (seed/size 200). |
| `requirements.txt` | Backend deps with **floor pins** (`>=`) — tiktoken cl100k pinned in code, sklearn 1.8.0 documented. |

### Models

| File | Purpose |
|---|---|
| `models/domain.py` | Core dataclasses/enums: `FormatID`, `CandidateStatus` (VALID/REJECTED/INELIGIBLE/ENCODE_ERROR/DECODE_ERROR), `StructuralProfile` (topology features), `CandidateResult`, `RoutingResult`. |
| `models/requests.py` | Pydantic request/response schemas for every API endpoint (Profile, Serialize, SerializeAll, Route, Benchmark, LearnedRouterPredict, Adversarial, Health). |
| `models/learned_router.pkl` | **Committed binary** — trained sklearn DecisionTree (1.8.0). Retrained/overwritten by the test suite and router evals; cross-version unpickle is not authoritative. |

### API routers (`routers/`)

| File | Purpose |
|---|---|
| `health.py` | `GET /health` — status, format count, learned-router trained flag. |
| `serialize.py` | `POST /profile` (structural profile + routing signals + archetype), `POST /serialize` (single-format encode→decode→validate→tokens), `POST /serialize-all` (all 5 candidates via `SerializationManager`). |
| `route.py` | `POST /api/route` — full adaptive routing pipeline via `exhaustive_router`, including selected format, candidates, token counts and fallback signals. |
| `benchmark.py` | `POST /api/benchmark` (runs the CLI-compatible canonical pipeline, trains the learned router on an 80% holdout, evaluates on 20%, persists raw + aggregated JSON), `GET /api/benchmark/results`, `POST /api/learned-router/predict`, `GET /api/learned-router/metrics`. |
| `reliability.py` | `POST /api/reliability/adversarial` — runs 6 fixed adversarial cases (type-coercion, null-vs-missing, leading zeros…) against TOON and reports validation/rejection/fallback outcomes. |

### Serialization layer (`serializers/`)

| File | Purpose |
|---|---|
| `registry.py` | Single source of truth: ordered `FORMAT_REGISTRY` mapping format id → format instance, plus `ALL_FORMAT_IDS`. |
| `serializer_factory.py` | `get_format(id)` lookup; raises `UnknownFormatError`. |
| `serialization_manager.py` | Coordinates per-candidate encode/decode across all formats. `serialize_one` / `serialize_all`. Does NOT validate or count tokens; returns raw `CandidateResult`s. |

### Formats (`formats/`) — PROTECTED research code

| File | Purpose |
|---|---|
| `base.py` | `BaseFormat` ABC (format_id, is_eligible, encode, decode) plus `FormatError` / `EligibilityError`. |
| `json_format.py` | `JSON` — canonical baseline, 2-space indented, always eligible. |
| `compact_json.py` | `Compact JSON` — minified (`,`/`:` separators), always eligible, lossless, zero syntax mutation. |
| `toon.py` | `TOON` — Token-Ordered Object Notation; schema-once header + comma-separated value stream. Only eligible on uniform key-set arrays; unquoted strings trigger known type-coercion rejections. |
| `jton.py` | `JTON` — JSON Table Object Notation; key-hoisting/columnar projection (`JTON:{"keys":[...],"rows":[...]}`). Eligible on high key-set-consistency arrays. |
| `onto.py` | `ONTO` — Object-Nesting Tuple Ordering; flattens deep nesting into `path|value` lines. Eligible at depth ≥ 3. |

### Services (`services/`) — PROTECTED research code

| File | Purpose |
|---|---|
| `router.py` | `exhaustive_router` — the ground-truth router: profiles, runs every format, validates, counts tokens, selects best valid format, tracks fallback semantics. Defines exhaustive-router oracle/regret semantics. |
| `profiler.py` | Structural profiler: node/type/depth/key-distribution statistics, tabular/sparse signals, `extract_feature_vector` (12 features), routing signals, archetype labels. |
| `validator.py` | Strict semantic round-trip validator: deep equality across types, values, keys, null-vs-missing, array order. VALIDITY BEATS TOKEN EFFICIENCY. |
| `tokenizer.py` | `token_estimator` — cl100k_base BPE proxy for estimated token counts; chars/4 fallback. Same proxy applied to all formats. |
| `learned_router.py` | `learned_router` — DecisionTreeClassifier format predictor: train/predict/persist (`learned_router.pkl`), recorded metrics. Documented ~3.6–3.9x latency speedup range vs exhaustive. |
| `learned_router_eval.py` | Oracle comparison helpers for learned-router eval: `oracle_for`, `classify_prediction` (validity-first, tie-aware), `evaluate_samples`, `split_dataset`. |

### Tests (`tests/`) — full suite = 46 tests

| File | Purpose |
|---|---|
| `api/test_api.py` | HTTP endpoint tests (health, serialize, profile, route, benchmark). |
| `formats/test_formats.py` | Per-format encode/decode/eligibility unit tests. |
| `services/test_services.py` | Router, validator, tokenizer, profiler unit tests. |
| `integration/test_integration.py` | End-to-end pipeline tests across services + serializers. |
| `regression/test_regression.py` | Regression guards for known defect/strictness semantics. |
| `benchmarks/test_benchmark_methodology.py` | Validates methodology invariants (valid-vs-ineligible-vs-fallback semantics, canonical corpus facts). |
| `benchmarks/test_step6_reproducibility.py` | Step-6 determinism/reproducibility checks (CLI vs API parity). |
| `benchmarks/test_learned_router_eval.py` | Learned-router oracle/regret semantics tests. |
| `benchmarks/test_downstream_proxy.py` | Downstream retrievability proxy tests. |

---

## `apps/web` — Next.js 14 dashboard

### Lib

| File | Purpose |
|---|---|
| `lib/api.ts` | Shared API client: `ApiError`, `apiFetch` (422 detail normalization), typed clients for `profile`, `serializeAll`, `route`, `learnedRouterPredict`, `benchmark`. **Production guard (FIX 1):** if `NEXT_PUBLIC_API_URL` is missing in production, throws `ApiError('NEXT_PUBLIC_API_URL is not configured.')` before any fetch; dev falls back to `http://localhost:8000`. |

### App pages (`app/`)

| File | Purpose |
|---|---|
| `layout.tsx` | Root layout: metadata, fonts, wraps pages in `NavigationShell`. |
| `page.tsx` | Overview/hero page. Carries validated headline claims; `MOCK_PAYLOADS` is animation-only (demo, not data). |
| `analyze/page.tsx` | Interactive payload analyzer: editable payload, live `profile` results (structural counts, tabular_score, archetype), Export AST. Interactive demo — numbers are live/demo labels, not measurements. |
| `router/page.tsx` | Interactive Adaptive Router: payload editor with presets, live STEP-01/02/03 explanation, reference chips pre-run. Interactive demo. |
| `compare/page.tsx` | Format Comparison: pre-run `REF_CANDIDATES` reference view; live results render ONLY backend `serializeAll` candidates (strict separation, FIX 2), `encoded`→"Not provided" when null, no fabricated token counts. |
| `benchmark/page.tsx` | Benchmark Lab: `STATIC_RESULTS` mirrors the canonical run (carries validated numbers). |
| `learned-router/page.tsx` | Learned Router page: trained model metrics, feature vector rendered from `feature_vector`, labeled "(illustrative)" cases. Carries validated numbers. |
| `reliability/page.tsx` | Reliability page: adversarial/reliability claims and labels (demos are unlabeled, not corrected numbers). |
| `research/page.tsx` | Research/claims overview page (validated claims, about page). |
| `globals.css` | Theme design tokens, typography scale, themed thin scrollbars, focus-visible outlines, `prefers-reduced-motion` gates. |

### Components

| File | Purpose |
|---|---|
| `components/ApiErrorBanner.tsx` | Dismissible inline error banner (`role="alert"`). |
| `components/DataSourceBadge.tsx` | State pill (live/loading/idle/demo/reference/error) used across experimental pages. |
| `components/layout/NavigationShell.tsx` | Client shell composing Sidebar + Header + MobileDrawer around page content. |
| `components/layout/Sidebar.tsx` / `SidebarContent.tsx` | Desktop sidebar (nav list, branding). |
| `components/layout/Header.tsx` | Top bar with menu toggle + page context. |
| `components/layout/MobileDrawer.tsx` | Responsive mobile navigation drawer. |
| `components/layout/navigation.ts` | `NAV_ITEMS` route table (name/path/icon). |

### Config & env

| File | Purpose |
|---|---|
| `package.json` | Web scripts: `npm run dev`, `npm run build` (no lint script). |
| `package-lock.json` | Locked dependency tree. |
| `next.config.js` | Next config: `reactStrictMode`, static generation timeout. |
| `tailwind.config.ts` | Tailwind theme mapping to the design tokens. |
| `postcss.config.js` | PostCSS/Tailwind pipeline config. |
| `tsconfig.json` | TypeScript config (`incremental: true` → writes `tsconfig.tsbuildinfo`). |
| `next-env.d.ts` | Next generated TS shims. |
| `netlify.toml` | Netlify build config (build + `@netlify/plugin-nextjs`). |
| `.env.example` | Example env template (dev localhost; production example commented out). |
| `.env.local` | **Gitignored, local-only** — sets `NEXT_PUBLIC_API_URL` for local verification. Never committed. |
| `public/ace-logo.png` | Branding asset. |

---

## `benchmarks` — empirical evaluation suite

| File | Purpose |
|---|---|
| `taxonomy.py` | The 5 structural categories (`flat_tabular`, `nested_objects`, `deep_nested`, `heterogeneous`, `key_sparse`), metadata, and hypothesized optimal format per category. |
| `generate_corpus.py` | Deterministic seeded corpus generator (canonical N=200, seed=200, 40/category). PROTECTED. |
| `run_benchmark.py` | CLI benchmark runner. Methodology: validity-before-efficiency (token stats valid-only), full-corpus applicability rates, genuine fallback semantics. Writes `benchmark_summary_n200_s200.json`. |
| `analyze_results.py` | Post-hoc analysis of benchmark result JSONs (`--dir benchmarks/results`). |
| `learned_router_eval.py` | Learned router vs exhaustive evaluation: top-1 agreement, macro-F1, token regret, latency speedup, feature importance. **Retrains/overwrites `learned_router.pkl`.** |
| `adversarial_cases.py` | CLI adversarial reliability cases (mirrors the API router's cases). |
| `downstream_proxy.py` | Section-V retrievability proxy for downstream task value (question-answering proxy over serialized outputs). |
| `tokenizer_audit.py` | Tokenizer robustness audit: recomputes valid-only reductions with real tokenizers (gpt-4o/o200k, cl100k self-check, Mistral, Qwen; Llama gated→skipped). The cl100k column must reproduce the canonical summary exactly. |
| `results/benchmark_summary_n200_s200.json` | **Canonical tracked artifact** — source of truth for all paper numbers. |
| `results/benchmark_summary_n25_s42.json` | Small-sized reproducibility run artifact. |
| `results/raw/*.json`, `results/aggregated/latest.json` | Ephemeral outputs (gitignored). |
| `results/tokenizer_audit_results.json` | Untracked audit output. |

---

## `docs` — paper-facing documentation

| File | Purpose |
|---|---|
| `benchmark_methodology.md` | **Single source of truth** for all benchmark numbers and methodology semantics. Update first before README/web. |
| `architecture.md` | System architecture narrative (maps to diagrams/figures). |
| `api.md` | API reference. |
| `reliability.md` | Reliability/validation storyline and adversarial guarantees. |
| `limitations.md` | Honest limitations and known defects (TOON coercion, ONTO variance, tokenizer proxy). |

---

## `packages/sdk` — client SDKs (rarely touched by research)

| File | Purpose |
|---|---|
| `python/toonforge/__init__.py` | Python SDK package export. |
| `python/toonforge/client.py` | Python client for the TOONFORGE HTTP API. |
| `python/toonforge/models.py` | Python SDK response models. |
| `typescript/src/client.ts` | TypeScript client (fetch-based). |
| `typescript/src/index.ts` | TS SDK entrypoint/exports. |
| `typescript/src/types.ts` | TS SDK type definitions. |

---

## Integrity notes

- Protected research files (do not change without explicit instruction): `apps/api/formats/*`, `services/router.py`, `validator.py`, `tokenizer.py`, `profiler.py`, `benchmarks/generate_corpus.py`, ONTO efficiency logic, methodology semantics, and exhaustive-router oracle/regret semantics.
- Running the test suite or `learned_router_eval.py` retrains `apps/api/models/learned_router.pkl` — restore it with `git checkout -- apps/api/models/learned_router.pkl` afterward.
- `npx tsc --noEmit` writes `apps/web/tsconfig.tsbuildinfo` (not gitignored) — delete it after typechecking.