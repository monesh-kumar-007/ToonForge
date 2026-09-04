'use client';

import React, { useState, useEffect } from 'react';
import { profilePayload, ProfileResponse, StructuralProfile } from '@/lib/api';
import { StatusBadge } from '@/components/common/StatusBadge';

const SAMPLE_PAYLOADS: Record<string, { label: string; data: any }> = {
  flat: {
    label: 'Flat Tabular (Uniform Records)',
    data: [
      { record_id: 'rec_01', user_id: 'usr_100', action: 'login', region: 'us-east-1', latency_ms: 14.8, status: 200, cached: true },
      { record_id: 'rec_02', user_id: 'usr_101', action: 'query', region: 'us-west-2', latency_ms: 22.1, status: 200, cached: false },
      { record_id: 'rec_03', user_id: 'usr_102', action: 'update', region: 'eu-central-1', latency_ms: 45.0, status: 204, cached: false },
      { record_id: 'rec_04', user_id: 'usr_103', action: 'read', region: 'us-east-1', latency_ms: 8.5, status: 200, cached: true },
    ],
  },
  nested: {
    label: 'Nested Objects (Graph with Relational Keys)',
    data: {
      service: 'payment-gateway',
      version: '2.4.0',
      cluster: {
        region: 'us-east-1',
        nodes: 8,
        active_tls: true,
        metrics: { cpu_percent: 42.5, memory_mb: 4096, p99_latency_ms: 18.2 },
      },
      endpoints: [
        { path: '/v1/charge', method: 'POST', auth: 'bearer', rate_limit: 1000 },
        { path: '/v1/refund', method: 'POST', auth: 'bearer', rate_limit: 200 },
      ],
    },
  },
  deep: {
    label: 'Deep-Nested (Hierarchical Tree AST)',
    data: {
      id: 'root',
      level: 0,
      child: {
        id: 'node_1',
        level: 1,
        child: {
          id: 'node_2',
          level: 2,
          child: {
            id: 'node_3',
            level: 3,
            child: {
              id: 'node_4',
              level: 4,
              child: {
                id: 'leaf',
                level: 5,
                value: 42.0,
                valid: true,
              },
            },
          },
        },
      },
    },
  },
  hetero: {
    label: 'Heterogeneous (Mixed Variant Structures)',
    data: [
      { type: 'log', message: 'User signed in', code: 100 },
      { type: 'metric', val: 99.4, tags: ['prod', 'v2'] },
      { type: 'alert', active: true, priority: 'critical', note: null },
      { type: 'blob', raw_bytes: [12, 45, 88] },
    ],
  },
  scalar: {
    label: 'Small / Scalar-Dominated (Key-Value Pairs)',
    data: {
      api_key_valid: true,
      retry_count: 3,
      tenant_id: 'corp_alpha',
      rate_limit_remaining: 850,
      timestamp: 1729857492,
    },
  },
};

