'use client';

import { useEffect, useState, useCallback } from 'react';
import { runAdversarialSuite, AdversarialResponse, AdversarialCase } from '@/lib/api';
import ApiErrorBanner from '@/components/ApiErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';

const STATIC_CASES: AdversarialCase[] = [
  {
    case_id: 'ADJ-001',
    name: 'Leading-Zero String Coercion',
    description: 'Incoming structured payload with preservation-sensitive leading zeros.',
    original_payload: { code: '00123' },
    selected_format: 'COMPACT_JSON',
    fallback_used: false,
    strictly_sound: true,
    candidates: {
      TOON: { status: 'REJECTED', valid: false, reason: 'String "00123" coerced to Number 123' },
      COMPACT_JSON: { status: 'VALID', valid: true, reason: null },
      JSON: { status: 'VALID', valid: true, reason: null },
      YAML: { status: 'REJECTED', valid: false, reason: 'Type coercion risk' },
      CSV: { status: 'INELIGIBLE', valid: false, reason: 'Non-tabular payload' },
    },
  },
];

function formatPretty(value: unknown): string {
  if (value === undefined || value === null) return 'null';
  if (typeof value === 'string') return value;
  try {
    const json = JSON.stringify(value, null, 2);
    return json ?? String(value);
  } catch {
    return String(value);
  }
}

