"""Integration tests for full serialization and routing pipeline."""
import pytest
from apps.api.serializers.serialization_manager import SerializationManager
from apps.api.services.router import exhaustive_router
from apps.api.services.profiler import profiler
from apps.api.services.learned_router import learned_router


def test_end_to_end_pipeline():
    manager = SerializationManager()
    payload = [
        {"user_id": 101, "dept": "engineering", "active": True},
        {"user_id": 102, "dept": "product", "active": False},
        {"user_id": 103, "dept": "sales", "active": True},
    ]

    # 1. Serialization Manager
    candidates = manager.serialize_all(payload)
    assert len(candidates) == 5

    # 2. Exhaustive Routing
    res = exhaustive_router.route(payload)
    assert res.selected_format is not None
    assert not res.final_fallback_used

    # 3. Profiler
    prof = profiler.profile(payload)
    assert prof.record_count == 3

    # 4. Learned Router
    fv = profiler.extract_feature_vector(prof)
    learned_router.train([fv] * 10, [res.selected_format] * 10)
    pred = learned_router.predict(prof)
    assert pred["predicted_format"] in ["JSON", "Compact JSON", "TOON", "JTON", "ONTO"]
