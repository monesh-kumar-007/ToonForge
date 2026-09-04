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

## Empirical Benchmark Findings (N=200)

| Strategy | Mean Reduction (%) | Median (%) | Validity Rate (%) | Fallback Rate (%) | Classification |
|:---|:---:|:---:|:---:|:---:|:---|
| **Canonical JSON** | 0.00% | 0.00% | 100.0% | 0.0% | `BASELINE` |
| **Compact JSON** | 40.47% | 41.88% | 100.0% | 0.0% | `OPTIMAL LEADER` |
| **TOON** | 12.69% | 0.00% | 20.0% | 80.0% | `HIGH DEFECT` |
| **JTON** | 12.21% | 0.00% | 20.0% | 80.0% | `HIGH DEFECT` |
| **ONTO** | 2.53% | 0.00% | 40.0% | 60.0% | `HIGH DEFECT` |
| **Adaptive Router** | **46.26%** | **42.66%** | **100.0%** | **0.0%** | `OPTIMAL LEADER` |

### Key Insight
Forcing a specialized format across non-uniform datasets leads to severe defect rates (60–80%). TOON achieves **63.43% mean token reduction on Flat Tabular**, but fails on irregular shapes. The Adaptive Router captures the optimal performance of specialized formats while guaranteeing 100% validity across all payload types.
