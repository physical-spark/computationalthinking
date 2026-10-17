"""Meaningful checks for independent lessons, arithmetic models and source fidelity."""
import ast
import contextlib
import importlib.util
import io
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location("number_operators", Path("runtime/number_operators.py"))
numbers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(numbers)


def test_authored_operator_models_reject_answers_without_the_requested_operation():
    for name, source, expected in [
        ("remainder", "17 % 5", True), ("remainder", "(17 % 5)", True),
        ("remainder", "17 // 5", False), ("remainder", "2", False),
        ("remainder", "5 % 17", False), ("square", "6 ** 2", True),
        ("square", "(6 ** 2)", True), ("square", "6 * 2", False),
        ("square", "2 ** 6", False), ("square", "36", False),
        ("square", "__import__('os').system('echo unsafe')", False),
        ("square", "6 ** (6 ** 6)", False),
    ]:
        assert numbers.assess(name, source)[0] is expected, (name, source)
    outputs = []
    result = numbers.check({"page_slug": numbers.PAGE, "step_name": "remainder", "input": "17 % 5"}, lambda kind, data: outputs.append((kind, data)))
    assert result["passed"] and outputs[0][1]["parts"][0]["text"] == "2\n"


def test_all_learn_examples_really_produce_the_documented_output():
    data = json.loads(Path("content/page-concepts.json").read_text())
    course = json.loads(Path("content/course.json").read_text())
    assert set(data) == {p["id"] for p in course["pages"]}
    assert len({x["code"] for x in data.values()}) == 69
    for pid, lesson in data.items():
        tree = ast.parse(lesson["code"])
        output = io.StringIO()
        env = {}
        with contextlib.redirect_stdout(output):
            if len(tree.body) == 1 and isinstance(tree.body[0], ast.Expr):
                value = eval(compile(ast.Expression(tree.body[0].value), pid, "eval"), env)
                actual = output.getvalue().strip() or repr(value)
            else:
                exec(compile(tree, pid, "exec"), env)
                actual = output.getvalue().strip()
        assert actual == lesson["expected_output"], (pid, actual, lesson["expected_output"])
        assert len(lesson["choices"]) == 3 and 0 <= lesson["answer"] < 3
        assert len(lesson["walkthrough"]["frames"]) >= 3


def test_lesson_specific_learn_is_editable_and_code_is_locked(administrator, other):
    bid = "learn/AddingStrings/idea"
    original = administrator.get("/api/v1/admin/content/block", params={"id": bid}).json()
    assert original["preview_hash"] == "concept/AddingStrings/2"
    before = other.get("/api/v1/course").json()["page_concepts"]
    body = original["base"] + " 이번에는 빈칸까지 직접 이어 봐요."
    draft = administrator.post("/api/v1/admin/content/drafts", json={"block_id": bid, "body": body, "base_hash": original["base_hash"]})
    assert draft.status_code == 200, draft.text
    assert administrator.post("/api/v1/admin/content/" + draft.json()["id"] + "/publish", json={}).status_code == 200
    after = other.get("/api/v1/course").json()["page_concepts"]
    assert after["AddingStrings"]["idea"] == body
    assert after["IntroducingStrings"] == before["IntroducingStrings"]
    assert after["AddingStrings"]["code"] == before["AddingStrings"]["code"]
    assert administrator.get("/api/v1/admin/content/block", params={"id": "learn/AddingStrings/code"}).status_code == 404


def test_every_review_has_concept_gap_transfer_and_self_contained_choice_exercises(client):
    c = client.get("/api/v1/course").json()
    steps = {s["id"]: s for p in c["pages"] for s in p["steps"]}
    for p in c["pages"]:
        review = next(s for s in p["steps"] if s.get("recap"))
        assert review["reading"]
        for heading in ["핵심 개념 다시 보기", "이 방법을 쓰기 전에는", "이제는 이렇게 생각해요", "이런 의문도 떠올릴 수 있어요"]:
            assert heading in review["text"]
    for sid in ["FunctionsAndMethodsForLists.subscript_assignment_exercise", "FunctionsAndMethodsForLists.remove_exercise", "MoreListFunctionsAndMethods.average_exercise"]:
        assert "<pre" in steps[sid]["context_html"]
        assert "insert_one_line_from_above" in steps[sid].get("starter", "") or sid.endswith("remove_exercise")
    assert "위에서 500" not in steps["CreatingKeyValuePairs.buy_quantity_exercise"]["hints"][5]
    assert len(c["page_concepts"]) == 69
    assert sum(not s["reading"] for s in steps.values()) == 267
