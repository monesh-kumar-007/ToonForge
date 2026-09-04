'use client';

import React, { useState, useEffect } from 'react';
import { routePayload, RouteResponse } from '@/lib/api';
import { StatusBadge } from '@/components/common/StatusBadge';

const ARCHETYPES: Record<string, { name: string; data: any }> = {
  flat_metrics: {
    name: 'Flat Tabular (Uniform Telemetry)',
    data: [
      { id: 'REC_101', user_id: 'usr_8820', action: 'compile', latency_ms: 14.8, status: 200, cached: true },
      { id: 'REC_102', user_id: 'usr_8821', action: 'inference', latency_ms: 22.4, status: 200, cached: false },
      { id: 'REC_103', user_id: 'usr_8822', action: 'query', latency_ms: 9.1, status: 200, cached: true },
      { id: 'REC_104', user_id: 'usr_8823', action: 'sync', latency_ms: 88.0, status: 201, cached: false },
    ],
  },
  adversarial_numeric: {
    name: 'Adversarial: Numeric String ("00123")',
    data: [
      { code: '00123', zip: '02138', rate: '0.50' },
      { code: '00456', zip: '90210', rate: '1.00' },
    ],
  },
  nested_config: {
    name: 'Nested Configuration Tree',
    data: {
      model: 'deepseek-coder',
      parameters: { temperature: 0.2, max_tokens: 4096, stream: true },
      clusters: [{ id: 'c1', active: true }, { id: 'c2', active: false }],
    },
  },
  deep_tree: {
    name: 'Deep-Nested Parent-Child (Depth 5)',
    data: {
      node: 'root',
      child: {
        node: 'lvl_1',
        child: {
          node: 'lvl_2',
          child: {
            node: 'lvl_3',
            child: {
              node: 'leaf',
              val: 42,
            },
          },
        },
      },
    },
  },
};

