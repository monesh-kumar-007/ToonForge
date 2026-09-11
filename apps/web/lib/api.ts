const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  readonly status: number | null;
  readonly detail: string | null;
  readonly url: string;

  constructor(
    message: string,
    options: {
      status?: number | null;
      detail?: string | null;
      url: string;
    } = { url: API_BASE_URL }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? null;
    this.detail = options.detail ?? null;
    this.url = options.url;
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch {
    throw new ApiError(
      `Unable to reach the TOONFORGE API at ${API_BASE_URL}. ` +
        'Check that the backend is running and that NEXT_PUBLIC_API_URL is set correctly for production.',
      { url }
    );
  }

  if (!response.ok) {
    let detail: string | null = null;

    const body: unknown = await response.json().catch(() => null);

    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const maybeDetail = (body as { detail: unknown }).detail;
      if (typeof maybeDetail === 'string') {
        detail = maybeDetail;
      }
    }

    if (detail === null) {
      const text = await response.text().catch(() => null);
      if (text) detail = text;
    }

    throw new ApiError(
      `API error (HTTP ${response.status})${detail ? `: ${detail}` : '.'}`,
      { status: response.status, detail, url }
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      `Unexpected response from the TOONFORGE API (HTTP ${response.status}).`,
      { status: response.status, url }
    );
  }
}

// ─── Candidate ──────────────────────────────────────────────────────────────

export interface CandidateResult {
  format_id: string;
  status: string;
  eligible: boolean;
  encoded: string | null;
  valid: boolean;
  rejection_reason: string | null;
  estimated_tokens: number | null;
  encode_error?: string | null;
  decode_error?: string | null;
  pipeline_latency_ms?: number;
}

// ─── Profile ────────────────────────────────────────────────────────────────

export interface StructuralProfile {
  top_level_type: string;
  node_count: number;
  object_count: number;
  array_count: number;
  scalar_count: number;
  null_count: number;
  max_depth: number;
  avg_depth: number;
  record_count: number;
  avg_object_width: number;
  unique_key_count: number;
  total_key_occurrences: number;
  key_repetition_ratio: number;
  key_set_consistency: number;
  schema_uniformity: number;
  heterogeneity_index: number;
  string_ratio: number;
  number_ratio: number;
  bool_ratio: number;
  null_ratio: number;
  object_ratio: number;
  array_ratio: number;
  is_tabular: boolean;
  tabular_score: number;
  is_deeply_nested: boolean;
  is_small_scalar: boolean;
  estimated_savings_vs_json: number;
  key_entropy_bits_per_key: number;
}

export interface RoutingSignal {
  signal: string;
  description: string;
  value?: string;
}

export interface ProfileResponse {
  profile: StructuralProfile;
  routing_signals: RoutingSignal[];
  archetype_label: string;
}

// ─── Route ──────────────────────────────────────────────────────────────────

export interface RouteResponse {
  selected_format: string | null;
  serialized_output: string | null;
  profile: StructuralProfile;
  candidates: CandidateResult[];
  valid_candidates: string[];
  rejected_candidates: string[];
  ineligible_candidates: string[];
  token_counts: Record<string, number>;
  token_savings_vs_json: number | null;
  json_token_baseline: number | null;
  routing_latency_ms: number;
  final_fallback_used: boolean;
  fallback_reason: string | null;
  routing_signals: string[];
}

// ─── Benchmark ──────────────────────────────────────────────────────────────

export interface BenchmarkStrategyResult {
  strategy: string;
  mean_reduction: number;
  median_reduction: number;
  std_dev: number;
  fallback_rate: number;
  routing_grade: string;
  sample_count: number;
  validity_rate?: number;
  ineligibility_rate?: number;
  rejection_rate?: number;
  valid_count?: number;
  ineligible_count?: number;
  rejected_count?: number;
  final_fallback_count?: number;
}

export interface BenchmarkResponse {
  run_id: string;
  seed: number;
  corpus_size: number;
  results: BenchmarkStrategyResult[];
  category_breakdown: Record<string, unknown>;
  completed_at: string;
  duration_seconds: number;
}

export interface BenchmarkResultsResponse {
  available: boolean;
  run_id?: string | null;
  results?: BenchmarkStrategyResult[] | null;
  category_breakdown?: Record<string, unknown> | null;
  completed_at?: string | null;
  message?: string | null;
}

// ─── Learned Router ─────────────────────────────────────────────────────────

export interface LearnedRouterPrediction {
  predicted_format: string;
  exhaustive_format: string | null;
  agreement: boolean;
  confidence: number;
  token_regret: number | null;
  learned_latency_ms: number;
  exhaustive_latency_ms: number;
  feature_vector: Record<string, number>;
  model_trained: boolean;
  optimal_selection?: boolean | null;
  invalid_selection?: boolean | null;
  regret_tokens?: number | null;
  regret_pct?: number | null;
}

// ─── Reliability ────────────────────────────────────────────────────────────

export interface AdversarialCase {
  case_id: string;
  name: string;
  description: string;
  original_payload: unknown;

  toon_encoded?: string | null;
  toon_decoded?: unknown;
  validation_passed?: boolean;
  rejection_reason?: string | null;
  candidate_rejected?: boolean;
  alternative_format?: string | null;
  final_fallback_used?: boolean;

  // Compatibility with the static/demo UI data
  selected_format?: string;
  fallback_used?: boolean;
  strictly_sound?: boolean;
  candidates?: Record<
    string,
    {
      status: string;
      valid: boolean;
      reason: string | null;
    }
  >;

  routing_result?: RouteResponse | null;
}

export interface AdversarialResponse {
  cases: AdversarialCase[];
  total_cases: number;
  rejection_count: number;
  fallback_count: number;
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function profilePayload(
  payload: unknown
): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>('/api/profile', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  });
}

export async function routePayload(
  payload: unknown
): Promise<RouteResponse> {
  return apiFetch<RouteResponse>('/api/route', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  });
}

export async function serializeAll(
  payload: unknown
): Promise<{ candidates: CandidateResult[] }> {
  return apiFetch<{ candidates: CandidateResult[] }>('/api/serialize-all', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  });
}

export async function runBenchmark(
  corpusSize: number = 200,
  seed: number = 200
): Promise<BenchmarkResponse> {
  return apiFetch<BenchmarkResponse>('/api/benchmark', {
    method: 'POST',
    body: JSON.stringify({
      corpus_size: corpusSize,
      seed,
    }),
  });
}

export async function getBenchmarkResults(): Promise<BenchmarkResultsResponse> {
  return apiFetch<BenchmarkResultsResponse>('/api/benchmark/results');
}

export async function predictLearnedRouter(
  payload: unknown
): Promise<LearnedRouterPrediction> {
  return apiFetch<LearnedRouterPrediction>(
    '/api/learned-router/predict',
    {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }
  );
}

export async function runAdversarialSuite(
  caseIds?: string[]
): Promise<AdversarialResponse> {
  return apiFetch<AdversarialResponse>('/api/reliability/adversarial', {
    method: 'POST',
    body: JSON.stringify({
      case_ids: caseIds ?? null,
    }),
  });
}