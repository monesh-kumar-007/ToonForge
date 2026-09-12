'use client';

import { useState } from 'react';
import { serializeAll, CandidateResult } from '@/lib/api';
import ApiErrorBanner from '@/components/ApiErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';

const SAMPLE_PAYLOAD = {
  record_id: 'rec_01J98X4L',
  user_id: 'usr_88201a',
  metric: {
    duration_ms: 14.82,
    cache_hit: true,
  },
};

/*
 * REF_CANDIDATES is used ONLY as the pre-run / reference display.
 * Once a live response exists, every card, chart bar, and audit row is
 * rendered exclusively from the candidates returned by serializeAll().
 */
const REF_CANDIDATES: CandidateResult[] = [
  {
    format_id: 'JSON',
    status: 'VALID',
    eligible: true,
    valid: true,
    encoded: null,
    estimated_tokens: 52,
    rejection_reason: null,
    pipeline_latency_ms: 1.2,
  },
  {
    format_id: 'COMPACT JSON',
    status: 'VALID',
    eligible: true,
    valid: true,
    encoded: null,
    estimated_tokens: 39,
    rejection_reason: null,
    pipeline_latency_ms: 1.8,
  },
  {
    format_id: 'TOON',
    status: 'REJECTED',
    eligible: true,
    valid: false,
    encoded: null,
    estimated_tokens: 28,
    rejection_reason: 'Type Coercion',
    pipeline_latency_ms: 2.4,
  },
  {
    format_id: 'JTON',
    status: 'VALID',
    eligible: true,
    valid: true,
    encoded: null,
    estimated_tokens: 34,
    rejection_reason: null,
    pipeline_latency_ms: 2.1,
  },
  {
    format_id: 'ONTO',
    status: 'VALID',
    eligible: true,
    valid: true,
    encoded: null,
    estimated_tokens: 41,
    rejection_reason: null,
    pipeline_latency_ms: 1.9,
  },
];

const DISPLAY_NAMES: Record<string, string> = {
  JSON: 'JSON',
  'Compact JSON': 'Compact JSON',
  'COMPACT JSON': 'Compact JSON',
  COMPACT: 'Compact JSON',
  TOON: 'TOON',
  JTON: 'JTON',
  ONTO: 'ONTO',
};

const META: Record<string, { desc: string; icon: string; note: string }> = {
  JSON: { desc: 'Canonical baseline spec', icon: 'memory', note: 'Uncompressed AST' },
  'Compact JSON': { desc: 'Deterministic whitespace stripping', icon: 'compress', note: 'Zero syntax mutation' },
  TOON: { desc: 'Tabular-oriented notation', icon: 'table_rows', note: 'Type inference active' },
  JTON: { desc: 'Tuple syntax optimized', icon: 'schema', note: 'Columnar projection' },
  ONTO: { desc: 'Object graph notation', icon: 'hub', note: 'Graph vector layout' },
};

function displayName(formatId: string): string {
  return DISPLAY_NAMES[formatId] ?? formatId;
}

const metaFor = (formatId: string) => META[displayName(formatId)] ?? null;

/*
 * IMPORTANT:
 * pipeline_latency_ms is optional in CandidateResult.
 * Therefore we must not call:
 *
 * candidate.pipeline_latency_ms.toFixed(1)
 *
 * directly.
 */
function formatLatency(
  latency: number | null | undefined
): string {
  if (typeof latency !== 'number' || !Number.isFinite(latency)) {
    return 'N/A';
  }

  return `${latency.toFixed(1)}ms`;
}

