"""Compact JSON format — whitespace-stripped JSON."""
from __future__ import annotations

import json
from typing import Any, Optional

from .base import BaseFormat, FormatError


class CompactJSONFormat(BaseFormat):
    """
    Compact JSON serialization — no whitespace, no indentation.

    - Always eligible (same semantics as JSON, zero syntax mutation).
    - Uses separators=(',', ':') for maximum compaction.
    - Guaranteed lossless: decode(encode(x)) == x for all JSON types.
    """

    @property
    def format_id(self) -> str:
        return "Compact JSON"

    @property
    def description(self) -> str:
        return "Minified whitespace AST — lossless, zero syntax mutation."

    def is_eligible(self, payload: Any) -> tuple[bool, Optional[str]]:
        """Compact JSON is always eligible — it is syntactically identical to JSON."""
        return True, None

    def encode(self, payload: Any) -> str:
        try:
            return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
        except (TypeError, ValueError) as exc:
            raise FormatError(f"Compact JSON encode failed: {exc}") from exc

    def decode(self, text: str) -> Any:
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise FormatError(f"Compact JSON decode failed: {exc}") from exc
