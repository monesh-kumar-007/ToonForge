'use client';

import React, { useState, useEffect } from 'react';
import { routePayload, RouteResponse, CandidateResult } from '@/lib/api';
import { StatusBadge } from '@/components/common/StatusBadge';

const COMPARE_SAMPLES: Record<string, { label: string; payload: any }> = {
  uniform_table: {
    label: 'Flat Uniform Table (Telemetry)',
    payload: [
      { id: 'REC_101', name: 'Alice', score: 98.5, active: true },
      { id: 'REC_102', name: 'Bob', score: 87.0, active: false },
      { id: 'REC_103', name: 'Charlie', score: 92.4, active: true },
    ],
  },
  numeric_strings: {
    label: 'Numeric String ("00123" Safety Trap)',
    payload: [
      { code: '00123', zip: '02138', rate: '0.50' },
      { code: '00789', zip: '90210', rate: '1.00' },
    ],
  },
  nested_objects: {
    label: 'Nested Sub-Objects & Configuration',
    payload: {
      service: 'auth-v2',
      port: 8080,
      config: { tls: true, timeout: 3000, hosts: ['h1', 'h2'] },
      meta: { owner: 'ops', env: 'production' },
    },
  },
  deep_hierarchy: {
    label: 'Deep-Nested Tree (Depth 4)',
    payload: {
      root: true,
      branch: {
        level: 1,
        branch: {
          level: 2,
          branch: {
            level: 3,
            leaf: 'target_value',
          },
        },
      },
    },
  },
};

export default function FormatComparisonPage() {
  const [selectedKey, setSelectedKey] = useState<string>('uniform_table');
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [activeFormat, setActiveFormat] = useState<string>('JSON');
  const [loading, setLoading] = useState<boolean>(false);

  const runComparison = async (key: string) => {
    setLoading(true);
    try {
      const data = await routePayload(COMPARE_SAMPLES[key].payload);
      setRouteData(data);
      if (data.selected_format) {
        setActiveFormat(data.selected_format);
      }
    } catch (err) {
      console.error('Comparison route error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison(selectedKey);
  }, [selectedKey]);

  const candidates = routeData?.candidates || [];
  const selectedCandidate = candidates.find((c) => c.format_id === activeFormat);

  return (
    <div className="flex flex-col w-full pb-16 px-8 pt-8 max-w-7xl mx-auto space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-secondary tracking-widest font-semibold">
              STRUCTURAL SERIALIZATION SUITE
            </span>
            <span className="text-outline-variant font-mono text-xs">/</span>
            <span className="font-mono text-xs text-outline">EVAL_ID: 0x9F41C</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
            Serialization Format Comparison
          </h1>
          <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
            Compare token efficiency, structural compression delta, and strict round-trip validity
            across all 5 supported representations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">
            <span className="font-mono text-[10px] text-outline uppercase">Sample:</span>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="bg-surface-container-lowest text-on-surface font-mono text-xs px-2 py-0.5 rounded border border-outline-variant/40 focus:border-primary focus:outline-none cursor-pointer"
            >
              {Object.entries(COMPARE_SAMPLES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => runComparison(selectedKey)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded font-mono text-xs uppercase font-semibold hover:bg-primary-container transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            {loading ? 'Evaluating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Crucial Insight Principle Box */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-secondary border border-outline-variant/30">
            <span className="material-symbols-outlined text-[20px]">lightbulb</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-secondary font-bold tracking-wider">
                Crucial Theoretical Insight
              </span>
              <span className="font-mono text-[10px] text-outline">SAFETY_FIRST_PRINCIPLE</span>
            </div>
            <p className="font-sans text-xs text-on-surface mt-0.5">
              <strong className="font-semibold">Smaller Does Not Automatically Mean Better.</strong>{' '}
              Only valid candidates participate in final selection. Structural entropy or type
              coercion will fatally corrupt downstream context ingestion.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 rounded font-mono text-xs text-outline shrink-0 border border-outline-variant/20">
          <span className="material-symbols-outlined text-[15px] text-secondary">rule</span>
          <span>
            {routeData?.valid_candidates.length || 0}/5 Sound Candidates
          </span>
        </div>
      </div>

      {/* 5-Column Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {candidates.map((cand, idx) => {
          const isSelected = cand.format_id === routeData?.selected_format;
          const isCurrentViewer = cand.format_id === activeFormat;
          const jsonBaseline = routeData?.json_token_baseline || 1;
          const candTokens = cand.estimated_tokens || jsonBaseline;
          const deltaPct = ((jsonBaseline - candTokens) / jsonBaseline) * 100;

          return (
            <div
              key={cand.format_id}
              onClick={() => setActiveFormat(cand.format_id)}
              className={`p-4 rounded-xl flex flex-col justify-between gap-3 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface-container-high border-primary ring-1 ring-primary shadow-lg'
                  : isCurrentViewer
                  ? 'bg-surface-container-low border-secondary'
                  : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-outline uppercase font-semibold">
                    FORMAT 0{idx + 1}
                  </span>
                  <StatusBadge
                    status={isSelected ? 'SELECTED' : cand.valid ? 'VALID' : cand.status}
                    size="sm"
                  />
                </div>
                <h3 className="font-headline text-base font-bold text-on-surface">
                  {cand.format_id}
                </h3>
              </div>

              {/* Token Footprint */}
              <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/15 flex items-baseline justify-between font-mono">
                <span className="text-outline text-[11px]">Footprint</span>
                {cand.valid ? (
                  <span className="text-on-surface font-bold text-sm">
                    {cand.estimated_tokens}{' '}
                    <span className="text-[10px] text-outline font-normal">tok</span>
                  </span>
                ) : (
                  <span className="text-rose-400 line-through text-xs font-semibold">
                    {cand.estimated_tokens || '—'} tok
                  </span>
                )}
              </div>

              {/* Delta and Latency */}
              <div className="space-y-1 font-mono text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-outline">Delta vs JSON:</span>
                  <span
                    className={`font-semibold ${
                      cand.valid
                        ? deltaPct > 0
                          ? 'text-secondary'
                          : 'text-outline'
                        : 'text-rose-400'
                    }`}
                  >
                    {cand.valid ? `${deltaPct > 0 ? '-' : ''}${Math.abs(deltaPct).toFixed(1)}%` : 'Disqualified'}
                  </span>
                </div>
                <div className="flex justify-between text-outline">
                  <span>Latency:</span>
                  <span className="text-on-surface">{cand.pipeline_latency_ms.toFixed(2)} ms</span>
                </div>
              </div>

              {cand.rejection_reason && (
                <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[10px] leading-tight">
                  {cand.rejection_reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Stream Inspector */}
      {selectedCandidate && (
        <section className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                code
              </span>
              <h3 className="font-headline text-base font-semibold text-on-surface">
                Encoded Stream Inspector: <span className="text-primary">{activeFormat}</span>
              </h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <StatusBadge status={selectedCandidate.valid ? 'VALID' : selectedCandidate.status} />
              <button
                onClick={() => {
                  if (selectedCandidate.encoded) {
                    navigator.clipboard.writeText(selectedCandidate.encoded);
                  }
                }}
                className="text-secondary hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy Stream
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 font-mono text-xs text-on-surface overflow-auto max-h-[350px] leading-relaxed whitespace-pre">
            {selectedCandidate.encoded || `[Format Ineligible: ${selectedCandidate.rejection_reason || 'Not applicable'}]`}
          </pre>
        </section>
      )}
    </div>
  );
}
