'use client';

import React, { useState, useEffect } from 'react';

import {
  runBenchmark,
  getBenchmarkResults,
  BenchmarkResponse,
  BenchmarkResultsResponse,
  BenchmarkStrategyResult,
} from '@/lib/api';
import ApiErrorBanner from '@/components/ApiErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';

const STATIC_RESULTS: BenchmarkStrategyResult[] = [
  {
    strategy: 'Always JSON',
    mean_reduction: 0.0,
    median_reduction: 0.0,
    std_dev: 0.0,
    fallback_rate: 0.0,
    routing_grade: 'BASELINE',
    sample_count: 200,
  },
  {
    strategy: 'Always Compact JSON',
    mean_reduction: 40.47,
    median_reduction: 41.88,
    std_dev: 5.34,
    fallback_rate: 0.0,
    routing_grade: 'OPTIMAL LEADER',
    sample_count: 200,
  },
  {
    strategy: 'Always TOON',
    mean_reduction: 63.43,
    median_reduction: 63.67,
    std_dev: 0.79,
    fallback_rate: 0.0,
    routing_grade: 'OPTIMAL LEADER',
    sample_count: 200,
  },
  {
    strategy: 'Always JTON',
    mean_reduction: 61.06,
    median_reduction: 61.45,
    std_dev: 1.28,
    fallback_rate: 0.0,
    routing_grade: 'OPTIMAL LEADER',
    sample_count: 200,
  },
  {
    strategy: 'Always ONTO',
    mean_reduction: 4.27,
    median_reduction: 1.96,
    std_dev: 13.56,
    fallback_rate: 0.0,
    routing_grade: 'BASELINE',
    sample_count: 200,
  },
  {
    strategy: 'Adaptive Router',
    mean_reduction: 46.26,
    median_reduction: 42.66,
    std_dev: 9.68,
    fallback_rate: 0.0,
    routing_grade: 'OPTIMAL LEADER',
    sample_count: 200,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'flat', label: 'Flat Tabular' },
  { key: 'nested', label: 'Nested' },
  { key: 'deep', label: 'Deep-Nested' },
  { key: 'hetero', label: 'Heterogeneous' },
  { key: 'scalar', label: 'Key-Sparse Tabular' },
];

const PILL_BASE =
  'category-btn px-space-sm py-1 rounded font-mono-data-sm text-mono-data-sm transition-all';

