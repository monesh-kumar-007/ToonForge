'use client';

import React, { useState } from 'react';

interface Telemetry {
  id: string;
  depth: number;
  hom: string;
  valids: string;
  winner: string;
  latency: string;
}

const MOCK_PAYLOADS: Telemetry[] = [
  { id: '#2041_SYNTH', depth: 4, hom: '0.88', valids: '4/5', winner: 'COMPACT JSON (-38.2%)', latency: '1.12ms' },
  { id: '#3092_TABLE', depth: 2, hom: '0.96', valids: '5/5', winner: 'JTON (-44.1%)', latency: '0.84ms' },
  { id: '#4110_NESTED', depth: 7, hom: '0.34', valids: '3/5', winner: 'ONTO (-29.8%)', latency: '1.67ms' },
  { id: '#5019_EDGE', depth: 1, hom: '0.12', valids: '5/5', winner: 'TOON (-18.4%)', latency: '0.62ms' },
];

export default function OverviewPage() {
  const [telemetry, setTelemetry] = useState<Telemetry>(MOCK_PAYLOADS[0]);

  const runAnimation = () => {
    const nodes = document.querySelectorAll<HTMLElement>('.pipeline-node');
    nodes.forEach((node) => {
      node.classList.remove('ring-2', 'ring-secondary', 'bg-surface-container-highest');
    });

    nodes.forEach((node, idx) => {
      window.setTimeout(() => {
        node.classList.add('bg-surface-container-highest');
        window.setTimeout(() => {
          if (idx !== 3) {
            node.classList.remove('bg-surface-container-highest');
          }
        }, 350);
      }, idx * 160);
    });

    setTelemetry((prev: Telemetry) => {
      const next = MOCK_PAYLOADS[(MOCK_PAYLOADS.indexOf(prev) + 1) % MOCK_PAYLOADS.length];
      window.setTimeout(() => setTelemetry(next), 6 * 160);
      return prev;
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Utility Context Bar / Subheader */}
      <section className="relative px-space-lg pt-space-lg pb-space-md bg-surface-container-lowest">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-space-md max-w-7xl mx-auto">
          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">RESEARCH LAB CONSOLE</span>
              <span className="text-outline-variant font-mono-data-sm text-mono-data-sm">::</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">SYS_DIAGNOSTICS_RUNNING</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">Adaptive Context Engine</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Intelligent structural serialization for efficient and reliable LLM context utilization.
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-high shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold tracking-wider uppercase">VALIDATION ACTIVE</span>
              <span className="text-outline-variant">|</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">AESTHETIC_V2.4</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Callouts (4 Grid) */}
      <section className="px-space-lg py-space-lg max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1 */}
          <div className="group relative p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-md">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">COMPRESSION DELTA</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">trending_down</span>
            </div>
            <div className="flex items-baseline gap-space-2xs mb-space-3xs">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">46.26%</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold">avg</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-medium">Mean Token Reduction</p>
            <div className="mt-space-2xs flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">vs Plain JSON</span>
              <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary-fixed font-mono">OPT-94%</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r from-secondary via-primary to-transparent opacity-80" />
          </div>

          {/* Card 2 */}
          <div className="group relative p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-md">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">PIPELINE DIALECTS</span>
              <span className="material-symbols-outlined text-primary text-[18px]">alt_route</span>
            </div>
            <div className="flex items-baseline gap-space-2xs mb-space-3xs">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">5</span>
              <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold">dialects</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-medium">Serialization Formats</p>
            <div className="mt-space-2xs flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant truncate">JSON → Compact → TOON → JTON → ONTO</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r from-primary via-tertiary to-transparent opacity-80" />
          </div>

          {/* Card 3 */}
          <div className="group relative p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-md">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">ROUTER CONVERGENCE</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">neurology</span>
            </div>
            <div className="flex items-baseline gap-space-2xs mb-space-3xs">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">100.0%</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold">acc</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-medium">Learned Router Agreement</p>
            <div className="mt-space-2xs flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">vs Exhaustive Router</span>
              <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-mono">&lt;1.8ms</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r from-secondary-fixed via-secondary to-transparent opacity-80" />
          </div>

          {/* Card 4 */}
          <div className="group relative p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-md">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">INTEGRITY ASSURANCE</span>
              <span className="material-symbols-outlined text-secondary-fixed-dim text-[18px]">verified_user</span>
            </div>
            <div className="flex items-baseline gap-space-2xs mb-space-3xs">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">0</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary-fixed-dim font-semibold">faults</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-medium">Final Fallbacks Triggered</p>
            <div className="mt-space-2xs flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Across benchmark corpus</span>
              <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-high text-secondary font-mono">100% SAFE</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r from-secondary via-secondary-fixed to-transparent opacity-80" />
          </div>
        </div>
      </section>

      {/* Interactive Pipeline Section */}
      <section className="px-space-lg py-space-md max-w-7xl mx-auto w-full">
        <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden">
          {/* Background Graphic Micro-grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#adc6ff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-lg">
            <div>
              <div className="flex items-center gap-space-2xs mb-space-3xs">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">ARCHITECTURE SCHEMATIC</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">How the Engine Works</h2>
            </div>
            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
              <span className="px-2 py-1 rounded bg-surface-container-highest text-on-surface">Interactive Trace Mode</span>
              <button
                onClick={runAnimation}
                className="px-2 py-1 rounded bg-primary text-on-primary font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Run Simulation
              </button>
            </div>
          </div>

          {/* Horizontal Connected Pipeline Flow */}
          <div className="relative grid grid-cols-1 md:grid-cols-6 gap-space-sm items-stretch">
            {/* Step 1: Ingest Payload */}
            <div className="pipeline-node relative flex flex-col p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm" data-step="1">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline font-mono">01</span>
                <span className="material-symbols-outlined text-outline text-[18px]">input</span>
              </div>
              <p className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold mb-space-3xs">Payload</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">Raw arbitrary JSON input ingested from contextual LLM prompt buffers.</p>
              <div className="mt-space-sm pt-space-xs bg-surface-container-lowest/50 -mx-space-sm -mb-space-sm p-space-xs rounded-b-lg flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Type Check</span>
                <span className="font-label-caps text-label-caps text-primary font-mono">PASS</span>
              </div>
            </div>

            {/* Step 2: Structural Profile */}
            <div className="pipeline-node relative flex flex-col p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm" data-step="2">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline font-mono">02</span>
                <span className="material-symbols-outlined text-outline text-[18px]">query_stats</span>
              </div>
              <p className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold mb-space-3xs">Structural Profile</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">Calculates depth, key-homogeneity, primitive density, and repetition ratios.</p>
              <div className="mt-space-sm pt-space-xs bg-surface-container-lowest/50 -mx-space-sm -mb-space-sm p-space-xs rounded-b-lg flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">AST Extracted</span>
                <span className="font-label-caps text-label-caps text-secondary font-mono">16 DIMS</span>
              </div>
            </div>

            {/* Step 3: Candidate Formats */}
            <div className="pipeline-node relative flex flex-col p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm" data-step="3">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline font-mono">03</span>
                <span className="material-symbols-outlined text-outline text-[18px]">view_in_ar</span>
              </div>
              <p className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold mb-space-3xs">Candidates</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">Parallel speculative serialization into valid dialect encoders (TOON, JTON, ONTO).</p>
              <div className="mt-space-sm pt-space-xs bg-surface-container-lowest/50 -mx-space-sm -mb-space-sm p-space-xs rounded-b-lg flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Encoders</span>
                <span className="font-label-caps text-label-caps text-tertiary font-mono">5 ACTIVE</span>
              </div>
            </div>

            {/* Step 4: Round-Trip Validation (CRITICAL SAFETY STAGE) */}
            <div className="pipeline-node relative flex flex-col p-space-sm rounded-lg bg-surface-container-high shadow-lg transition-transform hover:-translate-y-0.5" data-step="4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-caps text-label-caps font-bold tracking-wider shadow-md whitespace-nowrap flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">shield</span>
                ZERO DATA LOSS BARRIER
              </div>
              <div className="flex items-center justify-between mb-space-xs mt-1">
                <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono">04 CRITICAL</span>
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
              </div>
              <p className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold mb-space-3xs flex items-center gap-1">
                Validation
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">Strict deserialization &amp; semantic isomorphism assertion against source payload.</p>
              <div className="mt-space-sm pt-space-xs bg-surface-container-lowest -mx-space-sm -mb-space-sm p-space-xs rounded-b-lg flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-secondary">Round-Trip</span>
                <span className="font-label-caps text-label-caps text-secondary font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>ISOMORPHIC
                </span>
              </div>
            </div>

            {/* Step 5: Adaptive Selection */}
            <div className="pipeline-node relative flex flex-col p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm" data-step="5">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline font-mono">05</span>
                <span className="material-symbols-outlined text-outline text-[18px]">balance</span>
              </div>
              <p className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold mb-space-3xs">Adaptive Routing</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">Learned selector picks minimum token footprint strictly from verified valid candidates.</p>
              <div className="mt-space-sm pt-space-xs bg-surface-container-lowest/50 -mx-space-sm -mb-space-sm p-space-xs rounded-b-lg flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Scored By</span>
                <span className="font-label-caps text-label-caps text-primary font-mono">BPE TOKENIZER</span>
              </div>
            </div>

            {/* Step 6: Optimized Output */}
            <div className="pipeline-node relative flex flex-col p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm" data-step="6">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline font-mono">06</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">rocket_launch</span>
              </div>
              <p className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold mb-space-3xs">Optimized Output</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">Clean condensed stream delivered to LLM inference pipeline with safety receipt.</p>
              <div className="mt-space-sm pt-space-xs bg-surface-container-lowest/50 -mx-space-sm -mb-space-sm p-space-xs rounded-b-lg flex items-center justify-between">
                <span className="font-mono-data-sm text-mono-data-sm text-secondary">Safety Hash</span>
                <span className="font-label-caps text-label-caps text-secondary font-mono">SIG_VALID</span>
              </div>
            </div>
          </div>

          {/* Interactive Micro-Console for Simulation */}
          <div className="mt-space-md p-space-sm rounded-lg bg-surface-container-lowest flex flex-wrap items-center justify-between gap-space-xs" id="pipeline-telemetry">
            <div className="flex items-center gap-space-sm">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-secondary" /> LIVE SIMULATION RECEIPT
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Payload {telemetry.id}</span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Depth: {telemetry.depth} | Homogeneity: {telemetry.hom}</span>
            </div>
            <div className="flex items-center gap-space-md font-mono-data-sm text-mono-data-sm">
              <span className="text-on-surface-variant">Validated: <span className="text-secondary font-semibold">{telemetry.valids} Formats</span></span>
              <span className="text-on-surface-variant">Winner: <span className="text-secondary font-bold">{telemetry.winner}</span></span>
              <span className="text-outline">Roundtrip Latency: <span className="text-on-surface">{telemetry.latency}</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Bottom Section */}
      <section className="px-space-lg py-space-md mb-space-xl max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-stretch">
          {/* LEFT: FORMAT SELECTION DISTRIBUTION */}
          <div className="lg:col-span-7 flex flex-col p-space-lg rounded-xl bg-surface-container-low shadow-lg">
            <div className="flex items-center justify-between mb-space-xs">
              <div>
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">EMPIRICAL CORPUS EVALUATION</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Format Selection Distribution</h3>
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-outline bg-surface-container px-space-xs py-1 rounded">
                N = 200 Payloads
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
              Empirical winner distribution across the synthetic benchmark suite, balancing AST depth, repeating keys, and nesting overhead.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-md items-center flex-1">
              {/* Vector Donut Chart */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center relative p-space-xs">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container" cx="50" cy="50" fill="none" r="38" stroke="currentColor" strokeWidth="12" />
                  <circle className="transition-all duration-500 hover:opacity-80 cursor-pointer" cx="50" cy="50" fill="none" r="38" stroke="#4cd7f6" strokeDasharray="100.28 238.76" strokeDashoffset="0" strokeWidth="12" />
                  <circle className="transition-all duration-500 hover:opacity-80 cursor-pointer" cx="50" cy="50" fill="none" r="38" stroke="#adc6ff" strokeDasharray="66.85 238.76" strokeDashoffset="-100.28" strokeWidth="12" />
                  <circle className="transition-all duration-500 hover:opacity-80 cursor-pointer" cx="50" cy="50" fill="none" r="38" stroke="#d0bcff" strokeDasharray="42.98 238.76" strokeDashoffset="-167.13" strokeWidth="12" />
                  <circle className="transition-all duration-500 hover:opacity-80 cursor-pointer" cx="50" cy="50" fill="none" r="38" stroke="#4d8eff" strokeDasharray="19.10 238.76" strokeDashoffset="-210.11" strokeWidth="12" />
                  <circle className="transition-all duration-500 hover:opacity-80 cursor-pointer" cx="50" cy="50" fill="none" r="38" stroke="#8c909f" strokeDasharray="9.55 238.76" strokeDashoffset="-229.21" strokeWidth="12" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">200</span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">PAYLOADS</span>
                </div>
              </div>

              {/* Distribution Legend and Metric Bars */}
              <div className="sm:col-span-7 flex flex-col justify-center space-y-space-xs">
                <div className="p-space-2xs rounded bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="h-3 w-3 rounded-sm bg-secondary shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Compact JSON</span>
                      <span className="font-body-sm text-body-sm text-outline">Whitespace &amp; punctuation optimized</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-secondary font-bold">42%</span>
                    <span className="block font-mono-data-sm text-mono-data-sm text-outline">84 runs</span>
                  </div>
                </div>

                <div className="p-space-2xs rounded bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="h-3 w-3 rounded-sm bg-primary shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">JTON</span>
                      <span className="font-body-sm text-body-sm text-outline">Tabular key repetition compression</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-primary font-bold">28%</span>
                    <span className="block font-mono-data-sm text-mono-data-sm text-outline">56 runs</span>
                  </div>
                </div>

                <div className="p-space-2xs rounded bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="h-3 w-3 rounded-sm bg-tertiary shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">ONTO</span>
                      <span className="font-body-sm text-body-sm text-outline">Object-nesting tuple oriented</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-tertiary font-bold">18%</span>
                    <span className="block font-mono-data-sm text-mono-data-sm text-outline">36 runs</span>
                  </div>
                </div>

                <div className="p-space-2xs rounded bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="h-3 w-3 rounded-sm bg-primary-container shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">TOON</span>
                      <span className="font-body-sm text-body-sm text-outline">Token-ordered optimal notation</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-primary-container font-bold">8%</span>
                    <span className="block font-mono-data-sm text-mono-data-sm text-outline">16 runs</span>
                  </div>
                </div>

                <div className="p-space-2xs rounded bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="h-3 w-3 rounded-sm bg-outline shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">Plain JSON</span>
                      <span className="font-body-sm text-body-sm text-outline">Standard serialization baseline</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-outline font-bold">4%</span>
                    <span className="block font-mono-data-sm text-mono-data-sm text-outline">8 runs</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-lowest/50 px-space-sm py-2 rounded-lg">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">Primary Routing Determinant:</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary font-medium">Uniformity &gt; 0.72 triggers JTON/ONTO Tabular Compression</span>
            </div>
          </div>

          {/* RIGHT: SYSTEM PRINCIPLES */}
          <div className="lg:col-span-5 flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-low shadow-lg">
            <div className="mb-space-md">
              <div className="flex items-center gap-space-2xs mb-space-3xs">
                <span className="material-symbols-outlined text-secondary text-[16px]">gavel</span>
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">INVARIANTS &amp; AXIOMS</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">System Principles</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Execution rules enforced unconditionally at every pipeline cycle. Safety strictly precedes economy.
              </p>
            </div>
            <div className="space-y-space-sm flex-1 flex flex-col justify-between">
              {/* Principle 1: VALIDITY */}
              <div className="relative p-space-md rounded-xl bg-surface-container-high shadow-md overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-secondary" />
                <div className="flex items-center justify-between mb-space-xs pl-space-2xs">
                  <div className="flex items-center gap-space-2xs">
                    <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-secondary text-on-secondary font-bold font-mono">01 NON-NEGOTIABLE</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-secondary font-bold">VALIDITY</span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface pl-space-2xs font-medium">
                  Data must round-trip safely. No loss of types, null vs missing distinction, or structure.
                </p>
                <div className="mt-space-xs pl-space-2xs flex items-center gap-space-xs text-secondary font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Zero tolerated degradation. Rejected candidates purged immediately.</span>
                </div>
              </div>

              {/* Principle 2: ADAPTIVE SUITABILITY */}
              <div className="relative p-space-md rounded-xl bg-surface-container shadow-sm overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-center justify-between mb-space-xs pl-space-2xs">
                  <div className="flex items-center gap-space-2xs">
                    <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-bold font-mono">02 CONTEXTUAL</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">ADAPTIVE SUITABILITY</span>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant pl-space-2xs">
                  Choose according to structural profile (depth, uniformity, repeated keys). No universal hammer.
                </p>
                <div className="mt-space-xs pl-space-2xs flex items-center gap-space-xs text-outline font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px]">insights</span>
                  <span>Dynamically fitted to payload topology rather than rigid heuristics.</span>
                </div>
              </div>

              {/* Principle 3: TOKEN EFFICIENCY */}
              <div className="relative p-space-md rounded-xl bg-surface-container shadow-sm overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-tertiary" />
                <div className="flex items-center justify-between mb-space-xs pl-space-2xs">
                  <div className="flex items-center gap-space-2xs">
                    <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-tertiary font-bold font-mono">03 OPTIMIZATION</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">TOKEN EFFICIENCY</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary text-[18px]">data_saver_on</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant pl-space-2xs">
                  Optimize token cost strictly among valid candidates. Smaller is never chosen if unsafe.
                </p>
                <div className="mt-space-xs pl-space-2xs flex items-center gap-space-xs text-outline font-mono-data-sm text-mono-data-sm">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>Efficiency is a constrained objective function under safety constraints.</span>
                </div>
              </div>
            </div>
            {/* Footnote / Research Citation */}
            <div className="mt-space-md pt-space-xs border-t border-outline-variant/20 flex items-center justify-between text-outline">
              <span className="font-label-caps text-label-caps uppercase">SPECIFICATION REF:</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary font-mono">ISO/IEC-21778 &amp; AST-ROUTER-v2</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}