"""Run the adversarial suite and persist a JSON trace.

benchmarks/adversarial_cases.py implements the suite (7 cases) and has a
__main__ that PRINTS a summary table only — it never persists JSON and does
not print per-candidate token counts. All of that data already exists in the
dict returned by `run_adversarial_evaluation()`, so this wrapper executes the
unchanged suite function and dumps the full per-case / per-candidate trace to
benchmarks/results/adversarial_trace_current.json.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure toonforge root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from benchmarks.adversarial_cases import run_adversarial_evaluation


def main(output: str = "benchmarks/results/adversarial_trace_current.json") -> Path:
    audit = run_adversarial_evaluation()

    out = Path(output)
    out.parent.mkdir(parents=True, exist_ok=True)
    body = {
        "metadata": {
            "title": "TOONFORGE Adversarial Suite — full per-candidate trace",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "benchmarks/adversarial_cases.py::run_adversarial_evaluation()",
            "case_count": len(audit),
            "note": "strictly_sound = selected candidate passed StrictValidator round-trip",
        },
        "cases": audit,
    }
    out.write_text(json.dumps(body, indent=2), encoding="utf-8")

    print("=" * 70)
    print("TOONFORGE ADVERSARIAL SUITE EVALUATION")
    print("=" * 70)
    for name, res in audit.items():
        status = "PASSED (Safe)" if res["strictly_sound"] else "FAILED (Data Corruption!)"
        print(f"\n[Case: {name}] -> {status}")
        print(f"  Selected: {res['selected_format']} (Fallback: {res['fallback_used']})")
        print(f"  Candidates:")
        for fmt, st in res["candidates"].items():
            valid_flag = "VALID" if st["valid"] else f"REJECTED ({st['rejection_reason']})"
            tokens = st["tokens"]
            print(
                f"    - {fmt:<14}: {valid_flag:<55} "
                f"tokens={tokens if tokens is not None else '-'}"
            )
    print("=" * 70)
    print(f"[+] Wrote trace: {out}")
    return out


if __name__ == "__main__":
    out_path = main()
    sys.exit(0)