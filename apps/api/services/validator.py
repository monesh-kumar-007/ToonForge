"""Strict semantic round-trip validator.

Validates that decoded output is semantically identical to the original payload.

Priority: VALIDITY > TOKEN EFFICIENCY
    A format producing the smallest token count MUST be rejected
    if its decoded output differs from the original in any way.

Detects:
    - Type changes: "123" != 123, "true" != true, "null" != null
    - Value changes
    - Missing keys
    - Additional keys
    - null vs missing-key differences
    - Nested structural differences
    - Array length and element differences
    - Order preservation in arrays
"""
from __future__ import annotations

from typing import Any, Optional


class ValidationError:
    """Detailed validation failure record."""
    def __init__(self, path: str, reason: str, original: Any = None, decoded: Any = None):
        self.path = path
        self.reason = reason
        self.original = original
        self.decoded = decoded

    def __str__(self) -> str:
        return f"[{self.path}] {self.reason}"


class StrictValidator:
    """Performs deep semantic equality validation between original and decoded payloads."""

    def validate(
        self, original: Any, decoded: Any
    ) -> tuple[bool, Optional[str]]:
        """
        Validate that decoded is semantically identical to original.

        Returns:
            (valid: bool, rejection_reason: Optional[str])

        The rejection_reason is None when valid is True.
        """
        errors: list[ValidationError] = []
        self._compare(original, decoded, path="$", errors=errors)
        if errors:
            # Return the first (most significant) error as the rejection reason
            return False, str(errors[0])
        return True, None

    def _compare(
        self, orig: Any, dec: Any, path: str, errors: list[ValidationError]
    ) -> None:
        # ── Type check ────────────────────────────────────────────────────────
        # CRITICAL: types must match exactly.
        # bool is a subclass of int in Python — must check bool before int.
        orig_type = self._type_tag(orig)
        dec_type = self._type_tag(dec)

        if orig_type != dec_type:
            errors.append(ValidationError(
                path=path,
                reason=(
                    f"Type mismatch: original={orig_type} ({orig!r}), "
                    f"decoded={dec_type} ({dec!r})"
                ),
                original=orig,
                decoded=dec,
            ))
            return  # Cannot recurse if types differ

        # ── Null ──────────────────────────────────────────────────────────────
        if orig is None:
            # Both are None (type tags matched above)
            return

        # ── Bool ──────────────────────────────────────────────────────────────
        if isinstance(orig, bool):
            if orig is not dec and orig != dec:
                errors.append(ValidationError(
                    path=path,
                    reason=f"Bool value mismatch: {orig!r} != {dec!r}",
                    original=orig,
                    decoded=dec,
                ))
            return

        # ── Number (int/float) ────────────────────────────────────────────────
        if isinstance(orig, (int, float)):
            if orig != dec:
                errors.append(ValidationError(
                    path=path,
                    reason=f"Numeric value mismatch: {orig!r} != {dec!r}",
                    original=orig,
                    decoded=dec,
                ))
            return

        # ── String ────────────────────────────────────────────────────────────
        if isinstance(orig, str):
            if orig != dec:
                errors.append(ValidationError(
                    path=path,
                    reason=f"String value mismatch: {orig!r} != {dec!r}",
                    original=orig,
                    decoded=dec,
                ))
            return

        # ── Array ─────────────────────────────────────────────────────────────
        if isinstance(orig, list):
            if len(orig) != len(dec):
                errors.append(ValidationError(
                    path=path,
                    reason=f"Array length mismatch: {len(orig)} != {len(dec)}",
                    original=orig,
                    decoded=dec,
                ))
                return
            for i, (o_item, d_item) in enumerate(zip(orig, dec)):
                self._compare(o_item, d_item, path=f"{path}[{i}]", errors=errors)
                if errors:  # Fail fast after first error
                    return
            return

        # ── Object ────────────────────────────────────────────────────────────
        if isinstance(orig, dict):
            orig_keys = set(orig.keys())
            dec_keys = set(dec.keys())

            # Missing keys in decoded
            missing = orig_keys - dec_keys
            if missing:
                errors.append(ValidationError(
                    path=path,
                    reason=f"Keys missing in decoded output: {sorted(missing)}",
                    original=orig,
                    decoded=dec,
                ))
                return

            # Extra keys in decoded
            extra = dec_keys - orig_keys
            if extra:
                errors.append(ValidationError(
                    path=path,
                    reason=f"Unexpected extra keys in decoded output: {sorted(extra)}",
                    original=orig,
                    decoded=dec,
                ))
                return

            # Recurse into matching keys
            for k in orig_keys:
                self._compare(orig[k], dec[k], path=f"{path}.{k}", errors=errors)
                if errors:
                    return
            return

    @staticmethod
    def _type_tag(value: Any) -> str:
        """Return a type tag that distinguishes all JSON types precisely."""
        if value is None:
            return "null"
        if isinstance(value, bool):
            return "bool"   # Must check before int (bool is subclass of int)
        if isinstance(value, int):
            return "int"
        if isinstance(value, float):
            return "float"
        if isinstance(value, str):
            return "string"
        if isinstance(value, list):
            return "array"
        if isinstance(value, dict):
            return "object"
        return f"unknown({type(value).__name__})"


validator = StrictValidator()
