'use client';

import { useState, type MouseEvent } from 'react';

export default function ResearchPage() {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const REPRO_COMMAND = 'python benchmarks/run_benchmark.py --size 200 --seed 200';

  const scrollToRepro = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document
      .getElementById('repro-harness')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(REPRO_COMMAND);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="p-space-lg max-w-7xl mx-auto w-full space-y-space-xl">
      {/* Top Research Masthead */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="space-y-space-2xs min-w-0">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps uppercase text-secondary bg-surface-container-high px-space-xs py-0.5 rounded shadow-sm">
              Conference Paper
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Research
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Adaptive serialisation routing for LLM context — implemented,
            validated, benchmarked.
          </p>
        </div>
        <div className="flex items-center gap-space-xs shrink-0">
          <a
            className="group flex items-center gap-1.5 px-space-sm py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shadow-sm"
            href="#repro-harness"
            onClick={scrollToRepro}
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              terminal
            </span>
            <span className="font-mono-data-sm text-mono-data-sm text-primary">
              Reproduce
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </a>
        </div>
      </div>

      {/* Paper Title Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
        <div className="p-space-lg md:p-space-xl flex flex-col md:flex-row gap-space-lg items-start justify-between relative z-10">
          <div className="space-y-space-sm max-w-4xl">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-secondary font-mono-data-sm text-mono-data-sm">
                Adaptive Routing
              </span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                Serialisation
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Adaptive Structure-Aware Routing for LLM Context Serialisation
            </h2>
            <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-2xs text-on-surface-variant font-body-md text-body-md">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  group
                </span>
                <span className="text-on-surface font-medium">
                  Monesh Kumar S · Nandhagopal A · Nishanth D S
                </span>
              </div>
              <span className="text-outline">·</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">
                Dept. of Computer Science &amp; Engineering, Panimalar
                Engineering College, Poonamalle, India
              </span>
            </div>

            {/* Quantitative Highlights Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
              <div className="p-space-xs rounded bg-surface-container/60 shadow-sm">
                <div className="font-label-caps text-label-caps text-outline uppercase">
                  Context Saving
                </div>
                <div className="font-headline-lg text-headline-lg text-secondary font-semibold tracking-tight">
                  46.26%
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Token reduction vs JSON
                </div>
              </div>
              <div className="p-space-xs rounded bg-surface-container/60 shadow-sm">
                <div className="font-label-caps text-label-caps text-outline uppercase">
                  Round-Trip
                </div>
                <div className="font-headline-lg text-headline-lg text-primary font-semibold tracking-tight">
                  100.0%
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Round-trip validated
                </div>
              </div>
              <div className="p-space-xs rounded bg-surface-container/60 shadow-sm">
                <div className="font-label-caps text-label-caps text-outline uppercase">
                  Learned Router
                </div>
                <div className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                  ≈3.2–3.9×
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Speedup vs exhaustive
                </div>
              </div>
              <div className="p-space-xs rounded bg-surface-container/60 shadow-sm">
                <div className="font-label-caps text-label-caps text-outline uppercase">
                  Evaluated Set
                </div>
                <div className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                  N=200
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Corpus · seed=200
                </div>
              </div>
            </div>
          </div>

          {/* Router Selection Distribution Visual */}
          <div className="w-full md:w-80 shrink-0 p-space-md rounded-lg bg-surface-container shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between pb-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase">
                Router Selection Share
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                N=200 · seed=200
              </span>
            </div>
            <div className="py-space-xs">
              <svg
                className="w-full h-24 text-primary"
                fill="none"
                viewBox="0 0 280 96"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeOpacity="0.08"
                  x1="0"
                  x2="280"
                  y1="24"
                  y2="24"
                />
                <line
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeOpacity="0.08"
                  x1="0"
                  x2="280"
                  y1="48"
                  y2="48"
                />
                <line
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeOpacity="0.08"
                  x1="0"
                  x2="280"
                  y1="72"
                  y2="72"
                />
                <path
                  d="M 10 70 Q 70 65, 140 68 T 270 66"
                  opacity="0.6"
                  stroke="#ffb4ab"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
                <path
                  d="M 10 52 Q 80 40, 150 46 T 270 38"
                  opacity="0.7"
                  stroke="#4cd7f6"
                  strokeWidth="1.5"
                />
                <path
                  d="M 10 32 C 60 18, 120 14, 180 20 C 220 24, 250 16, 270 12"
                  stroke="#adc6ff"
                  strokeWidth="2.5"
                />
                <path
                  d="M 10 32 C 60 18, 120 14, 180 20 C 220 24, 250 16, 270 12 L 270 85 L 10 85 Z"
                  fill="currentColor"
                  fillOpacity="0.05"
                />
                <circle cx="180" cy="20" fill="#adc6ff" r="3.5" />
                <circle cx="270" cy="12" fill="#4cd7f6" r="3.5" />
              </svg>
            </div>
            <div className="flex items-center justify-between text-outline font-mono-data-sm text-mono-data-sm pt-space-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-primary" />
                Adaptive Router
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-secondary" />
                TOON
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-error" />
                JSON
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Four Design Pillars */}
      <div className="space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight">
              Methodology
            </span>
            <span className="text-outline">/</span>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              Four Design Pillars
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* P1: Structural Adaptability */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                    P1
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Structure First
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-error">
                  account_tree
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Structural Adaptability
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                The router selects per payload shape, not a fixed default.
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  schema
                </span>
                Fig. 2 · 80/20 split
              </span>
              <span>Shape-Dependent Candidates</span>
            </div>
          </div>

          {/* P2: Efficiency vs Suitability */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-primary font-semibold">
                    P2
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Savings vs Fidelity
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-primary">
                  balance
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Efficiency versus Suitability
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                The smallest encoding is not always the correct one.
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  query_stats
                </span>
                ONTO −8.12% deep-nested
              </span>
              <span>No Single Format Wins All</span>
            </div>
          </div>

          {/* P3: Reliability */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                    P3
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Verified Before Trust
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  verified
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Reliability
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Every candidate is type-exact round-trip validated before use.
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  rule
                </span>
                Strict DEC∘ENC == p
              </span>
              <span>Three Bugs Caught</span>
            </div>
          </div>

          {/* P4: Recovery */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                    P4
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Fallback Guarantee
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  emergency
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Recovery
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Guaranteed fallback; never returns a corrupted encoding.
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  workspace_premium
                </span>
                0.0% Fallback Events
              </span>
              <span>Compact as Second-Tier Safety Net</span>
            </div>
          </div>
        </div>
      </div>

      {/* Research Scope & Methodological Boundaries */}
      <div className="space-y-space-md pt-space-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-2xs">
          <div className="space-y-space-3xs">
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              RESEARCH SCOPE
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Boundaries and assumptions behind the measurements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {/* Card 1: Tokenizer Proxy */}
          <div className="rounded-lg bg-surface-container-low p-space-md shadow-md space-y-space-xs group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-caps text-label-caps uppercase text-secondary">
                Boundary 01 · Estimator
              </span>
              <span className="material-symbols-outlined text-[18px]">
                calculate
              </span>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Tokenizer Proxy
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              cl100k_base (tiktoken v0.13.0); ranking holds across o200k_base,
              Mistral-7B, and Qwen2.5-7B.
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-outline flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>4 tokeniser families</span>
            </div>
          </div>

          {/* Card 2: Synthetic vs Production Corpus */}
          <div className="rounded-lg bg-surface-container-low p-space-md shadow-md space-y-space-xs group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-caps text-label-caps uppercase text-secondary">
                Boundary 02 · Sampling
              </span>
              <span className="material-symbols-outlined text-[18px]">
                dataset
              </span>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Synthetic vs Production Corpus
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              200 seeded synthetic payloads from hand-authored category
              templates, not sampled production traffic.
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-outline flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>5 categories × 40</span>
            </div>
          </div>

          {/* Card 3: Downstream Retrieval vs Per-Token Cost */}
          <div className="rounded-lg bg-surface-container-low p-space-md shadow-md space-y-space-xs group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-caps text-label-caps uppercase text-secondary">
                Boundary 03 · Task Utility
              </span>
              <span className="material-symbols-outlined text-[18px]">
                query_stats
              </span>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Downstream Retrieval vs Cost
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Once valid, formats retrieve as reliably as JSON (89.92% / 100% /
              89.03%).
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                check_circle
              </span>
              <span>True task accuracy unmeasured</span>
            </div>
          </div>

          {/* Card 4: Routing Latency Trade-offs (Spans 2 cols on desktop) */}
          <div className="md:col-span-2 rounded-lg bg-surface-container-low p-space-md shadow-md space-y-space-xs group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-caps text-label-caps uppercase text-secondary">
                Boundary 04 · Performance Envelope
              </span>
              <span className="material-symbols-outlined text-[18px]">
                bolt
              </span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-space-md">
              <div className="space-y-space-2xs">
                <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Routing Latency Trade-offs
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Exhaustive ≈2.5 ms vs fixed-format mean ≈0.08 ms; learned
                  stump ≈0.74 ms. One observed sample.
                </p>
              </div>
              <div className="shrink-0 p-space-xs bg-surface-container rounded flex items-center gap-space-md">
                <div className="text-right">
                  <div className="font-mono-data-sm text-mono-data-sm text-outline">
                    Speedup Multiplier
                  </div>
                  <div className="font-headline-md text-headline-md text-secondary font-semibold">
                    ≈3.2–3.9×
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-surface-container-highest" />
                <div>
                  <div className="font-mono-data-sm text-mono-data-sm text-outline">
                    Decision Time
                  </div>
                  <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-medium">
                    ~0.74 ms
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Suboptimal Path Handling */}
          <div className="rounded-lg bg-surface-container-low p-space-md shadow-md space-y-space-xs group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-caps text-label-caps uppercase text-secondary">
                Boundary 05 · Regret Safety
              </span>
              <span className="material-symbols-outlined text-[18px]">
                shield
              </span>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Suboptimal Path Handling
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Zero token regret, zero fallback on the 160/40 holdout (seed 42).
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                check_circle
              </span>
              <span>Depth-1 stump · 100% agreement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reproduction Harness */}
      <div
        className="rounded-xl bg-surface-container p-space-lg shadow-lg space-y-space-md scroll-mt-20"
        id="repro-harness"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
          <div className="space-y-space-3xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps uppercase text-primary">
                Reproduction
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Replicating Table III &amp; Figs. 2–3
            </h3>
          </div>
          <button
            onClick={handleCopyCommand}
            className={`flex items-center gap-space-xs px-space-md py-space-xs rounded transition-all shadow-sm font-mono-data-sm text-mono-data-sm ${
              copyStatus === 'copied'
                ? 'bg-primary text-on-primary'
                : copyStatus === 'error'
                ? 'bg-error text-on-error'
                : 'bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {copyStatus === 'copied' ? 'check' : 'content_copy'}
            </span>
            <span>
              {copyStatus === 'copied'
                ? 'Copied to Clipboard'
                : copyStatus === 'error'
                ? 'Copy Failed'
                : 'Copy Command'}
            </span>
          </button>
        </div>
        <div className="relative rounded-lg bg-surface-container-lowest p-space-md overflow-x-auto shadow-inner">
          <pre className="font-mono-data-sm text-mono-data-sm text-on-surface-variant leading-relaxed select-all">
            {`# generate_benchmark_corpus(size=200, seed=200)
${REPRO_COMMAND}

# Full pytest suite (46 tests); learned-router holdout: 160/40, seed 42.`}
          </pre>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs text-on-surface-variant font-mono-data-sm text-mono-data-sm">
          <div className="flex flex-wrap items-center gap-space-md">
            <a
              className="hover:text-primary transition-colors flex items-center gap-1"
              href="/benchmark"
            >
              <span className="material-symbols-outlined text-[15px]">
                dataset
              </span>
              <span>Dataset Archetypes (N=200 JSON)</span>
            </a>
            <code className="hidden md:inline-flex items-center gap-1 px-space-2xs py-0.5 rounded bg-surface-container-high text-outline font-mono-data-sm text-mono-data-sm">
              {REPRO_COMMAND}
            </code>
          </div>
          <div className="text-outline font-label-caps text-label-caps uppercase">
            Research Prototype · Not Production Software
          </div>
        </div>
      </div>
    </div>
  );
}