"""Plain JSON format — canonical baseline (2-space indent)."""
from __future__ import annotations

import json
from typing import Any, Optional

from .base import BaseFormat, FormatError


class JSONFormat(BaseFormat):
    """
    Standard JSON serialization.

    - Always eligible (JSON can represent any JSON-compatible payload).
    - Uses 2-space indentation.
    - Baseline reference for token comparison.
    """

    @property
    def format_id(self) -> str:
        return "JSON"

    @property
    def description(self) -> str:
        return "Canonical baseline spec — standard 2-space indented JSON."

    def is_eligible(self, payload: Any) -> tuple[bool, Optional[str]]:
        """JSON is always eligible for any JSON-serialisable payload."""
        return True, None

    def encode(self, payload: Any) -> str:
        try:
            return json.dumps(payload, indent=2, ensure_ascii=False)
        except (TypeError, ValueError) as exc:
            raise FormatError(f"JSON encode failed: {exc}") from exc

    def decode(self, text: str) -> Any:
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise FormatError(f"JSON decode failed: {exc}") from exc
