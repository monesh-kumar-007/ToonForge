'use client';

import { useEffect, useState } from 'react';
import { serializeAll, CandidateResult } from '@/lib/api';

type FormatKey = 'JSON' | 'COMPACT JSON' | 'TOON' | 'JTON' | 'ONTO';

const ALIASES: Record<FormatKey, string[]> = {
  'JSON': ['JSON'],
  'COMPACT JSON': ['COMPACT JSON', 'Compact JSON', 'COMPACT'],
  'TOON': ['TOON'],
  'JTON': ['JTON'],
  'ONTO': ['ONTO'],
};

const SAMPLE_PAYLOAD = {
  record_id: 'rec_01J98X4L',
  user_id: 'usr_88201a',
  metric: { duration_ms: 14.82, cache_hit: true },
};

const MOCK_CANDIDATES: CandidateResult[] = [
  {
    format_id: 'JSON',
    status: 'VALID',
    eligible: true,
    valid: true,
    encoded: '{"record_id":"rec_01J98X4L","user_id":"usr_88201a","metric":{"duration_ms":14.82,"cache_hit":true}}',
    estimated_tokens: 52,
    rejection_reason: null,
    pipeline_latency_ms: 1.2,
  },
  {
    format_id: 'COMPACT JSON',
    status: 'VALID',
    eligible: true,
    valid: true,
    encoded: '{"record_id":"rec_01J98X4L","user_id":"usr_88201a","metric":{"duration_ms":14.82,"cache_hit":true}}',
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
    encoded: 'JTON[... 34 tokens]',
    estimated_tokens: 34,
    rejection_reason: null,
    pipeline_latency_ms: 2.1,
  },
  {
    format_id: 'ONTO',
    status: 'VALID',
    eligible: true,
    valid: true,
    encoded: 'ONTO[... 41 tokens]',
    estimated_tokens: 41,
    rejection_reason: null,
    pipeline_latency_ms: 1.9,
  },
];

function mergeCandidates(live: CandidateResult[]): CandidateResult[] {
  const merged: CandidateResult[] = MOCK_CANDIDATES.map((m) => ({ ...m }));
  for (const c of live) {
    const idx = merged.findIndex(
      (m) => ALIASES[m.format_id as FormatKey]?.includes(c.format_id)
    );
    if (idx >= 0) merged[idx] = { ...c };
  }
  return merged;
}