export default function AdaptiveRouterPage() {
  const [selectedArchetype, setSelectedArchetype] = useState<string>('flat_metrics');
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'serialized' | 'candidates'>('serialized');

  const executeRoute = async (archetypeKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = ARCHETYPES[archetypeKey].data;
      const res = await routePayload(payload);
      setRouteData(res);
    } catch (err: any) {
      setError(err.message || 'Routing failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeRoute(selectedArchetype);
  }, [selectedArchetype]);

  const p = routeData?.profile;

  return (
    <div className="flex flex-col w-full pb-16 px-8 pt-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-semibold">
              INFERENCE EXECUTION PIPELINE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
            <span className="font-mono text-xs text-outline">
              Latency: {routeData?.routing_latency_ms.toFixed(2) || '—'} ms
            </span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
            Adaptive Routing Decision Pipeline
          </h1>
          <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
            Exhaustively evaluates candidate representations while enforcing strict semantic isomorphism.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">
            <span className="font-mono text-[10px] text-outline uppercase">Archetype:</span>
            <select
              value={selectedArchetype}
              onChange={(e) => setSelectedArchetype(e.target.value)}
              className="bg-surface-container-lowest text-on-surface font-mono text-xs px-2 py-0.5 rounded border border-outline-variant/40 focus:border-primary focus:outline-none cursor-pointer"
            >
              {Object.entries(ARCHETYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => executeRoute(selectedArchetype)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary rounded font-mono text-xs uppercase font-semibold hover:bg-primary-container transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            {loading ? 'Evaluating...' : 'Re-Evaluate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-error-container/20 border border-error/40 text-error font-mono text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 01: Structural Profile Summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary text-on-primary font-bold">
              STEP 01
            </span>
            <span className="font-headline text-base text-on-surface font-semibold">
              Structural Profile Ingestion
            </span>
          </div>
          <span className="font-mono text-xs text-outline">Deterministic AST Topology</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-outline uppercase font-semibold">
              Data Archetype
            </span>
            <span className="font-headline text-base text-secondary font-bold truncate">
              {p?.top_level_type === 'array' ? 'Array of Objects' : p?.top_level_type || '—'}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              {p?.is_tabular ? 'Tabular Uniform Recordset' : 'Hierarchical Graph'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-outline uppercase font-semibold">Volume</span>
            <span className="font-headline text-xl text-on-surface font-bold">
              {p?.record_count || p?.node_count || 0}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              {p?.record_count ? 'records batch' : 'total AST nodes'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-outline uppercase font-semibold">
              Homogeneity
            </span>
            <span className="font-headline text-xl text-primary font-bold">
              {p ? `${(p.schema_uniformity * 100).toFixed(0)}%` : '—'}
            </span>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${(p?.schema_uniformity || 0) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-outline uppercase font-semibold">
              Nesting Depth
            </span>
            <span className="font-headline text-xl text-tertiary font-bold">
              {p?.max_depth || 0} lvls
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              {p && p.max_depth >= 3 ? 'Deep nesting active' : 'Shallow hierarchy'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-outline uppercase font-semibold">
              Key Repetition
            </span>
            <span className="font-headline text-base text-secondary-fixed font-bold">
              {p ? `${p.key_repetition_ratio.toFixed(2)}x` : '—'}
            </span>
            <span className="font-mono text-[10px] text-secondary">
              {p && p.key_repetition_ratio >= 1.5 ? 'Key Hoisting Viable' : 'Key Set Sparse'}
            </span>
          </div>
        </div>
      </section>

      {/* Step 02: Candidate Results Matrix */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary text-on-primary font-bold">
              STEP 02 & 03
            </span>
            <span className="font-headline text-base text-on-surface font-semibold">
              Speculative Execution & Strict Validation
            </span>
          </div>
          <span className="font-mono text-xs text-secondary">
            {routeData?.valid_candidates.length || 0} of 5 Candidates Passed Soundness
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {routeData?.candidates.map((cand) => {
            const isWinner = routeData.selected_format === cand.format_id;
            return (
              <div
                key={cand.format_id}
                className={`p-4 rounded-xl flex flex-col justify-between gap-3 border transition-all ${
                  isWinner
                    ? 'bg-surface-container-high border-secondary ring-1 ring-secondary shadow-lg'
                    : 'bg-surface-container-low border-outline-variant/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-headline text-sm font-bold text-on-surface">
                      {cand.format_id}
                    </span>
                    <StatusBadge
                      status={cand.valid ? (isWinner ? 'SELECTED' : 'VALID') : cand.status}
                      size="sm"
                    />
                  </div>

                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-outline">
                      <span>Tokens:</span>
                      <span className="text-on-surface font-bold">
                        {cand.estimated_tokens !== null ? cand.estimated_tokens : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-outline">
                      <span>Latency:</span>
                      <span className="text-on-surface">
                        {cand.pipeline_latency_ms.toFixed(2)} ms
                      </span>
                    </div>
                  </div>
                </div>

                {cand.rejection_reason && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[10px] leading-tight">
                    {cand.rejection_reason}
                  </div>
                )}
                {isWinner && (
                  <div className="p-1.5 rounded bg-secondary/10 border border-secondary/30 text-secondary font-mono text-[10px] text-center font-bold uppercase">
                    ★ Optimal Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 04: Token Footprint & Winner Resolution */}
      {routeData && (
        <section className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
            <div>
              <span className="font-mono text-[10px] text-secondary uppercase font-bold tracking-widest">
                FINAL ROUTING DECISION
              </span>
              <h2 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-3">
                Selected Format: <span className="text-primary">{routeData.selected_format}</span>
                <StatusBadge status="SELECTED" />
              </h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="text-right">
                <span className="text-outline block text-[10px] uppercase">Token Reduction</span>
                <span className="text-emerald-400 font-bold text-lg">
                  -{routeData.token_savings_vs_json?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-outline block text-[10px] uppercase">Token Count</span>
                <span className="text-primary font-bold text-lg">
                  {routeData.token_counts[routeData.selected_format || ''] || '—'} tkn
                </span>
              </div>
            </div>
          </div>

          {/* Serialized Content Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-outline uppercase font-semibold">
                Serialized Output Stream ({routeData.selected_format})
              </span>
              <button
                onClick={() => {
                  if (routeData.serialized_output) {
                    navigator.clipboard.writeText(routeData.serialized_output);
                  }
                }}
                className="font-mono text-xs text-secondary hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy Stream
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 font-mono text-xs text-on-surface overflow-auto max-h-[300px] leading-relaxed whitespace-pre">
              {routeData.serialized_output || 'No output'}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
