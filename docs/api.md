# TOONFORGE API Reference

The TOONFORGE FastAPI backend exposes interactive endpoints at `http://localhost:8000/docs` and `http://localhost:8000/redoc`.

---

## Endpoints

### 1. Health & Status
- **Method**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "project": "TOONFORGE",
  "version": "1.0.0",
  "token_estimator": "tiktoken-cl100k_base"
}
```

### 2. Structural Profiling
- **Method**: `POST /api/profile`
- **Body**:
```json
{
  "payload": [{"id": 1, "name": "Item A", "active": true}]
}
```
- **Response**: Returns `StructuralProfileSchema`, archetype label, and heuristic `routing_signals`.

### 3. Adaptive Routing
- **Method**: `POST /api/route`
- **Body**:
```json
{
  "payload": [{"user_id": 101, "event": "click", "ts": 1710000000}]
}
```
- **Response**: Returns `selected_format`, `serialized_output`, candidate validation results (`VALID`, `REJECTED`, `INELIGIBLE`), `token_savings_vs_json`, and latency.

### 4. Direct Serialization
- **Method**: `POST /api/serialize`
- **Body**:
```json
{
  "payload": [{"col1": "val1"}],
  "format": "TOON"
}
```
- **Response**: Returns `encoded`, `valid`, `rejection_reason`, `estimated_tokens`, and `latency_ms`.

### 5. Multi-Candidate Serialization
- **Method**: `POST /api/serialize-all`
- **Body**:
```json
{
  "payload": [{"col1": "val1"}]
}
```
- **Response**: Returns candidate status and outputs for all 5 formats.

### 6. Benchmark Execution
- **Method**: `POST /api/benchmark`
- **Body**:
```json
{
  "corpus_size": 200,
  "seed": 200
}
```
- **Response**: Runs asynchronous or synchronous benchmark experiment and returns statistical summary.

### 7. Learned Router Prediction
- **Method**: `POST /api/learned-router/predict`
- **Body**:
```json
{
  "payload": [{"x": 1, "y": 2}]
}
```
- **Response**: Returns `predicted_format`, `confidence`, `learned_latency_ms`, and agreement metrics.

### 8. Adversarial Reliability Audit
- **Method**: `POST /api/reliability/adversarial`
- **Body**: `{}`
- **Response**: Executes adversarial test suite and returns audit results across numeric string safety, null handling, and delimiter immunity.
