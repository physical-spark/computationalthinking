import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("module1", Path("runtime/module1.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def test_all_project_solutions_and_wrong_solutions():
    for p in m.PROJECTS:
        entry = {"page_slug": p["id"], "input": p["solution"]}
        assert m.check(entry, lambda *_: None)["passed"], p["id"]
        entry["input"] = f"def {p['function']}(*args):\n    return None"
        assert not m.check(entry, lambda *_: None)["passed"], p["id"]