export default function AnalyzePage() {
  const [mode, setMode] = useState<'sample' | 'custom'>('sample');
  const [selectedKey, setSelectedKey] = useState<string>('flat');
  const [customJson, setCustomJson] = useState<string>('');
  const [profileResult, setProfileResult] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getActivePayload = () => {
    if (mode === 'sample') {
      return SAMPLE_PAYLOADS[selectedKey].data;
    }
    try {
      return JSON.parse(customJson);
    } catch (e) {
      throw new Error('Invalid JSON input syntax');
    }
  };

  const handleRunProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = getActivePayload();
      const res = await profilePayload(payload);
      setProfileResult(res);
    } catch (err: any) {
      setError(err.message || 'Profiling failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunProfile();
  }, [selectedKey, mode]);

  const p: StructuralProfile | undefined = profileResult?.profile;

  return (
    <div className="flex flex-col w-full pb-16 px-8 pt-8">
      {/* Top Header Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-outline-variant/20 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-secondary bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30 font-semibold">
              Module 02 // Structural Inspection
            </span>
            <span className="font-mono text-xs text-outline">AST_PARSER_ACTIVE</span>
          </div>
          <h1 className="font-headline text-2xl text-on-surface font-bold tracking-tight">
            Payload Analysis
          </h1>
          <p className="font-sans text-xs text-on-surface-variant max-w-2xl leading-relaxed">
            Inspect the structural topology, depth hierarchy, and recurring schema signatures
            before committing downstream serialization pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (p) {
                const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ast_profile_${selectedKey}.json`;
                a.click();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded border border-outline-variant/40 transition-colors font-mono text-xs uppercase"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
            Export AST
          </button>
          <button
            onClick={handleRunProfile}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded shadow-md transition-all font-mono text-xs uppercase font-semibold cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">sync_alt</span>
            {loading ? 'Profiling...' : 'Run Structure Profiler'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded bg-error-container/20 border border-error/40 text-error font-mono text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code / Input Area (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden shadow-xl">
          {/* Header Bar with Tabs */}
          <div className="h-12 bg-surface-container-lowest px-4 border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">terminal</span>
              <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-semibold">
                INPUT STRUCTURED DATA
              </span>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center bg-surface-container-high p-0.5 rounded border border-outline-variant/30">
              <button
                onClick={() => setMode('sample')}
                className={`px-3 py-1 rounded font-mono text-xs transition-all ${
                  mode === 'sample'
                    ? 'bg-surface-container-low text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sample Payload
              </button>
              <button
                onClick={() => {
                  setMode('custom');
                  if (!customJson) {
                    setCustomJson(JSON.stringify(SAMPLE_PAYLOADS[selectedKey].data, null, 2));
                  }
                }}
                className={`px-3 py-1 rounded font-mono text-xs transition-all ${
                  mode === 'custom'
                    ? 'bg-surface-container-low text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Custom Input
              </button>
            </div>
          </div>

          {/* Sample Selector Ribbon */}
          {mode === 'sample' ? (
            <div className="px-4 py-2 bg-surface-container-low/60 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
                  Archetype:
                </span>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="bg-surface-container-lowest text-on-surface font-mono text-xs px-2 py-1 rounded border border-outline-variant/40 focus:border-primary focus:outline-none cursor-pointer"
                >
                  {Object.entries(SAMPLE_PAYLOADS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="font-mono text-xs text-outline">
                Archetype:{' '}
                <strong className="text-secondary font-semibold">
                  {profileResult?.archetype_label || 'Tabular'}
                </strong>
              </span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-surface-container-low/60 border-b border-outline-variant/20 flex items-center justify-between text-xs font-mono text-outline">
              <span>Paste valid JSON to inspect structure in real-time</span>
              <button
                onClick={() => setCustomJson(JSON.stringify(SAMPLE_PAYLOADS[selectedKey].data, null, 2))}
                className="text-secondary hover:underline cursor-pointer"
              >
                Load {selectedKey} sample
              </button>
            </div>
          )}

          {/* Code Viewer / Textarea */}
          <div className="p-4 bg-surface-container-lowest font-mono text-xs overflow-auto min-h-[440px] max-h-[520px]">
            {mode === 'sample' ? (
              <pre className="text-on-surface whitespace-pre leading-relaxed">
                {JSON.stringify(SAMPLE_PAYLOADS[selectedKey].data, null, 2)}
              </pre>
            ) : (
              <textarea
                value={customJson}
                onChange={(e) => setCustomJson(e.target.value)}
                className="w-full h-full min-h-[400px] bg-transparent text-on-surface font-mono text-xs resize-none outline-none focus:ring-0 leading-relaxed"
                placeholder="Paste JSON here..."
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Right Column: 19-Dimensional Profile Display (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Classification Banner */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                ARCHETYPE CLASSIFICATION
              </span>
              <StatusBadge status={p?.is_tabular ? 'OPTIMAL' : 'STABLE'} label={profileResult?.archetype_label || 'Standard'} />
            </div>
            <h3 className="font-headline text-xl font-bold text-on-surface mb-2">
              {profileResult?.archetype_label || 'Uniform Tabular Record Set'}
            </h3>
            <div className="space-y-1.5 mt-3 pt-3 border-t border-outline-variant/20 font-mono text-xs">
              {profileResult?.routing_signals.map((sig, idx) => (
                <div key={idx} className="flex items-start gap-2 text-on-surface-variant">
                  <span className="text-secondary font-bold">›</span>
                  <span>{sig.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md flex flex-col gap-4">
            <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-semibold">
              TOPOLOGICAL AST METRICS
            </span>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Top-Level Type</span>
                <span className="text-primary font-bold text-sm uppercase">
                  {p?.top_level_type || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Max Depth</span>
                <span className="text-secondary font-bold text-sm">
                  {p?.max_depth !== undefined ? `${p.max_depth} lvls` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Total Nodes</span>
                <span className="text-on-surface font-bold text-sm">{p?.node_count || 0}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Record Count</span>
                <span className="text-on-surface font-bold text-sm">{p?.record_count || 0}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Schema Uniformity</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {p?.schema_uniformity !== undefined ? `${(p.schema_uniformity * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Key Repetition</span>
                <span className="text-tertiary font-bold text-sm">
                  {p?.key_repetition_ratio !== undefined ? `${p.key_repetition_ratio.toFixed(2)}x` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Tabular Score</span>
                <span className="text-secondary font-bold text-sm">
                  {p?.tabular_score !== undefined ? `${(p.tabular_score * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-outline text-[10px] block uppercase">Estimated Savings</span>
                <span className="text-primary font-bold text-sm">
                  {p?.estimated_savings_vs_json !== undefined ? `~${p.estimated_savings_vs_json.toFixed(0)}%` : '—'}
                </span>
              </div>
            </div>

            {/* Primitive Type Ratios */}
            <div className="pt-2 border-t border-outline-variant/20">
              <span className="font-mono text-[10px] text-outline uppercase block mb-2 font-semibold">
                Primitive Distribution
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-variant">Strings:</span>
                  <span className="text-on-surface font-semibold">
                    {p ? `${(p.string_ratio * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-variant">Numbers:</span>
                  <span className="text-on-surface font-semibold">
                    {p ? `${(p.number_ratio * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-variant">Booleans:</span>
                  <span className="text-on-surface font-semibold">
                    {p ? `${(p.bool_ratio * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-variant">Nulls:</span>
                  <span className="text-on-surface font-semibold">
                    {p ? `${(p.null_ratio * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
