"""TOONFORGE Benchmark Structural Taxonomy Definitions.

Defines the 5 structural categories used in empirical evaluation:
1. FLAT_TABULAR: Uniform list of flat dictionaries (high schema uniformity, zero nesting)
2. NESTED_OBJECTS: Multi-level objects with recurring sub-schemas
3. DEEP_NESTED: Deep hierarchical trees (depth >= 5, low branching factor)
4. HETEROGENEOUS: Polymorphic arrays, mixed record types, variable schemas
5. KEY_SPARSE: Tabular data with high null distribution or optional attributes
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable


class StructuralCategory(str, Enum):
    FLAT_TABULAR = "flat_tabular"
    NESTED_OBJECTS = "nested_objects"
    DEEP_NESTED = "deep_nested"
    HETEROGENEOUS = "heterogeneous"
    KEY_SPARSE = "key_sparse"


@dataclass(frozen=True)
class CategoryMetadata:
    name: str
    code: StructuralCategory
    description: str
    expected_depth_range: tuple[int, int]
    expected_uniformity_range: tuple[float, float]
    hypothesized_optimal_format: str


TAXONOMY: dict[StructuralCategory, CategoryMetadata] = {
    StructuralCategory.FLAT_TABULAR: CategoryMetadata(
        name="Flat Tabular",
        code=StructuralCategory.FLAT_TABULAR,
        description="Uniform arrays of dictionary records with consistent keys and primitive values.",
        expected_depth_range=(1, 2),
        expected_uniformity_range=(0.95, 1.0),
        hypothesized_optimal_format="TOON",
    ),
    StructuralCategory.NESTED_OBJECTS: CategoryMetadata(
        name="Nested Objects",
        code=StructuralCategory.NESTED_OBJECTS,
        description="Complex objects containing sub-records, metadata, and structured configuration blocks.",
        expected_depth_range=(2, 4),
        expected_uniformity_range=(0.60, 0.90),
        hypothesized_optimal_format="JTON",
    ),
    StructuralCategory.DEEP_NESTED: CategoryMetadata(
        name="Deep Nested",
        code=StructuralCategory.DEEP_NESTED,
        description="Hierarchical trees or recursive parent-child relationships with depth >= 5.",
        expected_depth_range=(5, 12),
        expected_uniformity_range=(0.40, 0.85),
        hypothesized_optimal_format="ONTO",
    ),
    StructuralCategory.HETEROGENEOUS: CategoryMetadata(
        name="Heterogeneous / Polymorphic",
        code=StructuralCategory.HETEROGENEOUS,
        description="Mixed item types within arrays, dynamic fields, and irregular shapes.",
        expected_depth_range=(1, 4),
        expected_uniformity_range=(0.0, 0.50),
        hypothesized_optimal_format="Compact JSON",
    ),
    StructuralCategory.KEY_SPARSE: CategoryMetadata(
        name="Key-Sparse Tabular",
        code=StructuralCategory.KEY_SPARSE,
        description="Tabular collections with frequent optional or missing keys, high null density.",
        expected_depth_range=(1, 3),
        expected_uniformity_range=(0.30, 0.75),
        hypothesized_optimal_format="Compact JSON",
    ),
}
