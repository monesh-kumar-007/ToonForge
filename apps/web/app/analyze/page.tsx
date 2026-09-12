'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { profilePayload, ProfileResponse, StructuralProfile } from '@/lib/api';
import ApiErrorBanner from '@/components/ApiErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';

interface Preset {
  type: string;
  records: string;
  depth: string;
  uniformity: string;
  keyRep: string;
  uniqueKeys: string;
  size: string;
  tokens: string;
  code: string;
}

const payloadPresets: Record<string, Preset> = {
  flat: {
    type: 'Array',
    records: '24',
    depth: '4',
    uniformity: '82%',
    keyRep: 'High (0.88)',
    uniqueKeys: '12',
    size: '3.84 KB',
    tokens: '~942 tkn',
    code: `[
  {
    "record_id": "rec_01J98X4L",
    "user_id": "usr_88201a",
    "timestamp": 1729857492104,
    "action": "kernel_serialization_compile",
    "metrics": {
      "duration_ms": 14.82,
      "throughput_rps": 3890.1,
      "cache_hit": true
    },
    "metadata": {
      "env": "cluster-us-east-4",
      "tags": ["ast", "v2_prod"]
    }
  },
  {
    "record_id": "rec_01J98X5B",
    "user_id": "usr_88201a",
    "timestamp": 1729857493215,
    "action": "kernel_serialization_compile",
    "metrics": {
      "duration_ms": 13.11,
      "throughput_rps": 4102.5,
      "cache_hit": true
    },
    "metadata": {
      "env": "cluster-us-east-4",
      "tags": ["ast"]
    }
  }
]`,
  },
  nested: {
    type: 'Object',
    records: '8',
    depth: '6',
    uniformity: '64%',
    keyRep: 'Medium (0.52)',
    uniqueKeys: '29',
    size: '5.12 KB',
    tokens: '~1,240 tkn',
    code: `{
  "graph_id": "grp_alpha_9",
  "revision": 3,
  "root_nodes": [
    {
      "node_id": "node_eval_01",
      "context": {
        "model_ref": "ace-learned-v2",
        "parameters": {
          "temperature": 0.2,
          "top_p": 0.95,
          "fallback": "json_strict"
        }
      },
      "dependencies": ["node_eval_00"]
    }
  ]
}`,
  },
  deep: {
    type: 'Object',
    records: '1',
    depth: '9',
    uniformity: '45%',
    keyRep: 'Low (0.31)',
    uniqueKeys: '34',
    size: '7.80 KB',
    tokens: '~1,980 tkn',
    code: `{
  "ast": {
    "kind": "Program",
    "body": [{
      "kind": "FunctionDeclaration",
      "id": {"kind": "Identifier", "name": "serializePayload"},
      "body": {
        "kind": "BlockStatement",
        "body": [{
          "kind": "ReturnStatement",
          "argument": {"kind": "CallExpression", "callee": "hoistKeys"}
        }]
      }
    }]
  }
}`,
  },
  hetero: {
    type: 'Array',
    records: '40',
    depth: '3',
    uniformity: '31%',
    keyRep: 'Low (0.24)',
    uniqueKeys: '48',
    size: '6.45 KB',
    tokens: '~1,610 tkn',
    code: `[
  { "event": "click", "target": "btn_analyze", "ts": 1729858000 },
  { "event": "telemetry", "sys": { "load": 0.44, "mem_mb": 1024 }, "err": null },
  { "event": "mutation", "delta": "+4 bytes", "schema_id": "v1.2" },
  { "event": "custom", "payload_blob": "0x7F4A0B" }
]`,
  },
  scalar: {
    type: 'Object',
    records: '18',
    depth: '1',
    uniformity: '95%',
    keyRep: 'None (0.05)',
    uniqueKeys: '18',
    size: '1.10 KB',
    tokens: '~260 tkn',
    code: `{
  "max_tokens": 8192,
  "temperature": 0.1,
  "stream": true,
  "enable_caching": true,
  "quantization": "fp16",
  "context_reserve": 1024,
  "safety_tier": "permissive",
  "shard_count": 8
}`,
  },
};

const TAB_SAMPLE_ACTIVE = 'px-space-sm py-1 rounded bg-surface-container-low text-primary font-mono-data-sm text-mono-data-sm font-medium transition-all shadow-sm';
const TAB_INACTIVE = 'px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface font-mono-data-sm text-mono-data-sm transition-all';

