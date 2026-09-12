'use client';

import React, { useState } from 'react';
import { routePayload, RouteResponse } from '@/lib/api';
import ApiErrorBanner from '@/components/ApiErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';

const SAMPLE_PAYLOAD = {
  user_id: 'usr_88201a',
  items: [
    { id: '00418', qty: 3 },
    { id: '00419', qty: 1 },
  ],
};

const PAYLOAD_PRESETS = {
  sample: {
    label: 'Sample · heterogeneous',
    code: JSON.stringify(SAMPLE_PAYLOAD, null, 2),
  },
  flat: {
    label: 'Flat tabular',
    code: JSON.stringify(
      [
        { id: 'u_001', name: 'ada', score: 92 },
        { id: 'u_002', name: 'ben', score: 41 },
      ],
      null,
      2
    ),
  },
  nested: {
    label: 'Deep nested',
    code: JSON.stringify(
      {
        graph_id: 'g-9',
        revision: 3,
        root: {
          label: 'root',
          children: [
            { label: 'a', children: [{ label: 'a.1', leaf: true }] },
            { label: 'b', leaf: true },
          ],
        },
      },
      null,
      2
    ),
  },
} as const;

interface CandidateUI {
  format_id: string;
  status: string;
  valid: boolean;
  encoded: string | null;
  estimated_tokens: number | null;
  rejection_reason: string | null;
}

const FORMAT_ORDER = ['JSON', 'Compact JSON', 'TOON', 'JTON', 'ONTO'];

const CAND_META: Record<string, { desc: string; icon: string; note: string }> = {
  JSON: { desc: 'Baseline Standard', icon: 'memory', note: 'Uncompressed AST' },
  'Compact JSON': { desc: 'Whitespace Stripped', icon: 'compress', note: 'Zero Syntax Mutation' },
  TOON: { desc: 'Tabular Object Notation', icon: 'table_rows', note: 'Type Inference Active' },
  JTON: { desc: 'Hoisted Key Dictionary', icon: 'schema', note: 'Columnar Projection' },
  ONTO: { desc: 'Ordered Nested Triples', icon: 'hub', note: 'Graph Vector Layout' },
};

const REF_CANDIDATES: CandidateUI[] = [
  {
    format_id: 'JSON',
    status: 'VALID',
    valid: true,
    encoded: null,
    estimated_tokens: 52,
    rejection_reason: null,
  },
  {
    format_id: 'Compact JSON',
    status: 'VALID',
    valid: true,
    encoded: null,
    estimated_tokens: 39,
    rejection_reason: null,
  },
  {
    format_id: 'TOON',
    status: 'REJECTED',
    valid: false,
    encoded: null,
    estimated_tokens: 28,
    rejection_reason:
      'Type preservation failed: string leading zeros coerced to numeric (e.g. "00418" -> 418)',
  },
  {
    format_id: 'JTON',
    status: 'VALID',
    valid: true,
    encoded: null,
    estimated_tokens: 43,
    rejection_reason: null,
  },
  {
    format_id: 'ONTO',
    status: 'VALID',
    valid: true,
    encoded: null,
    estimated_tokens: 47,
    rejection_reason: null,
  },
];

const REF_PROFILE = {
  archetype: 'Array of Objects',
  records: 24,
  uniformity: 82,
  depth: 4,
  redundancy: 'High Ratio',
  redundancyNote: 'Key hoisting viable',
};

