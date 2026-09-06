# System Limitations & Future Research

## Known Limitations

1. **Exhaustive Router Latency**: Attempting all 5 candidates and round-trip decoding takes on the order of `~1.7–2.2ms` per payload on the benchmark machine (may be higher on cold paths or other environments; latency is machine/run dependent and should be reported as an observed range, never a universal constant). While negligible compared to LLM API latency (`200–2000ms`), high-throughput streaming systems should employ the **Learned Router** (measured `~0.04–0.6ms`, ~3.6–3.9× faster in the CLI evaluation) for sub-millisecond decision times.
2. **Binary & Complex Types**: The current prototype supports all standard JSON data types (numbers, strings, booleans, null, arrays, objects). Custom binary payloads (Base64 buffers, UUIDs, Date objects) are treated as strings.
3. **Downstream Model Attention**: Different foundation models (e.g. GPT-4o vs Claude 3.5 Sonnet vs Llama 3) exhibit slightly differing tokenization efficiencies for non-standard delimiters. The token counts in this study are computed using `cl100k_base` BPE.

## Future Research Directions

- Dynamic runtime BPE calibration for open-weights tokenizer vocabularies (e.g. Llama-3, Gemma, Mistral).
- Reinforcement learning router that optimizes joint objective: token savings $\times$ downstream task completion accuracy.
- Hardware-accelerated SIMD deserializers in Rust/C for sub-10-microsecond candidate decoding.