function formatKeyRep(ratio: number): string {
  if (ratio >= 0.7) return `High (${ratio.toFixed(2)})`;
  if (ratio >= 0.3) return `Medium (${ratio.toFixed(2)})`;
  return `Low (${ratio.toFixed(2)})`;
}

export default function AnalyzePage() {
  const [selectedPreset, setSelectedPreset] = useState('flat');
  const [activeTab, setActiveTab] = useState<'sample' | 'custom'>('sample');
  const [customCode, setCustomCode] = useState('');
  const [isProfiling, setIsProfiling] = useState(false);
  const [flashLabel, setFlashLabel] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mTopLevel, setMTopLevel] = useState(payloadPresets.flat.type);
  const [mRecords, setMRecords] = useState(payloadPresets.flat.records);
  const [mDepth, setMDepth] = useState(payloadPresets.flat.depth);
  const [mUniformity, setMUniformity] = useState(payloadPresets.flat.uniformity);
  const [mKeyRep, setMKeyRep] = useState(payloadPresets.flat.keyRep);
  const [mUniqueKeys, setMUniqueKeys] = useState(payloadPresets.flat.uniqueKeys);
  const [mSize, setMSize] = useState(payloadPresets.flat.size);
  const [mTokens, setMTokens] = useState(payloadPresets.flat.tokens);
  const [mSavings, setMSavings] = useState('41.2% v JSON');
  const [mEntropy, setMEntropy] = useState('1.41 bits/key');
  const [mArchetype, setMArchetype] = useState('');
  const [mSignals, setMSignals] = useState<{ signal: string; description: string; value?: string }[]>([]);
  const [liveResponse, setLiveResponse] = useState<ProfileResponse | null>(null);
  const [profileDetails, setProfileDetails] = useState<StructuralProfile | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const preset = payloadPresets[selectedPreset] || payloadPresets.flat;
  const currentCode = activeTab === 'custom' && customCode ? customCode : preset.code;

  const profileState = liveResponse
    ? 'live'
    : isProfiling
    ? 'loading'
    : apiError
    ? 'error'
    : 'idle';

  const profileStateLabel = (() => {
    if (profileState === 'live') return 'Live profile';
    if (profileState === 'loading') return 'Profiling…';
    if (profileState === 'error') return 'API unavailable — showing sample values';
    return 'Awaiting profile · sample preset shown';
  })();

  const profileAnnotation =
    profileState === 'idle'
      ? 'Sample preset preview — not measured. Run the profiler for live values.'
      : profileState === 'error'
      ? 'API unavailable — values below are from the sample preset, not measured.'
      : null;

  const handlePresetChange = useCallback((key: string) => {
    setSelectedPreset(key);
    const p = payloadPresets[key] || payloadPresets.flat;
    setMTopLevel(p.type);
    setMRecords(p.records);
    setMDepth(p.depth);
    setMUniformity(p.uniformity);
    setMKeyRep(p.keyRep);
    setMUniqueKeys(p.uniqueKeys);
    setMSize(p.size);
    setMTokens(p.tokens);
    setLiveResponse(null);
    setProfileDetails(null);
    setMSignals([]);
    setMArchetype('');
    setApiError(null);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedPreset('flat');
    setCustomCode('');
    setActiveTab('sample');
    setLiveResponse(null);
    setProfileDetails(null);
    setMSignals([]);
    setMArchetype('');
    setApiError(null);
    handlePresetChange('flat');
  }, [handlePresetChange]);

  const runAnalysis = useCallback(async () => {
    if (isProfiling) return;
    setApiError(null);
    setLiveResponse(null);
    setProfileDetails(null);
    setIsProfiling(true);

    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (flashTimer2.current) clearTimeout(flashTimer2.current);

    try {
      const parsed = JSON.parse(currentCode);
      setFlashLabel('PROFILING...');
      const res = await profilePayload(parsed);

      setMTopLevel(res.profile.top_level_type);
      setMRecords(String(res.profile.record_count));
      setMDepth(String(res.profile.max_depth));
      setMUniformity(`${(res.profile.schema_uniformity * 100).toFixed(0)}%`);
      setMKeyRep(formatKeyRep(res.profile.key_repetition_ratio));
      setMUniqueKeys(String(res.profile.unique_key_count));
      setMSavings(`${(res.profile.estimated_savings_vs_json * 100).toFixed(1)}% v JSON`);
      setMEntropy(`${res.profile.key_entropy_bits_per_key.toFixed(2)} bits/key`);
      setMArchetype(res.archetype_label);
      setMSignals(res.routing_signals);
      setProfileDetails(res.profile);
      setLiveResponse(res);

      flashTimer.current = setTimeout(() => setFlashLabel('SIGNALS UPDATED'), 0);
      flashTimer2.current = setTimeout(() => setFlashLabel(null), 900);
    } catch (err) {
      setFlashLabel(null);
      const p = payloadPresets[selectedPreset] || payloadPresets.flat;
      setMTopLevel(p.type);
      setMRecords(p.records);
      setMDepth(p.depth);
      setMUniformity(p.uniformity);
      setMKeyRep(p.keyRep);
      setMUniqueKeys(p.uniqueKeys);
      setMSize(p.size);
      setMTokens(p.tokens);
      setMSavings('41.2% v JSON');
      setMEntropy('1.41 bits/key');
      setMArchetype('');
      setMSignals([]);
      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    } finally {
      setIsProfiling(false);
    }
  }, [currentCode, isProfiling, selectedPreset]);

  const handleExportAst = useCallback(() => {
    const data = liveResponse ?? {
      node_type: mTopLevel,
      records: parseInt(mRecords),
      max_depth: parseInt(mDepth),
      uniformity_score: mUniformity,
      signals: mSignals.map((s) => s.signal),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ace_ast_profile.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [liveResponse, mTopLevel, mRecords, mDepth, mUniformity, mSignals]);

  const lineNumbers = Array.from(
    { length: Math.max(currentCode.split('\n').length, 28) },
    (_, i) => i + 1
  );

  return (
    <div className="px-space-xl py-space-lg flex flex-col gap-space-lg">
      <ApiErrorBanner
        message={apiError}
        onDismiss={() => setApiError(null)}
      />
      {/* Top Action & Overview Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
        <div className="flex flex-col gap-space-3xs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps uppercase text-secondary bg-surface-container-high px-space-xs py-0.5 rounded border border-outline-variant/30">
              Module 02 // Structural Inspection
            </span>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">AST_PARSER_ACTIVE</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Payload Analysis</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Inspect the structural topology, depth hierarchy, and recurring schema signatures before committing downstream serialization pipelines.
          </p>
        </div>
        <div className="flex items-center gap-space-xs shrink-0">
          <button
            className="flex items-center gap-space-2xs px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface rounded border border-outline-variant/40 transition-colors font-label-caps text-label-caps uppercase tracking-wider"
            onClick={handleExportAst}
            title="Export the current profile as a JSON artifact"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
            Export AST (.json)
          </button>
          <button
            className="flex items-center gap-space-2xs px-space-md py-space-xs bg-primary text-on-primary hover:bg-primary-fixed-dim rounded shadow-md transition-all font-label-caps text-label-caps uppercase font-semibold tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={runAnalysis}
            disabled={isProfiling}
          >
            <span className="material-symbols-outlined text-[16px]">{isProfiling ? 'refresh' : 'sync_alt'}</span>
            {isProfiling ? 'Profiling…' : 'Run Structure Profiler'}
          </button>
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT WORKSPACE: Input Structured Data (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden shadow-xl">
          {/* Header Bar with Integrated Tabs */}
          <div className="h-12 bg-surface-container-lowest px-space-md border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px] text-secondary">terminal</span>
              <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                INPUT STRUCTURED DATA
              </span>
            </div>
            <div className="flex items-center bg-surface-container-high p-0.5 rounded border border-outline-variant/30">
              <button
                className={activeTab === 'sample' ? TAB_SAMPLE_ACTIVE : TAB_INACTIVE}
                onClick={() => setActiveTab('sample')}
              >
                Sample Payload
              </button>
              <button
                className={activeTab === 'custom' ? TAB_SAMPLE_ACTIVE : TAB_INACTIVE}
                onClick={() => setActiveTab('custom')}
              >
                Custom Input
              </button>
            </div>
          </div>

          {/* Sample Selector Ribbon */}
          {activeTab === 'sample' && (
            <div className="px-space-md py-space-xs bg-surface-container-low/60 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Archetype:</span>
                <div className="relative">
                  <select
                    className="bg-surface-container-lowest text-on-surface font-mono-data-sm text-mono-data-sm pl-space-xs pr-7 py-1 rounded border border-outline-variant/40 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 appearance-none cursor-pointer"
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                  >
                    <option value="flat">Flat Tabular (24 records, metrics)</option>
                    <option value="nested">Nested (Object Graph with Relational Keys)</option>
                    <option value="deep">Deep-Nested (Hierarchical AST node trees)</option>
                    <option value="hetero">Heterogeneous (Mixed variant structures)</option>
                    <option value="scalar">Small / Scalar-Dominated (Key-value KV pairs)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs text-outline font-mono-data-sm text-mono-data-sm">
                <span>Size: <strong className="text-on-surface-variant">{mSize}</strong></span>
                <span>·</span>
                <span>Tokens: <strong className="text-on-surface-variant">{mTokens}</strong></span>
              </div>
            </div>
          )}

          {/* Code Editor Surface */}
          <div className="relative bg-surface-container-lowest font-mono-data-sm text-mono-data-sm overflow-hidden flex min-h-[460px] max-h-[560px]">
            <div className="select-none py-space-sm px-space-xs text-right bg-surface-container-lowest border-r border-outline-variant/20 text-outline-variant/80 font-mono-data-sm w-12 shrink-0">
              {lineNumbers.map((n) => (
                <span key={n}>
                  {n}
                  <br />
                </span>
              ))}
            </div>
            <div className="relative flex-1 overflow-auto p-space-sm">
              <pre className="text-on-surface leading-relaxed whitespace-pre font-mono-data-sm text-mono-data-sm select-text outline-none">
                {currentCode}
              </pre>
              <textarea
                className={`${activeTab === 'custom' ? '' : 'hidden'} w-full h-full bg-transparent text-on-surface font-mono-data-sm text-mono-data-sm p-0 resize-none outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-primary/60 leading-relaxed`}
                placeholder="Paste raw JSON or scalar payload here..."
                spellCheck={false}
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
              />
            </div>
          </div>

          {/* Editor Controls Bar */}
          <div className="h-14 px-space-md bg-surface-container border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <button
                className="flex items-center gap-1.5 px-space-sm py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-mono-data-sm text-mono-data-sm border border-outline-variant/30 transition-colors"
                onClick={handleReset}
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset Payload
              </button>
              <span className="font-mono-data-sm text-mono-data-sm text-outline hidden sm:inline-block">
                JSON Parser: UTF-8 Validated
              </span>
            </div>
            <button
              className={`flex items-center gap-2 px-space-lg py-2 rounded bg-primary-container text-on-primary-container hover:bg-primary font-mono-data-sm text-mono-data-sm font-semibold tracking-wide border border-primary/50 shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed${isProfiling ? ' opacity-75' : ''}`}
              onClick={runAnalysis}
              disabled={isProfiling}
            >
              {isProfiling ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  PROFILING...
                </>
              ) : flashLabel ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">analytics</span>
                  {flashLabel}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">analytics</span>
                  ANALYZE STRUCTURE
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT WORKSPACE: Structural Profile & Routing Signals (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-space-md">
          {/* Metrics Matrix Card */}
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden shadow-xl">
            <div className="h-10 bg-surface-container-lowest px-space-md border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary">tune</span>
                <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                  STRUCTURAL PROFILE
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <DataSourceBadge
                  state={profileState}
                  label={profileStateLabel}
                />
              </div>
            </div>

            {/* 6-Metric Card Grid */}
            <div className="p-space-md grid grid-cols-3 gap-space-xs bg-surface-container/40">
              {/* Metric 1 */}
              <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">Top-Level</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight mt-1">
                  {mTopLevel}
                </span>
                <span className="font-mono-data-sm text-[10px] text-secondary">Root Container</span>
              </div>
              {/* Metric 2 */}
              <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">Records</span>
                <span className="font-headline-md text-headline-md text-secondary font-semibold tracking-tight mt-1">
                  {mRecords}
                </span>
                <span className="font-mono-data-sm text-[10px] text-outline">Instances</span>
              </div>
              {/* Metric 3 */}
              <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">Max Depth</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight mt-1">
                  {mDepth}
                </span>
                <span className="font-mono-data-sm text-[10px] text-outline">AST Levels</span>
              </div>
              {/* Metric 4 */}
              <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">Uniformity</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-headline-md text-headline-md text-tertiary-fixed-dim font-semibold tracking-tight">
                    {mUniformity}
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-tertiary-container h-full rounded-full"
                    style={{ width: mUniformity }}
                  ></div>
                </div>
              </div>
              {/* Metric 5 */}
              <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">Key Repetition</span>
                <span className="font-mono-data-lg text-mono-data-lg text-secondary-fixed-dim font-semibold mt-1">
                  {mKeyRep}
                </span>
                <span className="font-mono-data-sm text-[10px] text-secondary">Hoist Advantage</span>
              </div>
              {/* Metric 6 */}
              <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">Unique Keys</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight mt-1">
                  {mUniqueKeys}
                </span>
                <span className="font-mono-data-sm text-[10px] text-outline">Lexical Symbols</span>
              </div>
            </div>

            {/* Micro Visual Schema Breakdown Chart */}
            <div className="px-space-md py-space-xs border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm">
              <span className="text-outline">Key Entropy: <strong className="text-on-surface">{mEntropy}</strong></span>
              <span>·</span>
              <span className="text-outline">Estimated Savings: <strong className="text-secondary">{mSavings}</strong></span>
            </div>
            {mArchetype && (
              <div className="px-space-md py-space-2xs border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-1.5 text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                <span className="material-symbols-outlined text-[14px] text-secondary">sell</span>
                <span className="text-outline">Archetype:</span>
                <strong className="text-secondary">{mArchetype}</strong>
              </div>
            )}
            {profileAnnotation && (
              <div
                className="px-space-md py-space-2xs border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-1.5 text-outline font-body-sm text-body-sm"
                role="note"
              >
                <span className="material-symbols-outlined text-[14px] text-primary shrink-0">info</span>
                {profileAnnotation}
              </div>
            )}
          </div>

          {/* Structural Details (live profile fields) */}
          {profileDetails && (
            <div className="bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden shadow-xl">
              <div className="h-9 bg-surface-container-lowest px-space-md border-b border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[16px] text-secondary">dns</span>
                  <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                    STRUCTURAL DETAILS
                  </span>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-outline">{mArchetype || 'PROFILE'}</span>
              </div>
              <div className="p-space-md grid grid-cols-2 gap-space-xs font-mono-data-sm text-mono-data-sm">
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Nodes</span>
                  <strong className="text-on-surface">{profileDetails.node_count}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Objects</span>
                  <strong className="text-on-surface">{profileDetails.object_count}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Arrays</span>
                  <strong className="text-on-surface">{profileDetails.array_count}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Arrays %</span>
                  <strong className="text-on-surface">{(profileDetails.array_ratio * 100).toFixed(0)}%</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Scalars</span>
                  <strong className="text-on-surface">{profileDetails.scalar_count}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Nulls</span>
                  <strong className="text-on-surface">{profileDetails.null_count}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Avg Depth</span>
                  <strong className="text-on-surface">{profileDetails.avg_depth.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">String Ratio</span>
                  <strong className="text-on-surface">{(profileDetails.string_ratio * 100).toFixed(0)}%</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Key Consistency</span>
                  <strong className="text-on-surface">{profileDetails.key_set_consistency.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Tabular Score</span>
                  <strong className="text-on-surface">{profileDetails.tabular_score.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Tabular</span>
                  <strong className="text-on-surface">{profileDetails.is_tabular ? 'Yes' : 'No'}</strong>
                </div>
                <div className="flex items-center justify-between p-space-2xs rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-outline">Deeply Nested</span>
                  <strong className="text-on-surface">{profileDetails.is_deeply_nested ? 'Yes' : 'No'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Visual Structure Tree Panel */}
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden shadow-xl flex flex-col">
            <div className="h-9 bg-surface-container-lowest px-space-md border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-outline">account_tree</span>
                <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                  SYNTACTIC SCHEMA GRAPH
                </span>
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">DEPTH_MAP_RENDER</span>
            </div>
            <div className="p-space-md bg-surface-container-lowest/80 overflow-x-auto font-mono-data-sm text-mono-data-sm text-on-surface leading-snug">
              <div className="flex flex-col gap-1 text-on-surface-variant select-all">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">OBJECT</span>
                  <span className="text-outline-variant text-[10px] uppercase tracking-wide px-1 rounded bg-surface-container">
                    Root node
                  </span>
                </div>
                <div className="flex items-center gap-2 text-outline">
                  <span>└──</span>
                  <span className="text-secondary font-semibold">ARRAY</span>
                  <span className="text-secondary/70">[24 records]</span>
                </div>
                <div className="flex items-center gap-2 text-outline pl-6">
                  <span>├──</span>
                  <span className="text-on-surface">OBJECT</span>
                  <span className="text-on-surface-variant">
                    {'{ id: '}<span className="text-secondary-fixed">str</span>{', timestamp: '}<span className="text-primary-fixed">int</span>{', metric: '}<span className="text-tertiary">float</span>{' }'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-outline pl-6">
                  <span>├──</span>
                  <span className="text-on-surface">OBJECT</span>
                  <span className="text-on-surface-variant">
                    {'{ metadata: { env: '}<span className="text-secondary-fixed">str</span>{', tags: '}<span className="text-tertiary">list</span>{' } }'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-outline pl-6">
                  <span>└──</span>
                  <span className="text-outline-variant italic font-body-sm text-body-sm">
                    ... [uniform schema across 82% of records]
                  </span>
                </div>
              </div>
            </div>
            <div className="px-space-md py-space-2xs border-t border-outline-variant/20 bg-surface-container-lowest text-outline font-body-sm text-body-sm">
              Sample archetype schematic · illustrative, not derived from the live profile.
            </div>
          </div>

          {/* Routing Signals & Serialization Directives */}
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/30 p-space-md flex flex-col gap-space-sm shadow-xl">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-tertiary">sensors</span>
                <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                  ROUTING SIGNALS &amp; DIRECTIVES
                </span>
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary bg-secondary/10 px-space-2xs py-0.5 rounded border border-secondary/20 font-semibold">
                {mSignals.length > 0 ? `${mSignals.length} Active Signals` : 'Sample signals'}
              </span>
            </div>

            {/* Signal Badges List */}
            <div className="grid grid-cols-1 gap-space-xs">
              {mSignals.length > 0
                ? mSignals.map((sig, i) => (
                    <div
                      key={i}
                      className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-space-xs hover:border-secondary/40 transition-colors"
                    >
                      <span className="text-secondary font-mono-data-sm font-bold shrink-0 mt-0.5">✓</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                            {sig.signal}
                          </span>
                          {sig.value && (
                            <span className="font-label-caps text-[9px] uppercase px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/30">
                              {sig.value}
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {sig.description}
                        </span>
                      </div>
                    </div>
                  ))
                : (
                  <>
                    {/* Signal 1: Tabular Pattern */}
                    <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-space-xs hover:border-secondary/40 transition-colors">
                      <span className="text-secondary font-mono-data-sm font-bold shrink-0 mt-0.5">✓</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Tabular Pattern</span>
                          <span className="font-label-caps text-[9px] uppercase px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/30">
                            Candidates: JTON, Compact
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          High row-repetition profile detected across uniform record keys.
                        </span>
                      </div>
                    </div>
                    {/* Signal 2: Repeated Schema */}
                    <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-space-xs hover:border-secondary/40 transition-colors">
                      <span className="text-secondary font-mono-data-sm font-bold shrink-0 mt-0.5">✓</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Repeated Schema</span>
                          <span className="font-label-caps text-[9px] uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                            Key Hoisting Eligible
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Payload qualifies for column-oriented vector header compression.
                        </span>
                      </div>
                    </div>
                    {/* Signal 3: Moderate Depth */}
                    <div className="p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-space-xs hover:border-secondary/40 transition-colors">
                      <span className="text-secondary font-mono-data-sm font-bold shrink-0 mt-0.5">✓</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Moderate Depth</span>
                          <span className="font-label-caps text-[9px] uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                            {'Depth <= 4'}
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Shallow AST guarantees sub-millisecond serialization latency.
                        </span>
                      </div>
                    </div>
                    {/* Signal 4: Heterogeneous Fields */}
                    <div className="p-space-xs rounded bg-surface-container-lowest border border-error/30 flex items-start gap-space-xs bg-error-container/10">
                      <span className="text-error font-mono-data-sm font-bold shrink-0 mt-0.5">⚠</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Heterogeneous Fields</span>
                          <span className="font-label-caps text-[9px] uppercase px-1.5 py-0.5 rounded bg-error-container text-on-error-container border border-error/40 font-semibold">
                            18% Variance
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Strict schema fallback validation required to handle polymorphic records.
                        </span>
                      </div>
                    </div>
                  </>
                )}
            </div>

            {/* Bottom Architectural Note */}
            <div className="p-space-xs rounded bg-surface-container-high/60 border border-outline-variant/20 flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">info</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                Routing signals deterministically feed the Candidate Generator stage to prune inefficient serialization strategies before evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