export default function AdaptiveRouterDecisionPage() {
  const [payloadPreset, setPayloadPreset] = useState<keyof typeof PAYLOAD_PRESETS>('sample');
  const [payloadText, setPayloadText] = useState<string>(PAYLOAD_PRESETS.sample.code);
  const [parseError, setParseError] = useState<string | null>(null);

  const [routingLatencyMs, setRoutingLatencyMs] = useState<number>(4.82);
  const [winnerFormat, setWinnerFormat] = useState<string>('Compact JSON');
  const [winnerVariant, setWinnerVariant] = useState<string>('v-standard');
  const [winnerDesc, setWinnerDesc] = useState<string>(
    'Selected because it delivers the optimal validated token cost among candidates that passed semantic preservation tests for this heterogeneous payload.'
  );
  const [serializedOutput, setSerializedOutput] = useState<string>(
    '[{"id":"00418","node":1,"val":"k3"},{"id":"00419","node":2,"val":"k7"}]'
  );
  const [winnerTokens, setWinnerTokens] = useState<number>(39);
  const [baselineTokens, setBaselineTokens] = useState<number>(52);
  const [efficiencyGain, setEfficiencyGain] = useState<number>(25.5);
  const [roundTripStatus, setRoundTripStatus] = useState<string>('100% Invertible');
  const [finalFallback, setFinalFallback] = useState<boolean>(false);
  const [validCount, setValidCount] = useState<number>(4);
  const [rejectedCount, setRejectedCount] = useState<number>(1);
  const [ineligibleCount, setIneligibleCount] = useState<number>(0);
  const [evaluatedCount, setEvaluatedCount] = useState<number>(5);
  const [selectedActiveLabel, setSelectedActiveLabel] = useState<string>('Selected Format Active');
  const [profileMetric, setProfileMetric] = useState(REF_PROFILE);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRouted, setHasRouted] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<CandidateUI[]>(REF_CANDIDATES);

  const dataState = loading
    ? 'loading'
    : hasRouted
    ? 'live'
    : apiError
    ? 'error'
    : 'idle';

  const dataStateLabel =
    dataState === 'live'
      ? 'Live route result'
      : dataState === 'loading'
      ? 'Routing…'
      : dataState === 'error'
      ? hasRouted
        ? 'API unavailable — showing last result'
        : 'API unavailable — showing reference values'
      : 'Awaiting live route';

  const isReference = !hasRouted && !apiError && !loading;

  const runRouter = async () => {
    if (loading) return;
    setApiError(null);
    setParseError(null);
    setLoading(true);
    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      setParseError('Payload is not valid JSON — fix it or reselect a preset.');
      setLoading(false);
      return;
    }
    try {
      const res: RouteResponse = await routePayload(parsed);
      setHasRouted(true);

      const profile = res.profile;
      setRoutingLatencyMs(res.routing_latency_ms);
      setWinnerFormat(res.selected_format ?? 'Compact JSON');
      setWinnerVariant('v-standard');
      setWinnerDesc(
        res.final_fallback_used
          ? `Final fallback engaged — ${res.fallback_reason ?? 'no candidate passed semantic round-trip validation'}. Validity-first: plain JSON emitted.`
          : `Lowest-token-cost format among ${res.valid_candidates.length} of ${res.candidates.length} candidates that passed semantic round-trip validation for this ${profile.top_level_type} payload.`
      );
      setSerializedOutput(
        res.candidates.find((c) => c.format_id === res.selected_format)?.encoded ??
          res.serialized_output ??
          '[latency metric only]'
      );
      setWinnerTokens(
        (res.selected_format && res.token_counts[res.selected_format]) || 0
      );
      setBaselineTokens(res.json_token_baseline ?? 0);
      setEfficiencyGain(
        res.token_savings_vs_json !== null && res.token_savings_vs_json !== undefined
          ? Number(res.token_savings_vs_json.toFixed(1))
          : 0
      );
      setRoundTripStatus(
        `${res.valid_candidates.length}/${res.candidates.length} candidates round-trip verified`
      );
      setFinalFallback(res.final_fallback_used);
      setValidCount(res.valid_candidates.length);
      setRejectedCount(res.rejected_candidates.length);
      setIneligibleCount(res.ineligible_candidates.length);
      setEvaluatedCount(res.candidates.length);
      setSelectedActiveLabel(
        res.final_fallback_used ? 'Fallback Path Active' : 'Selected Format Active'
      );
      setProfileMetric({
        archetype: profile.top_level_type,
        records: profile.record_count,
        uniformity: Math.round(profile.schema_uniformity * 100),
        depth: profile.max_depth,
        redundancy:
          profile.key_repetition_ratio > 0.6
            ? 'High Ratio'
            : profile.key_repetition_ratio > 0.3
            ? 'Moderate Ratio'
            : 'Low Ratio',
        redundancyNote:
          profile.key_repetition_ratio > 0.5 ? 'Key hoisting viable' : 'Key hoisting limited',
      });
      setCandidates(
        res.candidates.map((c) => ({
          format_id: c.format_id,
          status: c.status,
          valid: c.valid,
          encoded: c.encoded,
          estimated_tokens: c.estimated_tokens,
          rejection_reason: c.rejection_reason,
        }))
      );
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (key: keyof typeof PAYLOAD_PRESETS) => {
    setPayloadPreset(key);
    setPayloadText(PAYLOAD_PRESETS[key].code);
    setParseError(null);
    setApiError(null);
    setHasRouted(false);
  };

  const candidateToken = (formatId: string): number | null => {
    const c = candidates.find((c) => c.format_id === formatId);
    return c ? c.estimated_tokens : null;
  };

  const candidateReason = (formatId: string): string | null => {
    const c = candidates.find((c) => c.format_id === formatId);
    return c ? c.rejection_reason : null;
  };

  const step02Chip = (c: CandidateUI) => {
    if (c.valid) return { label: 'ELIGIBLE', cls: 'bg-primary-container/20 text-primary' };
    if (c.status === 'INELIGIBLE') return { label: 'INELIGIBLE', cls: 'bg-outline-variant/25 text-outline' };
    return { label: 'REJECTED', cls: 'bg-error-container/40 text-error' };
  };

  const step03Chip = (c: CandidateUI) => {
    if (c.valid) return { label: '✓ VALID', cls: 'bg-secondary/10 text-secondary' };
    if (c.status === 'INELIGIBLE') return { label: '⊘ INELIGIBLE', cls: 'bg-outline-variant/25 text-outline' };
    return { label: '⚠ REJECTED', cls: 'bg-error-container/40 text-error' };
  };

  const step03Desc: Record<string, string> = {
    JSON: 'Baseline representation standard. Full loss-free structural fidelity.',
    'Compact JSON': 'Lossless whitespace and structural compression. 100% key and scalar types preserved.',
    TOON: '',
    JTON: 'Tabular schema hoisted successfully. Sparse property padding preserved.',
    ONTO: 'Object-to-nested array round-trip verified. Index pointers aligned.',
  };

  return (
    <div className="p-space-lg space-y-space-xl max-w-7xl mx-auto w-full">
      <ApiErrorBanner
        message={apiError}
        onDismiss={() => setApiError(null)}
      />
      {/* Top Execution Status Bar & Telemetry Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-md border-b-0">
        <div className="space-y-space-3xs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Decision Cell · Live Router</span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              Pipeline Latency: {hasRouted ? `${routingLatencyMs.toFixed(2)}ms` : '—'}
              {isReference ? ' (reference example — run to measure)' : ''}
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Adaptive Routing Decision</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Evaluating eligible representations while prioritizing semantic preservation.</p>
        </div>
        <div className="flex items-center gap-space-xs self-start md:self-auto">
          <DataSourceBadge state={dataState} label={dataStateLabel} />
          <div className="px-space-sm py-space-2xs rounded bg-surface-container-high flex items-center gap-space-xs shadow-sm">
            <span className={`w-2 h-2 rounded-full ${hasRouted ? 'bg-secondary' : 'bg-outline-variant'}`}></span>
            <span className="font-label-caps text-label-caps text-on-surface font-semibold tracking-wider">
              {loading ? 'ROUTING…' : hasRouted ? 'Evaluation Complete · Round-trip Verified' : 'Awaiting Live Evaluation'}
            </span>
          </div>
          <button
            onClick={runRouter}
            disabled={loading}
            className="px-space-xs py-space-2xs rounded bg-surface-container-low text-secondary font-mono-data-sm text-mono-data-sm cursor-pointer hover:bg-surface-container-high transition-colors disabled:opacity-50"
            title="Route the payload in the editor below"
          >
            {loading ? 'Routing…' : '⟳ Route Payload'}
          </button>
          <div className="px-space-xs py-space-2xs rounded bg-surface-container-low text-outline font-mono-data-sm text-mono-data-sm">
            Strict Mode: ON
          </div>
        </div>
      </div>
      {/* Central Interactive Pipeline Flow Container */}
      <div className="relative space-y-space-xl">
        {/* Payload Editor */}
        <section className="rounded-xl bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-md">
          <div className="h-9 bg-surface-container-lowest px-space-md border-b border-outline-variant/30 flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">input</span>
              <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">Route Payload</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">valid JSON body</span>
            </div>
            <div className="flex items-center gap-space-2xs">
              {(Object.keys(PAYLOAD_PRESETS) as (keyof typeof PAYLOAD_PRESETS)[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`px-space-xs py-space-2xs rounded font-label-caps text-label-caps uppercase tracking-wider transition-colors ${
                    payloadPreset === key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {PAYLOAD_PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={payloadText}
            onChange={(e) => {
              setPayloadText(e.target.value);
              setPayloadPreset('sample');
              setParseError(null);
            }}
            spellCheck={false}
            rows={8}
            className="w-full bg-surface-container-lowest/60 p-space-md font-mono-data-sm text-mono-data-sm text-on-surface resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          />
          <div className="px-space-md py-space-2xs border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-2xs">
            <span className="font-body-sm text-body-sm text-outline">
              {parseError
                ? 'Fix the payload JSON, or reselect a preset.'
                : 'Editing the payload marks the page as reference until you re-run.'}
            </span>
            {parseError && (
              <span className="font-mono-data-sm text-mono-data-sm text-error font-semibold" role="alert">
                {parseError}
              </span>
            )}
          </div>
        </section>
        {/* STEP 01: STRUCTURAL PROFILE */}
        <section className="relative">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-primary text-on-primary font-bold">STEP 01</span>
              <span className="font-headline-md text-headline-md text-on-surface">Structural Profile Ingestion</span>
            </div>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              Deterministic AST Topology{isReference ? ' · Reference example (pre-run)' : ''}
            </span>
          </div>
          <div className="p-space-lg rounded-xl bg-surface-container-low relative overflow-hidden shadow-md">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-space-md relative z-10">
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Data Archetype</span>
                <span className="font-headline-lg text-headline-lg text-secondary truncate">{profileMetric.archetype}</span>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Root structure type</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Volume</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl text-headline-xl text-on-surface">{hasRouted ? profileMetric.records : '—'}</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">records</span>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Top-level entries</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Homogeneity</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl text-headline-xl text-primary">{hasRouted ? profileMetric.uniformity : '—'}</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">uniform</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${hasRouted ? profileMetric.uniformity : 0}%` }}></div>
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Nesting Depth</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl text-headline-xl text-tertiary">{hasRouted ? profileMetric.depth : '—'}</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">levels</span>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Max recursive depth</span>
              </div>
              <div className="col-span-2 md:col-span-1 p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Redundancy Density</span>
                <span className="font-headline-lg text-headline-lg text-secondary-fixed">{hasRouted ? profileMetric.redundancy : '—'}</span>
                <span className="font-mono-data-sm text-mono-data-sm text-secondary truncate">
                  {hasRouted ? profileMetric.redundancyNote : 'Key repetition pending'}
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* Flow Connector 1 -> 2 */}
        <div className="flex items-center justify-center py-space-2xs">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gradient-to-b from-secondary to-primary/40"></div>
            <span className="material-symbols-outlined text-primary text-[20px] -my-1 animate-bounce">arrow_downward</span>
            <div className="w-0.5 h-4 bg-primary/40"></div>
          </div>
        </div>
        {/* STEP 02: ELIGIBLE CANDIDATES */}
        <section className="relative">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-bold">STEP 02</span>
              <span className="font-headline-md text-headline-md text-on-surface">Format Viability Matrix</span>
            </div>
            <span className="font-mono-data-sm text-mono-data-sm text-secondary">
              {hasRouted ? `${validCount} / ${evaluatedCount} Candidate Archetypes Evaluated` : 'Pre-selection review'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
            {FORMAT_ORDER.map((fmt) => {
              const c = candidates.find((x) => x.format_id === fmt);
              const meta = CAND_META[fmt];
              const chip = c ? step02Chip(c) : null;
              return (
                <div
                  key={fmt}
                  className="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm transition-transform hover:-translate-y-0.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-headline-md text-headline-md text-on-surface">{fmt}</span>
                    {chip && (
                      <span className={`font-label-caps text-label-caps px-space-2xs py-0.5 rounded font-semibold ${chip.cls}`}>
                        {chip.label}
                      </span>
                    )}
                  </div>
                  <div className="space-y-space-3xs">
                    <span className="font-mono-data-sm text-mono-data-sm text-outline block">{meta.desc}</span>
                    <div className="flex items-center gap-1 text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                      <span className="material-symbols-outlined text-[14px] text-secondary">{meta.icon}</span>
                      <span>{meta.note}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {/* Flow Connector 2 -> 3 */}
        <div className="flex items-center justify-center py-space-2xs">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-primary/40"></div>
            <span className="material-symbols-outlined text-primary text-[20px] -my-1">arrow_downward</span>
            <div className="w-0.5 h-4 bg-primary/40"></div>
          </div>
        </div>
        {/* STEP 03: ROUND-TRIP VALIDATION */}
        <section className="space-y-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-bold">STEP 03</span>
              <span className="font-headline-md text-headline-md text-on-surface">Semantic Round-Trip Proofing</span>
            </div>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              Assertion Engine: Strict Invertibility{isReference ? ' · Reference example (pre-run)' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-space-xs">
            {FORMAT_ORDER.map((fmt) => {
              const c = candidates.find((x) => x.format_id === fmt);
              const chip = c ? step03Chip(c) : null;
              const token = c ? c.estimated_tokens : null;
              const rejected = c && !c.valid && c.status !== 'INELIGIBLE';
              const ineligible = c && c.status === 'INELIGIBLE';
              return (
                <div
                  key={fmt}
                  className={`p-space-sm rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-space-xs ${
                    rejected
                      ? 'bg-surface-container-lowest shadow-inner'
                      : ineligible
                      ? 'bg-surface-container-low shadow-sm'
                      : fmt === 'Compact JSON'
                      ? 'bg-surface-container-high shadow-sm'
                      : 'bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${rejected ? 'bg-error' : ineligible ? 'bg-outline-variant' : 'bg-secondary'}`}></span>
                    <span className={`font-headline-md text-headline-md w-36 ${rejected ? 'text-error' : ineligible ? 'text-outline' : 'text-on-surface'}`}>
                      {fmt}
                    </span>
                    {rejected ? (
                      <div className="flex items-center gap-space-2xs text-error font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>
                          {candidateReason(fmt) ||
                            'Semantic preservation failed during pre-selection validation.'}
                        </span>
                      </div>
                    ) : (
                      <span className={`font-body-md text-body-md ${ineligible ? 'text-outline' : 'text-on-surface-variant'}`}>
                        {ineligible ? 'Not applicable to this payload archetype — skipped without validation.' : step03Desc[fmt]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-space-sm self-end md:self-auto">
                    {token !== null && (
                      <span className={`font-mono-data-sm text-mono-data-sm ${rejected ? 'text-outline line-through' : ineligible ? 'text-outline' : 'text-outline'}`}>
                        {token} Tokens
                      </span>
                    )}
                    {chip && (
                      <span className={`font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded font-semibold ${chip.cls}`}>
                        {chip.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Prominent Informational Distinction Banner */}
          <div className="p-space-md rounded-xl bg-surface-container-high/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center gap-space-md shadow-md">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
            </div>
            <div className="space-y-space-3xs flex-1">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-caps text-label-caps text-primary tracking-wider uppercase">ARCHITECTURAL SAFETY GUARANTEE</span>
                <span className="font-mono-data-sm text-mono-data-sm text-outline">· Pre-Selection Guardrail</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                <strong className="text-secondary font-semibold">Candidate rejection means an unsafe representation was excluded during pre-selection validation.</strong> The engine continues evaluating valid candidates. Rejected and ineligible candidates are never emitted.
              </p>
            </div>
            <div className="px-space-xs py-1 rounded bg-surface-container-lowest text-outline-variant font-mono-data-sm text-mono-data-sm shrink-0">
              AST Check: STRICT
            </div>
          </div>
        </section>
        {/* Flow Connector 3 -> 4 */}
        <div className="flex items-center justify-center py-space-2xs">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-primary/40"></div>
            <span className="material-symbols-outlined text-secondary text-[20px] -my-1 animate-pulse">arrow_downward</span>
            <div className="w-0.5 h-4 bg-secondary"></div>
          </div>
        </div>
        {/* STEP 04: BEST VALID FORMAT (WINNER CARD) */}
        <section className="relative">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-secondary text-on-secondary font-bold">STEP 04</span>
              <span className="font-headline-md text-headline-md text-on-surface">Optimal Serialization Dispatch</span>
            </div>
            <span className="font-mono-data-sm text-mono-data-sm text-secondary font-medium">
              {selectedActiveLabel}{isReference ? ' (reference)' : ''}
            </span>
          </div>
          {/* Large Highlighted Winner Card with Emissive Electric Blue Glow */}
          <div className="p-space-xl rounded-2xl bg-surface-container-high/90 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/15 via-primary/5 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-10 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
              <div className="space-y-space-sm max-w-xl">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest font-semibold">
                    {hasRouted ? 'Verified Optimal Representation' : 'Reference Example (pre-run)'}
                  </span>
                </div>
                <div>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight flex items-baseline gap-space-xs">
                    <span>{hasRouted ? winnerFormat : '—'}</span>
                    {hasRouted && <span className="font-mono-data-sm text-mono-data-sm text-outline font-normal">{winnerVariant}</span>}
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-2xs leading-relaxed">
                    {hasRouted ? winnerDesc : 'Run the router to evaluate the payload above and surface the winning validated format here.'}
                  </p>
                </div>
                {hasRouted && serializedOutput && (
                  <div className="p-space-xs rounded bg-surface-container-lowest font-mono-data-sm text-mono-data-sm text-secondary truncate max-w-lg">
                    <code>{serializedOutput}</code>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-space-sm min-w-0 lg:min-w-[280px]">
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-3xs shadow-inner">
                  <span className="font-label-caps text-label-caps text-outline uppercase">Context Payload</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-xl text-headline-xl text-secondary">{hasRouted ? winnerTokens : '—'}</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-outline">tokens</span>
                  </div>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">
                    {hasRouted ? `vs ${baselineTokens} raw baseline` : 'run to measure'}
                  </span>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-3xs shadow-inner">
                  <span className="font-label-caps text-label-caps text-outline uppercase">Efficiency Gain</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-xl text-headline-xl text-secondary-fixed">{hasRouted ? `+${efficiencyGain.toFixed(1)}%` : '—'}</span>
                  </div>
                  <span className="font-mono-data-sm text-mono-data-sm text-secondary">token reduction</span>
                </div>
                <div className="col-span-2 p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between shadow-inner">
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">Round-Trip Status</span>
                  <div className="flex items-center gap-space-2xs text-secondary font-mono-data-sm text-mono-data-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>{hasRouted ? roundTripStatus : 'Awaiting evaluation'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom System Resilience Indicator */}
        <footer className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
            <span className="material-symbols-outlined text-[16px] text-outline">analytics</span>
            <span>Engine Instance: cluster-east-04.serialize.worker</span>
          </div>
          <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high shadow-md">
            <span className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[14px] font-bold">check</span>
            </span>
            <span className="font-label-caps text-label-caps text-secondary uppercase font-bold tracking-wider">
              FINAL FALLBACK USED: {hasRouted ? (finalFallback ? 'YES' : 'NO') : '—'}
            </span>
            <span className="w-1 h-1 rounded-full bg-outline"></span>
            <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              {hasRouted ? 'Optimal Path Selected' : 'Reference example (pre-run)'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}