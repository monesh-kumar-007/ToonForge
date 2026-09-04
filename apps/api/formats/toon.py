"""TOON — Token-Ordered Object Notation.

Schema-once, value-stream encoding for uniform arrays of objects.

Format:
    TOON:<key1>,<key2>,...<keyN>
    <val1>,<val2>,...<valN>
    <val1>,<val2>,...<valN>
    ...

Design constraints & known limitations:
    - ONLY eligible when the root payload is an array of objects that share
      an identical key set.
    - Values are serialised as JSON scalars separated by commas and newlines.
    - Strings are NOT quoted in the value stream: this means strings that
      look like numbers ("00123"), booleans ("true"), or null ("null") will
      be coerced on decode → STRICT VALIDATION WILL REJECT those candidates.
    - This is a KNOWN defect: do not silently suppress it. The validator
      detects the type mismatch and rejects the candidate.
"""
from __future__ import annotations

import json
import re
from typing import Any, Optional

from .base import BaseFormat, EligibilityError, FormatError


_TOON_HEADER_RE = re.compile(r"^TOON:(.+)$", re.MULTILINE)


def _scalar_to_toon(value: Any) -> str:
    """Serialise a scalar value to its TOON token representation."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return json.dumps(value)  # preserves int vs float
    if isinstance(value, str):
        # Strings are stored unquoted — this is the source of TOON's type-preservation risk
        return value
    # Non-scalar: embed as compact JSON
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def _toon_token_to_python(token: str) -> Any:
    """Convert a TOON value token back to a Python value.

    Note: unquoted strings that look like numbers/booleans/null
    will be coerced to their native types. The strict validator
    will detect this as a semantic mismatch.
    """
    token = token.strip()
    if token == "null":
        return None
    if token == "true":
        return True
    if token == "false":
        return False
    # Try numeric
    try:
        # Prefer int if no decimal/exponent
        if re.fullmatch(r"-?\d+", token):
            return int(token)
        return float(token)
    except ValueError:
        pass
    # Try embedded JSON (for nested objects)
    if token.startswith("{") or token.startswith("["):
        try:
            return json.loads(token)
        except json.JSONDecodeError:
            pass
    # Plain string
    return token


class TOONFormat(BaseFormat):
    """Token-Ordered Object Notation (schema-once, value-stream)."""

    @property
    def format_id(self) -> str:
        return "TOON"

    @property
    def description(self) -> str:
        return "Token-ordered optimal notation — schema-once, value-stream encoding."

    def is_eligible(self, payload: Any) -> tuple[bool, Optional[str]]:
        """
        TOON is eligible ONLY when:
        1. Root payload is a non-empty list.
        2. Every element is a dict.
        3. All dicts share the exact same key set.
        """
        if not isinstance(payload, list) or len(payload) == 0:
            return False, "TOON requires a non-empty array at root."
        first_keys: Optional[frozenset] = None
        for item in payload:
            if not isinstance(item, dict):
                return False, "TOON requires every array element to be an object."
            ks = frozenset(item.keys())
            if first_keys is None:
                first_keys = ks
            elif ks != first_keys:
                return False, "TOON requires all objects to share an identical key set."
        return True, None

    def encode(self, payload: Any) -> str:
        eligible, reason = self.is_eligible(payload)
        if not eligible:
            raise EligibilityError(reason)
        if not payload:
            raise FormatError("TOON cannot encode an empty array.")

        keys = list(payload[0].keys())
        header = "TOON:" + ",".join(keys)
        rows: list[str] = []
        for record in payload:
            row_vals = [_scalar_to_toon(record[k]) for k in keys]
            rows.append(",".join(row_vals))
        return header + "\n" + "\n".join(rows)

    def decode(self, text: str) -> Any:
        lines = text.strip().splitlines()
        if not lines:
            raise FormatError("TOON: empty input.")
        header_line = lines[0]
        match = _TOON_HEADER_RE.match(header_line)
        if not match:
            raise FormatError(f"TOON: invalid header line: {header_line!r}")
        keys = match.group(1).split(",")
        records: list[dict] = []
        for line in lines[1:]:
            if not line.strip():
                continue
            # Simple CSV split — commas inside nested JSON objects are a known limitation
            tokens = _smart_split(line, len(keys))
            if len(tokens) != len(keys):
                raise FormatError(
                    f"TOON: row token count mismatch. "
                    f"Expected {len(keys)}, got {len(tokens)}. Row: {line!r}"
                )
            record = {k: _toon_token_to_python(v) for k, v in zip(keys, tokens)}
            records.append(record)
        return records


def _smart_split(line: str, expected_count: int) -> list[str]:
    """
    Split a TOON value row by commas, respecting embedded JSON objects/arrays.
    Falls back to simple split if bracket depth tracking is needed.
    """
    tokens: list[str] = []
    depth = 0
    current: list[str] = []
    for ch in line:
        if ch in "{[":
            depth += 1
            current.append(ch)
        elif ch in "}]":
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            tokens.append("".join(current))
            current = []
        else:
            current.append(ch)
    if current:
        tokens.append("".join(current))
    return tokens
