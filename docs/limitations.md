# System Limitations & Future Research

## Known Limitations

1. **Exhaustive Router Latency**: Attempting all 5 candidates and round-trip decoding takes `~2.5ms` per payload on standard CPU. While negligible compared to LLM API latency (`200–2000ms`), high-throughput streaming systems should employ the **Learned Router** (`~0.5ms`) for sub-millisecond decision times.
2. **Binary & Complex Types**: The current prototype supports all standard JSON data types (numbers, strings, booleans, null, arrays, objects). Custom binary payloads (Base64 buffers, UUIDs, Date objects) are treated as strings.
3. **Downstream Model Attention**: Different foundation models (e.g. GPT-4o vs Claude 3.5 Sonnet vs Llama 3) exhibit slightly differing tokenization efficiencies for non-standard delimiters. The token counts in this study are computed using `cl100k_base` BPE.

## Future Research Directions

- Dynamic runtime BPE calibration for open-weights tokenizer vocabularies (e.g. Llama-3, Gemma, Mistral).
- Reinforcement learning router that optimizes joint objective: token savings $\times$ downstream task completion accuracy.
- Hardware-accelerated SIMD deserializers in Rust/C for sub-10-microsecond candidate decoding.
