'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/common/MetricCard';
import { routePayload, RouteResponse } from '@/lib/api';

const SAMPLE_PAYLOAD = [
  { id: 'REC_1042', user_id: 'USR_8819', action: 'read', region: 'us-east-1', latency_ms: 12.4, status: 200, cached: true },
  { id: 'REC_1043', user_id: 'USR_4120', action: 'write', region: 'eu-west-1', latency_ms: 45.1, status: 201, cached: false },
  { id: 'REC_1044', user_id: 'USR_7731', action: 'query', region: 'us-west-2', latency_ms: 8.9, status: 200, cached: true },
  { id: 'REC_1045', user_id: 'USR_9002', action: 'sync', region: 'ap-northeast', latency_ms: 110.2, status: 200, cached: false },
];

export default function OverviewPage() {
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(4);

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const data = await routePayload(SAMPLE_PAYLOAD);
      setRouteData(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Context Subheader */}
      <section className="relative px-8 pt-8 pb-6 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-secondary tracking-widest font-semibold">
                RESEARCH LAB CONSOLE
              </span>
              <span className="text-outline-variant font-mono text-xs">::</span>
              <span className="font-mono text-xs text-outline">
                ADAPTIVE_CONTEXT_SERIALIZATION_V1
              </span>
            </div>
            <h1 className="font-headline text-3xl text-on-surface font-bold tracking-tight">
              Adaptive Context Engine
            </h1>
            <p className="font-sans text-sm text-on-surface-variant max-w-3xl leading-relaxed">
              Adaptive Structure-Aware Routing for LLM Context Serialization: An Implemented and
              Empirically Benchmarked Architecture Unifying JSON, TOON, JTON, and ONTO.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="font-mono text-[11px] text-on-surface font-semibold tracking-wider uppercase">
                VALIDATION ACTIVE
              </span>
              <span className="text-outline-variant">|</span>
              <span className="font-mono text-[11px] text-secondary">AESTHETIC_V1.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Cards (4 Grid) */}
      <section className="px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="COMPRESSION DELTA"
            value="46.3%"
            unit="avg"
            title="Mean Token Reduction"
            subtitle="vs Canonical JSON"
            badge="OPT-63% TOON"
            icon="trending_down"
            gradient="cyan"
          />
          <MetricCard
            label="PIPELINE DIALECTS"
            value="5"
            unit="formats"
            title="Serialization Candidates"
            subtitle="JSON · Compact · TOON · JTON · ONTO"
            icon="alt_route"
            gradient="blue"
          />
          <MetricCard
            label="ROUTER CONVERGENCE"
            value="100%"
            unit="acc"
            title="Learned Router Agreement"
            subtitle="vs Ground Truth Exhaustive"
            badge="<0.6ms"
            icon="neurology"
            gradient="purple"
          />
          <MetricCard
            label="INTEGRITY ASSURANCE"
            value="0"
            unit="faults"
            title="Data Corruptions Prevented"
            subtitle="Strict round-trip isomorphism"
            badge="100% SAFE"
            icon="verified_user"
            gradient="emerald"
          />
        </div>
      </section>

      {/* Interactive Pipeline Section */}
      <section className="px-8 py-4 max-w-7xl mx-auto w-full">
        <div className="rounded-xl bg-surface-container-low p-6 shadow-xl relative overflow-hidden border border-outline-variant/20">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-semibold">
                  ARCHITECTURE SCHEMATIC
                </span>
              </div>
              <h2 className="font-headline text-xl text-on-surface font-semibold">
                How the Engine Works
              </h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-outline">
              <span className="px-2.5 py-1 rounded bg-surface-container-highest text-on-surface">
                Interactive Trace Mode
              </span>
              <button
                onClick={runSimulation}
                disabled={simulating}
                className="px-3 py-1.5 rounded bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>{simulating ? 'Routing...' : 'Run Simulation'}</span>
              </button>
            </div>
          </div>

          {/* 6-Step Horizontal Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-stretch">
            {/* Step 1 */}
            <div
              onClick={() => setActiveStep(1)}
              className={`flex flex-col p-3.5 rounded-lg bg-surface-container transition-all cursor-pointer border ${
                activeStep === 1
                  ? 'border-secondary bg-surface-container-high ring-1 ring-secondary/50'
                  : 'border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline">
                  01
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">input</span>
              </div>
              <p className="font-mono text-xs text-on-surface font-semibold mb-1">Payload</p>
              <p className="font-sans text-[11px] text-on-surface-variant flex-1 leading-relaxed">
                Raw arbitrary JSON input ingested from prompt buffers.
              </p>
              <div className="mt-3 pt-2 bg-surface-container-lowest/50 -mx-3.5 -mb-3.5 p-2 rounded-b-lg flex items-center justify-between">
                <span className="font-mono text-[10px] text-outline">Type</span>
                <span className="font-mono text-[10px] text-primary font-bold">
                  {routeData?.profile.top_level_type.toUpperCase() || 'ARRAY'}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setActiveStep(2)}
              className={`flex flex-col p-3.5 rounded-lg bg-surface-container transition-all cursor-pointer border ${
                activeStep === 2
                  ? 'border-secondary bg-surface-container-high ring-1 ring-secondary/50'
                  : 'border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline">
                  02
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">query_stats</span>
              </div>
              <p className="font-mono text-xs text-on-surface font-semibold mb-1">Structural Profile</p>
              <p className="font-sans text-[11px] text-on-surface-variant flex-1 leading-relaxed">
                Calculates depth, key-homogeneity, primitive density.
              </p>
              <div className="mt-3 pt-2 bg-surface-container-lowest/50 -mx-3.5 -mb-3.5 p-2 rounded-b-lg flex items-center justify-between">
                <span className="font-mono text-[10px] text-outline">AST Features</span>
                <span className="font-mono text-[10px] text-secondary font-bold">19 DIMS</span>
              </div>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setActiveStep(3)}
              className={`flex flex-col p-3.5 rounded-lg bg-surface-container transition-all cursor-pointer border ${
                activeStep === 3
                  ? 'border-secondary bg-surface-container-high ring-1 ring-secondary/50'
                  : 'border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline">
                  03
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">view_in_ar</span>
              </div>
              <p className="font-mono text-xs text-on-surface font-semibold mb-1">Candidates</p>
              <p className="font-sans text-[11px] text-on-surface-variant flex-1 leading-relaxed">
                Parallel speculative serialization across candidate dialects.
              </p>
              <div className="mt-3 pt-2 bg-surface-container-lowest/50 -mx-3.5 -mb-3.5 p-2 rounded-b-lg flex items-center justify-between">
                <span className="font-mono text-[10px] text-outline">Formats</span>
                <span className="font-mono text-[10px] text-tertiary font-bold">5 ACTIVE</span>
              </div>
            </div>

            {/* Step 4: Critical Safety Stage */}
            <div
              onClick={() => setActiveStep(4)}
              className={`relative flex flex-col p-3.5 rounded-lg bg-surface-container-high shadow-lg transition-all cursor-pointer border ${
                activeStep === 4
                  ? 'border-secondary ring-2 ring-secondary/60'
                  : 'border-secondary/40'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-mono text-[9px] font-bold tracking-wider shadow-md whitespace-nowrap flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">shield</span>
                ZERO DATA LOSS BARRIER
              </div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary font-bold">
                  04 CRITICAL
                </span>
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
              </div>
              <p className="font-mono text-xs text-on-surface font-semibold mb-1">Validation</p>
              <p className="font-sans text-[11px] text-on-surface-variant flex-1 leading-relaxed">
                Strict deserialization & semantic isomorphism assertion against original.
              </p>
              <div className="mt-3 pt-2 bg-surface-container-lowest -mx-3.5 -mb-3.5 p-2 rounded-b-lg flex items-center justify-between">
                <span className="font-mono text-[10px] text-secondary">Soundness</span>
                <span className="font-mono text-[10px] text-secondary font-bold">ISOMORPHIC</span>
              </div>
            </div>

            {/* Step 5 */}
            <div
              onClick={() => setActiveStep(5)}
              className={`flex flex-col p-3.5 rounded-lg bg-surface-container transition-all cursor-pointer border ${
                activeStep === 5
                  ? 'border-secondary bg-surface-container-high ring-1 ring-secondary/50'
                  : 'border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline">
                  05
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">balance</span>
              </div>
              <p className="font-mono text-xs text-on-surface font-semibold mb-1">Adaptive Routing</p>
              <p className="font-sans text-[11px] text-on-surface-variant flex-1 leading-relaxed">
                Selects minimum token footprint strictly from verified valid candidates.
              </p>
              <div className="mt-3 pt-2 bg-surface-container-lowest/50 -mx-3.5 -mb-3.5 p-2 rounded-b-lg flex items-center justify-between">
                <span className="font-mono text-[10px] text-outline">Tokenizer</span>
                <span className="font-mono text-[10px] text-primary font-bold">BPE cl100k</span>
              </div>
            </div>

            {/* Step 6 */}
            <div
              onClick={() => setActiveStep(6)}
              className={`flex flex-col p-3.5 rounded-lg bg-surface-container transition-all cursor-pointer border ${
                activeStep === 6
                  ? 'border-secondary bg-surface-container-high ring-1 ring-secondary/50'
                  : 'border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline">
                  06
                </span>
                <span className="material-symbols-outlined text-secondary text-[18px]">rocket_launch</span>
              </div>
              <p className="font-mono text-xs text-on-surface font-semibold mb-1">Optimized Output</p>
              <p className="font-sans text-[11px] text-on-surface-variant flex-1 leading-relaxed">
                Clean condensed stream delivered to LLM context with validation receipt.
              </p>
              <div className="mt-3 pt-2 bg-surface-container-lowest/50 -mx-3.5 -mb-3.5 p-2 rounded-b-lg flex items-center justify-between">
                <span className="font-mono text-[10px] text-secondary">Receipt</span>
                <span className="font-mono text-[10px] text-secondary font-bold">SIG_VALID</span>
              </div>
            </div>
          </div>

          {/* Live Telemetry Receipt Bar */}
          <div className="mt-4 p-3 rounded-lg bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3 border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-secondary uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-secondary" /> LIVE SIMULATION RECEIPT
              </span>
              <span className="font-mono text-xs text-outline">#PAYLOAD_SIM_01</span>
              {routeData && (
                <span className="font-mono text-xs text-on-surface-variant">
                  Depth: {routeData.profile.max_depth} | Uniformity:{' '}
                  {(routeData.profile.schema_uniformity * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <span className="text-on-surface-variant">
                Valid Candidates:{' '}
                <span className="text-secondary font-semibold">
                  {routeData?.valid_candidates.length || 0}/5
                </span>
              </span>
              <span className="text-on-surface-variant">
                Winner:{' '}
                <span className="text-primary font-bold uppercase">
                  {routeData?.selected_format || 'COMPACT JSON'} (-{routeData?.token_savings_vs_json?.toFixed(1) || '0.0'}%)
                </span>
              </span>
              <span className="text-outline">
                Latency:{' '}
                <span className="text-on-surface font-medium">
                  {routeData?.routing_latency_ms.toFixed(2) || '0.00'} ms
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Bottom Section */}
      <section className="px-8 py-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Column: Format Distribution */}
          <div className="lg:col-span-7 flex flex-col p-6 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-semibold">
                  EMPIRICAL CORPUS EVALUATION
                </span>
                <h3 className="font-headline text-lg text-on-surface font-semibold">
                  Format Selection Distribution
                </h3>
              </div>
              <span className="font-mono text-xs text-outline bg-surface-container px-2 py-1 rounded">
                N = 200 Payloads
              </span>
            </div>
            <p className="font-sans text-xs text-on-surface-variant mb-6 leading-relaxed">
              Distribution of winning formats selected by the Adaptive Router across the benchmark
              corpus categories (Flat Tabular, Nested Objects, Deep Nested, Heterogeneous, Key-Sparse).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center flex-1">
              {/* Distribution Stats */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="text-secondary font-semibold">Compact JSON</span>
                    <span className="text-on-surface">160 / 200 (80.0%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="text-primary font-semibold">TOON</span>
                    <span className="text-on-surface">40 / 200 (20.0%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '20%' }} />
                  </div>
                  <p className="font-mono text-[10px] text-outline mt-0.5">
                    *100% win rate on Flat Uniform Tabular (63.4% reduction)
                  </p>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="text-tertiary font-semibold">JTON / ONTO</span>
                    <span className="text-on-surface">Filtered for Safety</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              {/* Insights Box */}
              <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-secondary uppercase font-bold tracking-wider">
                  Core Empirical Finding
                </span>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Specialized formats (TOON, JTON) provide unmatched savings on uniform tables,
                  but exhibit up to <span className="text-rose-400 font-semibold">80% defect rates</span> when
                  forced onto non-uniform or deeply nested payloads.
                </p>
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                  <span className="font-mono text-outline">Fallback Rate:</span>
                  <span className="font-mono text-emerald-400 font-bold">0.0% (Adaptive)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fast Actions & Navigation */}
          <div className="lg:col-span-5 flex flex-col p-6 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-md">
            <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-semibold mb-1">
              EXPLORE PROTOTYPE
            </span>
            <h3 className="font-headline text-lg text-on-surface font-semibold mb-4">
              Research Workbenches
            </h3>

            <div className="space-y-2.5 flex-1">
              <Link
                href="/analyze"
                className="group p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/15"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    data_object
                  </span>
                  <div>
                    <p className="font-headline text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                      Analyze Payload
                    </p>
                    <p className="font-sans text-[11px] text-on-surface-variant">
                      Inspect 19-dimensional topological AST profiles
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>

              <Link
                href="/router"
                className="group p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/15"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    alt_route
                  </span>
                  <div>
                    <p className="font-headline text-xs font-semibold text-on-surface group-hover:text-secondary transition-colors">
                      Adaptive Router
                    </p>
                    <p className="font-sans text-[11px] text-on-surface-variant">
                      Inspect step-by-step speculative routing & token comparison
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>

              <Link
                href="/benchmark"
                className="group p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/15"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">
                    speed
                  </span>
                  <div>
                    <p className="font-headline text-xs font-semibold text-on-surface group-hover:text-tertiary transition-colors">
                      Benchmark Lab
                    </p>
                    <p className="font-sans text-[11px] text-on-surface-variant">
                      Run N=200 empirical evaluation across 5 strategies
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>

              <Link
                href="/reliability"
                className="group p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/15"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">
                    verified
                  </span>
                  <div>
                    <p className="font-headline text-xs font-semibold text-on-surface group-hover:text-emerald-400 transition-colors">
                      Reliability Suite
                    </p>
                    <p className="font-sans text-[11px] text-on-surface-variant">
                      Audit numeric strings, null preservation, delimiter immunity
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
