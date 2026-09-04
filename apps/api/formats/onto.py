"""ONTO — Object-Nesting Tuple Ordering.

Ordered nested-triple encoding for deep recursive object structures.

Format:
    ONTO:<json_path>|<value_json>\n...

Design:
    - Flattens deeply nested objects into (path, value) pairs.
    - Paths use dot-notation for objects and bracket-notation for arrays.
    - All values are JSON-encoded scalars or empty containers.
    - Eligible when structure contains significant nesting depth.
    - Preserves full JSON type semantics (values remain JSON-encoded).
"""
from __future__ import annotations

import json
import re
from typing import Any, Optional

from .base import BaseFormat, EligibilityError, FormatError

_ONTO_PREFIX = "ONTO\n"
_MIN_DEPTH_THRESHOLD = 3          # require at least depth 3 for ONTO to add value
_PATH_SEPARATOR = "."
_ARRAY_BRACKET_RE = re.compile(r"\[(\d+)\]")


def _flatten(obj: Any, prefix: str = "") -> list[tuple[str, Any]]:
    """Recursively flatten a nested object into (path, leaf_value) pairs."""
    pairs: list[tuple[str, Any]] = []

    if isinstance(obj, dict):
        if not obj:
            pairs.append((prefix, {}))
        else:
            for k, v in obj.items():
                safe_key = str(k).replace("|", "\\|").replace(".", "\\.")
                new_prefix = f"{prefix}.{safe_key}" if prefix else safe_key
                pairs.extend(_flatten(v, new_prefix))
    elif isinstance(obj, list):
        if not obj:
            pairs.append((prefix, []))
        else:
            for i, v in enumerate(obj):
                new_prefix = f"{prefix}[{i}]"
                pairs.extend(_flatten(v, new_prefix))
    else:
        pairs.append((prefix, obj))

    return pairs


def _unflatten(pairs: list[tuple[str, Any]]) -> Any:
    """Reconstruct nested object from (path, leaf_value) pairs."""
    root: dict = {}

    for path, value in pairs:
        _set_nested(root, path, value)

    # If root has exactly one key that is "__root__", unwrap it
    if list(root.keys()) == ["__root__"]:
        return root["__root__"]
    return root


def _parse_path(path: str) -> list[Any]:
    """Parse a dot/bracket path into a list of keys/indices."""
    # Split on unescaped dots
    parts_raw = re.split(r"(?<!\\)\.", path)
    parts: list[Any] = []
    for part in parts_raw:
        if not part:
            continue
        # Handle array notation [0], [1], etc.
        bracket_match = _ARRAY_BRACKET_RE.fullmatch(part)
        if bracket_match:
            parts.append(int(bracket_match.group(1)))
        elif "[" in part:
            # Mixed: key[index]
            base_bracket = re.split(r"(?=\[)", part, maxsplit=1)
            base = base_bracket[0].replace("\\.", ".").replace("\\|", "|")
            if base:
                parts.append(base)
            for m in _ARRAY_BRACKET_RE.finditer(part):
                parts.append(int(m.group(1)))
        else:
            parts.append(part.replace("\\.", ".").replace("\\|", "|"))
    return parts


def _set_nested(root: dict, path: str, value: Any) -> None:
    """Set value in nested dict/list structure according to path."""
    keys = _parse_path(path)
    if not keys:
        return
    node: Any = root
    for i, key in enumerate(keys[:-1]):
        next_key = keys[i + 1]
        if isinstance(key, int):
            while len(node) <= key:
                node.append(None)
            if node[key] is None:
                node[key] = [] if isinstance(next_key, int) else {}
            node = node[key]
        else:
            if key not in node or node[key] is None:
                node[key] = [] if isinstance(next_key, int) else {}
            node = node[key]
    last_key = keys[-1]
    if isinstance(last_key, int):
        while len(node) <= last_key:
            node.append(None)
        node[last_key] = value
    else:
        node[last_key] = value


def _max_depth(obj: Any, current: int = 0) -> int:
    """Compute maximum nesting depth of a payload."""
    if isinstance(obj, dict):
        if not obj:
            return current
        return max(_max_depth(v, current + 1) for v in obj.values())
    if isinstance(obj, list):
        if not obj:
            return current
        return max(_max_depth(v, current + 1) for v in obj)
    return current


class ONTOFormat(BaseFormat):
    """Object-Nesting Tuple Ordering — nested-triple encoding."""

    @property
    def format_id(self) -> str:
        return "ONTO"

    @property
    def description(self) -> str:
        return "Ordered nested triples — graph vector layout for deep recursive structures."

    def is_eligible(self, payload: Any) -> tuple[bool, Optional[str]]:
        """
        ONTO is eligible when:
        1. Payload is a dict or list.
        2. Maximum depth >= threshold (3).
        """
        if not isinstance(payload, (dict, list)):
            return False, "ONTO requires an object or array at root."
        depth = _max_depth(payload)
        if depth < _MIN_DEPTH_THRESHOLD:
            return (
                False,
                f"ONTO requires nesting depth >= {_MIN_DEPTH_THRESHOLD} "
                f"(payload depth = {depth}).",
            )
        return True, None

    def encode(self, payload: Any) -> str:
        eligible, reason = self.is_eligible(payload)
        if not eligible:
            raise EligibilityError(reason)

        pairs = _flatten(payload)
        lines: list[str] = [_ONTO_PREFIX.strip()]
        for path, value in pairs:
            encoded_value = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
            lines.append(f"{path}|{encoded_value}")
        return "\n".join(lines)

    def decode(self, text: str) -> Any:
        lines = text.strip().splitlines()
        if not lines:
            raise FormatError("ONTO: empty input.")
        if lines[0] != "ONTO":
            raise FormatError(f"ONTO: expected 'ONTO' header, got {lines[0]!r}.")

        pairs: list[tuple[str, Any]] = []
        for line in lines[1:]:
            if not line.strip():
                continue
            # Split on first unescaped pipe
            pipe_idx = _find_pipe(line)
            if pipe_idx == -1:
                raise FormatError(f"ONTO: missing '|' separator in line: {line!r}")
            path = line[:pipe_idx]
            value_json = line[pipe_idx + 1:]
            try:
                value = json.loads(value_json)
            except json.JSONDecodeError as exc:
                raise FormatError(f"ONTO: invalid JSON value at path {path!r}: {exc}") from exc
            pairs.append((path, value))

        if not pairs:
            raise FormatError("ONTO: no path-value pairs found.")
        return _unflatten(pairs)


def _find_pipe(line: str) -> int:
    """Find the first unescaped pipe character."""
    for i, ch in enumerate(line):
        if ch == "|" and (i == 0 or line[i - 1] != "\\"):
            return i
    return -1
