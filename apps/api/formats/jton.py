"""JTON — JSON Table Object Notation.

Key-hoisting / columnar projection for tabular payloads with high key repetition.

Format:
    JTON:{"keys":[<k1>,<k2>,...<kN>],"rows":[[v1,v2,...vN],...]}

Design:
    - The schema (key list) is stored once.
    - Each record is stored as a value array.
    - Preserves full JSON type semantics (values are JSON-encoded).
    - Eligible when root is an array of objects with high key-set consistency.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from .base import BaseFormat, EligibilityError, FormatError

_JTON_PREFIX = "JTON:"
_KEY_CONSISTENCY_THRESHOLD = 0.6  # at least 60% key-set overlap required


class JTONFormat(BaseFormat):
    """JSON Table Object Notation — hoisted-key columnar encoding."""

    @property
    def format_id(self) -> str:
        return "JTON"

    @property
    def description(self) -> str:
        return "Hoisted key dictionary — columnar projection for repeated-key payloads."

    def is_eligible(self, payload: Any) -> tuple[bool, Optional[str]]:
        """
        JTON is eligible when:
        1. Root is a non-empty list.
        2. At least 60% of elements are dicts.
        3. The dominant key-set covers >= 60% of all key occurrences.
        """
        if not isinstance(payload, list) or len(payload) == 0:
            return False, "JTON requires a non-empty array at root."
        dict_items = [x for x in payload if isinstance(x, dict)]
        if len(dict_items) / len(payload) < _KEY_CONSISTENCY_THRESHOLD:
            return False, "JTON requires most array elements to be objects."

        # Find dominant key-set
        all_keys: dict[str, int] = {}
        for item in dict_items:
            for k in item.keys():
                all_keys[k] = all_keys.get(k, 0) + 1

        if not all_keys:
            return False, "JTON: no keys found."

        # Key repetition ratio: avg occurrences per unique key
        total_occurrences = sum(all_keys.values())
        unique_keys = len(all_keys)
        repetition_ratio = total_occurrences / (unique_keys * len(dict_items))

        if repetition_ratio < _KEY_CONSISTENCY_THRESHOLD:
            return False, (
                f"JTON requires high key repetition ratio "
                f"(got {repetition_ratio:.2f}, need >= {_KEY_CONSISTENCY_THRESHOLD})."
            )
        return True, None

    def encode(self, payload: Any) -> str:
        eligible, reason = self.is_eligible(payload)
        if not eligible:
            raise EligibilityError(reason)

        dict_items = [x for x in payload if isinstance(x, dict)]

        # Build unified key list from most-frequent keys
        key_counts: dict[str, int] = {}
        for item in dict_items:
            for k in item.keys():
                key_counts[k] = key_counts.get(k, 0) + 1

        # Sort by frequency descending, then alphabetically for stability
        keys = sorted(key_counts.keys(), key=lambda k: (-key_counts[k], k))

        rows: list[list[Any]] = []
        for item in payload:
            if isinstance(item, dict):
                row = [item.get(k) for k in keys]  # None for missing keys
            else:
                # Non-dict elements kept as singleton rows
                row = [item]
            rows.append(row)

        jton_obj = {"keys": keys, "rows": rows}
        return _JTON_PREFIX + json.dumps(jton_obj, separators=(",", ":"), ensure_ascii=False)

    def decode(self, text: str) -> Any:
        if not text.startswith(_JTON_PREFIX):
            raise FormatError(f"JTON: text does not start with expected prefix {_JTON_PREFIX!r}.")
        json_part = text[len(_JTON_PREFIX):]
        try:
            jton_obj = json.loads(json_part)
        except json.JSONDecodeError as exc:
            raise FormatError(f"JTON: JSON parse failed: {exc}") from exc

        if not isinstance(jton_obj, dict):
            raise FormatError("JTON: top-level structure must be an object.")
        if "keys" not in jton_obj or "rows" not in jton_obj:
            raise FormatError("JTON: missing 'keys' or 'rows' field.")

        keys: list[str] = jton_obj["keys"]
        rows: list[Any] = jton_obj["rows"]

        result: list[Any] = []
        for row in rows:
            if isinstance(row, list) and len(row) == len(keys):
                record = {k: v for k, v in zip(keys, row)}
                # Remove keys where value is None (they were absent in original)
                # BUT: we must NOT remove explicit None values from original.
                # Since JTON uses None for absent keys, we retain them all.
                result.append(record)
            else:
                # Scalar or mismatched row
                result.append(row[0] if isinstance(row, list) and len(row) == 1 else row)
        return result
