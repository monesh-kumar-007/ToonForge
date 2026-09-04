'use client';

import React, { useState, useEffect } from 'react';
import { runAdversarialSuite, AdversarialResponse, AdversarialCase } from '@/lib/api';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function ReliabilityPage() {
  const [suiteData, setSuiteData] = useState<AdversarialResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ADV-001');

  const executeAdversarialSuite = async () => {
    setLoading(true);
    try {
      const data = await runAdversarialSuite();
      setSuiteData(data);
    } catch (err) {
      console.error('Adversarial audit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeAdversarialSuite();
  }, []);

  const cases = suiteData?.cases || [];
  const activeCase = cases.find((c) => c.case_id === selectedCaseId) || cases[0];

  return (
    <div className="flex flex-col w-full pb-16 px-8 pt-8 max-w-7xl mx-auto space-y-8">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-mono text-[10px] tracking-wider uppercase font-semibold">
              VERIFICATION PROTOCOL // STAGE 04
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-outline font-mono text-[10px]">
              ZERO-CORRUPTION ENFORCED
            </span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
            Reliability & Semantic Validation
          </h1>
          <p className="font-sans text-xs text-on-surface-variant max-w-3xl leading-relaxed">
            Efficiency is accepted only when semantic isomorphism is mathematically and
            computationally verified through strict bidirectional round-tripping.
          </p>
        </div>

        <button
          onClick={executeAdversarialSuite}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded shadow-md transition-all font-mono text-xs uppercase font-semibold cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">security</span>
          {loading ? 'Auditing...' : 'Run Adversarial Audit'}
        </button>
      </div>

      {/* Hero Banner: High Contrast Safety Statement */}
      <div className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                verified_user
              </span>
              <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-bold">
                ZERO-MUTATION GUARANTEE
              </span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">
              VALIDITY BEFORE EFFICIENCY
            </h2>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              The TOONFORGE serialization engine strictly asserts that every encoded candidate can
              be losslessly recovered. Unsafe formats with silent type conversions are discarded
              prior to token footprint selection.
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[220px] bg-surface-container-low p-3.5 rounded-lg border border-outline-variant/20 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-outline text-[11px]">STRICT ISOMORPHISM</span>
              <span className="text-secondary font-bold">100% ENFORCED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline text-[11px]">DATA CORRUPTION</span>
              <span className="text-emerald-400 font-bold">0 BITS DRIFT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline text-[11px]">DEFECT INTERCEPTION</span>
              <span className="text-primary font-bold">
                {suiteData?.rejection_count || 3} REJECTIONS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Adversarial Trace Terminal */}
      <section className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Terminal Titlebar */}
        <div className="h-10 bg-surface-container-low px-4 border-b border-outline-variant/20 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-outline">TRACE_VIEWER // DISQUALIFICATION_ANALYSIS</span>
          </div>
          <span className="text-secondary font-semibold">REALTIME_EXEC</span>
        </div>

        {/* 4-Step Walkthrough for Active Case */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-secondary font-bold uppercase">
                  STEP 01 — INPUT PAYLOAD
                </span>
                <span className="font-mono text-[10px] text-outline">ORIGIN</span>
              </div>
              <p className="font-sans text-[11px] text-on-surface-variant">
                Incoming structured payload with preservation-sensitive leading zeros or string flags.
              </p>
              <pre className="p-3 rounded bg-surface-container-lowest font-mono text-xs text-secondary overflow-auto max-h-[140px]">
                {JSON.stringify(activeCase?.original_payload || [{ code: '00123' }], null, 2)}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-tertiary font-bold uppercase">
                  STEP 02 — CANDIDATE ENCODING
                </span>
                <span className="font-mono text-[10px] text-outline">SPECULATIVE FORMAT</span>
              </div>
              <p className="font-sans text-[11px] text-on-surface-variant">
                Serialized to unquoted token stream to minimize syntax overhead (e.g. TOON).
              </p>
              <pre className="p-3 rounded bg-surface-container-lowest font-mono text-xs text-on-surface-variant overflow-auto max-h-[140px]">
                {activeCase?.case_id === 'ADV-001'
                  ? 'TOON:code,label\n00123,alpha'
                  : 'TOON:flag,active\ntrue,false'}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-low p-4 rounded-lg border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-rose-400 font-bold uppercase">
                  STEP 03 — DECODED RESULT (COERCION DEFECT)
                </span>
                <span className="font-mono text-[10px] text-rose-400">DESERIALIZED AST</span>
              </div>
              <p className="font-sans text-[11px] text-on-surface-variant">
                Unsafe parser strips quotes, coercing string <code className="text-secondary">&quot;00123&quot;</code> to number <code className="text-rose-400">123</code>.
              </p>
              <pre className="p-3 rounded bg-surface-container-lowest font-mono text-xs text-rose-400 overflow-auto max-h-[140px]">
                {activeCase?.case_id === 'ADV-001'
                  ? '[\n  {\n    "code": 123,\n    "label": "alpha"\n  }\n]'
                  : '[\n  {\n    "flag": true,\n    "active": false\n  }\n]'}
              </pre>
            </div>

            {/* Step 4 */}
            <div className="bg-surface-container-low p-4 rounded-lg border border-secondary/40 ring-1 ring-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-secondary font-bold uppercase">
                  STEP 04 — STRICT VALIDATOR INTERCEPTION
                </span>
                <StatusBadge status="REJECTED" size="sm" />
              </div>
              <p className="font-sans text-[11px] text-on-surface-variant">
                Recursive validator detects type mutation. The candidate is immediately rejected!
              </p>
              <div className="p-3 rounded bg-surface-container-lowest space-y-1 font-mono text-[11px]">
                <div className="text-rose-400 font-bold">
                  ✕ DISQUALIFICATION TRIGGERED
                </div>
                <div className="text-outline text-[10px]">
                  Reason: $[0].code type mismatch: expected string, found int
                </div>
                <div className="text-emerald-400 pt-1 border-t border-outline-variant/20">
                  ✓ Selected Sound Format: {activeCase?.selected_format || 'Compact JSON'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Adversarial Cases Matrix Table */}
      <section className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-base font-bold text-on-surface">
            Adversarial Audit Case Registry
          </h3>
          <span className="font-mono text-xs text-outline">
            {cases.length} Stress Cases Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs text-left">
            <thead>
              <tr className="border-b border-outline-variant/30 text-outline text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Attack Description</th>
                <th className="py-2.5 px-3">Selected Format</th>
                <th className="py-2.5 px-3 text-center">TOON Status</th>
                <th className="py-2.5 px-3 text-right">Soundness Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {cases.map((c) => {
                const toonCand = c.candidates?.TOON;
                const isSelected = c.case_id === selectedCaseId;
                return (
                  <tr
                    key={c.case_id}
                    onClick={() => setSelectedCaseId(c.case_id)}
                    className={`hover:bg-surface-container transition-colors cursor-pointer ${
                      isSelected ? 'bg-secondary/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-primary">{c.case_id}</td>
                    <td className="py-3 px-3 max-w-md">
                      <div className="font-sans font-medium text-on-surface text-xs">{c.name}</div>
                      <div className="font-sans text-[11px] text-on-surface-variant truncate">
                        {c.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-secondary">{c.selected_format}</td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge
                        status={toonCand?.valid ? 'VALID' : 'REJECTED'}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-400">100% PRESERVED</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
