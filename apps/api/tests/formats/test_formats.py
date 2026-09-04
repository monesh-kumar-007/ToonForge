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


def test_onto_root_dictionary():
    """TEST 1: Existing Root Dictionary Compatibility."""
    from apps.api.services.validator import validator
    fmt = ONTOFormat()
    payload = {
        "system": {
            "service": {
                "name": "toonforge"
            }
        }
    }
    el, _ = fmt.is_eligible(payload)
    assert el is True
    enc = fmt.encode(payload)
    dec = fmt.decode(enc)
    valid, reason = validator.validate(payload, dec)
    assert valid is True, f"Validation failed: {reason}"


def test_onto_root_array_of_objects():
    """TEST 2: Root Array of Objects reconstructs as a list."""
    from apps.api.services.validator import validator
    fmt = ONTOFormat()
    payload = [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"},
    ]
    encoded_text = 'ONTO\n[0].id|1\n[0].name|"Alice"\n[1].id|2\n[1].name|"Bob"'
    dec = fmt.decode(encoded_text)
    assert isinstance(dec, list)
    assert len(dec) == 2
    valid, reason = validator.validate(payload, dec)
    assert valid is True, f"Validation failed: {reason}"


def test_onto_deep_root_array():
    """TEST 3: Deep Root Array with depth >= 3 round-trips with StrictValidator."""
    from apps.api.services.validator import validator
    fmt = ONTOFormat()
    payload = [
        {
            "user": {
                "profile": {
                    "name": "Alice",
                    "settings": {"theme": "dark"}
                }
            }
        },
        {
            "user": {
                "profile": {
                    "name": "Bob",
                    "settings": {"theme": "light"}
                }
            }
        }
    ]
    el, _ = fmt.is_eligible(payload)
    assert el is True
    enc = fmt.encode(payload)
    dec = fmt.decode(enc)
    assert isinstance(dec, list)
    valid, reason = validator.validate(payload, dec)
    assert valid is True, f"Validation failed: {reason}"


def test_onto_nested_array_object_transition():
    """TEST 4: Nested Array/Object Transition."""
    from apps.api.services.validator import validator
    fmt = ONTOFormat()
    payload = {
        "teams": [
            {
                "members": [
                    {"id": 1},
                    {"id": 2}
                ]
            }
        ]
    }
    el, _ = fmt.is_eligible(payload)
    assert el is True
    enc = fmt.encode(payload)
    dec = fmt.decode(enc)
    valid, reason = validator.validate(payload, dec)
    assert valid is True, f"Validation failed: {reason}"


def test_onto_array_of_arrays():
    """TEST 5: Array of Arrays preserves exact list nesting."""
    from apps.api.services.validator import validator
    fmt = ONTOFormat()
    # Depth 3 array of arrays is eligible
    payload = [
        [[1, 2], [3, 4]],
        [[5, 6], [7, 8]]
    ]
    el, _ = fmt.is_eligible(payload)
    assert el is True
    enc = fmt.encode(payload)
    dec = fmt.decode(enc)
    assert isinstance(dec, list)
    valid, reason = validator.validate(payload, dec)
    assert valid is True, f"Validation failed: {reason}"


def test_onto_type_fidelity():
    """TEST 6: Type Fidelity preserves distinct types without coercion."""
    from apps.api.services.validator import validator
    fmt = ONTOFormat()
    payload = [
        {
            "level1": {
                "level2": {
                    "num_str": "00123",
                    "num": 123,
                    "b_true": True,
                    "str_true": "true",
                    "n_null": None,
                    "str_null": "null"
                }
            }
        }
    ]
    el, _ = fmt.is_eligible(payload)
    assert el is True
    enc = fmt.encode(payload)
    dec = fmt.decode(enc)
    valid, reason = validator.validate(payload, dec)
    assert valid is True, f"Validation failed: {reason}"

    # Verify type tags explicitly
    dec_obj = dec[0]["level1"]["level2"]
    assert dec_obj["num_str"] == "00123" and isinstance(dec_obj["num_str"], str)
    assert dec_obj["num"] == 123 and isinstance(dec_obj["num"], int) and not isinstance(dec_obj["num"], bool)
    assert dec_obj["b_true"] is True and isinstance(dec_obj["b_true"], bool)
    assert dec_obj["str_true"] == "true" and isinstance(dec_obj["str_true"], str)
    assert dec_obj["n_null"] is None
    assert dec_obj["str_null"] == "null" and isinstance(dec_obj["str_null"], str)