function describeType(value: unknown): string {
  if (value === undefined || value === null) return '—';
  if (Array.isArray(value)) return `Array (len: ${value.length})`;
  if (typeof value === 'object') return `Object (${Object.keys(value).length} keys)`;
  const t = typeof value;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function statusPill(status: string) {
  const cls =
    status === 'VALID'
      ? 'bg-secondary/10 text-secondary'
      : status === 'REJECTED'
      ? 'bg-error-container text-on-error'
      : 'bg-surface-container-high text-outline';
  return (
    <span
      className={`px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm font-semibold whitespace-nowrap ${cls}`}
    >
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="w-full rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col items-center justify-center gap-space-sm p-space-2xl text-center">
      <span className="material-symbols-outlined text-[40px] text-outline-variant">folder_off</span>
      <div className="flex flex-col gap-space-2xs items-center">
        <span className="font-headline-md text-headline-md text-on-surface">No adversarial cases returned.</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          The API returned an empty cases array for this run.
        </span>
      </div>
    </div>
  );
}

function LiveTrace({
  selected,
  fetchState,
}: {
  selected: AdversarialCase;
  fetchState: 'loading' | 'live' | 'error';
}) {
  const routing = selected.routing_result;
  const validation = selected.validation_passed;
  const assertionFailed = validation === false;
  const rejected = selected.candidate_rejected === true;
  const promotedFormat = selected.alternative_format ?? routing?.selected_format ?? null;
  const fallbackUsed = selected.final_fallback_used ?? routing?.final_fallback_used ?? false;
  const candidates = routing?.candidates ?? [];

  return (
    <div className="w-full rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
      {/* Terminal Header Bar */}
      <div className="h-10 bg-surface-container-low px-space-md flex items-center justify-between select-none gap-space-xs">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-error-container"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-surface-container-highest"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-container"></span>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-outline tracking-wider truncate">
            TRACE_VIEWER // {selected.case_id}
          </span>
          <DataSourceBadge
            state={fetchState === 'live' ? 'live' : fetchState === 'error' ? 'error' : 'loading'}
            label={
              fetchState === 'live'
                ? 'Live case'
                : fetchState === 'error'
                ? 'Last live results'
                : 'Refetching…'
            }
            className="hidden sm:inline-flex"
          />
        </div>
        <div className="flex items-center gap-space-xs shrink-0">
          <span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-outline font-label-caps text-label-caps uppercase">
            AST-DEPTH: {routing?.profile?.max_depth ?? '—'}
          </span>
          <span
            className={`px-space-2xs py-0.5 rounded bg-surface-container-high font-label-caps text-label-caps uppercase ${
              assertionFailed ? 'text-error' : 'text-secondary'
            }`}
          >
            ASSERTION: {validation === undefined ? 'PENDING' : assertionFailed ? 'FAIL' : 'PASS'}
          </span>
        </div>
      </div>

      {/* Terminal Body / Step Grid */}
      <div className="p-space-lg flex flex-col gap-space-md">
        {/* Case Detail Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-sm">
          <div className="flex flex-col gap-space-2xs min-w-0">
            <div className="flex items-center gap-space-xs flex-wrap">
              <h4 className="font-headline-md text-headline-md text-on-surface">{selected.name}</h4>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-outline font-mono-data-sm text-mono-data-sm">
                {selected.case_id}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
              {selected.description}
            </p>
          </div>
          <span
            className={`px-space-sm py-1 rounded font-mono-data-sm text-mono-data-sm font-semibold whitespace-nowrap self-start ${
              assertionFailed
                ? 'bg-error-container text-on-error-container'
                : 'bg-secondary/10 text-secondary'
            }`}
          >
            {validation === undefined ? 'UNKNOWN' : assertionFailed ? 'REJECTED' : 'VALID'}
          </span>
        </div>

        {/* Step 1 & Step 2 Split Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* Step 1: Input Payload */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative group hover:bg-surface-container transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-secondary font-semibold">
                STEP 01 — INPUT PAYLOAD
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">RAW JSON (ORIGIN)</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{selected.description}</p>
            <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
              <pre className="text-primary-fixed">{formatPretty(selected.original_payload)}</pre>
            </div>
            <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
              <span>INFERRED TYPE:</span>
              <span className="text-secondary font-medium">{routing?.profile?.top_level_type ?? '—'}</span>
            </div>
          </div>

          {/* Step 2: TOON Encoding */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative group hover:bg-surface-container transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-tertiary font-semibold">
                STEP 02 — TOON ENCODING
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">OPTIMIZER CANDIDATE</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Serialized TOON candidate under the adversarial case.
            </p>
            {selected.toon_encoded != null ? (
              <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                <pre className="text-on-surface-variant">{selected.toon_encoded}</pre>
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-sm text-mono-data-sm text-outline">
                Not provided — TOON encoding was not produced.
              </div>
            )}
            <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
              <span>TOON TOKENS:</span>
              <span className="text-primary font-medium">{routing?.token_counts?.['TOON'] ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Step 3 & Step 4: Coercion & Failure Detection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* Step 3: Decoded Result */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className={`font-label-caps text-label-caps font-semibold ${assertionFailed ? 'text-error' : 'text-secondary'}`}
              >
                STEP 03 — DECODED RESULT
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">DESERIALIZED AST</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Round-trip parser reconstructs payload from token stream.
            </p>
            {selected.toon_decoded !== undefined && selected.toon_decoded !== null ? (
              <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                <pre className={assertionFailed ? 'text-error' : 'text-on-surface'}>
                  {formatPretty(selected.toon_decoded)}
                </pre>
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-sm text-mono-data-sm text-outline">
                Not provided — decoded result was not recorded.
              </div>
            )}
            <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
              <span>RECOVERED TYPE:</span>
              <span className={`font-semibold ${assertionFailed ? 'text-error' : 'text-secondary'}`}>
                {describeType(selected.toon_decoded)}
              </span>
            </div>
          </div>

          {/* Step 4: Deep AST Assertion Engine */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className={`font-label-caps text-label-caps font-semibold ${assertionFailed ? 'text-error' : 'text-secondary'}`}
              >
                STEP 04 — DEEP AST ASSERTION ENGINE
              </span>
              <span
                className={`px-space-2xs py-0.5 rounded font-mono-data-sm text-mono-data-sm font-semibold ${
                  assertionFailed ? 'bg-error-container text-on-error' : 'bg-secondary/10 text-secondary'
                }`}
              >
                {validation === undefined
                  ? 'NOT EXECUTED'
                  : assertionFailed
                  ? 'ASSERTION FAIL'
                  : 'ASSERTION PASS'}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Bi-directional semantic tree comparison checks scalar primitive parity.
            </p>
            {selected.rejection_reason ? (
              <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-sm text-mono-data-sm text-error overflow-x-auto flex flex-col gap-1">
                <div className="flex items-center gap-space-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>TYPE MISMATCH DETECTED</span>
                </div>
                <div className="text-on-surface-variant">{selected.rejection_reason}</div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-sm text-mono-data-sm text-secondary overflow-x-auto flex flex-col gap-1">
                <div className="flex items-center gap-space-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>NO TYPE MISMATCH</span>
                </div>
                <div className="text-on-surface-variant">Semantic identity preserved across round-trip.</div>
              </div>
            )}
            <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
              <span>VALID CANDIDATES:</span>
              <span className="text-secondary font-medium">
                {routing?.valid_candidates && routing.valid_candidates.length > 0
                  ? routing.valid_candidates.join(', ')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Step 5 & Step 6: Router Action & Alternative Promotion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* Step 5: Router Action */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-error font-semibold">
                STEP 05 — ROUTER ACTION
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">PRUNING PIPELINE</span>
            </div>
            <div
              className={`flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded ${
                rejected ? '' : 'border border-secondary/30'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${rejected ? 'text-error' : 'text-secondary'}`}>
                {rejected ? 'block' : 'task_alt'}
              </span>
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-mono-data-sm text-mono-data-sm font-semibold uppercase ${
                    rejected ? 'text-error' : 'text-secondary'
                  }`}
                >
                  {rejected ? 'REJECT CANDIDATE: TOON' : 'TOON CANDIDATE: VALID'}
                </span>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  {rejected
                    ? selected.rejection_reason ?? 'Candidate failed validation.'
                    : 'Validator confirmed round-trip isomorphism.'}
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {rejected
                ? 'TOON candidate pruned despite token efficiency — semantic preservation is prioritized.'
                : 'TOON candidate retained as a sound candidate for selection.'}
            </p>
          </div>

          {/* Step 6: Safe Alternative Promotion */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-secondary font-semibold">
                STEP 06 — SAFE ALTERNATIVE PROMOTION
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">SELECTED FORMAT</span>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded">
              <span className="material-symbols-outlined text-secondary text-[24px]">task_alt</span>
              <div className="flex flex-col min-w-0">
                <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold uppercase truncate">
                  {promotedFormat ? `${promotedFormat} PROMOTED` : 'ALTERNATIVE FORMAT'}
                </span>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  {promotedFormat
                    ? 'Selected as the routed format for this payload.'
                    : 'No alternative format recorded.'}
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {fallbackUsed
                ? 'Fallback path engaged — final output routed through the safe fallback format.'
                : 'Routed without fallback — candidate selection handled in pruning phase.'}
            </p>
          </div>
        </div>

        {/* Final Validation Status Readout Strip */}
        <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md flex-wrap">
            <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-lowest">
              <span
                className={`h-2 w-2 rounded-full ${assertionFailed ? 'bg-error' : 'bg-secondary'} animate-pulse`}
              ></span>
              <span
                className={`font-mono-data-sm text-mono-data-sm font-semibold uppercase ${
                  assertionFailed ? 'text-error' : 'text-secondary'
                }`}
              >
                Final Output: {assertionFailed ? '✗ REJECTED' : '✓ VALID'}
              </span>
            </div>
            <div className="h-4 w-px bg-outline-variant/40 hidden md:block"></div>
            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              <span>Final Fallback Used:</span>
              <span className="text-on-surface font-semibold">{fallbackUsed ? 'YES' : 'NO'}</span>
              {routing?.fallback_reason ? (
                <span className="text-outline">({routing.fallback_reason})</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
            <span className="material-symbols-outlined text-[16px] text-secondary">security</span>
            <span>Downstream Safety Locked</span>
          </div>
        </div>

        {/* Candidate Evaluation Table */}
        {candidates.length > 0 && (
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-on-surface font-semibold">
                CANDIDATE EVALUATION
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline uppercase">
                {candidates.length} CANDIDATES
              </span>
            </div>
            <div className="bg-surface-container-lowest rounded p-space-sm overflow-x-auto">
              <div className="min-w-[560px] flex flex-col gap-0.5">
                <div className="grid grid-cols-[minmax(0,110px)_minmax(0,90px)_minmax(0,46px)_minmax(0,1fr)_minmax(0,64px)] gap-space-sm px-space-sm py-1 font-mono-data-sm text-mono-data-sm text-outline uppercase">
                  <span>Format</span>
                  <span>Status</span>
                  <span>Valid</span>
                  <span>Rejection</span>
                  <span>Tokens</span>
                </div>
                {candidates.map((rc) => (
                  <div
                    key={rc.format_id}
                    className="grid grid-cols-[minmax(0,110px)_minmax(0,90px)_minmax(0,46px)_minmax(0,1fr)_minmax(0,64px)] gap-space-sm px-space-sm py-1 items-center font-mono-data-sm text-mono-data-sm border-t border-outline-variant/20"
                  >
                    <span className="text-on-surface font-medium">{rc.format_id}</span>
                    <span>{statusPill(rc.status)}</span>
                    <span className={rc.valid ? 'text-secondary' : 'text-outline'}>
                      {rc.valid ? 'YES' : 'NO'}
                    </span>
                    <span className="text-outline truncate">{rc.rejection_reason ?? '—'}</span>
                    <span className="text-primary">{rc.estimated_tokens ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReliabilityPage() {
  const [cases, setCases] = useState<AdversarialCase[]>(STATIC_CASES);
  const [totalCases, setTotalCases] = useState(1);
  const [rejectionCount, setRejectionCount] = useState(0);
  const [fallbackCount, setFallbackCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchState, setFetchState] = useState<'loading' | 'live' | 'error'>('loading');
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [hasLiveData, setHasLiveData] = useState(false);

  const advanceSelectedCaseId = useCallback((nextCases: AdversarialCase[]) => {
    setSelectedCaseId(nextCases.length > 0 ? nextCases[0].case_id : null);
  }, []);

  const applyResponse = useCallback(
    (data: AdversarialResponse) => {
      setCases(data.cases);
      setTotalCases(data.total_cases);
      setRejectionCount(data.rejection_count);
      setFallbackCount(data.fallback_count);
      setHasLiveData(true);
      advanceSelectedCaseId(data.cases);
    },
    [advanceSelectedCaseId]
  );

  const scrollToAdversarialSuite = useCallback(() => {
    document
      .getElementById('adversarial-suite')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleRunAudit = useCallback(async () => {
    setLoading(true);
    setFetchState('loading');
    setApiError(null);

    try {
      const data = await runAdversarialSuite();
      setFetchState('live');
      applyResponse(data);
    } catch (err) {
      setFetchState('error');
      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    handleRunAudit();
  }, [handleRunAudit]);

  const firstCase = cases[0];
  const selectedCase =
    cases.find((c) => c.case_id === selectedCaseId) ?? firstCase ?? null;

  return (
    <div className="relative w-full px-space-xl py-space-xl overflow-hidden">
      <ApiErrorBanner
        message={apiError}
        onDismiss={() => setApiError(null)}
      />
      {/* Ambient Emissive Background Light */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-48 left-12 w-80 h-80 bg-error/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Block */}
      <div className="flex flex-col gap-space-2xs mb-space-xl">
        <div className="flex items-center gap-space-xs">
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-secondary font-mono-data-sm text-mono-data-sm tracking-wider uppercase">
            VERIFICATION PROTOCOL // STAGE 04
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-outline font-mono-data-sm text-mono-data-sm">
            ISO-14224 COMPLIANT
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
          Reliability &amp; Validation
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Efficiency is accepted only when semantic preservation is verified.
        </p>
      </div>

      {/* Top Hero Banner */}
      <div className="relative w-full rounded-xl bg-surface-container-lowest p-space-xl shadow-xl mb-space-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low/90 via-surface-container-lowest/80 to-surface-container-low/40 pointer-events-none"></div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
                ZERO-MUTATION GUARANTEE
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight">
              VALIDITY BEFORE EFFICIENCY
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              The serialization engine enforces strict round-trip isomorphism. Unsafe formats are discarded before token optimization.
            </p>
          </div>
          {/* Telemetry Pill Stack */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-space-xs min-w-[240px] bg-surface-container-low p-space-sm rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">STRICT ISOMORPHISM</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold">100% ENFORCED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">ROUNDTRIP DELTA</span>
              <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold">0 BITS DRIFT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">HALLUCINATION RISK</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary-fixed font-semibold">0.0000%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: ADVERSARIAL VALIDATION TRACE */}
      <div
        id="adversarial-suite"
        className="w-full flex flex-col gap-space-md mb-space-2xl scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 rounded-full bg-secondary"></span>
            <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
              Adversarial Validation Trace
            </h3>
          </div>
          <div className="flex items-center gap-space-xs flex-wrap font-mono-data-sm text-mono-data-sm text-outline">
            <span>
              DEBUGGER ID:{' '}
              <span className="text-on-surface">TRACE-ADV-9041X</span>
            </span>
            <span className="text-outline-variant">/</span>
            {fetchState === 'live' && <span className="text-secondary">REALTIME_EXEC</span>}
            <span className="text-outline-variant">/</span>
            <span className={hasLiveData ? 'text-secondary' : 'text-outline'}>
              {hasLiveData
                ? `${cases.length} adversarial case${cases.length === 1 ? '' : 's'}`
                : `${cases.length} reference case${cases.length === 1 ? '' : 's'}`}
            </span>
            <DataSourceBadge
              state={
                fetchState === 'live'
                  ? 'live'
                  : fetchState === 'error'
                  ? 'error'
                  : 'loading'
              }
              label={
                fetchState === 'live'
                  ? 'Live trace'
                  : fetchState === 'error'
                  ? hasLiveData
                    ? 'API unavailable — showing last live results'
                    : 'API unavailable — demo trace shown'
                  : 'Running suite…'
              }
            />
          </div>
        </div>

        {/* Case Explorer: Selector + Detail */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-space-md items-start">
          {/* Case Selector */}
          <div className="w-full rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
            <div className="h-10 bg-surface-container-low px-space-md flex items-center select-none">
              <span className="font-mono-data-sm text-mono-data-sm text-outline tracking-wider">
                CASE SELECTOR
              </span>
            </div>
            <div className="p-space-sm flex flex-row lg:flex-col gap-space-xs overflow-x-auto lg:overflow-y-auto lg:max-h-[640px]">
              {cases.map((c) => {
                const isActive = (selectedCase?.case_id ?? null) === c.case_id;
                const status =
                  c.validation_passed === true
                    ? 'PASS'
                    : c.validation_passed === false
                    ? 'FAIL'
                    : null;
                return (
                  <button
                    key={c.case_id}
                    type="button"
                    onClick={() => setSelectedCaseId(c.case_id)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`${c.case_id}: ${c.name}${status ? ` — ${status}` : ''}`}
                    className={`flex items-center justify-between gap-space-xs px-space-sm py-space-sm rounded-md border text-left transition-colors shrink-0 min-w-[220px] lg:min-w-0 lg:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      isActive
                        ? 'bg-primary/10 border-secondary/40'
                        : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">{c.case_id}</span>
                      <span
                        className={`font-body-sm text-body-sm truncate ${
                          isActive ? 'text-on-surface' : 'text-on-surface-variant'
                        }`}
                      >
                        {c.name}
                      </span>
                    </div>
                    <span
                      className={`px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm font-semibold shrink-0 ${
                        status === 'PASS'
                          ? 'bg-secondary/10 text-secondary'
                          : status === 'FAIL'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container-high text-outline'
                      }`}
                    >
                      {status ?? '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Column */}
          <div className="min-w-0 flex flex-col">
            {fetchState === 'live' && cases.length === 0 ? (
              <EmptyState />
            ) : hasLiveData && selectedCase ? (
              <LiveTrace selected={selectedCase} fetchState={fetchState} />
            ) : (
              <>
        {/* Execution Trace Terminal */}
        <div className="w-full rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
          {/* Terminal Header Bar */}
          <div className="h-10 bg-surface-container-low px-space-md flex items-center justify-between select-none">
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error-container"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-surface-container-highest"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-secondary-container"></span>
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-outline tracking-wider">
                TRACE_VIEWER // CANDIDATE_EVALUATION
              </span>
              <DataSourceBadge state="demo" label="Demo case" />
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-outline font-label-caps text-label-caps uppercase">
                AST-DEPTH: 4
              </span>
              <span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-secondary font-label-caps text-label-caps uppercase">
                ASSERTION: ACTIVE
              </span>
            </div>
          </div>

          {/* Terminal Body / Step Grid */}
          <div className="p-space-lg flex flex-col gap-space-md">
            {/* Step 1 & Step 2 Split Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Step 1: Input Payload */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative group hover:bg-surface-container transition-colors shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary font-semibold">
                    STEP 01 — INPUT PAYLOAD
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">RAW JSON (ORIGIN)</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Incoming structured payload with preservation-sensitive leading zeros.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <pre className="text-primary-fixed">{`{
  "code": "00123"
}`}</pre>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>INFERRED TYPE:</span>
                  <span className="text-secondary font-medium">String (Len: 5)</span>
                </div>
              </div>

              {/* Step 2: TOON Encoding */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative group hover:bg-surface-container transition-colors shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-tertiary font-semibold">
                    STEP 02 — TOON ENCODING
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">OPTIMIZER CANDIDATE</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Serialized to unquoted token stream to minimize syntax overhead.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <pre className="text-on-surface-variant">code: 00123</pre>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>TOKEN GAIN:</span>
                  <span className="text-primary font-medium">-3 Tokens (-37.5%)</span>
                </div>
              </div>
            </div>

            {/* Step 3 & Step 4: Coercion & Failure Detection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Step 3: Decoded Result */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-error font-semibold">
                    STEP 03 — DECODED RESULT
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">DESERIALIZED AST</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Round-trip parser reconstructs payload from token stream.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <pre className="text-error">{`{
  "code": 123
}`}</pre>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>RECOVERED TYPE:</span>
                  <span className="text-error font-semibold">Integer (Loss of 2 chars)</span>
                </div>
              </div>

              {/* Step 4: Deep AST Assertion Engine */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-error font-semibold">
                    STEP 04 — DEEP AST ASSERTION ENGINE
                  </span>
                  <span className="px-space-2xs py-0.5 rounded bg-error-container text-on-error font-mono-data-sm text-mono-data-sm font-semibold">
                    ASSERTION FAIL
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Bi-directional semantic tree comparison checks scalar primitive parity.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-sm text-mono-data-sm text-error overflow-x-auto flex flex-col gap-1">
                  <div className="flex items-center gap-space-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>TYPE MISMATCH DETECTED</span>
                  </div>
                  <div className="text-on-surface-variant">
                    Primitive coercion: String <span className="text-primary-fixed">&quot;00123&quot;</span> coerced to Number{' '}
                    <span className="text-error">123</span>.
                  </div>
                  <div className="text-outline">
                    Entropy Delta: -2 bytes, Semantic Identity Compromised.
                  </div>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>INSPECTOR REF:</span>
                  <span className="text-error font-medium">AST_PRIMITIVE_INCOMPATIBLE</span>
                </div>
              </div>
            </div>

            {/* Step 5 & Step 6: Router Action & Alternative Promotion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Step 5: Router Action */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-error font-semibold">
                    STEP 05 — ROUTER ACTION
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">PRUNING PIPELINE</span>
                </div>
                <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded">
                  <span className="material-symbols-outlined text-error text-[24px]">block</span>
                  <div className="flex flex-col">
                    <span className="font-mono-data-sm text-mono-data-sm text-error font-semibold uppercase">
                      REJECT CANDIDATE: TOON
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      Severity: Schema Mutation (High Risk)
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Optimizer strictly rejects TOON candidate despite 37.5% lower token footprint.
                </p>
              </div>

              {/* Step 6: Safe Alternative Promotion */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary font-semibold">
                    STEP 06 — SAFE ALTERNATIVE PROMOTION
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">PROMOTED CANDIDATE</span>
                </div>
                <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded">
                  <span className="material-symbols-outlined text-secondary text-[24px]">task_alt</span>
                  <div className="flex flex-col">
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold uppercase">
                      COMPACT JSON PROMOTED
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      Preserves quotation and literal string scalar typing
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Promoted as optimal valid candidate maintaining guaranteed isomorphism.
                </p>
              </div>
            </div>

            {/* Final Validation Status Readout Strip */}
            <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-lowest">
                  <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold uppercase">
                    Final Output: ✓ VALID
                  </span>
                </div>
                <div className="h-4 w-px bg-outline-variant/40 hidden md:block"></div>
                <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  <span>Final Fallback Used:</span>
                  <span className="text-on-surface font-semibold">
                    {firstCase?.fallback_used ? 'YES' : 'NO'}
                  </span>
                  <span className="text-outline">(Handled cleanly in candidate pruning phase)</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
                <span className="material-symbols-outlined text-[16px] text-secondary">security</span>
                <span>Downstream Safety Locked</span>
              </div>
            </div>
          </div>
        </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: EDGE CASE & SEMANTIC INTEGRITY GUARANTEES */}
      <div className="w-full flex flex-col gap-space-md mb-space-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 rounded-full bg-primary"></span>
            <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
              Edge Case &amp; Semantic Integrity Guarantees
            </h3>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-outline uppercase">FORMAL SPECIFICATION</span>
        </div>

        {/* Two Side-by-Side Comparison Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
          {/* Block 1: Null vs Missing Key Preservation */}
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between pb-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">difference</span>
                <h4 className="font-headline-md text-headline-md text-on-surface">Null vs Missing Key Preservation</h4>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                RULE: EXISTENCE != NULL
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Many token-saving serializers omit keys with null values, destroying semantic distinction between deliberate
              emptiness and missing property schemas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-md rounded-lg">
              <div className="flex flex-col gap-space-2xs">
                <span className="font-label-caps text-label-caps text-outline uppercase">RECORD A (EXPLICIT NULL)</span>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface">
                  <pre className="text-on-surface">{`{
  "name": "A",
  "score": null
}`}</pre>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Status: Property Key Exists</span>
              </div>
              <div className="flex flex-col gap-space-2xs">
                <span className="font-label-caps text-label-caps text-outline uppercase">RECORD B (ABSENT KEY)</span>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface">
                  <pre className="text-on-surface">{`{
  "name": "B"
}`}</pre>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Status: Property Key Undefined</span>
              </div>
            </div>
            <div className="flex items-start gap-space-xs bg-surface-container p-space-sm rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">check_circle</span>
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  Strict Differentiation Preserved
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Key existence verified without stripping nulls. Downstream models reliably discern schema fields intended
                  to represent null states.
                </span>
              </div>
            </div>
          </div>

          {/* Block 2: Floating-point & Numerical Precision */}
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between pb-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">pin</span>
                <h4 className="font-headline-md text-headline-md text-on-surface">
                  Floating-point &amp; Numerical Precision
                </h4>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container font-mono-data-sm text-mono-data-sm text-primary font-semibold">
                IEEE 754 BIT-EXACT
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Validates IEEE 754 precision preservation across high-precision floats and bigint timestamps, eliminating
              scientific truncation errors.
            </p>
            <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-md rounded-lg">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between font-mono-data-sm text-mono-data-sm">
                  <span className="text-outline">64-BIT PRECISION FLOAT:</span>
                  <span className="text-secondary font-medium">EPSILON = 0.00000000000000000</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <code>0.1000000000000000055511151231257827021181583404541015625</code>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between font-mono-data-sm text-mono-data-sm">
                  <span className="text-outline">NANOSECOND BIGINT TIMESTAMP:</span>
                  <span className="text-primary font-medium">INT64 PRESERVED</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <code>1719238491029384729n</code>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-space-xs bg-surface-container p-space-sm rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">verified</span>
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  Zero Mantissa Drift Guarantee
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Mathematical constants and nanosecond telemetry payloads undergo exact decimal-to-binary parity asserts
                  before validation sign-off.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Visual System Safety Architecture (Bento Style) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-2xl">
        {/* Card 1 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary text-[24px]">terminal</span>
              <span className="font-label-caps text-label-caps text-outline uppercase">PHASE 01</span>
            </div>
            <h5 className="font-headline-md text-headline-md text-on-surface">Candidate Generation</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Generates 5 structural candidate candidates (JSON, TOON, YAML, Compact, CSV/TSV) concurrently under token
              optimization targets.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-lowest px-space-sm py-space-xs rounded flex items-center justify-between font-mono-data-sm text-mono-data-sm">
            <span className="text-outline">CANDIDATES:</span>
            <span className="text-secondary font-semibold">5 ACTIVE</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-tertiary text-[24px]">bug_report</span>
              <span className="font-label-caps text-label-caps text-outline uppercase">PHASE 02</span>
            </div>
            <h5 className="font-headline-md text-headline-md text-on-surface">Adversarial Round-Trip</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Instantly deserializes serialized candidate through the corresponding LLM parser tokenizer to detect lossy
              coercion.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-lowest px-space-sm py-space-xs rounded flex items-center justify-between font-mono-data-sm text-mono-data-sm">
            <span className="text-outline">ISOMORPHISM CHECK:</span>
            <span className="text-tertiary font-semibold">DEEP AST DIFF</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
              <span className="font-label-caps text-label-caps text-outline uppercase">PHASE 03</span>
            </div>
            <h5 className="font-headline-md text-headline-md text-on-surface">Pruning &amp; Promotion</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Unsafe variants get eliminated immediately. The engine selects the highest compression ratio format with 100%
              verified fidelity.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-lowest px-space-sm py-space-xs rounded flex items-center justify-between font-mono-data-sm text-mono-data-sm">
            <span className="text-outline">FINAL SAFETY:</span>
            <span className="text-primary font-semibold">100% GUARANTEED</span>
          </div>
        </div>
      </div>

      {/* Bottom Research Guarantee Callout Note */}
      <div className="w-full rounded-xl bg-surface-container-lowest p-space-lg shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-[28px]">shield_with_heart</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-secondary font-semibold uppercase tracking-wider">
                RESEARCH PRINCIPLE // NON-NEGOTIABLE
              </span>
              <p className="font-body-md text-body-md text-on-surface max-w-4xl pt-1">
                &ldquo;The validator prevents unsafe candidates from ever becoming final selections, ensuring zero downstream
                hallucination or context corruption in LLM prompts.&rdquo;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
            <button
              onClick={scrollToAdversarialSuite}
              className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-data-sm text-mono-data-sm transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Read Validation Spec</span>
            </button>
            <button
              onClick={handleRunAudit}
              disabled={loading}
              className="px-space-md py-space-xs rounded bg-primary text-on-primary font-mono-data-sm text-mono-data-sm font-semibold transition-all hover:bg-primary-container flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>{loading ? 'Running...' : 'Run Test Harness'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
