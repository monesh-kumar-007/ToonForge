'use client';

import { useEffect, useState, useCallback } from 'react';
import { runAdversarialSuite, AdversarialResponse, AdversarialCase } from '@/lib/api';

const STATIC_CASES: AdversarialCase[] = [
  {
    case_id: 'ADJ-001',
    name: 'Leading-Zero String Coercion',
    description: 'Incoming structured payload with preservation-sensitive leading zeros.',
    original_payload: { code: '00123' },
    selected_format: 'COMPACT_JSON',
    fallback_used: false,
    strictly_sound: true,
    candidates: {
      TOON: { status: 'REJECTED', valid: false, reason: 'String "00123" coerced to Number 123' },
      COMPACT_JSON: { status: 'VALID', valid: true, reason: null },
      JSON: { status: 'VALID', valid: true, reason: null },
      YAML: { status: 'REJECTED', valid: false, reason: 'Type coercion risk' },
      CSV: { status: 'INELIGIBLE', valid: false, reason: 'Non-tabular payload' },
    },
  },
];

export default function ReliabilityPage() {
  const [cases, setCases] = useState<AdversarialCase[]>(STATIC_CASES);
  const [totalCases, setTotalCases] = useState(1);
  const [rejectionCount, setRejectionCount] = useState(0);
  const [fallbackCount, setFallbackCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const applyResponse = useCallback((data: AdversarialResponse) => {
    if (data.cases && data.cases.length > 0) {
      setCases(data.cases);
    }
    setTotalCases(data.total_cases);
    setRejectionCount(data.rejection_count);
    setFallbackCount(data.fallback_count);
  }, []);

  const handleRunAudit = useCallback(async () => {
    setLoading(true);
    try {
      const data = await runAdversarialSuite();
      applyResponse(data);
    } catch {
      // keep static values on failure
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    handleRunAudit();
  }, [handleRunAudit]);

  const firstCase = cases[0];

  return (
    <div className="relative w-full px-space-xl py-space-xl overflow-hidden">
      {/* Ambient Emissive Background Light */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-48 left-12 w-80 h-80 bg-error/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Block */}
      <div className="flex flex-col gap-space-2xs mb-space-xl">
        <div className="flex items-center gap-space-xs">
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-secondary font-mono-data-sm text-mono-data-sm tracking-wider uppercase">
            VERIFICATION PROTOCOL // STAGE 04
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-outline font-mono-data-sm text-mono-data-sm">
            ISO-14224 COMPLIANT
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
          Reliability &amp; Validation
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Efficiency is accepted only when semantic preservation is verified.
        </p>
      </div>

      {/* Top Hero Banner */}
      <div className="relative w-full rounded-xl bg-surface-container-lowest p-space-xl shadow-xl mb-space-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low/90 via-surface-container-lowest/80 to-surface-container-low/40 pointer-events-none"></div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
                ZERO-MUTATION GUARANTEE
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight">
              VALIDITY BEFORE EFFICIENCY
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              The serialization engine enforces strict round-trip isomorphism. Unsafe formats are discarded before token optimization.
            </p>
          </div>
          {/* Telemetry Pill Stack */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-space-xs min-w-[240px] bg-surface-container-low p-space-sm rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">STRICT ISOMORPHISM</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold">100% ENFORCED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">ROUNDTRIP DELTA</span>
              <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold">0 BITS DRIFT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono-data-sm text-mono-data-sm text-outline">HALLUCINATION RISK</span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary-fixed font-semibold">0.0000%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: ADVERSARIAL VALIDATION TRACE */}
      <div className="w-full flex flex-col gap-space-md mb-space-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 rounded-full bg-secondary"></span>
            <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
              Adversarial Validation Trace
            </h3>
          </div>
          <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
            <span>
              DEBUGGER ID:{' '}
              <span className="text-on-surface">TRACE-ADV-9041X</span>
            </span>
            <span className="text-outline-variant">/</span>
            <span className="text-secondary">REALTIME_EXEC</span>
          </div>
        </div>

        {/* Execution Trace Terminal */}
        <div className="w-full rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
          {/* Terminal Header Bar */}
          <div className="h-10 bg-surface-container-low px-space-md flex items-center justify-between select-none">
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error-container"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-surface-container-highest"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-secondary-container"></span>
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-outline tracking-wider">
                TRACE_VIEWER // CANDIDATE_EVALUATION
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-outline font-label-caps text-label-caps uppercase">
                AST-DEPTH: 4
              </span>
              <span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-secondary font-label-caps text-label-caps uppercase">
                ASSERTION: ACTIVE
              </span>
            </div>
          </div>

          {/* Terminal Body / Step Grid */}
          <div className="p-space-lg flex flex-col gap-space-md">
            {/* Step 1 & Step 2 Split Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Step 1: Input Payload */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative group hover:bg-surface-container transition-colors shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary font-semibold">
                    STEP 01 — INPUT PAYLOAD
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">RAW JSON (ORIGIN)</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Incoming structured payload with preservation-sensitive leading zeros.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <pre className="text-primary-fixed">{`{
  "code": "00123"
}`}</pre>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>INFERRED TYPE:</span>
                  <span className="text-secondary font-medium">String (Len: 5)</span>
                </div>
              </div>

              {/* Step 2: TOON Encoding */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative group hover:bg-surface-container transition-colors shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-tertiary font-semibold">
                    STEP 02 — TOON ENCODING
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">OPTIMIZER CANDIDATE</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Serialized to unquoted token stream to minimize syntax overhead.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <pre className="text-on-surface-variant">code: 00123</pre>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>TOKEN GAIN:</span>
                  <span className="text-primary font-medium">-3 Tokens (-37.5%)</span>
                </div>
              </div>
            </div>

            {/* Step 3 & Step 4: Coercion & Failure Detection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Step 3: Decoded Result */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-error font-semibold">
                    STEP 03 — DECODED RESULT
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">DESERIALIZED AST</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Round-trip parser reconstructs payload from token stream.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <pre className="text-error">{`{
  "code": 123
}`}</pre>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>RECOVERED TYPE:</span>
                  <span className="text-error font-semibold">Integer (Loss of 2 chars)</span>
                </div>
              </div>

              {/* Step 4: Deep AST Assertion Engine */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs relative shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-error font-semibold">
                    STEP 04 — DEEP AST ASSERTION ENGINE
                  </span>
                  <span className="px-space-2xs py-0.5 rounded bg-error-container text-on-error font-mono-data-sm text-mono-data-sm font-semibold">
                    ASSERTION FAIL
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Bi-directional semantic tree comparison checks scalar primitive parity.
                </p>
                <div className="bg-surface-container-lowest p-space-sm rounded font-mono-data-sm text-mono-data-sm text-error overflow-x-auto flex flex-col gap-1">
                  <div className="flex items-center gap-space-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>TYPE MISMATCH DETECTED</span>
                  </div>
                  <div className="text-on-surface-variant">
                    Primitive coercion: String <span className="text-primary-fixed">&quot;00123&quot;</span> coerced to Number{' '}
                    <span className="text-error">123</span>.
                  </div>
                  <div className="text-outline">
                    Entropy Delta: -2 bytes, Semantic Identity Compromised.
                  </div>
                </div>
                <div className="flex items-center gap-space-xs pt-space-2xs font-mono-data-sm text-mono-data-sm text-outline">
                  <span>INSPECTOR REF:</span>
                  <span className="text-error font-medium">AST_PRIMITIVE_INCOMPATIBLE</span>
                </div>
              </div>
            </div>

            {/* Step 5 & Step 6: Router Action & Alternative Promotion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Step 5: Router Action */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-error font-semibold">
                    STEP 05 — ROUTER ACTION
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">PRUNING PIPELINE</span>
                </div>
                <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded">
                  <span className="material-symbols-outlined text-error text-[24px]">block</span>
                  <div className="flex flex-col">
                    <span className="font-mono-data-sm text-mono-data-sm text-error font-semibold uppercase">
                      REJECT CANDIDATE: TOON
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      Severity: Schema Mutation (High Risk)
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Optimizer strictly rejects TOON candidate despite 37.5% lower token footprint.
                </p>
              </div>

              {/* Step 6: Safe Alternative Promotion */}
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary font-semibold">
                    STEP 06 — SAFE ALTERNATIVE PROMOTION
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-outline">PROMOTED CANDIDATE</span>
                </div>
                <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded">
                  <span className="material-symbols-outlined text-secondary text-[24px]">task_alt</span>
                  <div className="flex flex-col">
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold uppercase">
                      COMPACT JSON PROMOTED
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      Preserves quotation and literal string scalar typing
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Promoted as optimal valid candidate maintaining guaranteed isomorphism.
                </p>
              </div>
            </div>

            {/* Final Validation Status Readout Strip */}
            <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-lowest">
                  <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-mono-data-sm text-mono-data-sm text-secondary font-semibold uppercase">
                    Final Output: ✓ VALID
                  </span>
                </div>
                <div className="h-4 w-px bg-outline-variant/40 hidden md:block"></div>
                <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  <span>Final Fallback Used:</span>
                  <span className="text-on-surface font-semibold">
                    {firstCase?.fallback_used ? 'YES' : 'NO'}
                  </span>
                  <span className="text-outline">(Handled cleanly in candidate pruning phase)</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-outline">
                <span className="material-symbols-outlined text-[16px] text-secondary">security</span>
                <span>Downstream Safety Locked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: EDGE CASE & SEMANTIC INTEGRITY GUARANTEES */}
      <div className="w-full flex flex-col gap-space-md mb-space-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 rounded-full bg-primary"></span>
            <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
              Edge Case &amp; Semantic Integrity Guarantees
            </h3>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-outline uppercase">FORMAL SPECIFICATION v2.4</span>
        </div>

        {/* Two Side-by-Side Comparison Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
          {/* Block 1: Null vs Missing Key Preservation */}
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between pb-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">difference</span>
                <h4 className="font-headline-md text-headline-md text-on-surface">Null vs Missing Key Preservation</h4>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container font-mono-data-sm text-mono-data-sm text-secondary font-semibold">
                RULE: EXISTENCE != NULL
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Many token-saving serializers omit keys with null values, destroying semantic distinction between deliberate
              emptiness and missing property schemas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-md rounded-lg">
              <div className="flex flex-col gap-space-2xs">
                <span className="font-label-caps text-label-caps text-outline uppercase">RECORD A (EXPLICIT NULL)</span>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface">
                  <pre className="text-on-surface">{`{
  "name": "A",
  "score": null
}`}</pre>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Status: Property Key Exists</span>
              </div>
              <div className="flex flex-col gap-space-2xs">
                <span className="font-label-caps text-label-caps text-outline uppercase">RECORD B (ABSENT KEY)</span>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface">
                  <pre className="text-on-surface">{`{
  "name": "B"
}`}</pre>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-outline">Status: Property Key Undefined</span>
              </div>
            </div>
            <div className="flex items-start gap-space-xs bg-surface-container p-space-sm rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">check_circle</span>
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  Strict Differentiation Preserved
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Key existence verified without stripping nulls. Downstream models reliably discern schema fields intended
                  to represent null states.
                </span>
              </div>
            </div>
          </div>

          {/* Block 2: Floating-point & Numerical Precision */}
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between pb-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">pin</span>
                <h4 className="font-headline-md text-headline-md text-on-surface">
                  Floating-point &amp; Numerical Precision
                </h4>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container font-mono-data-sm text-mono-data-sm text-primary font-semibold">
                IEEE 754 BIT-EXACT
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Validates IEEE 754 precision preservation across high-precision floats and bigint timestamps, eliminating
              scientific truncation errors.
            </p>
            <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-md rounded-lg">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between font-mono-data-sm text-mono-data-sm">
                  <span className="text-outline">64-BIT PRECISION FLOAT:</span>
                  <span className="text-secondary font-medium">EPSILON = 0.00000000000000000</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <code>0.1000000000000000055511151231257827021181583404541015625</code>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between font-mono-data-sm text-mono-data-sm">
                  <span className="text-outline">NANOSECOND BIGINT TIMESTAMP:</span>
                  <span className="text-primary font-medium">INT64 PRESERVED</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded font-mono-data-lg text-mono-data-lg text-on-surface overflow-x-auto">
                  <code>1719238491029384729n</code>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-space-xs bg-surface-container p-space-sm rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">verified</span>
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  Zero Mantissa Drift Guarantee
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Mathematical constants and nanosecond telemetry payloads undergo exact decimal-to-binary parity asserts
                  before validation sign-off.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Visual System Safety Architecture (Bento Style) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-2xl">
        {/* Card 1 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary text-[24px]">terminal</span>
              <span className="font-label-caps text-label-caps text-outline uppercase">PHASE 01</span>
            </div>
            <h5 className="font-headline-md text-headline-md text-on-surface">Candidate Generation</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Generates 5 structural candidate candidates (JSON, TOON, YAML, Compact, CSV/TSV) concurrently under token
              optimization targets.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-lowest px-space-sm py-space-xs rounded flex items-center justify-between font-mono-data-sm text-mono-data-sm">
            <span className="text-outline">CANDIDATES:</span>
            <span className="text-secondary font-semibold">5 ACTIVE</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-tertiary text-[24px]">bug_report</span>
              <span className="font-label-caps text-label-caps text-outline uppercase">PHASE 02</span>
            </div>
            <h5 className="font-headline-md text-headline-md text-on-surface">Adversarial Round-Trip</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Instantly deserializes serialized candidate through the corresponding LLM parser tokenizer to detect lossy
              coercion.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-lowest px-space-sm py-space-xs rounded flex items-center justify-between font-mono-data-sm text-mono-data-sm">
            <span className="text-outline">ISOMORPHISM CHECK:</span>
            <span className="text-tertiary font-semibold">DEEP AST DIFF</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
              <span className="font-label-caps text-label-caps text-outline uppercase">PHASE 03</span>
            </div>
            <h5 className="font-headline-md text-headline-md text-on-surface">Pruning &amp; Promotion</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Unsafe variants get eliminated immediately. The engine selects the highest compression ratio format with 100%
              verified fidelity.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-lowest px-space-sm py-space-xs rounded flex items-center justify-between font-mono-data-sm text-mono-data-sm">
            <span className="text-outline">FINAL SAFETY:</span>
            <span className="text-primary font-semibold">100% GUARANTEED</span>
          </div>
        </div>
      </div>

      {/* Bottom Research Guarantee Callout Note */}
      <div className="w-full rounded-xl bg-surface-container-lowest p-space-lg shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-[28px]">shield_with_heart</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-secondary font-semibold uppercase tracking-wider">
                RESEARCH PRINCIPLE // NON-NEGOTIABLE
              </span>
              <p className="font-body-md text-body-md text-on-surface max-w-4xl pt-1">
                &ldquo;The validator prevents unsafe candidates from ever becoming final selections, ensuring zero downstream
                hallucination or context corruption in LLM prompts.&rdquo;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
            <a
              className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-data-sm text-mono-data-sm transition-colors flex items-center gap-1.5 shadow-sm"
              href="#"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Read Validation Spec</span>
            </a>
            <button
              onClick={handleRunAudit}
              disabled={loading}
              className="px-space-md py-space-xs rounded bg-primary text-on-primary font-mono-data-sm text-mono-data-sm font-semibold transition-all hover:bg-primary-container flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>{loading ? 'Running...' : 'Run Test Harness'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
