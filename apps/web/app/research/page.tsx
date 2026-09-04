'use client';

import React, { useState } from 'react';

const BIBTEX = `@article{toonforge2024adaptive,
  title={Adaptive Structure-Aware Routing for LLM Context Serialization: An Implemented and Empirically Benchmarked Architecture Unifying JSON, TOON, JTON, and ONTO},
  author={AI Systems Research Group},
  journal={arXiv preprint arXiv:2408.0124},
  year={2024},
  archivePrefix={arXiv},
  eprint={2408.0124},
  primaryClass={cs.AI}
}`;

export default function ResearchPage() {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(BIBTEX);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full pb-16 px-8 pt-8 max-w-7xl mx-auto space-y-8">
      {/* Companion Masthead */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded shadow-sm font-semibold uppercase tracking-widest">
              Peer Review Preprint
            </span>
            <span className="font-mono text-xs text-outline">DOC-ID: TOONFORGE-PPR-2024.08</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
            Research Overview & Methodology
          </h1>
          <p className="font-sans text-xs text-on-surface-variant max-w-3xl leading-relaxed">
            An implemented and empirically benchmarked architecture unifying JSON, TOON, JTON, and ONTO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary bg-surface-container px-3 py-1.5 rounded border border-outline-variant/30">
            arXiv:2408.0124 [cs.AI, cs.SE]
          </span>
        </div>
      </div>

      {/* Official Paper Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-xl p-8 space-y-6">
        <div className="space-y-3 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-semibold">
              Conference Submission · 2024
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
              Empirical Evaluation Track
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-bold">
              Code: Reproducible Artifact v1.0
            </span>
          </div>

          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface tracking-tight leading-snug">
            Adaptive Structure-Aware Routing for LLM Context Serialization: An Implemented and Empirically Benchmarked Architecture Unifying JSON, TOON, JTON, and ONTO
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant font-sans text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">group</span>
              <span className="text-on-surface font-semibold">AI Systems Research Group</span>
            </div>
            <span className="text-outline">·</span>
            <span className="font-mono text-outline">Lab for High-Performance Contextual Computing</span>
          </div>
        </div>

        {/* Quantitative Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-surface-container/60 border border-outline-variant/15 shadow-sm">
            <div className="font-mono text-[10px] text-outline uppercase font-semibold">Context Saving</div>
            <div className="font-headline text-2xl text-secondary font-bold tracking-tight">46.3%</div>
            <div className="font-sans text-[11px] text-on-surface-variant">Mean Token Reduction</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-container/60 border border-outline-variant/15 shadow-sm">
            <div className="font-mono text-[10px] text-outline uppercase font-semibold">Isomorphism</div>
            <div className="font-headline text-2xl text-primary font-bold tracking-tight">100.0%</div>
            <div className="font-sans text-[11px] text-on-surface-variant">Round-Trip Exactness</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-container/60 border border-outline-variant/15 shadow-sm">
            <div className="font-mono text-[10px] text-outline uppercase font-semibold">Learned Latency</div>
            <div className="font-headline text-2xl text-on-surface font-bold tracking-tight">~0.5 ms</div>
            <div className="font-sans text-[11px] text-on-surface-variant">Tree Classifier P99</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-container/60 border border-outline-variant/15 shadow-sm">
            <div className="font-mono text-[10px] text-outline uppercase font-semibold">Evaluated Set</div>
            <div className="font-headline text-2xl text-on-surface font-bold tracking-tight">N = 200</div>
            <div className="font-sans text-[11px] text-on-surface-variant">Production Archetypes</div>
          </div>
        </div>
      </div>

      {/* 4-Quadrant Academic Methodology Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-headline text-lg font-bold text-on-surface">Methodological Framework</span>
            <span className="text-outline">/</span>
            <span className="font-mono text-xs text-outline">FOUR-QUADRANT CORE ARCHITECTURE</span>
          </div>
          <span className="font-mono text-[10px] text-secondary uppercase font-bold tracking-wider">
            Formal Axioms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Q1 */}
          <div className="rounded-xl bg-surface-container p-6 shadow-md border border-outline-variant/15 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono text-xs text-secondary font-bold">
                    Q1
                  </span>
                  <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                    Empirical Bottleneck
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-rose-400">format_image_left</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface">1. The Problem</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Structured data in LLM prompt contexts incurs massive token inflation due to repeating
                attribute keys, structural brackets, quotes, and indentation whitespace. This crowds out
                model reasoning capacity and accelerates inference costs.
              </p>
            </div>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between font-mono text-xs text-outline">
              <span className="text-rose-400 flex items-center gap-1 font-semibold">
                Context Overhead: +40% to +80%
              </span>
              <span>JSON/YAML Over-Encoding</span>
            </div>
          </div>

          {/* Q2 */}
          <div className="rounded-xl bg-surface-container p-6 shadow-md border border-outline-variant/15 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono text-xs text-primary font-bold">
                    Q2
                  </span>
                  <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                    Literature Void
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-primary">search</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface">2. The Research Gap</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Existing work focuses on static format proposals (e.g. YAML, CSV, TOON) in isolation.
                Prior literature lacks an adaptive selector that accounts for structural diversity,
                silent type coercion failures, and strict round-trip isomorphism guarantees.
              </p>
            </div>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between font-mono text-xs text-outline">
              <span className="text-primary flex items-center gap-1 font-semibold">
                Critical Gap: No Adaptive Unification
              </span>
              <span>Static Format Fragility</span>
            </div>
          </div>

          {/* Q3 */}
          <div className="rounded-xl bg-surface-container p-6 shadow-md border border-outline-variant/15 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono text-xs text-secondary font-bold">
                    Q3
                  </span>
                  <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                    Engine Innovation
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-secondary">alt_route</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface">3. Key Contribution</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                An implemented adaptive architecture that extracts 19 topological AST features,
                speculatively encodes candidates across 5 dialects (JSON, Compact JSON, TOON, JTON, ONTO),
                and filters strictly through an automated semantic isomorphism validator.
              </p>
            </div>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between font-mono text-xs text-outline">
              <span className="text-secondary flex items-center gap-1 font-semibold">
                Innovation: Adaptive Router + Tree Fast-Path
              </span>
              <span>5 Unified Dialects</span>
            </div>
          </div>

          {/* Q4 */}
          <div className="rounded-xl bg-surface-container p-6 shadow-md border border-outline-variant/15 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center font-mono text-xs text-emerald-400 font-bold">
                    Q4
                  </span>
                  <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                    Empirical Grounding
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-emerald-400">insights</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface">4. Core Findings</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Fixed non-JSON serializers experience 60–80% defect rates when applied to arbitrary payloads.
                In contrast, Adaptive Routing achieves 46.3% mean token reduction (63.4% on tables) with
                100% validity and 0% final fallbacks.
              </p>
            </div>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between font-mono text-xs text-outline">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                Result: 46.3% Reduction · 100% Valid
              </span>
              <span>N=200 Empirical Corpus</span>
            </div>
          </div>
        </div>
      </section>

      {/* BibTeX Citation Section */}
      <section className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">format_quote</span>
            <h3 className="font-headline text-base font-bold text-on-surface">
              Cite This Research
            </h3>
          </div>
          <button
            onClick={handleCopyBibtex}
            className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded border border-outline-variant/30 font-mono text-xs text-secondary transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy BibTeX'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 font-mono text-xs text-on-surface-variant overflow-x-auto leading-relaxed">
          {BIBTEX}
        </pre>
      </section>
    </div>
  );
}
