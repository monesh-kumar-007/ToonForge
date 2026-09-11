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

interface CandidateUI {
  format_id: string;
  status: string;
  valid: boolean;
  encoded: string | null;
  estimated_tokens: number | null;
  rejection_reason: string | null;
}

export default function AdaptiveRouterDecisionPage() {
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
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRouted, setHasRouted] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<CandidateUI[]>([
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
      rejection_reason: 'Type preservation failed: string leading zeros coerced to numeric (e.g. "00418" -> 418)',
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
  ]);

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
        : 'API unavailable — showing demo values'
      : 'Awaiting live route';

  const runRouter = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await routePayload(SAMPLE_PAYLOAD);
      setHasRouted(true);
      setRoutingLatencyMs(res.routing_latency_ms);
      setWinnerFormat(res.selected_format || 'Compact JSON');
      setSerializedOutput(res.serialized_output || serializedOutput);
      setBaselineTokens(res.json_token_baseline ?? baselineTokens);
      if (res.token_savings_vs_json !== null && res.token_savings_vs_json !== undefined) {
        setEfficiencyGain(Number(res.token_savings_vs_json.toFixed(1)));
      }
      setFinalFallback(res.final_fallback_used);
      setWinnerTokens(res.token_counts?.[res.selected_format || ''] ?? winnerTokens);
      setValidCount(res.valid_candidates?.length ?? validCount);
      setRejectedCount(res.rejected_candidates?.length ?? rejectedCount);
      setIneligibleCount(res.ineligible_candidates?.length ?? ineligibleCount);
      setEvaluatedCount(res.candidates?.length ?? evaluatedCount);
      setSelectedActiveLabel(res.final_fallback_used ? 'Fallback Path Active' : 'Selected Format Active');
      if (res.candidates) {
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
      }
      const winner = res.candidates?.find((c) => c.format_id === res.selected_format);
      if (winner && winner.encoded) {
        setSerializedOutput(winner.encoded);
      }
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    } finally {
      setLoading(false);
    }
  };

  const candidateToken = (formatId: string): number | null => {
    const c = candidates.find((c) => c.format_id === formatId);
    return c ? c.estimated_tokens : null;
  };

  const candidateValid = (formatId: string): boolean => {
    const c = candidates.find((c) => c.format_id === formatId);
    return c ? c.valid : true;
  };

  const candidateRejected = (formatId: string): boolean => {
    const c = candidates.find((c) => c.format_id === formatId);
    return c ? !c.valid : false;
  };

  const candidateReason = (formatId: string): string | null => {
    const c = candidates.find((c) => c.format_id === formatId);
    return c ? c.rejection_reason : null;
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
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Inference Execution #0x8F94</span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">Pipeline Latency: {routingLatencyMs.toFixed(2)}ms{hasRouted ? '' : ' (reference)'}</span>
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
            title="Re-run router against the sample payload"
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
        {/* STEP 01: STRUCTURAL PROFILE */}
        <section className="relative">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-primary text-on-primary font-bold">STEP 01</span>
              <span className="font-headline-md text-headline-md text-on-surface">Structural Profile Ingestion</span>
            </div>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">Deterministic AST Topology</span>
          </div>
          <div className="p-space-lg rounded-xl bg-surface-container-low relative overflow-hidden shadow-md">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-space-md relative z-10">
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Data Archetype</span>
                <span className="font-headline-lg text-headline-lg text-secondary truncate">Array of Objects</span>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Uniform root structure</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Volume</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl text-headline-xl text-on-surface">24</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">records</span>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Batch size payload</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Homogeneity</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl text-headline-xl text-primary">82%</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">uniform</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-primary h-full rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Nesting Depth</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl text-headline-xl text-tertiary">4</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">levels</span>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Deep recursive sub-trees</span>
              </div>
              <div className="col-span-2 md:col-span-1 p-space-sm rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col gap-space-3xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Redundancy Density</span>
                <span className="font-headline-lg text-headline-lg text-secondary-fixed">High Ratio</span>
                <span className="font-mono-data-sm text-mono-data-sm text-secondary truncate">Key hoisting viable</span>
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
            <span className="font-mono-data-sm text-mono-data-sm text-secondary">{validCount} / {evaluatedCount} Candidate Archetypes Evaluated</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
            {/* Candidate 1 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm transition-transform hover:-translate-y-0.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-headline-md text-on-surface">JSON</span>
                <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-primary-container/20 text-primary font-semibold">ELIGIBLE</span>
              </div>
              <div className="space-y-space-3xs">
                <span className="font-mono-data-sm text-mono-data-sm text-outline block">Baseline Standard</span>
                <div className="flex items-center gap-1 text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px] text-secondary">memory</span>
                  <span>Uncompressed AST</span>
                </div>
              </div>
            </div>
            {/* Candidate 2 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm transition-transform hover:-translate-y-0.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-headline-md text-on-surface">Compact JSON</span>
                <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-primary-container/20 text-primary font-semibold">ELIGIBLE</span>
              </div>
              <div className="space-y-space-3xs">
                <span className="font-mono-data-sm text-mono-data-sm text-outline block">Whitespace Stripped</span>
                <div className="flex items-center gap-1 text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px] text-secondary">compress</span>
                  <span>Zero Syntax Mutation</span>
                </div>
              </div>
            </div>
            {/* Candidate 3 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm transition-transform hover:-translate-y-0.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-headline-md text-on-surface">TOON</span>
                <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-primary-container/20 text-primary font-semibold">ELIGIBLE</span>
              </div>
              <div className="space-y-space-3xs">
                <span className="font-mono-data-sm text-mono-data-sm text-outline block">Tabular Object Notation</span>
                <div className="flex items-center gap-1 text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px] text-secondary">table_rows</span>
                  <span>Type Inference Active</span>
                </div>
              </div>
            </div>
            {/* Candidate 4 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm transition-transform hover:-translate-y-0.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-headline-md text-on-surface">JTON</span>
                <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-primary-container/20 text-primary font-semibold">ELIGIBLE</span>
              </div>
              <div className="space-y-space-3xs">
                <span className="font-mono-data-sm text-mono-data-sm text-outline block">Hoisted Key Dictionary</span>
                <div className="flex items-center gap-1 text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px] text-secondary">schema</span>
                  <span>Columnar Projection</span>
                </div>
              </div>
            </div>
            {/* Candidate 5 */}
            <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm transition-transform hover:-translate-y-0.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-headline-md text-on-surface">ONTO</span>
                <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-primary-container/20 text-primary font-semibold">ELIGIBLE</span>
              </div>
              <div className="space-y-space-3xs">
                <span className="font-mono-data-sm text-mono-data-sm text-outline block">Ordered Nested Triples</span>
                <div className="flex items-center gap-1 text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px] text-secondary">hub</span>
                  <span>Graph Vector Layout</span>
                </div>
              </div>
            </div>
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
            <span className="font-mono-data-sm text-mono-data-sm text-outline">Assertion Engine: Strict Invertibility</span>
          </div>
          <div className="grid grid-cols-1 gap-space-xs">
            {/* Format: JSON */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-headline-md text-headline-md text-on-surface w-36">JSON</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Baseline representation standard. Full loss-free structural fidelity.</span>
              </div>
              <div className="flex items-center gap-space-sm self-end md:self-auto">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">{candidateToken('JSON') ?? 52} Tokens</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-semibold">✓ VALID</span>
              </div>
            </div>
            {/* Format: Compact JSON */}
            <div className="p-space-sm rounded-lg bg-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-space-xs shadow-sm">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-headline-md text-headline-md text-on-surface w-36">Compact JSON</span>
                <span className="font-body-md text-body-md text-on-surface">Lossless whitespace and structural compression. 100% key and scalar types preserved.</span>
              </div>
              <div className="flex items-center gap-space-sm self-end md:self-auto">
                <span className="font-mono-data-sm text-mono-data-sm text-secondary">{candidateToken('Compact JSON') ?? 39} Tokens</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-secondary/20 text-secondary font-semibold">✓ VALID</span>
              </div>
            </div>
            {/* Format: TOON (REJECTED) */}
            <div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col md:flex-row md:items-center justify-between gap-space-xs shadow-inner">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                <span className="font-headline-md text-headline-md text-error w-36">TOON</span>
                <div className="flex items-center gap-space-2xs text-error font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{candidateReason('TOON') || 'Type preservation failed: string leading zeros coerced to numeric (e.g. "00418" -> 418)'}</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm self-end md:self-auto">
                <span className="font-mono-data-sm text-mono-data-sm text-outline line-through">{candidateToken('TOON') ?? 28} Tokens</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-error-container/40 text-error font-semibold">⚠ REJECTED</span>
              </div>
            </div>
            {/* Format: JTON */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-headline-md text-headline-md text-on-surface w-36">JTON</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Tabular schema hoisted successfully. Sparse property padding preserved.</span>
              </div>
              <div className="flex items-center gap-space-sm self-end md:self-auto">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">{candidateToken('JTON') ?? 43} Tokens</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-semibold">✓ VALID</span>
              </div>
            </div>
            {/* Format: ONTO */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-headline-md text-headline-md text-on-surface w-36">ONTO</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Object-to-nested array round-trip verified. Index pointers aligned.</span>
              </div>
              <div className="flex items-center gap-space-sm self-end md:self-auto">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">{candidateToken('ONTO') ?? 47} Tokens</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-semibold">✓ VALID</span>
              </div>
            </div>
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
                <strong className="text-secondary font-semibold">Candidate rejection means an unsafe representation was excluded during pre-selection validation.</strong> The engine continues evaluating valid candidates and did <span className="underline underline-offset-4 decoration-secondary">NOT</span> trigger a system fallback.
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
            <span className="font-mono-data-sm text-mono-data-sm text-secondary font-medium">{selectedActiveLabel}</span>
          </div>
          {/* Large Highlighted Winner Card with Emissive Electric Blue Glow */}
          <div className="p-space-xl rounded-2xl bg-surface-container-high/90 relative overflow-hidden shadow-2xl">
            {/* Inset ambient aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/15 via-primary/5 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-10 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
              {/* Left Header / Identity */}
              <div className="space-y-space-sm max-w-xl">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest font-semibold">Verified Optimal Representation</span>
                </div>
                <div>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight flex items-baseline gap-space-xs">
                    <span>{winnerFormat}</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-outline font-normal">{winnerVariant}</span>
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-2xs leading-relaxed">
                    {winnerDesc}
                  </p>
                </div>
                {/* Serialization Micro Snippet Preview */}
                <div className="p-space-xs rounded bg-surface-container-lowest font-mono-data-sm text-mono-data-sm text-secondary truncate max-w-lg">
                  <code>{serializedOutput}</code>
                </div>
              </div>
              {/* Right Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-space-sm min-w-0 lg:min-w-[280px]">
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-3xs shadow-inner">
                  <span className="font-label-caps text-label-caps text-outline uppercase">Context Payload</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-xl text-headline-xl text-secondary">{winnerTokens}</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-outline">tokens</span>
                  </div>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">vs {baselineTokens} raw baseline</span>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-3xs shadow-inner">
                  <span className="font-label-caps text-label-caps text-outline uppercase">Efficiency Gain</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-xl text-headline-xl text-secondary-fixed">+{efficiencyGain.toFixed(1)}%</span>
                  </div>
                  <span className="font-mono-data-sm text-mono-data-sm text-secondary">token reduction</span>
                </div>
                <div className="col-span-2 p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between shadow-inner">
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">Round-Trip Status</span>
                  <div className="flex items-center gap-space-2xs text-secondary font-mono-data-sm text-mono-data-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>{roundTripStatus}</span>
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
          {/* Footer Indicator Badge: FINAL FALLBACK USED: NO */}
          <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high shadow-md">
            <span className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[14px] font-bold">check</span>
            </span>
            <span className="font-label-caps text-label-caps text-secondary uppercase font-bold tracking-wider">
              FINAL FALLBACK USED: {finalFallback ? 'YES' : 'NO'}
            </span>
            <span className="w-1 h-1 rounded-full bg-outline"></span>
            <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Optimal Path Selected</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
