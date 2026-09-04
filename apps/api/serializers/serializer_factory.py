"""Serializer factory — retrieves format instances from the registry.

Responsible for:
    - Looking up format instances by ID
    - Raising clear errors for unknown format IDs

NOT responsible for:
    - Format-specific encode/decode logic (formats/)
    - Orchestrating multiple formats (serialization_manager.py)
"""
from __future__ import annotations

from apps.api.formats.base import BaseFormat
from apps.api.serializers.registry import FORMAT_REGISTRY, ALL_FORMAT_IDS


class UnknownFormatError(ValueError):
    pass


def get_format(format_id: str) -> BaseFormat:
    """Return the format instance for the given format_id.

    Args:
        format_id: One of 'JSON', 'Compact JSON', 'TOON', 'JTON', 'ONTO'

    Raises:
        UnknownFormatError: if format_id is not registered.
    """
    fmt = FORMAT_REGISTRY.get(format_id)
    if fmt is None:
        raise UnknownFormatError(
            f"Unknown format: {format_id!r}. "
            f"Available: {ALL_FORMAT_IDS}"
        )
    return fmt


def list_formats() -> list[str]:
    """Return all registered format IDs in registry order."""
    return ALL_FORMAT_IDS
