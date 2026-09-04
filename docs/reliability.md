# Reliability & Adversarial Validation

## The Priority of Semantic Soundness

In production LLM context injection and RAG pipelines, data corruption is catastrophic. Converting a string `"00123"` into number `123` drops leading zeroes (destroying zip codes, invoice numbers, security hashes, or product SKUs). Similarly, coercing `"false"` to `false` creates logic inversions.

TOONFORGE enforces **zero-tolerance** on data degradation through the `StrictValidator`:

```python
# Validation Rules:
1. Strict type matching: isinstance(decoded, type(original)) and not (is_bool_vs_int)
2. Value equality: original == decoded
3. Key preservation: original.keys() == decoded.keys()
4. Array order and length symmetry
```

---

## Adversarial Test Suite

| Test Case | Attack Description | Unsafe Outcome Prevented | System Resolution |
|:---|:---|:---|:---|
| **Numeric Strings** | String `"00123"` in tabular record | Coerced to integer `123` by schema-less parsers | TOON rejected; JTON or Compact JSON selected |
| **Boolean Strings** | `"true"`, `"false"` strings | Coerced to boolean `True` / `False` | TOON rejected; sound candidate selected |
| **Null vs Absent** | Record A has no key `x`, Record B has `x: null` | Dropping key or filling default null | JTON rejected on key mismatch; Compact JSON selected |
| **Delimiter Injections** | Strings containing `,`, `|`, `\n`, `\t` | Array length / column count splitting error | TOON rejected; Compact JSON selected |
| **Deep Recursion** | Depth > 8 parent-child trees | Flattening failure | Evaluates ONTO or Compact JSON safely |

Every case is continuously audited via the `/api/reliability/adversarial` test runner and verified in automated CI tests (`apps/api/tests/regression/test_regression.py`).