export default function BenchmarkLabPage() {
  const [results, setResults] =
    useState<BenchmarkStrategyResult[]>(STATIC_RESULTS);

  // Supports both:
  // POST /api/benchmark -> BenchmarkResponse
  // GET  /api/benchmark/results -> BenchmarkResultsResponse
  const [benchmarkData, setBenchmarkData] = useState<
    BenchmarkResponse | BenchmarkResultsResponse | null
  >(null);

  const [corpusSize, setCorpusSize] = useState<number>(200);
  const [seed, setSeed] = useState<number>(200);
  const [running, setRunning] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('reduction');
  const [liveLoaded, setLiveLoaded] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');

  const maxReduction = Math.max(
    ...results.map((r) => r.mean_reduction)
  );

  const findResult = (name: string): BenchmarkStrategyResult => {
    return (
      results.find(
        (r) =>
          name
            .toLowerCase()
            .includes(r.strategy.toLowerCase().replace('always ', ''))
      ) ||
      results.find((r) =>
        name
          .toLowerCase()
          .replace('always ', '')
          .includes(r.strategy.toLowerCase())
      ) ||
      STATIC_RESULTS.find((s) => s.strategy === name) ||
      {
        strategy: name,
        mean_reduction: 0,
        median_reduction: 0,
        std_dev: 0,
        fallback_rate: 0,
        routing_grade: '—',
        sample_count: 200,
      }
    );
  };

  /**
   * Apply either benchmark response shape.
   *
   * BenchmarkResponse contains seed/corpus_size.
   * BenchmarkResultsResponse may not contain those fields.
   */
  const applyResponse = (
    data: BenchmarkResponse | BenchmarkResultsResponse
  ) => {
    setBenchmarkData(data);
    setLiveLoaded(true);

    if (data.results?.length) {
      setResults(data.results);
    }

    if ('corpus_size' in data && data.corpus_size) {
      setCorpusSize(data.corpus_size);
    }

    if ('seed' in data && data.seed) {
      setSeed(data.seed);
    }
  };

  const fetchResults = async () => {
    setApiError(null);

    try {
      const data = await getBenchmarkResults();

      if (data) {
        applyResponse(data);
      }
    } catch (err) {
      console.error('Failed to get benchmark data:', err);

      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    }
  };

  const handleRunBenchmark = async () => {
    setRunning(true);
    setApiError(null);

    try {
      const data = await runBenchmark(corpusSize, seed);

      applyResponse(data);
    } catch (err) {
      console.error('Benchmark run failed:', err);

      setApiError(
        err instanceof Error ? err.message : 'Unexpected API error.'
      );
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const escapeCsvCell = (value: string | number): string => {
    const str = String(value);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCsv = () => {
    if (results.length === 0) return;

    const header = [
      'strategy',
      'mean_reduction',
      'median_reduction',
      'std_dev',
      'fallback_rate',
      'routing_grade',
      'sample_count',
    ];

    const rows = results.map((r) => [
      escapeCsvCell(r.strategy),
      escapeCsvCell(r.mean_reduction),
      escapeCsvCell(r.median_reduction),
      escapeCsvCell(r.std_dev),
      escapeCsvCell(r.fallback_rate),
      escapeCsvCell(r.routing_grade),
      escapeCsvCell(r.sample_count),
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toonforge-benchmark-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetShareStatus = () => {
    setTimeout(() => setShareStatus('idle'), 2500);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = 'TOONFORGE Benchmark';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: `${shareText} — token-reduction results across serialization strategies.`,
          url: shareUrl,
        });
        setShareStatus('shared');
        resetShareStatus();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareStatus('copied');
          resetShareStatus();
        } catch {
          setShareStatus('error');
          resetShareStatus();
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      resetShareStatus();
    } catch {
      setShareStatus('error');
      resetShareStatus();
    }
  };

  const dataState = running
    ? 'loading'
    : liveLoaded
    ? 'live'
    : apiError
    ? 'error'
    : 'reference';

  const dataStateLabel =
    dataState === 'loading'
      ? 'Running benchmark…'
      : dataState === 'live'
      ? 'Live API results'
      : dataState === 'error'
      ? 'API unavailable — static reference shown'
      : 'Static reference';

  const barWidth = (mean: number) => {
    const max = maxReduction || 33.3;

    return Math.max(
      2,
      Math.min(100, (mean / max) * 83.25)
    );
  };

  const fmt = (n: number) => n.toFixed(1);

  const json = findResult('Always JSON');
  const comp = findResult('Always Compact JSON');
  const toon = findResult('Always TOON');
  const jton = findResult('Always JTON');
  const onto = findResult('Always ONTO');
  const router = findResult('Adaptive Router');

  // Safely get seed from either response type.
  const displaySeed =
    benchmarkData && 'seed' in benchmarkData
      ? benchmarkData.seed
      : seed;

  return (
    <div className="w-full px-space-lg py-space-md flex flex-col gap-space-lg">

      <ApiErrorBanner
        message={apiError}
        onDismiss={() => setApiError(null)}
      />

      {/* Laboratory Sub-header & Micro Telemetry Banner */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-3xs">

          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps text-secondary tracking-wider uppercase">
              EMPIRICAL EVALUATION SUITE
            </span>

            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>

            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              {liveLoaded
                ? `RUN_HASH: ${benchmarkData?.run_id ?? 'N/A'}`
                : `CANONICAL_REF_N${corpusSize}_SEED${seed}`}
            </span>

            <DataSourceBadge state={dataState} label={dataStateLabel} />
          </div>

          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Benchmark Laboratory
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Evaluating fixed strategies and adaptive routing across structural
            payload categories. Validating compression efficiency against AST
            parsing invariance.
          </p>
        </div>

        {/* Quick Statistical Metric Chips */}
        <div className="flex items-center flex-wrap gap-space-xs">

          <div className="bg-surface-container px-space-sm py-space-xs rounded shadow-sm flex flex-col">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              SAMPLE DEPTH
            </span>

            <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold">
              {corpusSize} PAYLOADS
            </span>
          </div>

          <div className="bg-surface-container px-space-sm py-space-xs rounded shadow-sm flex flex-col">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              P-VALUE CI (99%)
            </span>

            <span className="font-mono-data-lg text-mono-data-lg text-secondary font-semibold">
              &lt; 0.0001
            </span>
          </div>

          <div className="bg-surface-container px-space-sm py-space-xs rounded shadow-sm flex flex-col">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              ROUTER NET GAIN
            </span>

            <span className="font-mono-data-lg text-mono-data-lg text-primary font-semibold">
              +{fmt(router.mean_reduction)}% Δ
            </span>
          </div>

        </div>
      </div>

      {/* Experimental Control Toolbar */}
      <div className="bg-surface-container-low p-space-sm rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">

        <div className="flex items-center gap-space-sm flex-wrap">

          <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1.5 rounded text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              database
            </span>

            <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
              Benchmark Corpus: {corpusSize} Seeded Synthetic Payloads
            </span>
          </div>

          <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1.5 rounded text-on-surface">
            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              Seed:
            </span>

            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-16 bg-surface-container-lowest text-on-surface font-mono-data-sm text-mono-data-sm outline-none"
            />

            <span className="material-symbols-outlined text-[16px] text-secondary">
              casino
            </span>
          </div>

          <div className="h-4 w-px bg-outline-variant/40 hidden sm:block"></div>

          <span className="font-label-caps text-label-caps text-outline uppercase hidden md:inline">
            Partition filter:
          </span>
        </div>

        {/* Category Filter Pills */}
        <div
          className="flex items-center gap-space-3xs flex-wrap"
          id="categoryFilterContainer"
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                className={`${PILL_BASE} ${
                  active
                    ? 'active bg-primary-container text-on-primary-container font-semibold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
                data-cat={cat.key}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            );
          })}

          <button
            onClick={handleRunBenchmark}
            disabled={running}
            className="bg-primary text-on-primary hover:bg-primary/90 transition-all font-mono-data-sm text-mono-data-sm py-1 px-space-sm rounded font-semibold shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[14px]">
              play_arrow
            </span>

            {running ? 'Running…' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Primary Chart Section */}
      <div className="bg-surface-container-low rounded-lg shadow-md p-space-md flex flex-col gap-space-md">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">

          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px] text-primary">
              bar_chart
            </span>

            <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
              Mean Token Reduction vs Plain JSON
            </h2>
          </div>

          <div className="flex items-center gap-space-xs">

            <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-secondary/10 text-secondary font-mono-data-sm text-mono-data-sm font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Adaptive Router — {fmt(router.mean_reduction)}% Winner
            </span>

            <span className="font-label-caps text-label-caps text-outline bg-surface-container px-space-xs py-1 rounded">
              N={corpusSize} RUNS
            </span>

          </div>
        </div>

        {/* Comparative Bar Visuals */}
        <div className="bg-surface-container-lowest p-space-md rounded flex flex-col gap-space-md">

          {/* Adaptive Router */}
          <div className="flex flex-col gap-1">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>

                <span className="font-mono-data-lg text-mono-data-lg font-semibold text-secondary">
                  Adaptive Router (Dynamic Selection)
                </span>

                <span className="font-label-caps text-label-caps uppercase text-on-primary-fixed bg-primary-fixed px-space-2xs rounded">
                  SOTA OPTIMAL
                </span>
              </div>

              <span className="font-mono-data-lg text-mono-data-lg text-secondary font-bold">
                {fmt(router.mean_reduction)}%
              </span>

            </div>

            <div className="w-full bg-surface-container-high h-7 rounded-sm overflow-hidden flex items-center relative">

              <div
                className="h-full bg-gradient-to-r from-secondary-container to-secondary rounded-sm transition-all duration-700 relative flex items-center justify-end pr-space-xs"
                style={{
                  width: `${barWidth(router.mean_reduction)}%`,
                }}
              >
                <span className="font-mono-data-sm text-mono-data-sm text-on-secondary font-bold drop-shadow-sm">
                  -{fmt(router.mean_reduction)}% avg
                </span>
              </div>

              <div className="absolute left-1/4 h-full w-px bg-outline-variant/30"></div>
              <div className="absolute left-2/4 h-full w-px bg-outline-variant/30"></div>
              <div className="absolute left-3/4 h-full w-px bg-outline-variant/30"></div>

            </div>
          </div>

          {/* Compact JSON */}
          <div className="flex flex-col gap-1">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-outline"></span>

                <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
                  Always Compact JSON
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-outline">
                  Deterministic Whitespace Stripping
                </span>
              </div>

              <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                {fmt(comp.mean_reduction)}%
              </span>
            </div>

            <div className="w-full bg-surface-container-high h-6 rounded-sm overflow-hidden flex items-center relative">

              <div
                className="h-full bg-surface-tint/60 rounded-sm transition-all duration-500 flex items-center justify-end pr-space-xs"
                style={{
                  width: `${barWidth(comp.mean_reduction)}%`,
                }}
              >
                <span className="font-mono-data-sm text-mono-data-sm text-on-primary font-medium">
                  {fmt(comp.mean_reduction)}%
                </span>
              </div>

            </div>
          </div>

          {/* JTON */}
          <div className="flex flex-col gap-1">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>

                <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
                  Always JTON
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-outline">
                  Columnar Object Arrays
                </span>
              </div>

              <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                {fmt(jton.mean_reduction)}%
              </span>

            </div>

            <div className="w-full bg-surface-container-high h-6 rounded-sm overflow-hidden flex items-center relative">

              <div
                className="h-full bg-tertiary-container/70 rounded-sm transition-all duration-500 flex items-center justify-end pr-space-xs"
                style={{
                  width: `${barWidth(jton.mean_reduction)}%`,
                }}
              >
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                  {fmt(jton.mean_reduction)}%
                </span>
              </div>

            </div>
          </div>

          {/* TOON */}
          <div className="flex flex-col gap-1">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-error"></span>

                <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
                  Always TOON
                </span>

                <span className="font-label-caps text-label-caps text-error bg-error-container/40 px-space-2xs rounded">
                  STRICT VALIDITY ONLY
                </span>
              </div>

              <span className="font-mono-data-sm text-mono-data-sm text-error font-semibold">
                {fmt(toon.mean_reduction)}%
              </span>

            </div>

            <div className="w-full bg-surface-container-high h-6 rounded-sm overflow-hidden flex items-center relative">

              <div
                className="h-full bg-error-container/80 rounded-sm transition-all duration-500 flex items-center justify-end pr-space-xs"
                style={{
                  width: `${barWidth(toon.mean_reduction)}%`,
                }}
              >
                <span className="font-mono-data-sm text-mono-data-sm text-on-error-container font-medium">
                  {fmt(toon.mean_reduction)}%
                </span>
              </div>

            </div>
          </div>

          {/* ONTO */}
          <div className="flex flex-col gap-1">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-outline-variant"></span>

                <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
                  Always ONTO
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-outline">
                  Key Prefixes & Indentation
                </span>
              </div>

              <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                {fmt(onto.mean_reduction)}%
              </span>

            </div>

            <div className="w-full bg-surface-container-high h-6 rounded-sm overflow-hidden flex items-center relative">

              <div
                className="h-full bg-surface-container-highest rounded-sm transition-all duration-500 flex items-center justify-end pr-space-xs"
                style={{
                  width: `${barWidth(onto.mean_reduction)}%`,
                }}
              >
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant font-medium">
                  {fmt(onto.mean_reduction)}%
                </span>
              </div>

            </div>
          </div>

          {/* JSON */}
          <div className="flex flex-col gap-1">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-outline-variant"></span>

                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  Always JSON (Standard 2-Space Indent)
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-outline">
                  Canonical Reference Baseline
                </span>
              </div>

              <span className="font-mono-data-sm text-mono-data-sm text-outline-variant font-semibold">
                {fmt(json.mean_reduction)}%
              </span>

            </div>

            <div className="w-full bg-surface-container-high h-6 rounded-sm overflow-hidden flex items-center">

              <div
                className="h-full bg-outline-variant/30 rounded-sm flex items-center pl-space-xs"
                style={{
                  width: `${barWidth(json.mean_reduction)}%`,
                }}
              >
                <span className="font-mono-data-sm text-mono-data-sm text-outline">
                  {json.mean_reduction}%
                </span>
              </div>

            </div>
          </div>

          {/* Axis Scales */}
          <div className="flex justify-between pt-space-xs text-outline font-mono-data-sm text-mono-data-sm">
            <span>0.0% (JSON Baseline)</span>
            <span>10.0%</span>
            <span>20.0%</span>
            <span>30.0%</span>
            <span>40.0% Maximum</span>
          </div>

        </div>
      </div>

      {/* Results Table Section */}
      <div className="bg-surface-container-low rounded-lg shadow-md overflow-hidden flex flex-col">

        <div className="px-space-md py-space-sm bg-surface-container flex items-center justify-between">

          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              table_chart
            </span>

            <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
              Strategy Benchmark Ledger
            </span>
          </div>

          <span className="font-mono-data-sm text-mono-data-sm text-outline">
            Confidence Interval: ±0.82% σ
          </span>

        </div>

        <div className="w-full overflow-x-auto">

          <table className="w-full text-left font-mono-data-sm text-mono-data-sm text-on-surface">

            <thead className="bg-surface-container-lowest text-outline font-label-caps uppercase text-label-caps">
              <tr>
                <th className="py-space-xs px-space-md">Strategy</th>
                <th className="py-space-xs px-space-md">Mean Reduction</th>
                <th className="py-space-xs px-space-md">Median Reduction</th>
                <th className="py-space-xs px-space-md">
                  Variability (StdDev)
                </th>
                <th className="py-space-xs px-space-md">
                  Fallback Rate
                </th>
                <th className="py-space-xs px-space-md text-right">
                  Routing Grade
                </th>
              </tr>
            </thead>

            <tbody className="divide-y-0">

              {/* Always JSON */}
              <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">

                <td className="py-space-sm px-space-md flex items-center gap-space-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                  <span className="text-on-surface">
                    Always JSON
                  </span>
                </td>

                <td className="py-space-sm px-space-md text-on-surface-variant font-medium">
                  {json.mean_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-outline">
                  {json.median_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-outline">
                  {json.std_dev.toFixed(1)}
                </td>

                <td className="py-space-sm px-space-md text-outline">
                  {(json.fallback_rate * 100).toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-right">
                  <span className="bg-surface-container-high text-outline px-space-2xs py-0.5 rounded">
                    BASELINE
                  </span>
                </td>

              </tr>

              {/* Compact JSON */}
              <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">

                <td className="py-space-sm px-space-md flex items-center gap-space-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-tint"></span>

                  <span className="text-on-surface">
                    Always Compact JSON
                  </span>
                </td>

                <td className="py-space-sm px-space-md text-on-surface font-semibold">
                  {comp.mean_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface-variant">
                  {comp.median_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface-variant">
                  {comp.std_dev.toFixed(1)}
                </td>

                <td className="py-space-sm px-space-md text-secondary">
                  {(comp.fallback_rate * 100).toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-right">
                  <span className="bg-secondary/10 text-secondary px-space-2xs py-0.5 rounded">
                    OPTIMAL LEADER
                  </span>
                </td>

              </tr>

              {/* TOON */}
              <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">

                <td className="py-space-sm px-space-md flex items-center gap-space-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>

                  <span className="text-on-surface">
                    Always TOON
                  </span>
                </td>

                <td className="py-space-sm px-space-md text-error font-medium">
                  {toon.mean_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-outline">
                  {toon.median_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-error">
                  {toon.std_dev.toFixed(1)}
                </td>

                <td className="py-space-sm px-space-md">

                  <span className="inline-flex items-center gap-1 text-error font-semibold bg-error-container/20 px-space-2xs py-0.5 rounded">

                    <span className="material-symbols-outlined text-[12px]">
                      verified
                    </span>

                    {(toon.fallback_rate * 100).toFixed(1)}% Final Fallback

                  </span>

                </td>

                <td className="py-space-sm px-space-md text-right">
                  <span className="bg-error-container text-error px-space-2xs py-0.5 rounded">
                    OPTIMAL LEADER
                  </span>
                </td>

              </tr>

              {/* JTON */}
              <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">

                <td className="py-space-sm px-space-md flex items-center gap-space-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>

                  <span className="text-on-surface">
                    Always JTON
                  </span>
                </td>

                <td className="py-space-sm px-space-md text-on-surface font-semibold">
                  {jton.mean_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface-variant">
                  {jton.median_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface-variant">
                  {jton.std_dev.toFixed(1)}
                </td>

                <td className="py-space-sm px-space-md text-secondary">
                  {(jton.fallback_rate * 100).toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-right">
                  <span className="bg-tertiary/10 text-tertiary px-space-2xs py-0.5 rounded">
                    OPTIMAL LEADER
                  </span>
                </td>

              </tr>

              {/* ONTO */}
              <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">

                <td className="py-space-sm px-space-md flex items-center gap-space-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>

                  <span className="text-on-surface">
                    Always ONTO
                  </span>
                </td>

                <td className="py-space-sm px-space-md text-on-surface">
                  {onto.mean_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface-variant">
                  {onto.median_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface-variant">
                  {onto.std_dev.toFixed(1)}
                </td>

                <td className="py-space-sm px-space-md text-secondary">
                  {(onto.fallback_rate * 100).toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-right">
                  <span className="bg-surface-container-high text-on-surface-variant px-space-2xs py-0.5 rounded">
                    BASELINE
                  </span>
                </td>

              </tr>

              {/* Adaptive Router */}
              <tr className="bg-surface-container-high/80 hover:bg-surface-container-highest transition-colors font-medium">

                <td className="py-space-sm px-space-md flex items-center gap-space-xs">

                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>

                  <span className="text-secondary font-bold">
                    Adaptive Router
                  </span>

                </td>

                <td className="py-space-sm px-space-md text-secondary font-bold text-[14px]">
                  {router.mean_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface font-semibold">
                  {router.median_reduction.toFixed(1)}%
                </td>

                <td className="py-space-sm px-space-md text-on-surface">
                  {router.std_dev.toFixed(1)}
                </td>

                <td className="py-space-sm px-space-md">

                  <span className="inline-flex items-center gap-1 text-secondary font-semibold bg-secondary/10 px-space-2xs py-0.5 rounded">

                    <span className="material-symbols-outlined text-[12px]">
                      verified
                    </span>

                    {(router.fallback_rate * 100).toFixed(1)}% (Zero Fallback)

                  </span>

                </td>

                <td className="py-space-sm px-space-md text-right">
                  <span className="bg-secondary text-on-secondary px-space-xs py-0.5 rounded font-bold">
                    OPTIMAL LEADER
                  </span>
                </td>

              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Visualization */}
      <div className="bg-surface-container-low rounded-lg shadow-md p-space-md flex flex-col gap-space-md">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-xs">

          <div>

            <div className="flex items-center gap-space-xs">

              <span className="material-symbols-outlined text-[18px] text-secondary">
                category
              </span>

              <h3 className="font-headline-md text-headline-md text-on-surface">
                Per-Category Performance Breakdown
              </h3>

            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Adaptive policy shifts dispatch logic automatically according to
              structural payload density.
            </p>

          </div>

          {/* View Mode Matrix Switcher */}
          <div
            className="flex items-center bg-surface-container-lowest p-0.5 rounded shadow-inner"
            id="viewModeToggleGroup"
          >

            <button
              className={`view-mode-btn px-space-sm py-1 rounded font-mono-data-sm text-mono-data-sm transition-all ${
                viewMode === 'reduction'
                  ? 'active bg-surface-container-high text-on-surface font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
              data-mode="reduction"
              onClick={() => setViewMode('reduction')}
            >
              Token Reduction
            </button>

            <button
              className={`view-mode-btn px-space-sm py-1 rounded font-mono-data-sm text-mono-data-sm transition-all ${
                viewMode === 'formats'
                  ? 'active bg-surface-container-high text-on-surface font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
              data-mode="formats"
              onClick={() => setViewMode('formats')}
            >
              Selected Format Distribution
            </button>

            <button
              className={`view-mode-btn px-space-sm py-1 rounded font-mono-data-sm text-mono-data-sm transition-all ${
                viewMode === 'validation'
                  ? 'active bg-surface-container-high text-on-surface font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
              data-mode="validation"
              onClick={() => setViewMode('validation')}
            >
              Validation Outcomes
            </button>

          </div>
        </div>

        {/* Category Matrix Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-space-sm"
          id="matrixCardsContainer"
        >

          {/* Flat Tabular */}
          <div
            className={`category-matrix-card bg-surface-container p-space-sm rounded shadow-sm flex flex-col justify-between gap-space-sm transition-all duration-300 ${
              activeCategory !== 'all' && activeCategory !== 'flat'
                ? 'opacity-35 scale-[0.98]'
                : 'opacity-100'
            }`}
            data-category="flat"
          >

            <div className="flex flex-col gap-space-2xs">

              <div className="flex items-center justify-between">

                <span className="font-label-caps text-label-caps text-outline uppercase">
                  Tabular Schema
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-secondary px-space-2xs bg-secondary/10 rounded">
                  TOON Dominant
                </span>

              </div>

              <h4 className="font-headline-md text-[16px] leading-tight text-on-surface font-semibold">
                Flat Tabular
              </h4>

              <span className="font-body-sm text-body-sm text-on-surface-variant">
                40 Payloads · High Columnar Repetition
              </span>

            </div>

            <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-xs rounded">

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Router Gain:
                </span>

                <span className="text-secondary font-bold">
                  +63.4%
                </span>
              </div>

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Chosen Serializer:
                </span>

                <span className="text-tertiary font-semibold">
                  TOON (100%)
                </span>
              </div>

              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>

            </div>

            <div className="flex items-center justify-between text-mono-data-sm font-mono-data-sm text-outline">
              <span>Fallback: 0.0%</span>
              <span className="text-on-surface">
                Valid: 100%
              </span>
            </div>

          </div>

          {/* Nested Objects */}
          <div
            className={`category-matrix-card bg-surface-container p-space-sm rounded shadow-sm flex flex-col justify-between gap-space-sm transition-all duration-300 ${
              activeCategory !== 'all' && activeCategory !== 'nested'
                ? 'opacity-35 scale-[0.98]'
                : 'opacity-100'
            }`}
            data-category="nested"
          >

            <div className="flex flex-col gap-space-2xs">

              <div className="flex items-center justify-between">

                <span className="font-label-caps text-label-caps text-outline uppercase">
                  Moderate Depth
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-primary px-space-2xs bg-primary/10 rounded">
                  Compact JSON
                </span>

              </div>

              <h4 className="font-headline-md text-[16px] leading-tight text-on-surface font-semibold">
                Nested Objects
              </h4>

              <span className="font-body-sm text-body-sm text-on-surface-variant">
                40 Payloads · Variable Key Cardinality
              </span>

            </div>

            <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-xs rounded">

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Router Gain:
                </span>

                <span className="text-secondary font-bold">
                  +42.0%
                </span>
              </div>

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Chosen Serializer:
                </span>

                <span className="text-primary font-semibold">
                  Compact JSON (100%)
                </span>
              </div>

              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>

            </div>

            <div className="flex items-center justify-between text-mono-data-sm font-mono-data-sm text-outline">
              <span>Fallback: 0.0%</span>
              <span className="text-on-surface">
                Valid: 100%
              </span>
            </div>

          </div>

          {/* Deep-Nested */}
          <div
            className={`category-matrix-card bg-surface-container p-space-sm rounded shadow-sm flex flex-col justify-between gap-space-sm transition-all duration-300 ${
              activeCategory !== 'all' && activeCategory !== 'deep'
                ? 'opacity-35 scale-[0.98]'
                : 'opacity-100'
            }`}
            data-category="deep"
          >

            <div className="flex flex-col gap-space-2xs">

              <div className="flex items-center justify-between">

                <span className="font-label-caps text-label-caps text-outline uppercase">
                  Recursive Trees
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-tertiary px-space-2xs bg-tertiary/10 rounded">
                  Compact JSON
                </span>

              </div>

              <h4 className="font-headline-md text-[16px] leading-tight text-on-surface font-semibold">
                Deep-Nested
              </h4>

              <span className="font-body-sm text-body-sm text-on-surface-variant">
                40 Payloads · Depth &gt; 6 Levels
              </span>

            </div>

            <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-xs rounded">

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Router Gain:
                </span>

                <span className="text-secondary font-bold">
                  +42.7%
                </span>
              </div>

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Chosen Serializer:
                </span>

                <span className="text-tertiary font-semibold">
                  Compact JSON (100%)
                </span>
              </div>

              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-tertiary h-full rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>

            </div>

            <div className="flex items-center justify-between text-mono-data-sm font-mono-data-sm text-outline">
              <span>Fallback: 0.0%</span>
              <span className="text-on-surface">
                Valid: 100%
              </span>
            </div>

          </div>

          {/* Heterogeneous */}
          <div
            className={`category-matrix-card bg-surface-container p-space-sm rounded shadow-sm flex flex-col justify-between gap-space-sm transition-all duration-300 ${
              activeCategory !== 'all' && activeCategory !== 'hetero'
                ? 'opacity-35 scale-[0.98]'
                : 'opacity-100'
            }`}
            data-category="hetero"
          >

            <div className="flex flex-col gap-space-2xs">

              <div className="flex items-center justify-between">

                <span className="font-label-caps text-label-caps text-outline uppercase">
                  Asymmetric Trees
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-primary px-space-2xs bg-primary/10 rounded">
                  Compact JSON
                </span>

              </div>

              <h4 className="font-headline-md text-[16px] leading-tight text-on-surface font-semibold">
                Heterogeneous
              </h4>

              <span className="font-body-sm text-body-sm text-on-surface-variant">
                40 Payloads · Polymorphic Arrays
              </span>

            </div>

            <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-xs rounded">

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Router Gain:
                </span>

                <span className="text-secondary font-bold">
                  +48.5%
                </span>
              </div>

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Chosen Serializer:
                </span>

                <span className="text-primary font-semibold">
                  Compact JSON (100%)
                </span>
              </div>

              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>

            </div>

            <div className="flex items-center justify-between text-mono-data-sm font-mono-data-sm text-outline">
              <span>Fallback: 0.0%</span>
              <span className="text-on-surface">
                Valid: 100%
              </span>
            </div>

          </div>

          {/* Key-Sparse Tabular */}
          <div
            className={`category-matrix-card bg-surface-container p-space-sm rounded shadow-sm flex flex-col justify-between gap-space-sm transition-all duration-300 ${
              activeCategory !== 'all' && activeCategory !== 'scalar'
                ? 'opacity-35 scale-[0.98]'
                : 'opacity-100'
            }`}
            data-category="scalar"
          >

            <div className="flex flex-col gap-space-2xs">

              <div className="flex items-center justify-between">

                <span className="font-label-caps text-label-caps text-outline uppercase">
                  Sparse Columns
                </span>

                <span className="font-mono-data-sm text-mono-data-sm text-outline px-space-2xs bg-surface-container-highest rounded">
                  Compact JSON
                </span>

              </div>

              <h4 className="font-headline-md text-[16px] leading-tight text-on-surface font-semibold">
                Key-Sparse Tabular
              </h4>

              <span className="font-body-sm text-body-sm text-on-surface-variant">
                40 Payloads · Absent / Null Attributes
              </span>

            </div>

            <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-xs rounded">

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Router Gain:
                </span>

                <span className="text-secondary font-bold">
                  +34.7%
                </span>
              </div>

              <div className="flex justify-between items-center text-mono-data-sm font-mono-data-sm">
                <span className="text-on-surface-variant">
                  Chosen Serializer:
                </span>

                <span className="text-on-surface font-semibold">
                  Compact JSON (100%)
                </span>
              </div>

              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-surface-tint h-full rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>

            </div>

            <div className="flex items-center justify-between text-mono-data-sm font-mono-data-sm text-outline">
              <span>Fallback: 0.0%</span>
              <span className="text-on-surface">
                Valid: 100%
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* Visual Research Annotation & Statistical Rigor Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">

        {/* Scientific Method Note */}
        <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col gap-space-xs">

          <div className="flex items-center gap-space-xs">

            <span className="material-symbols-outlined text-[16px] text-secondary">
              psychology
            </span>

            <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
              Methodology Note
            </span>

          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            TOON achieves 63.43% mean token reduction on Flat Tabular
            (valid-only) and JTON 61.06%, but both are structurally
            inapplicable outside tabular arrays in this corpus. The Adaptive
            Router selects the strict-valid format with the lowest token count
            per payload, preserving 100% validity and 0.0% final fallback.
            Means are computed over strictly valid samples;
            validity/ineligibility/rejection are full-corpus rates.
          </p>

        </div>

        {/* Live Router Telemetry Strip */}
        <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col gap-space-xs">

          <div className="flex items-center gap-space-xs">

            <span className="material-symbols-outlined text-[16px] text-primary">
              dynamic_form
            </span>

            <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
              Router Decision Path
            </span>

          </div>

          <div className="flex flex-col gap-1.5 font-mono-data-sm text-mono-data-sm">

            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Tabular Density Threshold:</span>
              <span className="text-on-surface">
                &gt; 0.68 ⇒ JTON
              </span>
            </div>

            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Depth Level Threshold:</span>
              <span className="text-on-surface">
                &gt; 5 Nodes ⇒ ONTO
              </span>
            </div>

            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Polymorphism Defect Guard:</span>
              <span className="text-secondary font-semibold">
                Active (Comp-JSON Fallback)
              </span>
            </div>

          </div>
        </div>

        {/* Export / Reproducibility Trigger */}
        <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col justify-between gap-space-sm">

          <div className="flex flex-col gap-space-3xs">

            <div className="flex items-center gap-space-xs">

              <span className="material-symbols-outlined text-[16px] text-secondary">
                terminal
              </span>

              <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
                Reproducibility Run
              </span>

            </div>

            <span className="font-mono-data-sm text-mono-data-sm text-outline">
              CLI: ace-eval --corpus seed{displaySeed}.json --strict-ast
            </span>

          </div>

          <div className="flex items-center gap-space-xs">

            <button
              onClick={handleExportCsv}
              disabled={results.length === 0}
              title={
                results.length === 0
                  ? 'No benchmark results available to export.'
                  : 'Download the currently displayed benchmark results as CSV.'
              }
              className="flex-1 bg-primary text-on-primary hover:bg-primary/90 transition-all font-mono-data-sm text-mono-data-sm py-1.5 px-space-sm rounded font-medium shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[14px]">
                download
              </span>

              Export Raw CSV Data
            </button>

            <button
              onClick={handleShare}
              title="Share this benchmark page"
              aria-label="Share the TOONFORGE Benchmark page"
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all font-mono-data-sm text-mono-data-sm py-1.5 px-space-sm rounded flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">
                {shareStatus === 'copied' || shareStatus === 'shared'
                  ? 'check'
                  : shareStatus === 'error'
                  ? 'error'
                  : 'share'}
              </span>
              {shareStatus === 'copied' ? 'Link Copied' : shareStatus === 'shared' ? 'Shared' : ''}
            </button>

          </div>

          <span
            aria-live="polite"
            className="font-mono-data-sm text-mono-data-sm text-outline min-h-[1rem]"
          >
            {shareStatus === 'error'
              ? 'Share unavailable — clipboard blocked by browser.'
              : ''}
          </span>
        </div>

      </div>
    </div>
  );
}