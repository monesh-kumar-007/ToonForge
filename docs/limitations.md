# System Limitations & Future Research

## Known Limitations

1. **Exhaustive Router Latency**: Attempting all 5 candidates and round-trip decoding takes on the order of `~1.7–2.7ms` per payload on the benchmark machine (may be higher on cold paths or other environments; latency is machine/run dependent and should be reported as an observed range, never a universal constant). While negligible compared to LLM API latency (`200–2000ms`), high-throughput streaming systems should employ the **Learned Router** (measured `~0.04–0.74ms`; `~3.2–3.9×` faster in the CLI evaluation across observed runs, and faster still for in-process API decision timing) for sub-millisecond decision times.
2. **Binary & Complex Types**: The current prototype supports all standard JSON data types (numbers, strings, booleans, null, arrays, objects). Custom binary payloads (Base64 buffers, UUIDs, Date objects) are treated as strings.
3. **Downstream Model Attention**: Different foundation models (e.g. GPT-4o vs Claude 3.5 Sonnet vs Llama 3) exhibit slightly differing tokenization efficiencies for non-standard delimiters. The token counts in this study are computed using `cl100k_base` BPE.
4. **Docker Compose is not runnable as committed**: `docker-compose.yml` references `apps/api/Dockerfile` and `apps/web/Dockerfile`, which do **not** exist in the repository (a Step-8 audit finding, report-only). The validated runtime path is the native `uvicorn apps.api.main:app --port 8000` server plus `npm run dev` / `npm run build` in `apps/web`. Removing/replacing the Compose files is deferred to a post-freeze maintenance pass.
5. **Version pinning is not exact**: `apps/api/requirements.txt` uses floor pins (`>=`), and no Python version is pinned. A fresh `pip install` on Python 3.14 resolves newer versions (tiktoken 0.14.0, scikit-learn 1.9.0, pandas 3.0.5) than the documented methodology env (tiktoken 0.13.0, scikit-learn 1.8.0). Deterministic benchmark outputs reproduced in a verified fresh venv (Step 8), but token counts are pinned-tokenizer dependent, so regenerating numbers after a dependency drift can shift them slightly. Exact pinning is recommended post-freeze.
6. **Committed model artifact is sklearn-version-sensitive**: `apps/api/models/learned_router.pkl` was trained under scikit-learn 1.8.0; unpickling it with sklearn ≥ 1.9 emits `InconsistentVersionWarning`. Retrain the suite/router-eval or match the sklearn version before treating the binary as authoritative.
7. **Unused dependency**: `pandas>=2.2.0` is declared in `requirements.txt` but never imported by the codebase (dead dependency; removable in a maintenance pass).

## Future Research Directions

- Dynamic runtime BPE calibration for open-weights tokenizer vocabularies (e.g. Llama-3, Gemma, Mistral).
- Reinforcement learning router that optimizes joint objective: token savings $\times$ downstream task completion accuracy.
- Hardware-accelerated SIMD deserializers in Rust/C for sub-10-microsecond candidate decoding.