export default function FormatComparisonPage() {
  const [auditOpen, setAuditOpen] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [liveCandidates, setLiveCandidates] = useState<CandidateResult[] | null>(null);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'live' | 'error'>('idle');

  const runComparison = async () => {
    if (fetchState === 'loading') return;
    setApiError(null);
    setFetchState('loading');
    try {
      const res = await serializeAll(SAMPLE_PAYLOAD);
      if (res.candidates?.length) {
        setLiveCandidates(res.candidates);
        setFetchState('live');
      } else {
        setFetchState('error');
        setApiError(
          'The API returned no candidate data. Reference values remain shown.'
        );
      }
    } catch (err) {
      setFetchState('error');
      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    }
  };

  const isReference = liveCandidates === null;

  const displayCandidates = isReference ? REF_CANDIDATES : liveCandidates;

  const badgeState =
    fetchState === 'live'
      ? 'live'
      : fetchState === 'loading'
      ? 'loading'
      : fetchState === 'error'
      ? 'error'
      : 'idle';

  const badgeLabel =
    fetchState === 'live'
      ? 'Live API results'
      : fetchState === 'loading'
      ? 'Fetching live data…'
      : fetchState === 'error'
      ? isReference
        ? 'API unavailable — showing reference values'
        : 'API unavailable — showing last results'
      : 'Reference example (pre-run)';

  const jsonBase = displayCandidates.find(
    (c) => displayName(c.format_id) === 'JSON'
  )?.estimated_tokens ?? null;

  const deltaPct = (tokens: number | null): number | null => {
    if (tokens === null || jsonBase === null) return null;
    return Math.round(((jsonBase - tokens) / jsonBase) * 100);
  };

  const validCount = displayCandidates.filter(
    (c) => c.valid
  ).length;

  const compressionRatio = (() => {
    const json = displayCandidates.find(
      (c) => displayName(c.format_id) === 'JSON'
    );
    const compact = displayCandidates.find(
      (c) => displayName(c.format_id) === 'Compact JSON'
    );
    if (
      json?.estimated_tokens &&
      compact?.estimated_tokens &&
      compact.estimated_tokens > 0
    ) {
      return (json.estimated_tokens / compact.estimated_tokens).toFixed(2);
    }
    return '—';
  })();

  const bar = (tokens: number) => {
    const h = Math.max(
      3,
      Math.round((tokens / 60) * 180)
    );

    const y = 210 - h;

    return {
      h,
      y,
      labelY: y - 10,
    };
  };

  const ValidPill = () => (
    <span className="inline-flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
      Valid
    </span>
  );

  const UnsafePill = () => (
    <span className="inline-flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-error bg-error-container px-1.5 py-0.5 rounded">
      <span className="h-1.5 w-1.5 rounded-full bg-error" />
      Rejected
    </span>
  );

  const IneligiblePill = () => (
    <span className="inline-flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-outline bg-outline-variant/20 px-1.5 py-0.5 rounded">
      <span className="h-1.5 w-1.5 rounded-full bg-outline" />
      Ineligible
    </span>
  );

  const StatusPill = ({ c }: { c: CandidateResult }) => {
    if (c.valid) return <ValidPill />;
    if (c.status === 'INELIGIBLE' || !c.eligible) return <IneligiblePill />;
    return <UnsafePill />;
  };

  const decisionChip = (c: CandidateResult) => {
    if (c.valid) {
      return displayName(c.format_id) === 'JSON'
        ? {
            label: 'Valid (Baseline)',
            cls: 'bg-surface-container-high text-on-surface',
          }
        : {
            label: 'Valid Candidate',
            cls: 'bg-primary text-on-primary font-bold',
          };
    }
    if (c.status === 'INELIGIBLE' || !c.eligible) {
      return {
        label: 'Ineligible',
        cls: 'bg-surface-container-high text-on-surface-variant',
      };
    }
    return {
      label: `Rejected (${c.rejection_reason ?? 'Type Mismatch'})`,
      cls: 'bg-error-container text-on-error-container font-semibold',
    };
  };

  return (
    <>
      {/* ========================================================= */}
      {/* HEADER                                                     */}
      {/* ========================================================= */}

      <div className="p-space-lg flex flex-col gap-space-md">
        <ApiErrorBanner
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                Structural Serialization Suite
              </span>

              <span className="text-outline-variant font-mono-data-sm text-mono-data-sm">
                /
              </span>

              <span className="font-mono-data-sm text-mono-data-sm text-outline">
                EVAL_ID: 0x9F41C
              </span>

              <DataSourceBadge state={badgeState} label={badgeLabel} />

              <button
                onClick={runComparison}
                disabled={fetchState === 'loading'}
                className="flex items-center gap-1 px-space-sm py-space-2xs rounded bg-surface-container-low text-secondary font-mono-data-sm text-mono-data-sm cursor-pointer hover:bg-surface-container-high transition-colors disabled:opacity-50"
                title="Serialize the sample payload against all formats"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {fetchState === 'loading' ? 'progress_activity' : 'sync_alt'}
                </span>
                {fetchState === 'loading' ? 'Running…' : '⟳ Run Comparison'}
              </button>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Serialization Comparison
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
              Compare efficiency and validity across all supported representations.
            </p>
          </div>

          <div className="flex items-center gap-space-xs self-start lg:self-auto bg-surface-container-low px-space-md py-space-xs rounded-lg">
            <div className="flex flex-col pr-space-md">
              <span className="font-label-caps text-label-caps text-outline uppercase">
                Active Payload AST
              </span>

              <span className="font-mono-data-lg text-mono-data-lg text-on-surface">
                Nested_Object_Tree::k18
              </span>
            </div>

            <div className="h-6 w-px bg-outline-variant/30" />

            <div className="flex flex-col pl-space-xs">
              <span className="font-label-caps text-label-caps text-secondary uppercase">
                Deterministic Gate
              </span>

              <span className="font-mono-data-lg text-mono-data-lg text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  gavel
                </span>
                Strict Isolation
              </span>
            </div>
          </div>
        </div>

        {/* Critical research principle */}

        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-gradient-to-br from-secondary/15 via-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md relative z-10">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-secondary">
              <span className="material-symbols-outlined text-[20px]">
                lightbulb
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-caps text-label-caps uppercase text-secondary font-bold tracking-wider">
                  Crucial Insight
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-outline">
                  CORE_THEORY_SEC_4
                </span>
              </div>

              <p className="font-body-md text-body-md text-on-surface mt-0.5">
                <strong className="font-semibold text-on-surface">
                  Smaller Does Not Automatically Mean Better.
                </strong>{' '}
                Only valid candidates participate in final selection.
                Structural entropy and schema divergence can fatally
                corrupt downstream context ingestion.
              </p>
            </div>

            <div className="flex items-center gap-space-2xs bg-surface-container-lowest px-space-sm py-space-xs rounded font-mono-data-sm text-mono-data-sm text-outline shrink-0">
              <span className="material-symbols-outlined text-[15px] text-secondary">
                rule
              </span>

              <span>
                {validCount}/{displayCandidates.length} Candidates Sound
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FORMAT CARDS                                               */}
      {/* ========================================================= */}

      <div className="px-space-lg pb-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {displayCandidates.map((c, i) => {
            const meta = metaFor(c.format_id);
            const tokens = c.estimated_tokens;
            const delta = deltaPct(tokens);
            const isJson = displayName(c.format_id) === 'JSON';
            const rejected = !c.valid && c.status !== 'INELIGIBLE' && c.eligible !== false;

            return (
              <div
                key={c.format_id}
                className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative transition-all duration-200 hover:bg-surface-container"
              >
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-outline">
                      FORMAT {String(i + 1).padStart(2, '0')}
                    </span>

                    <StatusPill c={c} />
                  </div>

                  <span className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    {displayName(c.format_id)}
                  </span>

                  <span className="font-mono-data-sm text-mono-data-sm text-outline-variant">
                    {meta ? meta.desc : 'Structural representation'}
                  </span>
                </div>

                <div className="my-space-md py-space-xs bg-surface-container-lowest/60 rounded px-space-xs flex items-baseline justify-between">
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">
                    Token Footprint
                  </span>

                  {rejected ? (
                    <span className="font-mono-data-lg text-mono-data-lg text-error line-through font-semibold">
                      {tokens ?? '—'}{' '}
                      <span className="text-body-sm font-normal text-error/70">
                        tok
                      </span>
                    </span>
                  ) : (
                    <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">
                      {tokens ?? '—'}{' '}
                      <span className="text-body-sm font-normal text-outline">
                        tok
                      </span>
                    </span>
                  )}
                </div>

                <div className="space-y-space-2xs pt-space-xs">
                  <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                    <span className="text-outline">
                      Delta vs Baseline
                    </span>

                    <span
                      className={
                        isJson
                          ? 'text-outline font-semibold'
                          : delta === null
                          ? 'text-outline'
                          : delta >= 0
                          ? 'text-secondary font-semibold'
                          : 'text-on-surface font-semibold'
                      }
                    >
                      {isJson
                        ? '0% Baseline'
                        : delta === null
                        ? '—'
                        : `${delta}% ${delta >= 0 ? 'Reduction' : 'Increase'}`}
                    </span>
                  </div>

                  <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                    <span className="text-outline">
                      Pipeline Latency
                    </span>

                    <span className="text-on-surface">
                      {formatLatency(
                        c.pipeline_latency_ms
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-2 font-mono-data-sm text-mono-data-sm">
                    <span className="text-outline shrink-0">
                      Encoded
                    </span>

                    <span className={`text-right truncate ${c.encoded !== null ? 'text-on-surface-variant' : 'text-outline-variant'}`}>
                      {c.encoded !== null ? c.encoded : 'Not provided'}
                    </span>
                  </div>

                  {rejected && c.rejection_reason && (
                    <p className="font-mono-data-sm text-mono-data-sm text-error/80 pt-1 text-[10px] leading-tight">
                      Reason: {c.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TOKEN CHART                                                */}
      {/* ========================================================= */}

      <div className="px-space-lg pb-space-lg">
        <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
            <div>
              <span className="font-label-caps text-label-caps uppercase text-outline">
                Metric Telemetry
              </span>

              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                ESTIMATED TOKEN COUNT BY FORMAT
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-space-sm font-mono-data-sm text-mono-data-sm">
              {isReference && (
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-3 h-3 rounded-sm bg-primary" />
                  Optimal Valid
                </span>
              )}

              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-3 h-3 rounded-sm bg-surface-container-highest" />
                Valid Candidate
              </span>

              <span className="flex items-center gap-1.5 text-error">
                <span className="w-3 h-3 rounded-sm bg-error/30 ring-1 ring-error/50" />
                Disqualified / Unsafe
              </span>
            </div>
          </div>

          <div className="w-full mt-space-xs overflow-x-auto">
            <svg
              className="w-full h-auto min-w-[700px] text-on-surface"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 800 240"
            >
              <defs>
                <pattern
                  height="8"
                  id="rejectedStripes"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                  width="8"
                >
                  <rect
                    fill="#262a33"
                    height="8"
                    width="8"
                  />

                  <line
                    opacity="0.4"
                    stroke="#ffb4ab"
                    strokeWidth="2.5"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="8"
                  />
                </pattern>

                <linearGradient
                  id="selectedGlow"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#adc6ff"
                    stopOpacity="1"
                  />

                  <stop
                    offset="100%"
                    stopColor="#4d8eff"
                    stopOpacity="0.85"
                  />
                </linearGradient>
              </defs>

              {/* Grid */}

              <line
                stroke="#424754"
                strokeDasharray="3 3"
                strokeOpacity="0.3"
                x1="60"
                x2="780"
                y1="30"
                y2="30"
              />

              <text
                fill="#8c909f"
                fontFamily="jetbrainsMono"
                fontSize="10"
                textAnchor="end"
                x="50"
                y="34"
              >
                60 tok
              </text>

              <line
                stroke="#424754"
                strokeDasharray="3 3"
                strokeOpacity="0.3"
                x1="60"
                x2="780"
                y1="80"
                y2="80"
              />

              <text
                fill="#8c909f"
                fontFamily="jetbrainsMono"
                fontSize="10"
                textAnchor="end"
                x="50"
                y="84"
              >
                45 tok
              </text>

              <line
                stroke="#424754"
                strokeDasharray="3 3"
                strokeOpacity="0.3"
                x1="60"
                x2="780"
                y1="130"
                y2="130"
              />

              <text
                fill="#8c909f"
                fontFamily="jetbrainsMono"
                fontSize="10"
                textAnchor="end"
                x="50"
                y="134"
              >
                30 tok
              </text>

              <line
                stroke="#424754"
                strokeDasharray="3 3"
                strokeOpacity="0.3"
                x1="60"
                x2="780"
                y1="180"
                y2="180"
              />

              <text
                fill="#8c909f"
                fontFamily="jetbrainsMono"
                fontSize="10"
                textAnchor="end"
                x="50"
                y="184"
              >
                15 tok
              </text>

              <line
                stroke="#424754"
                strokeOpacity="0.8"
                x1="60"
                x2="780"
                y1="210"
                y2="210"
              />

              {/* Bars — one per returned candidate (reference only when pre-run) */}

              {displayCandidates.map((c, i) => {
                const tokens = c.estimated_tokens;
                const bh = tokens !== null ? bar(tokens) : { h: 3, y: 207, labelY: 197 };
                const x = 90 + i * 140;
                const cx = x + 40;
                const rejected = !c.valid && c.status !== 'INELIGIBLE' && c.eligible !== false;
                const ineligible = c.status === 'INELIGIBLE' || c.eligible === false;
                const showStar = isReference && displayName(c.format_id) === 'Compact JSON';
                const fill = rejected
                  ? 'url(#rejectedStripes)'
                  : showStar
                  ? 'url(#selectedGlow)'
                  : '#31353e';
                const labelFill = rejected
                  ? '#ffb4ab'
                  : showStar
                  ? '#adc6ff'
                  : '#dfe2ee';

                return (
                  <g key={c.format_id} className={`cursor-pointer group ${ineligible ? 'opacity-60' : ''}`}>
                    <rect
                      className="transition-opacity hover:opacity-85"
                      fill={fill}
                      height={bh.h}
                      rx="2"
                      stroke={rejected ? '#ffb4ab' : 'none'}
                      strokeWidth="1"
                      width="80"
                      x={x}
                      y={bh.y}
                    />

                    <text
                      fill={labelFill}
                      fontFamily="jetbrainsMono"
                      fontSize="12"
                      fontWeight={showStar ? '700' : '600'}
                      textAnchor="middle"
                      x={cx}
                      y={bh.labelY}
                    >
                      {tokens ?? '—'}
                      {rejected ? ' (✕)' : ''}
                      {showStar ? ' ★' : ''}
                    </text>

                    <text
                      fill={rejected ? '#ffb4ab' : '#8c909f'}
                      fontFamily="jetbrainsMono"
                      fontSize="11"
                      textAnchor="middle"
                      x={cx}
                      y="228"
                    >
                      {displayName(c.format_id).toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-space-xs font-mono-data-sm text-mono-data-sm text-outline">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-secondary">
                info
              </span>

              Baseline compression threshold: 45 Tokens.
              TOON yields low density but may fail strict
              schema validation.
            </span>

            <span className="text-on-surface-variant">
              Compression Efficiency Ratio:{' '}
              {compressionRatio} x vs Baseline
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VALIDATION DETAILS                                         */}
      {/* ========================================================= */}

      <div className="px-space-lg pb-space-lg">
        <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm">

          {/* Header */}

          <div
            className="px-space-lg py-space-md bg-surface-container flex items-center justify-between cursor-pointer select-none"
            onClick={() =>
              setAuditOpen((o) => !o)
            }
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                fact_check
              </span>

              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-md text-headline-md text-on-surface">
                    VALIDATION DETAILS
                  </span>

                  <span className="font-mono-data-sm text-mono-data-sm text-outline px-1.5 py-0.5 rounded bg-surface-container-highest">
                    {displayCandidates.length} Records
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Full round-trip AST assertion diagnostics and runtime rejection vectors
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
              <span>
                {auditOpen
                  ? 'COLLAPSE AUDIT'
                  : 'EXPAND AUDIT'}
              </span>

              <span
                className="material-symbols-outlined text-[18px] transition-transform duration-200"
                style={{
                  transform: auditOpen
                    ? 'rotate(0deg)'
                    : 'rotate(180deg)',
                }}
              >
                expand_less
              </span>
            </div>
          </div>

          {/* Table */}

          <div
            className="overflow-x-auto transition-all duration-300"
            style={{
              maxHeight: auditOpen
                ? 'none'
                : '0px',
              opacity: auditOpen ? 1 : 0,
            }}
          >
            <table className="w-full text-left font-mono-data-sm text-mono-data-sm">
              <thead className="bg-surface-container-lowest text-outline font-label-caps text-label-caps uppercase tracking-wider">
                <tr>
                  <th className="py-space-sm px-space-md">
                    Format
                  </th>

                  <th className="py-space-sm px-space-sm">
                    Eligible
                  </th>

                  <th className="py-space-sm px-space-sm">
                    Encoded
                  </th>

                  <th className="py-space-sm px-space-sm">
                    Decoded
                  </th>

                  <th className="py-space-sm px-space-sm">
                    Round-Trip
                  </th>

                  <th className="py-space-sm px-space-sm">
                    Tokens
                  </th>

                  <th className="py-space-sm px-space-md text-right">
                    Decision
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-transparent">
                {displayCandidates.map((c) => {
                  const ineligible = c.status === 'INELIGIBLE' || c.eligible === false;
                  const decision = decisionChip(c);
                  const name = displayName(c.format_id);

                  return (
                    <tr
                      key={c.format_id}
                      className={`transition-colors ${
                        ineligible
                          ? 'hover:bg-surface-container/50'
                          : c.valid
                          ? 'hover:bg-surface-container/50'
                          : 'bg-error/5 hover:bg-error/10'
                      }`}
                    >
                      <td className="py-space-sm px-space-md font-semibold text-on-surface flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ineligible
                              ? 'bg-outline'
                              : c.valid
                              ? 'bg-secondary'
                              : 'bg-error'
                          }`}
                        />
                        {name}
                      </td>

                      <td className="py-space-sm px-space-sm text-on-surface-variant">
                        {c.eligible ? 'Yes' : 'No'}
                      </td>

                      <td className="py-space-sm px-space-sm text-on-surface-variant">
                        {c.encoded !== null ? (
                          <code className="text-outline-variant truncate block max-w-[180px]">
                            {c.encoded}
                          </code>
                        ) : (
                          'Not provided'
                        )}
                      </td>

                      <td className="py-space-sm px-space-sm text-on-surface-variant">
                        {c.valid
                          ? 'Yes'
                          : ineligible
                          ? 'N/A'
                          : 'No'}
                      </td>

                      <td
                        className={`py-space-sm px-space-sm font-medium ${
                          ineligible
                            ? 'text-outline'
                            : c.valid
                            ? 'text-secondary'
                            : 'text-error'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            {ineligible
                              ? 'block'
                              : c.valid
                              ? 'check'
                              : 'close'}
                          </span>

                          {ineligible
                            ? 'Skipped'
                            : c.valid
                            ? 'Passed'
                            : 'Failed'}
                        </span>
                      </td>

                      <td className="py-space-sm px-space-sm text-on-surface font-semibold">
                        {c.estimated_tokens ?? '—'}
                      </td>

                      <td className="py-space-sm px-space-md text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm ${decision.cls}`}
                        >
                          {c.valid && (
                            <span className="material-symbols-outlined text-[12px]">
                              verified
                            </span>
                          )}
                          {ineligible && (
                            <span className="material-symbols-outlined text-[12px]">
                              block
                            </span>
                          )}
                          {!c.valid && !ineligible && (
                            <span className="material-symbols-outlined text-[12px]">
                              cancel
                            </span>
                          )}
                          {decision.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}

          <div className="px-space-lg py-space-sm bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-xs text-outline font-mono-data-sm text-mono-data-sm">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">
                verified_user
              </span>

              Round-trip assertion verified via strict deep-equality
              checking across AST, types, and null semantics.
            </span>

            <span className="text-outline-variant">
              Strict Validation Enabled
            </span>
          </div>
        </div>
      </div>
    </>
  );
}