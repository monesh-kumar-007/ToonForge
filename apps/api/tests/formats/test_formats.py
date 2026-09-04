"""Unit tests for all 5 serialization format implementations."""
import pytest
from apps.api.formats.json_format import JSONFormat
from apps.api.formats.compact_json import CompactJSONFormat
from apps.api.formats.toon import TOONFormat
from apps.api.formats.jton import JTONFormat
from apps.api.formats.onto import ONTOFormat


@pytest.fixture
def flat_records():
    return [
        {"id": 1, "name": "Alice", "score": 95.5, "active": True},
        {"id": 2, "name": "Bob", "score": 82.0, "active": False},
        {"id": 3, "name": "Charlie", "score": 91.2, "active": True},
    ]


@pytest.fixture
def nested_dict():
    return {
        "user": {"name": "Alice", "age": 30},
        "roles": ["admin", "editor"],
        "metadata": {"version": 1, "active": True},
    }


def test_json_format_roundtrip(flat_records, nested_dict):
    fmt = JSONFormat()
    el, _ = fmt.is_eligible(flat_records)
    assert el
    enc = fmt.encode(flat_records)
    dec = fmt.decode(enc)
    assert dec == flat_records

    enc2 = fmt.encode(nested_dict)
    dec2 = fmt.decode(enc2)
    assert dec2 == nested_dict


def test_compact_json_roundtrip(flat_records, nested_dict):
    fmt = CompactJSONFormat()
    el, _ = fmt.is_eligible(flat_records)
    assert el
    enc = fmt.encode(flat_records)
    assert "\n" not in enc
    dec = fmt.decode(enc)
    assert dec == flat_records


def test_toon_format_flat_records(flat_records):
    fmt = TOONFormat()
    el, _ = fmt.is_eligible(flat_records)
    if el:
        enc = fmt.encode(flat_records)
        dec = fmt.decode(enc)
        assert dec == flat_records


def test_jton_format_nested(nested_dict):
    fmt = JTONFormat()
    el, _ = fmt.is_eligible(nested_dict)
    if el:
        enc = fmt.encode(nested_dict)
        dec = fmt.decode(enc)
        assert dec == nested_dict


def test_onto_format_nested(nested_dict):
    fmt = ONTOFormat()
    el, _ = fmt.is_eligible(nested_dict)
    if el:
        enc = fmt.encode(nested_dict)
        dec = fmt.decode(enc)
        assert dec == nested_dict