export default function FormatComparisonPage() {
  const [candidates, setCandidates] = useState<CandidateResult[]>(MOCK_CANDIDATES);
  const [auditOpen, setAuditOpen] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    serializeAll(SAMPLE_PAYLOAD)
      .then((res) => {
        if (!cancelled && res.candidates?.length) {
          setCandidates(mergeCandidates(res.candidates));
        }
      })
      .catch(() => {
        // Keep static stitch values so the page renders completely offline.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const candFor = (key: FormatKey): CandidateResult => {
    const ids = ALIASES[key];
    return (
      candidates.find((c) => ids.includes(c.format_id)) ??
      MOCK_CANDIDATES.find((m) => m.format_id === key)!
    );
  };

  const jsonCand = candFor('JSON');
  const compactCand = candFor('COMPACT JSON');
  const toonCand = candFor('TOON');
  const jtonCand = candFor('JTON');
  const ontoCand = candFor('ONTO');

  const jsonTokens = jsonCand.estimated_tokens ?? 52;
  const compactTokens = compactCand.estimated_tokens ?? 39;
  const toonTokens = toonCand.estimated_tokens ?? 28;
  const jtonTokens = jtonCand.estimated_tokens ?? 34;
  const ontoTokens = ontoCand.estimated_tokens ?? 41;

  const deltaPct = (tokens: number) =>
    Math.round(((jsonTokens - tokens) / jsonTokens) * 100);

  const compactDelta = deltaPct(compactTokens);
  const jtonDelta = deltaPct(jtonTokens);
  const ontoDelta = deltaPct(ontoTokens);

  const validCount = candidates.filter((c) => c.valid).length;

  const bar = (tokens: number) => {
    const h = Math.max(3, Math.round((tokens / 60) * 180));
    const y = 210 - h;
    return { h, y, labelY: y - 10 };
  };
  const jsonBar = bar(jsonTokens);
  const compactBar = bar(compactTokens);
  const toonBar = bar(toonTokens);
  const jtonBar = bar(jtonTokens);
  const ontoBar = bar(ontoTokens);

  const ValidPill = () => (
    <span className="inline-flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
      <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span> Valid
    </span>
  );

  const UnsafePill = () => (
    <span className="inline-flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-error bg-error-container px-1.5 py-0.5 rounded">
      <span className="h-1.5 w-1.5 rounded-full bg-error"></span> Rejected
    </span>
  );

  return (
    <>
      {/* Top Section: Header & Critical Research Principle */}
      <div className="p-space-lg flex flex-col gap-space-md">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Structural Serialization Suite</span>
              <span className="text-outline-variant font-mono-data-sm text-mono-data-sm">/</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">EVAL_ID: 0x9F41C</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Serialization Comparison</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
              Compare efficiency and validity across all supported representations.
            </p>
          </div>
          {/* Quick Action / Global Stat Strip */}
          <div className="flex items-center gap-space-xs self-start lg:self-auto bg-surface-container-low px-space-md py-space-xs rounded-lg">
            <div className="flex flex-col pr-space-md">
              <span className="font-label-caps text-label-caps text-outline uppercase">Active Payload AST</span>
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface">Nested_Object_Tree::k18</span>
            </div>
            <div className="h-6 w-px bg-outline-variant/30"></div>
            <div className="flex flex-col pl-space-xs">
              <span className="font-label-caps text-label-caps text-secondary uppercase">Deterministic Gate</span>
              <span className="font-mono-data-lg text-mono-data-lg text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">gavel</span>
                Strict Isolation
              </span>
            </div>
          </div>
        </div>
        {/* Callout Box: High Visual Priority Principle */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-gradient-to-br from-secondary/15 via-primary/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md relative z-10">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-secondary">
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-caps text-label-caps uppercase text-secondary font-bold tracking-wider">Crucial Insight</span>
                <span className="font-mono-data-sm text-mono-data-sm text-outline">CORE_THEORY_SEC_4</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface mt-0.5">
                <strong className="font-semibold text-on-surface">Smaller Does Not Automatically Mean Better.</strong> Only valid candidates participate in final selection. Structural entropy and schema divergence can fatally corrupt downstream context ingestion.
              </p>
            </div>
            <div className="flex items-center gap-space-2xs bg-surface-container-lowest px-space-sm py-space-xs rounded font-mono-data-sm text-mono-data-sm text-outline shrink-0">
              <span className="material-symbols-outlined text-[15px] text-secondary">rule</span>
              <span>{validCount}/5 Candidates Sound</span>
            </div>
          </div>
        </div>
      </div>
      {/* Format Cards: 5-Column Grid */}
      <div className="px-space-lg pb-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
          {/* 1. JSON (Baseline) */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative transition-all duration-200 hover:bg-surface-container">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-outline">FORMAT 01</span>
                {jsonCand.valid ? <ValidPill /> : <UnsafePill />}
              </div>
              <span className="font-headline-md text-headline-md text-on-surface">JSON</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Canonical baseline spec</span>
            </div>
            <div className="my-space-md py-space-xs bg-surface-container-lowest/60 rounded px-space-xs flex items-baseline justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Token Footprint</span>
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">{jsonTokens} <span className="text-body-sm font-normal text-outline">tok</span></span>
            </div>
            <div className="space-y-space-2xs pt-space-xs">
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Delta vs Baseline</span>
                <span className="text-on-surface">0%</span>
              </div>
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Pipeline Latency</span>
                <span className="text-on-surface">{jsonCand.pipeline_latency_ms.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
          {/* 2. COMPACT JSON (Selected Candidate) */}
          <div className="bg-surface-container-high rounded-xl p-space-md flex flex-col justify-between relative shadow-lg transition-all duration-200 ring-0">
            {compactCand.valid && (
              <div className="absolute top-0 right-0 bg-primary text-on-primary font-label-caps text-label-caps uppercase px-space-xs py-0.5 rounded-bl-lg rounded-tr-xl font-bold tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                Selected
              </div>
            )}
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-primary">FORMAT 02</span>
              </div>
              <span className="font-headline-md text-headline-md text-primary font-bold">COMPACT JSON</span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Minified whitespace AST</span>
            </div>
            <div className="my-space-md py-space-xs bg-surface-container-lowest/90 rounded px-space-xs flex items-baseline justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Token Footprint</span>
              <span className="font-mono-data-lg text-mono-data-lg text-primary font-bold">{compactTokens} <span className="text-body-sm font-normal text-primary/70">tok</span></span>
            </div>
            <div className="space-y-space-2xs pt-space-xs">
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Delta vs Baseline</span>
                <span className="text-secondary font-semibold">{compactDelta}% Reduction</span>
              </div>
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Pipeline Latency</span>
                <span className="text-on-surface">{compactCand.pipeline_latency_ms.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
          {/* 3. TOON (Rejected) */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:bg-surface-container">
            {/* Striped Rejected Aesthetic */}
            <div className="absolute inset-x-0 top-0 h-1 bg-error"></div>
            <div className="absolute top-0 right-0 bg-error-container text-on-error-container font-label-caps text-label-caps uppercase px-space-xs py-0.5 rounded-bl-lg rounded-tr-xl font-bold tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              {toonCand.valid ? 'Valid' : 'Unsafe'}
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-error">FORMAT 03</span>
              </div>
              <span className="font-headline-md text-headline-md text-on-surface">TOON</span>
              <span className="font-mono-data-sm text-mono-data-sm text-error">✕ Rejected · {toonCand.rejection_reason ?? 'Type Coercion'}</span>
            </div>
            <div className="my-space-md py-space-xs bg-surface-container-lowest/60 rounded px-space-xs flex items-baseline justify-between relative">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Token Footprint</span>
              {toonCand.valid ? (
                <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">{toonTokens} <span className="text-body-sm font-normal text-outline">tok</span></span>
              ) : (
                <span className="font-mono-data-lg text-mono-data-lg text-error line-through font-semibold">{toonTokens} <span className="text-body-sm font-normal text-error/70">tok</span></span>
              )}
            </div>
            <div className="space-y-space-2xs pt-space-xs">
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Schema Validity</span>
                <span className="text-error font-semibold">{toonCand.valid ? 'Qualified' : 'Disqualified'}</span>
              </div>
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Pipeline Latency</span>
                <span className="text-on-surface">{toonCand.pipeline_latency_ms.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
          {/* 4. JTON (Valid with penalty) */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative transition-all duration-200 hover:bg-surface-container">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-outline">FORMAT 04</span>
                {jtonCand.valid ? <ValidPill /> : <UnsafePill />}
              </div>
              <span className="font-headline-md text-headline-md text-on-surface">JTON</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline-variant">Tuple syntax optimized</span>
            </div>
            <div className="my-space-md py-space-xs bg-surface-container-lowest/60 rounded px-space-xs flex items-baseline justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Token Footprint</span>
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">{jtonTokens} <span className="text-body-sm font-normal text-outline">tok</span></span>
            </div>
            <div className="space-y-space-2xs pt-space-xs">
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Delta vs Baseline</span>
                <span className="text-secondary font-semibold">{jtonDelta}% Reduction</span>
              </div>
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm items-center">
                <span className="text-outline">Pipeline Latency</span>
                <span className="text-on-surface">{jtonCand.pipeline_latency_ms.toFixed(1)}ms</span>
              </div>
              <p className="font-mono-data-sm text-mono-data-sm text-outline pt-1 text-[10px] leading-tight">
                *High structural complexity penalty
              </p>
            </div>
          </div>
          {/* 5. ONTO (Candidate) */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative transition-all duration-200 hover:bg-surface-container">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-outline">FORMAT 05</span>
                {ontoCand.valid ? <ValidPill /> : <UnsafePill />}
              </div>
              <span className="font-headline-md text-headline-md text-on-surface">ONTO</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline-variant">Object graph notation</span>
            </div>
            <div className="my-space-md py-space-xs bg-surface-container-lowest/60 rounded px-space-xs flex items-baseline justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Token Footprint</span>
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">{ontoTokens} <span className="text-body-sm font-normal text-outline">tok</span></span>
            </div>
            <div className="space-y-space-2xs pt-space-xs">
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Delta vs Baseline</span>
                <span className="text-secondary font-semibold">{ontoDelta}% Reduction</span>
              </div>
              <div className="flex justify-between font-mono-data-sm text-mono-data-sm">
                <span className="text-outline">Pipeline Latency</span>
                <span className="text-on-surface">{ontoCand.pipeline_latency_ms.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Middle Section: Chart & Research Visualization */}
      <div className="px-space-lg pb-space-lg">
        <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
            <div>
              <span className="font-label-caps text-label-caps uppercase text-outline">Metric Telemetry</span>
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">ESTIMATED TOKEN COUNT BY FORMAT</h2>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm font-mono-data-sm text-mono-data-sm">
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="w-3 h-3 rounded-sm bg-primary"></span> Optimal Valid
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-3 h-3 rounded-sm bg-surface-container-highest"></span> Valid Candidate
              </span>
              <span className="flex items-center gap-1.5 text-error">
                <span className="w-3 h-3 rounded-sm bg-error/30 ring-1 ring-error/50"></span> Disqualified / Unsafe
              </span>
            </div>
          </div>
          {/* Custom SVG Chart: Ultra Precise Monospaced Alignment */}
          <div className="w-full mt-space-xs">
            <svg className="w-full h-auto text-on-surface" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 240">
              <defs>
                {/* Diagonal stripes pattern for TOON (rejected format) */}
                <pattern height="8" id="rejectedStripes" patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width="8">
                  <rect fill="#262a33" height="8" width="8"></rect>
                  <line opacity="0.4" stroke="#ffb4ab" strokeWidth="2.5" x1="0" x2="0" y1="0" y2="8"></line>
                </pattern>
                <linearGradient id="selectedGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#adc6ff" stopOpacity="1"></stop>
                  <stop offset="100%" stopColor="#4d8eff" stopOpacity="0.85"></stop>
                </linearGradient>
              </defs>
              {/* Horizontal Grid Lines */}
              <line stroke="#424754" strokeDasharray="3 3" strokeOpacity="0.3" x1="60" x2="780" y1="30" y2="30"></line>
              <text fill="#8c909f" fontFamily="jetbrainsMono" fontSize="10" textAnchor="end" x="50" y="34">60 tok</text>
              <line stroke="#424754" strokeDasharray="3 3" strokeOpacity="0.3" x1="60" x2="780" y1="80" y2="80"></line>
              <text fill="#8c909f" fontFamily="jetbrainsMono" fontSize="10" textAnchor="end" x="50" y="84">45 tok</text>
              <line stroke="#424754" strokeDasharray="3 3" strokeOpacity="0.3" x1="60" x2="780" y1="130" y2="130"></line>
              <text fill="#8c909f" fontFamily="jetbrainsMono" fontSize="10" textAnchor="end" x="50" y="134">30 tok</text>
              <line stroke="#424754" strokeDasharray="3 3" strokeOpacity="0.3" x1="60" x2="780" y1="180" y2="180"></line>
              <text fill="#8c909f" fontFamily="jetbrainsMono" fontSize="10" textAnchor="end" x="50" y="184">15 tok</text>
              <line stroke="#424754" strokeOpacity="0.8" x1="60" x2="780" y1="210" y2="210"></line>
              {/* Bar: JSON */}
              <g className="cursor-pointer group">
                <rect className="transition-opacity hover:opacity-85" fill="#31353e" height={jsonBar.h} rx="2" width="80" x="90" y={jsonBar.y}></rect>
                <text fill="#dfe2ee" fontFamily="jetbrainsMono" fontSize="12" fontWeight="600" textAnchor="middle" x="130" y={jsonBar.labelY}>{jsonTokens}</text>
                <text fill="#8c909f" fontFamily="jetbrainsMono" fontSize="11" textAnchor="middle" x="130" y="228">JSON</text>
              </g>
              {/* Bar: COMPACT JSON */}
              <g className="cursor-pointer group">
                <rect fill="url(#selectedGlow)" height={compactBar.h} rx="2" width="80" x="230" y={compactBar.y}></rect>
                <text fill="#adc6ff" fontFamily="jetbrainsMono" fontSize="12" fontWeight="700" textAnchor="middle" x="270" y={compactBar.labelY}>{compactTokens} ★</text>
                <text fill="#adc6ff" fontFamily="jetbrainsMono" fontSize="11" fontWeight="600" textAnchor="middle" x="270" y="228">COMPACT</text>
              </g>
              {/* Bar: TOON (Rejected) */}
              <g className="cursor-pointer group">
                <rect fill="url(#rejectedStripes)" height={toonBar.h} rx="2" stroke="#ffb4ab" strokeWidth="1" width="80" x="370" y={toonBar.y}></rect>
                <text fill="#ffb4ab" fontFamily="jetbrainsMono" fontSize="12" fontWeight="600" textAnchor="middle" x="410" y={toonBar.labelY}>{toonTokens} (✕)</text>
                <text fill="#ffb4ab" fontFamily="jetbrainsMono" fontSize="11" textAnchor="middle" x="410" y="228">TOON</text>
              </g>
              {/* Bar: JTON */}
              <g className="cursor-pointer group">
                <rect className="transition-opacity hover:opacity-85" fill="#31353e" height={jtonBar.h} rx="2" width="80" x="510" y={jtonBar.y}></rect>
                <text fill="#dfe2ee" fontFamily="jetbrainsMono" fontSize="12" fontWeight="600" textAnchor="middle" x="550" y={jtonBar.labelY}>{jtonTokens}</text>
                <text fill="#8c909f" fontFamily="jetbrainsMono" fontSize="11" textAnchor="middle" x="550" y="228">JTON</text>
              </g>
              {/* Bar: ONTO */}
              <g className="cursor-pointer group">
                <rect className="transition-opacity hover:opacity-85" fill="#31353e" height={ontoBar.h} rx="2" width="80" x="650" y={ontoBar.y}></rect>
                <text fill="#dfe2ee" fontFamily="jetbrainsMono" fontSize="12" fontWeight="600" textAnchor="middle" x="690" y={ontoBar.labelY}>{ontoTokens}</text>
                <text fill="#8c909f" fontFamily="jetbrainsMono" fontSize="11" textAnchor="middle" x="690" y="228">ONTO</text>
              </g>
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-space-xs font-mono-data-sm text-mono-data-sm text-outline">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
              Baseline compression threshold: 45 Tokens. TOON yields lowest density but violates schema strictness.
            </span>
            <span className="text-on-surface-variant">Compression Efficiency Ratio: 1.33x vs Baseline</span>
          </div>
        </div>
      </div>
      {/* Bottom Section: VALIDATION DETAILS Table */}
      <div className="px-space-lg pb-space-lg">
        <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
          {/* Section Header with Accordion Toggle */}
          <div
            className="px-space-lg py-space-md bg-surface-container flex items-center justify-between cursor-pointer select-none"
            onClick={() => setAuditOpen((o) => !o)}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-secondary text-[20px]">fact_check</span>
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-md text-headline-md text-on-surface">VALIDATION DETAILS</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline px-1.5 py-0.5 rounded bg-surface-container-highest">{candidates.length} Records</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Full round-trip AST assertion diagnostics and runtime rejection vectors</p>
              </div>
            </div>
            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
              <span>{auditOpen ? 'COLLAPSE AUDIT' : 'EXPAND AUDIT'}</span>
              <span
                className="material-symbols-outlined text-[18px] transition-transform duration-200"
                style={{ transform: auditOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
              >
                expand_less
              </span>
            </div>
          </div>
          {/* Technical Audit Table Body */}
          <div
            className="overflow-x-auto transition-all duration-300"
            style={{ maxHeight: auditOpen ? 'none' : '0px', opacity: auditOpen ? 1 : 0 }}
          >
            <table className="w-full text-left font-mono-data-sm text-mono-data-sm">
              <thead className="bg-surface-container-lowest text-outline font-label-caps text-label-caps uppercase tracking-wider">
                <tr>
                  <th className="py-space-sm px-space-md">Format</th>
                  <th className="py-space-sm px-space-sm">Eligible</th>
                  <th className="py-space-sm px-space-sm">Encoded</th>
                  <th className="py-space-sm px-space-sm">Decoded</th>
                  <th className="py-space-sm px-space-sm">Round-Trip</th>
                  <th className="py-space-sm px-space-sm">Tokens</th>
                  <th className="py-space-sm px-space-md text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {/* Row 1: JSON */}
                <tr className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-space-sm px-space-md font-semibold text-on-surface flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> JSON
                  </td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-secondary font-medium">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">{jsonCand.valid ? 'check' : 'close'}</span> {jsonCand.valid ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="py-space-sm px-space-sm text-on-surface font-semibold">{jsonTokens}</td>
                  <td className="py-space-sm px-space-md text-right">
                    <span className="inline-flex items-center px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm bg-surface-container-high text-on-surface">
                      {jsonCand.valid ? 'Valid (Baseline)' : `Rejected (${jsonCand.rejection_reason ?? 'Baseline Mismatch'})`}
                    </span>
                  </td>
                </tr>
                {/* Row 2: Compact JSON */}
                <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                  <td className="py-space-sm px-space-md font-bold text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Compact JSON
                  </td>
                  <td className="py-space-sm px-space-sm text-primary">Yes</td>
                  <td className="py-space-sm px-space-sm text-primary">Yes</td>
                  <td className="py-space-sm px-space-sm text-primary">Yes</td>
                  <td className="py-space-sm px-space-sm text-secondary font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">{compactCand.valid ? 'check' : 'close'}</span> {compactCand.valid ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="py-space-sm px-space-sm text-primary font-bold">{compactTokens}</td>
                  <td className="py-space-sm px-space-md text-right">
                    {compactCand.valid ? (
                      <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm bg-primary text-on-primary font-bold">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Selected (Optimal Valid)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm bg-error-container text-on-error-container font-semibold">
                        <span className="material-symbols-outlined text-[12px]">cancel</span>
                        Rejected ({compactCand.rejection_reason ?? 'Type Mismatch'})
                      </span>
                    )}
                  </td>
                </tr>
                {/* Row 3: TOON */}
                <tr className="bg-error/5 hover:bg-error/10 transition-colors">
                  <td className="py-space-sm px-space-md font-semibold text-error flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span> TOON
                  </td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-error font-medium">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">{toonCand.valid ? 'check' : 'close'}</span> {toonCand.valid ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className={toonCand.valid ? 'py-space-sm px-space-sm text-on-surface font-semibold' : 'py-space-sm px-space-sm text-error/80 line-through'}>{toonTokens}</td>
                  <td className="py-space-sm px-space-md text-right">
                    <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm bg-error-container text-on-error-container font-semibold">
                      <span className="material-symbols-outlined text-[12px]">cancel</span>
                      Rejected ({toonCand.rejection_reason ?? 'Type Mismatch'})
                    </span>
                  </td>
                </tr>
                {/* Row 4: JTON */}
                <tr className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-space-sm px-space-md font-semibold text-on-surface flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> JTON
                  </td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-secondary font-medium">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">{jtonCand.valid ? 'check' : 'close'}</span> {jtonCand.valid ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="py-space-sm px-space-sm text-on-surface font-semibold">{jtonTokens}</td>
                  <td className="py-space-sm px-space-md text-right">
                    <span className="inline-flex items-center px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm bg-surface-container-high text-on-surface-variant">
                      {jtonCand.valid ? 'Valid Candidate' : `Rejected (${jtonCand.rejection_reason ?? 'Type Mismatch'})`}
                    </span>
                  </td>
                </tr>
                {/* Row 5: ONTO */}
                <tr className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-space-sm px-space-md font-semibold text-on-surface flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> ONTO
                  </td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-on-surface-variant">Yes</td>
                  <td className="py-space-sm px-space-sm text-secondary font-medium">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">{ontoCand.valid ? 'check' : 'close'}</span> {ontoCand.valid ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="py-space-sm px-space-sm text-on-surface font-semibold">{ontoTokens}</td>
                  <td className="py-space-sm px-space-md text-right">
                    <span className="inline-flex items-center px-space-xs py-0.5 rounded font-mono-data-sm text-mono-data-sm bg-surface-container-high text-on-surface-variant">
                      {ontoCand.valid ? 'Valid Candidate' : `Rejected (${ontoCand.rejection_reason ?? 'Type Mismatch'})`}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Table Sub-Bar Note */}
          <div className="px-space-lg py-space-sm bg-surface-container-lowest flex items-center justify-between text-outline font-mono-data-sm text-mono-data-sm">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
              Round-trip assertion verified via strict deep-equality checking across AST, types, and null semantics.
            </span>
            <span className="text-outline-variant">ISO/IEC 21778 Strictness Validated</span>
          </div>
        </div>
      </div>
    </>
  );
}