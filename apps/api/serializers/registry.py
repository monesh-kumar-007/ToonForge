"""Format registry — single source of truth for all available formats.

This module ONLY registers format classes.
It does NOT implement any serialization logic.
All serialization logic lives in formats/.
"""
from __future__ import annotations

from apps.api.formats.json_format import JSONFormat
from apps.api.formats.compact_json import CompactJSONFormat
from apps.api.formats.toon import TOONFormat
from apps.api.formats.jton import JTONFormat
from apps.api.formats.onto import ONTOFormat
from apps.api.formats.base import BaseFormat

# Ordered registry: defines evaluation priority
FORMAT_REGISTRY: dict[str, BaseFormat] = {
    "JSON": JSONFormat(),
    "Compact JSON": CompactJSONFormat(),
    "TOON": TOONFormat(),
    "JTON": JTONFormat(),
    "ONTO": ONTOFormat(),
}

ALL_FORMAT_IDS: list[str] = list(FORMAT_REGISTRY.keys())
