"""Token estimator — GPT-2/cl100k BPE proxy for token counting.

IMPORTANT LABEL:
    All counts produced by this module are ESTIMATED TOKEN COUNTS.
    They use a BPE tokenizer proxy (GPT-2 or cl100k_base).
    They are NOT exact token counts for any specific LLM.
    Variance exists across different model vocabularies.

The SAME estimation method is applied identically to ALL formats,
ensuring a fair relative comparison even if absolute counts differ
from a specific target model's tokenizer.
"""
from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Try tiktoken first (preferred — more accurate BPE proxy)
_tiktoken_enc = None
_proxy_label = "character-based proxy (4 chars/token)"

try:
    import tiktoken
    _tiktoken_enc = tiktoken.get_encoding("cl100k_base")
    _proxy_label = "cl100k_base BPE proxy"
    logger.info("TokenEstimator: using tiktoken cl100k_base")
except ImportError:
    try:
        import tiktoken
        _tiktoken_enc = tiktoken.get_encoding("gpt2")
        _proxy_label = "GPT-2 BPE proxy"
        logger.info("TokenEstimator: using tiktoken gpt2")
    except Exception:
        logger.warning(
            "TokenEstimator: tiktoken not available. "
            "Falling back to character-based estimate (chars / 4)."
        )


class TokenEstimator:
    """
    Estimates token counts using a BPE tokenizer proxy.

    LABEL: Estimated Token Count (BPE Proxy)
    WARNING: Not exact for any specific LLM deployment.
    """

    @property
    def proxy_label(self) -> str:
        return _proxy_label

    def estimate(self, text: str) -> int:
        """
        Estimate token count for the given serialized text.

        Returns:
            Estimated token count (int).
            Uses BPE proxy if available, otherwise chars/4 fallback.
        """
        if not text:
            return 0
        if _tiktoken_enc is not None:
            try:
                return len(_tiktoken_enc.encode(text))
            except Exception as exc:
                logger.warning(f"tiktoken encode error: {exc}. Falling back.")
        # Character-based fallback: ~4 chars per token (GPT-2 average)
        return max(1, len(text) // 4)

    def estimate_savings_pct(
        self, baseline_tokens: int, candidate_tokens: int
    ) -> float:
        """
        Compute percentage token savings vs baseline.

        Positive = fewer tokens than baseline (savings).
        Negative = more tokens than baseline (overhead).
        """
        if baseline_tokens <= 0:
            return 0.0
        return round((baseline_tokens - candidate_tokens) / baseline_tokens * 100, 2)


token_estimator = TokenEstimator()
