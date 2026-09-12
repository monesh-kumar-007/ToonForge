'use client';

import { useState, type MouseEvent } from 'react';

export default function ResearchPage() {
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const REPRO_COMMAND = 'python benchmarks/run_benchmark.py --size 200 --seed 200';

  const scrollToBibtex = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document
      .getElementById('bibtex-drawer')
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

  const handleCopy = async () => {
    const bibtexEl = document.getElementById('bibtex-text');
    if (!bibtexEl) return;
    try {
      await navigator.clipboard.writeText(bibtexEl.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-space-lg max-w-7xl mx-auto w-full space-y-space-xl">
      {/* Top Research Companion Masthead */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="space-y-space-2xs min-w-0">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps uppercase text-secondary bg-surface-container-high px-space-xs py-0.5 rounded shadow-sm">
              Research Preprint
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Research Overview
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            An empirical evaluation of adaptive serialization selection for
            structured LLM context.
          </p>
        </div>
        <div className="flex items-center gap-space-xs shrink-0">
          <a
            className="group flex items-center gap-1.5 px-space-sm py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shadow-sm"
            href="#bibtex-drawer"
            onClick={scrollToBibtex}
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              description
            </span>
            <span className="font-mono-data-sm text-mono-data-sm text-primary">
              Cite: BibTeX
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </a>
        </div>
      </div>

      {/* Paper Title Hero Banner with Subtle Emissive Glow & Lab Artifact Styling */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
        <div className="p-space-lg md:p-space-xl flex flex-col md:flex-row gap-space-lg items-start justify-between relative z-10">
          <div className="space-y-space-sm max-w-4xl">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-secondary font-mono-data-sm text-mono-data-sm">
                TOONFORGE Evaluation
              </span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-data-sm text-mono-data-sm">
                Empirical Evaluation Track
              </span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-mono-data-sm text-mono-data-sm">
                Code: Reproducible Artifact
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Optimizing LLM Context Windows via Structural Data Serialization
            </h2>
            <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-2xs text-on-surface-variant font-body-md text-body-md">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  group
                </span>
                <span className="text-on-surface font-medium">
                  AI Systems Research Group
                </span>
              </div>
              <span className="text-outline">·</span>
              <span className="font-mono-data-sm text-mono-data-sm text-outline">
                Lab for High-Performance Contextual Computing
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
                  Mean Token Reduction
                </div>
              </div>
              <div className="p-space-xs rounded bg-surface-container/60 shadow-sm">
                <div className="font-label-caps text-label-caps text-outline uppercase">
                  Isomorphism
                </div>
                <div className="font-headline-lg text-headline-lg text-primary font-semibold tracking-tight">
                  100.0%
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Round-Trip Exactness
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
                  Speedup vs exhaustive (observed)
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
                  Synthetic Archetypes (seed=200)
                </div>
              </div>
            </div>
          </div>

          {/* Research Visual Element: Compression Topology Sparkline / Isomorphism Visual */}
          <div className="w-full md:w-80 shrink-0 p-space-md rounded-lg bg-surface-container shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between pb-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase">
                Ablation Distribution
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                N=200 · seed=200
              </span>
            </div>
            {/* Visual Distribution Chart Inline SVG */}
            <div className="py-space-xs">
              <svg
                className="w-full h-24 text-primary"
                fill="none"
                viewBox="0 0 280 96"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Grid background lines */}
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
                {/* Baseline Raw JSON curve (Orange/Error-Container muted) */}
                <path
                  d="M 10 70 Q 70 65, 140 68 T 270 66"
                  opacity="0.6"
                  stroke="#ffb4ab"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
                {/* TOON Single format curve (Secondary fixed) */}
                <path
                  d="M 10 52 Q 80 40, 150 46 T 270 38"
                  opacity="0.7"
                  stroke="#4cd7f6"
                  strokeWidth="1.5"
                />
                {/* Adaptive Context Engine (ACE) Optimal Frontier */}
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
                {/* Highlight Nodes */}
                <circle cx="180" cy="20" fill="#adc6ff" r="3.5" />
                <circle cx="270" cy="12" fill="#4cd7f6" r="3.5" />
              </svg>
            </div>
            <div className="flex items-center justify-between text-outline font-mono-data-sm text-mono-data-sm pt-space-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-primary" />
                ACE Adaptive
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-secondary" />
                Static TOON
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-error" />
                Raw JSON
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Structured 4-Quadrant Academic Grid */}
      <div className="space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight">
              Methodological Framework
            </span>
            <span className="text-outline">/</span>
            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              FOUR-QUADRANT CORE ARCHITECTURE
            </span>
          </div>
          <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">
            Formal Axioms
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* Q1: Problem */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                    Q1
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Empirical Bottleneck
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-error">
                  format_image_left
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                1. The Problem
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Structured data consumes excessive token context through repeated
                key strings, nesting punctuation, and whitespace overhead,
                crowding out model reasoning space.
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  trending_up
                </span>
                Structural Token Overhead
              </span>
              <span>JSON/YAML Overhead</span>
            </div>
          </div>

          {/* Q2: Research Gap */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-primary font-semibold">
                    Q2
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Literature Void
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-primary">
                  rule
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                2. Research Gap
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Prior work commonly assumes a single format (JSON or TOON) is
                universally superior. In practice, no single compact format is
                optimal across all payload shapes without semantic breakage.
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  sync_problem
                </span>
                Format Heterogeneity
              </span>
              <span>Zero-One Fallacy</span>
            </div>
          </div>

          {/* Q3: Approach */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                    Q3
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Methodology
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  alt_route
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                3. Approach
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                A four-stage adaptive pipeline: Structural Profiling →
                Viability Generation → Round-Trip Isomorphism Assertion →
                Token-Optimal Selection with Zero-Degradation Guardrails.
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  schema
                </span>
                4-Stage Verified Flow
              </span>
              <span>Invariant Guardrails</span>
            </div>
          </div>

          {/* Q4: Core Contribution */}
          <div className="rounded-lg bg-surface-container p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                    Q4
                  </span>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    Primary Findings
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  verified
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                4. Core Contribution
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                A reliability-first adaptive router that delivers an
                average of 46.26% token reduction over raw JSON while maintaining
                100% semantic fidelity on the canonical synthetic corpus
                (N=200, seed=200).
              </p>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between font-mono-data-sm text-mono-data-sm text-outline">
              <span className="text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  workspace_premium
                </span>
                46.26% Net Efficiency
              </span>
              <span>100% Isomorphic Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Research Scope & Methodological Boundaries */}
      <div className="space-y-space-md pt-space-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-2xs">
          <div className="space-y-space-3xs">
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              RESEARCH SCOPE &amp; METHODOLOGICAL BOUNDARIES
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Explicit theoretical boundaries, assumptions, and validity
              envelopes for empirical reproducibility.
            </p>
          </div>
          <div className="flex items-center gap-space-xs shrink-0">
            <span className="font-mono-data-sm text-mono-data-sm text-outline px-space-xs py-0.5 rounded bg-surface-container">
              Ablation Set: STABLE
            </span>
          </div>
        </div>

        {/* Professional Technical Boundary Cards */}
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
              Token counts in this study use the GPT-4/GPT-3.5 `cl100k_base`
              tokenizer (pinned v0.13.0); variance across other vocabularies
              exists.
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-outline flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>tiktoken cl100k_base v0.13.0</span>
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
              Benchmark evaluated on 200 parameterized synthetic payloads
              (seed=200) reflecting realistic API traffic archetypes.
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-outline flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>5 categories × 40 samples (flat_tabular · nested_objects · deep_nested · heterogeneous · key_sparse)</span>
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
              Token count reduction is a direct context efficiency proxy;
              downstream task QA accuracy depends on model prompt formatting.
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-outline flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>Context-Window Headroom Optimization Target</span>
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
                  Exhaustive routing adds ~1.7–2.2ms; the learned tree router
                  reduces this to ~0.04–0.6ms with 100% agreement on the
                  deterministic holdout (measured in this environment).
                </p>
              </div>
              {/* Quantitative micro visual gauge */}
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
                    ~0.04–0.6ms
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline flex items-center gap-1.5">
              <span className="text-primary font-medium">
                Decision Path:
              </span>
              <span>
                Structural Profiling → Decision-Tree Inference →
                Routed Selection (validity-first)
              </span>
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
              Learned classifier attains zero token regret with zero
              validity violations on the deterministic synthetic holdout.
            </p>
            <div className="pt-space-xs font-mono-data-sm text-mono-data-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                check_circle
              </span>
              <span>
                Loss Metric: 0 Token Regret (100% Holdout Agreement)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Academic BibTeX Drawer / Citation Utility */}
      <div
        className="rounded-xl bg-surface-container p-space-lg shadow-lg space-y-space-md scroll-mt-20"
        id="bibtex-drawer"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
          <div className="space-y-space-3xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps uppercase text-primary">
                BibTeX Citation Spec
              </span>
              <span className="px-space-2xs py-0.5 rounded bg-surface-container-highest text-outline font-mono-data-sm text-mono-data-sm">
                Preprint Reference
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Citing this Empirical Artifact
            </h3>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-space-xs px-space-md py-space-xs rounded transition-all shadow-sm font-mono-data-sm text-mono-data-sm ${
              copied
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              content_copy
            </span>
            <span>{copied ? 'Copied to Clipboard' : 'Copy BibTeX'}</span>
          </button>
        </div>
        <div className="relative rounded-lg bg-surface-container-lowest p-space-md overflow-x-auto shadow-inner">
          <pre
            className="font-mono-data-sm text-mono-data-sm text-on-surface-variant leading-relaxed select-all"
            id="bibtex-text"
          >
            {`@misc{toonforge_serialization_preprint,
  title       = {Optimizing LLM Context Windows via Structural Data Serialization},
  author      = {AI Systems Research Group},
  howpublished = {Preprint (in preparation)},
  note        = {No arXiv ID or DOI assigned yet. Companion artifact of the TOONFORGE serialization engine.},
  abstract    = {Evaluates adaptive serialization across a synthetic 200-payload corpus (seed=200), achieving 46.26% mean token reduction with 100% round-trip validity.}
}`}
          </pre>
        </div>
        {/* Supplementary Research Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs text-on-surface-variant font-mono-data-sm text-mono-data-sm">
          <div className="flex flex-wrap items-center gap-space-md">
            <span
              className="flex items-center gap-1 text-outline"
              title="No manuscript PDF is published yet. Use the BibTeX citation above."
            >
              <span className="material-symbols-outlined text-[15px]">
                hourglass_empty
              </span>
              <span>PDF — in preparation</span>
            </span>
            <a
              className="hover:text-primary transition-colors flex items-center gap-1"
              href="/benchmark"
            >
              <span className="material-symbols-outlined text-[15px]">
                dataset
              </span>
              <span>Dataset Archetypes (N=200 JSON)</span>
            </a>
            <button
              type="button"
              onClick={handleCopyCommand}
              title={`Local reproduction command:\n${REPRO_COMMAND}`}
              className="bg-transparent p-0 border-0 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-mono-data-sm text-mono-data-sm"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copyStatus === 'copied' ? 'check' : 'terminal'}
              </span>
              <span>
                {copyStatus === 'copied'
                  ? 'Copied to Clipboard'
                  : copyStatus === 'error'
                  ? 'Copy Failed'
                  : 'Reproduction Harness'}
              </span>
            </button>
            <code className="hidden md:inline-flex items-center gap-1 px-space-2xs py-0.5 rounded bg-surface-container-high text-outline font-mono-data-sm text-mono-data-sm">
              python benchmarks/run_benchmark.py --size 200 --seed 200
            </code>
          </div>
          <div className="text-outline font-label-caps text-label-caps uppercase">
            Open-Access Research License (CC BY 4.0)
          </div>
        </div>
      </div>
    </div>
  );
}
