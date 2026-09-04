export interface CandidateResult {
  format_id: string;
  status: 'VALID' | 'REJECTED' | 'INELIGIBLE' | 'ENCODE_ERROR' | 'DECODE_ERROR';
  eligible: boolean;
  valid: boolean;
  encoded: string | null;
  estimated_tokens: number | null;
  rejection_reason: string | null;
  pipeline_latency_ms: number;
}

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
  schema_uniformity: number;
  heterogeneity_index: number;
  is_tabular: boolean;
  tabular_score: number;
  estimated_savings_vs_json: number;
}

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
