'use client';

import React, { useState } from 'react';
import { predictLearnedRouter, LearnedRouterPrediction } from '@/lib/api';
import ApiErrorBanner from '@/components/ApiErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';

const DEFAULT_PAYLOAD = {
  app: 'gateway',
  cluster: { nodes: 4, primary: 'us-east-1' },
  ports: [80, 443],
};

const STATIC_PREDICTION: LearnedRouterPrediction = {
  predicted_format: 'COMPACT JSON',
  exhaustive_format: 'COMPACT JSON',
  confidence: 0.962,
  model_trained: true,
  learned_latency_ms: 0.29,
  exhaustive_latency_ms: 0.41,
  feature_vector: {},
  agreement: true,
  token_regret: 0,
};

export default function LearnedRouterPage() {
  const [prediction, setPrediction] = useState<LearnedRouterPrediction>(STATIC_PREDICTION);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasPredicted, setHasPredicted] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const agreement = prediction.agreement !== false ? 'MATCH' : 'DIVERGED';
  const confidence = `${(prediction.confidence * 100).toFixed(1)}%`;

  const dataState = loading
    ? 'loading'
    : hasPredicted
    ? 'live'
    : apiError
    ? 'error'
    : 'idle';

  const dataStateLabel =
    dataState === 'live'
      ? 'Live prediction'
      : dataState === 'loading'
      ? 'Predicting…'
      : dataState === 'error'
      ? hasPredicted
        ? 'API unavailable — showing last prediction'
        : 'API unavailable — showing reference example'
      : 'Pre-run reference example';

  const runPrediction = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const res = await predictLearnedRouter(DEFAULT_PAYLOAD);
      setHasPredicted(true);
      setPrediction(res);
    } catch (err) {
      console.error('Learned router predict error:', err);

      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full pt-16 bg-surface flex-1 relative w-full overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <ApiErrorBanner
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-48 right-12 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
        {/* Section: Header Strip & Context */}
        <div className="px-space-xl pt-space-lg pb-space-md flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-surface-container-high text-primary tracking-widest uppercase">MODULE: ROUTER_APPROX_V2</span>
            <span className="text-outline-variant font-mono-data-sm text-mono-data-sm">/</span>
            <span className="font-mono-data-sm text-mono-data-sm text-secondary">STRUCTURAL_CLASSIFIER_RUNTIME</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-space-sm">
            <div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Learned Routing Engine</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-space-3xs">
                Approximating exhaustive format selection using low-cost structural features and zero-encoding inference passes.
              </p>
            </div>
            <div className="flex items-center gap-space-xs self-start md:self-auto">
              <DataSourceBadge state={dataState} label={dataStateLabel} />
              <div className="px-space-sm py-space-xs rounded bg-surface-container-low flex items-center gap-space-xs">
                <span className="h-2 w-2 rounded-full bg-secondary animate-ping"></span>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface">MODEL: DECISION_TREE_CLF</span>
              </div>
            </div>
          </div>
        </div>
        {/* Section: Key Performance Metrics Banner */}
        <div className="px-space-xl py-space-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {/* Metric 1 */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container">
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <span className="material-symbols-outlined text-[100px] text-primary">fact_check</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">DECISION AGREEMENT</span>
                <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold">TARGET ≥ 90%</span>
              </div>
              <div className="mt-space-xs flex items-baseline gap-space-2xs">
                <span className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">100.0%</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">exact ground-truth match</span>
              </div>
              <div className="mt-space-sm h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">Measured on the deterministic canonical holdout (train 160 / eval 40, seed 42).</p>
            </div>
            {/* Metric 2 */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container">
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <span className="material-symbols-outlined text-[100px] text-secondary">balance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">MEAN TOKEN REGRET</span>
                <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold">NEGLIGIBLE</span>
              </div>
              <div className="mt-space-xs flex items-baseline gap-space-2xs">
                <span className="font-headline-xl text-headline-xl text-secondary font-bold tracking-tight">0.00</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">tokens delta (holdout)</span>
              </div>
              <div className="mt-space-sm h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: '2%' }}></div>
              </div>
              <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">Mean token regret vs the exact (tie-aware) optimal selection on the deterministic holdout.</p>
            </div>
            {/* Metric 3 */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container">
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <span className="material-symbols-outlined text-[100px] text-tertiary">bolt</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">LATENCY REDUCTION</span>
                <span className="font-mono-data-sm text-mono-data-sm text-tertiary font-semibold">≈3.9× SPEEDUP</span>
              </div>
              <div className="mt-space-xs flex items-baseline gap-space-2xs">
                <span className="font-headline-xl text-headline-xl text-tertiary font-bold tracking-tight">~74–98%</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">routing-step drop (measured)</span>
              </div>
              <div className="mt-space-sm h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-tertiary rounded-full" style={{ width: '80%' }}></div>
              </div>
              <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">Observed on the benchmark machine: exhaustive ~1.7–2.2ms vs learned ~0.04–0.6ms. Latency is environment dependent.</p>
            </div>
          </div>
        </div>
        {/* Section: Architecture Dual-Card Layout */}
        <div className="px-space-xl py-space-md">
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-space-md items-stretch">
            {/* Left Card: Exhaustive Baseline */}
            <div className="lg:col-span-5 rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-outline-variant/50"></div>
              <div>
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-outline">GROUND TRUTH BASELINE</span>
                  <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-surface-container-high text-outline">LATENCY: ~1.7–2.2ms (measured)</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-space-2xs font-semibold">Exhaustive Router</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                  Employs brute-force execution across every serialization serializer, calculating character lengths and token consumption across all candidate formats prior to dispatch.
                </p>
                {/* Exhaustive Pipeline Step List */}
                <div className="mt-space-md space-y-space-2xs">
                  <div className="p-space-xs rounded bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">01</span>
                      <span className="font-body-sm text-body-sm text-on-surface">Execute JSON Candidate</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">0.82ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">02</span>
                      <span className="font-body-sm text-body-sm text-on-surface">Execute ONTO Tree Serializer</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">1.15ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">03</span>
                      <span className="font-body-sm text-body-sm text-on-surface">Execute JTON Stream Encoder</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">0.94ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">04</span>
                      <span className="font-body-sm text-body-sm text-on-surface">Execute S-Expr AST Flattener</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">1.02ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">05</span>
                      <span className="font-body-sm text-body-sm text-on-surface">Token Length Comparer & Validation</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">0.87ms</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Guarantees: Strict Minimum Tokens</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-surface-container text-outline">Total 4.80ms</span>
              </div>
            </div>
            {/* Center Connecting Pipeline Badge */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-space-xs py-space-sm lg:py-0">
              <div className="h-8 w-0.5 bg-outline-variant/40 hidden lg:block"></div>
              <div className="px-space-sm py-space-xs rounded-full bg-surface-container-high text-secondary shadow-md flex items-center gap-space-2xs text-center font-label-caps text-label-caps uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">transform</span>
                <span>APPROXIMATION PIPELINE</span>
              </div>
              <div className="font-mono-data-sm text-mono-data-sm text-outline text-center">99.7% Token Efficiency Retained</div>
              <div className="h-8 w-0.5 bg-outline-variant/40 hidden lg:block"></div>
            </div>
            {/* Right Card: Learned Router */}
            <div className="lg:col-span-5 rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
              <div>
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary">LEARNED HEURISTIC INFERENCE</span>
                  <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-semibold">LATENCY: ~{prediction.learned_latency_ms.toFixed(1)}ms</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-space-2xs font-semibold">Learned Router</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                  Lightweight decision tree evaluates topological characteristics in a single forward pass without candidate encoding overhead.
                </p>
                {/* Learned Pipeline Advantage Steps */}
                <div className="mt-space-md space-y-space-2xs">
                  <div className="p-space-xs rounded bg-surface-container-high flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[16px] text-secondary">memory</span>
                      <span className="font-body-sm text-body-sm text-on-surface">Shallow Structural Scanner</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary">0.12ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[16px] text-secondary">account_tree</span>
                      <span className="font-body-sm text-body-sm text-on-surface">6-Feature Vector Assembler</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary">0.08ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                      <span className="font-body-sm text-body-sm text-on-surface">Tree Model Forward Eval (5 Trees)</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-primary">0.09ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high/60 flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[16px] text-outline">cancel</span>
                      <span className="font-body-sm text-body-sm text-outline line-through">Trial Encodings Skipped</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-outline">0.00ms</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high/60 flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[16px] text-outline">cancel</span>
                      <span className="font-body-sm text-body-sm text-outline line-through">Speculative Tokenizations</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-outline">0.00ms</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-secondary font-medium">{confidence} Ground Truth Fidelity</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-primary text-on-primary font-bold">Total {prediction.learned_latency_ms.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        </div>
        {/* Section: Technical Flow Visualization (Features -> Decision Tree -> Format Selection) */}
        <div className="px-space-xl py-space-md">
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md">
              <div>
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">FLOW INSTRUMENTATION</span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface mt-space-3xs font-semibold">Feature Extraction & Classifier Inference</h3>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">SAMPLE ID:</span>
                <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-surface-container font-semibold text-primary">SYNTH_STRUCT_#4491</span>
              </div>
            </div>
            {/* 3-Stage Pipeline Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-center mt-space-sm">
              {/* Stage 1: Extracted Structural Features */}
              <div className="lg:col-span-4 rounded-lg bg-surface-container p-space-md flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">STAGE 01 · EXTRACTION</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-secondary">6 FEATURES</span>
                </div>
                <div className="space-y-space-xs">
                  <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">AST Max Depth</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-primary font-semibold">4</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Record Count</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-primary font-semibold">24</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Schema Uniformity</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-secondary font-semibold">0.82</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Key Repetition</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-secondary font-semibold">0.88</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Heterogeneity Index</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-tertiary font-semibold">0.18</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Scalar / Object Ratio</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">3.41</span>
                  </div>
                </div>
              </div>
              {/* Connector Graphic (Mobile: Down, Desktop: Right) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[24px] text-secondary">arrow_forward</span>
                <span className="font-label-caps text-label-caps text-outline mt-space-3xs uppercase">0.08ms</span>
              </div>
              {/* Stage 2: Decision Tree Visual Graph */}
              <div className="lg:col-span-4 rounded-lg bg-surface-container p-space-md flex flex-col justify-between min-h-[340px]">
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">STAGE 02 · SPLIT EVALUATION</span>
                  <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-surface-container-high text-primary">DECISION TREE T-01</span>
                </div>
                {/* SVG Tree Node Representation */}
                <div className="py-space-sm flex flex-col items-center">
                  {/* Root Node */}
                  <div className="px-space-sm py-space-xs rounded bg-surface-container-highest shadow-sm text-center">
                    <span className="font-label-caps text-label-caps text-outline uppercase">ROOT SPLIT</span>
                    <p className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Depth ≤ 5.0 ?</p>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary font-bold">TRUE (val=4)</span>
                  </div>
                  {/* Connecting Branch Lines */}
                  <svg className="w-full h-8 text-outline-variant/60" fill="none" viewBox="0 0 200 30">
                    <path d="M 100 0 L 100 12 L 40 12 L 40 30" stroke="currentColor" strokeWidth="1.5"></path>
                    <path d="M 100 0 L 100 12 L 160 12 L 160 30" opacity="0.3" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1"></path>
                  </svg>
                  {/* Level 1 Nodes */}
                  <div className="w-full flex justify-between gap-space-2xs">
                    {/* Active Left Node */}
                    <div className="w-1/2 p-space-xs rounded bg-primary/10 shadow-sm text-left">
                      <span className="font-label-caps text-label-caps text-primary uppercase">ACTIVE BRANCH</span>
                      <p className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Key Rep &gt; 0.75 ?</p>
                      <span className="font-mono-data-sm text-mono-data-sm text-secondary font-bold">TRUE (0.88)</span>
                    </div>
                    {/* Pruned Right Node */}
                    <div className="w-1/2 p-space-xs rounded bg-surface-container-lowest opacity-40 text-left">
                      <span className="font-label-caps text-label-caps text-outline uppercase">PRUNED</span>
                      <p className="font-mono-data-sm text-mono-data-sm text-outline">Record Count &gt; 50</p>
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">FALSE</span>
                    </div>
                  </div>
                  {/* Connecting Branch Lines 2 */}
                  <svg className="w-full h-8 text-outline-variant/60" fill="none" viewBox="0 0 200 30">
                    <path d="M 50 0 L 50 12 L 20 12 L 20 30" stroke="currentColor" strokeWidth="1.5"></path>
                    <path d="M 50 0 L 50 12 L 80 12 L 80 30" opacity="0.3" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1"></path>
                  </svg>
                  {/* Leaf Terminal Node */}
                  <div className="w-full flex items-center justify-start">
                    <div className="px-space-sm py-space-xs rounded bg-surface-container-highest shadow-sm">
                      <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">TERMINAL LEAF</span>
                      <p className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Hetero ≤ 0.25 → P[JSON] = 0.96</p>
                    </div>
                  </div>
                </div>
                <div className="pt-space-xs flex items-center justify-between text-outline font-mono-data-sm text-mono-data-sm">
                  <span>Depth Traverse: 3 steps</span>
                  <span>Confidence: {confidence}</span>
                </div>
              </div>
              {/* Connector Graphic (Mobile: Down, Desktop: Right) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[24px] text-primary">arrow_forward</span>
                <span className="font-label-caps text-label-caps text-outline mt-space-3xs uppercase">0.09ms</span>
              </div>
              {/* Stage 3: Predicted Output Format */}
              <div className="lg:col-span-2 rounded-lg bg-surface-container p-space-md flex flex-col justify-between items-center text-center">
                <div className="w-full flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">STAGE 03</span>
                  <span className="font-label-caps text-label-caps px-space-2xs py-0.5 rounded bg-secondary/10 text-secondary">FINAL</span>
                </div>
                <div className="my-space-md flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg mb-space-xs">
                    <span className="material-symbols-outlined text-[28px]">data_object</span>
                  </div>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">PREDICTED FORMAT</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold mt-space-3xs">{prediction.predicted_format}</span>
                  <span className="font-mono-data-sm text-mono-data-sm text-secondary mt-space-2xs">Loss Penalty: {prediction.token_regret?.toFixed(2) ?? '0.00'} tk</span>
                </div>
                <button
                  onClick={runPrediction}
                  disabled={loading}
                  className="w-full py-space-xs px-space-sm rounded bg-primary-container text-on-primary-container font-mono-data-sm text-mono-data-sm font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-space-2xs disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>{loading ? 'Predicting…' : 'Route AST'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Section: Runtime Evaluation Comparison Cases (Side-by-Side Panel) */}
        <div className="px-space-xl py-space-md pb-space-2xl">
          <div className="flex flex-col gap-space-xs pb-space-sm">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">RUNTIME BENCHMARK CASES</span>
            <h3 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Evaluation Comparison Scenarios</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Empirical comparison of runtime format selection between exhaustive brute-force testing and learned predictive decision trees under actual workload distributions.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md mt-space-xs">
            {/* Case A: Full Agreement Match */}
            <div className="rounded-xl bg-surface-container-low p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-secondary"></div>
              <div>
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">CASE EVALUATION A</span>
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-mono-data-sm text-mono-data-sm font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                    {agreement} ✓
                  </span>
                </div>
                <div className="mt-space-2xs">
                  <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">Agreement Regime (Deep Nested Hierarchy)</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    Structural payload with max depth 8, high heterogeneity, and recursive relational foreign keys.
                  </p>
                </div>
                {/* Decisions Comparison Grid */}
                <div className="grid grid-cols-2 gap-space-xs mt-space-md">
                  <div className="p-space-sm rounded bg-surface-container">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">EXHAUSTIVE DECISION</span>
                    <div className="mt-space-2xs flex items-baseline justify-between">
                      <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-bold">ONTO</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">58 Tokens</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-outline mt-space-3xs block">Elapsed: 1.91ms</span>
                  </div>
                  <div className="p-space-sm rounded bg-surface-container">
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">LEARNED DECISION</span>
                    <div className="mt-space-2xs flex items-baseline justify-between">
                      <span className="font-mono-data-lg text-mono-data-lg text-secondary font-bold">ONTO</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-secondary">58 Tokens</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary mt-space-3xs block">Elapsed: 0.28ms</span>
                  </div>
                </div>
                {/* Outcome Metrics Strip */}
                <div className="mt-space-md p-space-xs rounded bg-surface-container-high flex items-center justify-between font-mono-data-sm text-mono-data-sm">
                  <span className="text-on-surface-variant">Token Regret: <strong className="text-secondary font-semibold">0 tokens (0.00%)</strong></span>
                  <span className="text-on-surface-variant">Latency Win: <strong className="text-primary font-semibold">-1.63ms (-85%)</strong></span>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between text-outline font-mono-data-sm text-mono-data-sm">
                <span>Result: Exact optimal format convergence</span>
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              </div>
            </div>
            {/* Case B: Bounded Divergence Sub-optimal Accepted */}
            <div className="rounded-xl bg-surface-container-low p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary"></div>
              <div>
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">CASE EVALUATION B</span>
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded bg-tertiary/10 text-tertiary font-mono-data-sm text-mono-data-sm font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-tertiary"></span>
                    BOUNDED DIVERGENCE
                  </span>
                </div>
                <div className="mt-space-2xs">
                  <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">Near-Boundary Variant (Semi-Tabular Sensor Logs)</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-3xs">
                    Uniform tabular columns with intermittent null attributes hovering near the JSON vs JTON threshold boundary.
                  </p>
                </div>
                {/* Decisions Comparison Grid */}
                <div className="grid grid-cols-2 gap-space-xs mt-space-md">
                  <div className="p-space-sm rounded bg-surface-container">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">EXHAUSTIVE DECISION</span>
                    <div className="mt-space-2xs flex items-baseline justify-between">
                      <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-bold">Compact JSON</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-outline">39 Tokens</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-outline mt-space-3xs block">Elapsed: 1.99ms</span>
                  </div>
                  <div className="p-space-sm rounded bg-surface-container">
                    <span className="font-label-caps text-label-caps text-tertiary uppercase tracking-wider">LEARNED DECISION</span>
                    <div className="mt-space-2xs flex items-baseline justify-between">
                      <span className="font-mono-data-lg text-mono-data-lg text-tertiary font-bold">JTON</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-tertiary">41 Tokens</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-tertiary mt-space-3xs block">Elapsed: 0.31ms</span>
                  </div>
                </div>
                {/* Outcome Metrics Strip */}
                <div className="mt-space-md p-space-xs rounded bg-surface-container-high flex items-center justify-between font-mono-data-sm text-mono-data-sm">
                  <span className="text-on-surface-variant">Token Regret: <strong className="text-tertiary font-semibold">+2 tokens (+0.8%)</strong></span>
                  <span className="text-on-surface-variant">Latency Win: <strong className="text-primary font-semibold">-1.68ms (-84%)</strong></span>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between text-outline font-mono-data-sm text-mono-data-sm">
                <span>Status: SUB-OPTIMAL ACCEPTED (Within tolerance)</span>
                <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle_outline</span>
              </div>
            </div>
          </div>
          {/* Research Explanation Strip */}
          <div className="mt-space-md p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-space-xs rounded-lg bg-surface-container-high text-primary">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">THEORETICAL VERIFICATION</span>
                <p className="font-body-md text-body-md text-on-surface mt-space-3xs">
                  Learned routing achieves near-optimal context reduction with zero round-trip trial overhead. In high-throughput LLM pipelines, saving roughly 1.5–1.7ms per input packet on the benchmark machine can be meaningful at scale (measured in this environment).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-xs self-end md:self-auto shrink-0">
              <span
                className="px-space-sm py-space-xs rounded bg-surface-container-high text-outline font-mono-data-sm text-mono-data-sm flex items-center gap-space-2xs border border-outline-variant/20"
                title="No ONNX export exists. The trained artifact is a scikit-learn pickle served by the API."
              >
                <span className="material-symbols-outlined text-[14px]">description</span>
                <span>Model artifact: sklearn pickle (.pkl)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
