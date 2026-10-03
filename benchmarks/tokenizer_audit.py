"""Tokenizer robustness audit for the TOONFORGE benchmark suite.

Recomputes the token-efficiency statistics (Table III analogue) using real
model tokenizers instead of the single cl100k_base BPE proxy:

    - gpt4o         OpenAI family  (tiktoken o200k_base, the actual gpt-4o tokenizer)
    - claude_proxy  Anthropic family approximation (cl100k_base, the paper's proxy)
    - llama3        meta-llama/Llama-3.1-8B   (HuggingFace, gated -- skipped if unavailable)
    - mistral       mistralai/Mistral-7B-v0.3 (HuggingFace, open)
    - qwen2.5       Qwen/Qwen2.5-7B           (HuggingFace, open)

Methodology (must mirror run_benchmark.py exactly):
    - Canonical corpus: N=200, seed=200 (benchmarks.generate_corpus).
    - Real serializer dispatch via SerializationManager.serialize_one.
    - Token-efficiency statistics are computed over STRICTLY VALID samples
      only (INELIGIBLE / ENCODE_ERROR / DECODE_ERROR / REJECTED contribute
      no artificial 0.0 savings), using the canonical validator.
    - Savings are computed pairwise per payload: JSON baseline and candidate
      tokens are both counted with the SAME tokenizer on the SAME payload,
      then meaned across valid samples.
    - The cl100k_base column doubles as a self-check: it must reproduce the
      canonical benchmark summary (Compact JSON 40.47 / TOON 63.43 / JTON
      61.06 / ONTO 4.27 / Adaptive Router 46.26).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import tiktoken

from apps.api.models.domain import CandidateStatus
from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.router import exhaustive_router
from apps.api.services.validator import validator
from benchmarks.generate_corpus import generate_benchmark_corpus

FORMATS = ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]

TOKENIZER_SPECS: dict[str, str] = {
    "gpt4o": "tiktoken:gpt-4o",
    "claude_proxy": "tiktoken:cl100k_base",
    "llama3": "hf:meta-llama/Llama-3.1-8B",
    "mistral": "hf:mistralai/Mistral-7B-v0.3",
    "qwen2.5": "hf:Qwen/Qwen2.5-7B",
}


def load_tokenizer(kind: str, descriptor: str) -> tuple[str, Any] | None:
    try:
        if kind == "tiktoken":
            if descriptor == "gpt-4o":
                enc = tiktoken.encoding_for_model(descriptor)
            else:
                enc = tiktoken.get_encoding(descriptor)
            return "tiktoken", enc
        if kind == "hf":
            from transformers import AutoTokenizer

            tok = AutoTokenizer.from_pretrained(descriptor)
            return "hf", tok
    except Exception as exc:  # gated model, no network, incompatible env...
        print(f"[!] Skipping tokenizer {descriptor}: {exc}")
        return None
    return None


def count_tokens(kind: str, enc: Any, text: str) -> int:
    if kind == "tiktoken":
        return len(enc.encode(text))
    try:
        out = enc(text, add_special_tokens=False)
    except TypeError:
        out = enc(text)
    ids = out.input_ids if hasattr(out, "input_ids") else out
    return len(ids)


def run_audit(
    corpus_size: int = 200,
    seed: int = 200,
    output: str | Path = "benchmarks/results/tokenizer_audit_results.json",
) -> dict[str, Any]:
    print(f"[*] Initializing canonical corpus (N={corpus_size}, seed={seed})...")
    corpus = generate_benchmark_corpus(size=corpus_size, seed=seed)

    tokenizers: dict[str, tuple[str, Any]] = {}
    for name, spec in TOKENIZER_SPECS.items():
        kind, descriptor = spec.split(":", 1)
        loaded = load_tokenizer(kind, descriptor)
        if loaded is not None:
            tokenizers[name] = (kind, loaded[1])

    print(f"[*] Loaded {len(tokenizers)}/{len(TOKENIZER_SPECS)} tokenizers: {list(tokenizers)}")

    manager = SerializationManager()

    tokens_per_sample: dict[str, dict[str, list[tuple[int, int]]]] = {
        t: {f: [] for f in FORMATS} for t in tokenizers
    }
    adaptive_per_sample: dict[str, list[tuple[int, int]]] = {t: [] for t in tokenizers}
    json_per_sample: dict[str, list[int]] = {t: [] for t in tokenizers}
    valid_count: dict[str, int] = {f: 0 for f in FORMATS}

    for sample_idx, item in enumerate(corpus):
        payload = item["payload"]

        route_res = exhaustive_router.route(payload)
        selected = route_res.selected_format or "JSON"

        encoded_texts: dict[str, str] = {}

        for fmt in FORMATS:
            cand = manager.serialize_one(payload, fmt)

            if cand.status == CandidateStatus.INELIGIBLE:
                continue
            if cand.encoded is None or cand.decoded is None:
                continue

            is_valid, _ = validator.validate(payload, cand.decoded)
            if not is_valid:
                continue

            encoded_texts[fmt] = cand.encoded
            valid_count[fmt] += 1

        for tok_name, (kind, enc) in tokenizers.items():
            json_tokens = count_tokens(kind, enc, encoded_texts["JSON"])
            json_per_sample[tok_name].append(json_tokens)
            for fmt in FORMATS:
                if fmt in encoded_texts:
                    n = count_tokens(kind, enc, encoded_texts[fmt])
                    tokens_per_sample[tok_name][fmt].append((sample_idx, n))

            if selected in encoded_texts:
                adaptive_per_sample[tok_name].append(
                    (sample_idx, count_tokens(kind, enc, encoded_texts[selected]))
                )

    def _mean(seq: list[float]) -> float:
        return sum(seq) / len(seq) if seq else 0.0

    def _reduction(json_seq: list[int], fmt_seq: list[tuple[int, int]]) -> float:
        if not json_seq or not fmt_seq:
            return 0.0
        pairs = [
            100.0 * (1.0 - (fmt_t / json_seq[idx]))
            for idx, fmt_t in fmt_seq
        ]
        return round(_mean(pairs), 2)

    summary: dict[str, Any] = {}
    for tok_name in tokenizers:
        json_toks = json_per_sample[tok_name]
        reduction = {
            fmt: _reduction(json_toks, tokens_per_sample[tok_name][fmt])
            for fmt in FORMATS
        }
        ar_reduction = _reduction(
            json_toks, adaptive_per_sample[tok_name]
        )
        mean_tokens = {
            fmt: round(
                _mean([t for _, t in tokens_per_sample[tok_name][fmt]]) or 0.0, 2
            )
            for fmt in FORMATS
        }
        summary[tok_name] = {
            "reduction_vs_json_pct": reduction,
            "adaptive_router_reduction_vs_json_pct": ar_reduction,
            "mean_token_count": mean_tokens,
            "valid_samples": valid_count,
        }

    report = {
        "metadata": {
            "title": "TOONFORGE Tokenizer Robustness Audit",
            "corpus_size": corpus_size,
            "random_seed": seed,
            "tiktoken_version": tiktoken.__version__,
            "note": "Valid-only token statistics; pairwise per-payload savings vs JSON under the same tokenizer.",
        },
        "tokenizers": summary,
    }

    out_path = Path(output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 78)
    print(f"{'Tokenizer':<14} | {'Compact':<9} | {'TOON':<9} | {'JTON':<9} | {'ONTO':<9} | {'Router':<9}")
    print("-" * 78)
    for tok_name, data in summary.items():
        red = data["reduction_vs_json_pct"]
        print(
            f"{tok_name:<14} | {red['Compact JSON']:<9} | {red['TOON']:<9} | "
            f"{red['JTON']:<9} | {red['ONTO']:<9} | "
            f"{data['adaptive_router_reduction_vs_json_pct']:<9}"
        )
    print("=" * 78)
    print(f"[+] Tokenizer audit written to: {out_path}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TOONFORGE tokenizer robustness audit")
    parser.add_argument("--size", type=int, default=200, help="Corpus size (default: 200)")
    parser.add_argument("--seed", type=int, default=200, help="Random seed (default: 200)")
    parser.add_argument(
        "--output",
        type=str,
        default="benchmarks/results/tokenizer_audit_results.json",
        help="Destination JSON path (default: benchmarks/results/tokenizer_audit_results.json)",
    )
    args = parser.parse_args()
    run_audit(corpus_size=args.size, seed=args.seed, output=args.output)