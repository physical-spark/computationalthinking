import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("life_expression", Path("runtime/life_expression.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def test_equivalent_everyday_cost_models_are_accepted():
    for source in [
        "(4 * 8000 + 12000 - 4000) / 4",
        "8000 + (12000 - 4000) / 4",
        "8000 + 12000 / 4 - 4000 / 4",
        "(8000 * 4 - 4000 + 12000) / 4",
        "(4*8_000 + 1*12_000 - 1*4_000)/4",
        "(4 * 8000.0 + 12000 - 4000) / 4 # 한 사람 몫",
        "(4*8000 + 12000 + -4000)/4",
    ]:
        assert m.assess(source)[0], source


def test_wrong_models_and_answers_without_a_model_are_rejected():
    for source in [
        "5 - 6",
        "2 * 3",
        "10000",
        "print(10000)",
        "(8000 + 12000 - 4000) / 4",
        "4 * 8000 + 12000 - 4000 / 4",
        "(4 * (8000 + 12000) - 4000) / 4",
        "(4*8000 + 12000 - 4*4000)/4",
        "(4*8000 + 12000 - 4000)/(4-4)",
        "10000 + (8000-8000) + (12000-12000) + (4000-4000) + (4-4)",
        "__import__('os').system('echo should-not-run')",
        "x = (4*8000 + 12000-4000)/4",
        "(4 * 8000 + 12000 - 4000) // 4",
        "(4 * 8000 + 12000 - 4000 / 4",
    ]:
        passed, message = m.assess(source)
        assert not passed, source
        assert message


def test_overlay_changes_only_this_problem_and_preserves_runtime_failure(client):
    entry = {
        "page_slug": "IntroducingTheShell",
        "step_name": "more_calculation",
        "input": m.EXAMPLE,
    }
    assert m.apply(entry, {"passed": True})["passed"]
    assert not m.apply(entry, {"passed": False, "error": "runtime error"})["passed"]
    entry["input"] = "5 - 6"
    assert not m.apply(entry, {"passed": True})["passed"]
    entry["step_name"] = "first_expression"
    original = {"passed": True}
    assert m.apply(entry, original) is original
    course = client.get("/api/v1/course").json()
    step = next(s for p in course["pages"] for s in p["steps"] if s["id"] == m.STEP_ID)
    assert "팝콘" in step["text"] and "<code>4000</code>" in step["text"]
    assert step["solution"]["tokens"] == [m.EXAMPLE]
    assert "자체 작성" in step["sources"][0]["label"]
