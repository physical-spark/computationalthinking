from datetime import date
from uuid import uuid4

from backend.db import SessionLocal
from backend.main import published_course
from backend.learning import finish_execution
from backend.models import Learner, ExecutionRecord, Progress, Attempt
from sqlalchemy import select


def profile():
    return {"full_name": "동명 학습자", "birth_date": "2000-02-29", "avatar_id": "owl"}


def test_profile_gate_and_identity_preserved(client, other, task):
    uid = client.get("/api/v1/me").json()["id"]
    client.put("/api/v1/drafts", json={**task, "code": "1+2", "revision": 0})
    with SessionLocal.begin() as db:
        u = db.get(Learner, uid)
        u.full_name = None
        u.birth_date = None
        u.avatar_id = None
    assert client.get("/api/v1/course").status_code == 428
    assert client.post("/api/v1/view", json=task).status_code == 428
    assert client.get("/api/v1/me").json()["profile_complete"] is False
    assert (
        client.patch("/api/v1/me", json={**profile(), "birth_date": "2999-01-01"}).status_code
        == 422
    )
    assert (
        client.patch("/api/v1/me", json={**profile(), "birth_date": "2001-02-29"}).status_code
        == 422
    )
    assert (
        client.patch("/api/v1/me", json={**profile(), "avatar_id": "arbitrary"}).status_code == 422
    )
    assert client.patch("/api/v1/me", json=profile()).status_code == 200
    assert other.patch("/api/v1/me", json=profile()).status_code == 200
    assert client.get("/api/v1/me").json()["id"] == uid
    assert other.get("/api/v1/me").json()["id"] != uid
    assert client.get("/api/v1/progress").json()["drafts"][0]["code"] == "1+2"
    assert (
        client.get("/api/v1/admin/learners/" + other.get("/api/v1/me").json()["id"]).status_code
        == 403
    )


def test_independent_paths_and_existing_gaps(client, task):
    course = published_course()
    steps = [
        s for p in course["pages"] if p["track"] == "python" for s in p["steps"] if not s["reading"]
    ]
    state = client.get("/api/v1/progress").json()
    assert state["access"][steps[0]["id"]]["unlocked"]
    assert not state["access"][steps[1]["id"]]["unlocked"]
    assert state["access"]["m1-day1.solve"]["unlocked"]
    assert not state["access"]["m1-day2.solve"]["unlocked"]
    assert (
        client.put(
            "/api/v1/drafts", json={**task, "step_id": steps[1]["id"], "code": "3", "revision": 0}
        ).status_code
        == 403
    )
    uid = client.get("/api/v1/me").json()["id"]
    with SessionLocal.begin() as db:
        db.add(
            Progress(learner_id=uid, step_id=steps[2]["id"], version=task["version"], passed=True)
        )
    state = client.get("/api/v1/progress").json()
    assert state["access"][steps[2]["id"]]["unlocked"]
    assert not state["access"][steps[3]["id"]]["unlocked"]
    with SessionLocal.begin() as db:
        run = ExecutionRecord(
            id=str(uuid4()),
            learner_id=uid,
            step_id=task["step_id"],
            version=task["version"],
            code="1+2",
            outcome=True,
        )
        db.add(run)
        db.flush()
        finish_execution(db, run)
        db.flush()
        finish_execution(db, run)
    state = client.get("/api/v1/progress").json()
    assert state["access"][steps[1]["id"]]["unlocked"]
    with SessionLocal() as db:
        assert len(db.scalars(select(Attempt).where(Attempt.learner_id == uid)).all()) == 1


def test_prediction_is_bound_to_server_result_and_owner(client, other, task):
    step = next(
        s for p in published_course()["pages"] for s in p["steps"] if s["prediction"].get("choices")
    )
    uid = client.get("/api/v1/me").json()["id"]
    rid = str(uuid4())
    with SessionLocal.begin() as db:
        # Preserve a historical completed step to make this isolated prediction reachable.
        db.add(Progress(learner_id=uid, step_id=step["id"], version=task["version"], passed=True))
        db.add(
            ExecutionRecord(
                id=rid,
                learner_id=uid,
                step_id=step["id"],
                version=task["version"],
                code="example",
                outcome=True,
            )
        )
    endpoint = "/api/v1/executions/" + rid + "/prediction"
    assert other.post(endpoint, json={"answer": step["prediction"]["answer"]}).status_code == 404
    assert client.post(endpoint, json={"answer": "wrong"}).status_code == 422
    assert client.post(endpoint, json={"answer": step["prediction"]["answer"]}).json()["passed"]
    assert client.post(endpoint, json={"answer": step["prediction"]["answer"]}).status_code == 200


def test_editorial_draft_publish_restore_security(administrator, other):
    block = "IntroducingTheShell/title"
    base = administrator.get("/api/v1/admin/content/block", params={"id": block}).json()
    assert other.get("/api/v1/admin/content").status_code == 403
    payload = {"block_id": block, "body": "수정한 설명 제목", "base_hash": base["base_hash"]}
    draft = administrator.post("/api/v1/admin/content/drafts", json=payload).json()
    assert other.get("/api/v1/course").json()["pages"][0]["title"] == base["base"]
    assert (
        administrator.get("/api/v1/admin/content/preview", params={"revision": draft["id"]}).json()[
            "pages"
        ][0]["title"]
        == payload["body"]
    )
    assert (
        other.post("/api/v1/admin/content/" + draft["id"] + "/publish", json={}).status_code == 403
    )
    assert (
        administrator.post("/api/v1/admin/content/" + draft["id"] + "/publish", json={}).status_code
        == 200
    )
    assert other.get("/api/v1/course").json()["pages"][0]["title"] == payload["body"]
    assert (
        administrator.post(
            "/api/v1/admin/content/drafts", json={**payload, "body": "<img src=x onerror=alert(1)>"}
        ).status_code
        == 422
    )
    assert (
        administrator.post(
            "/api/v1/admin/content/drafts", json={**payload, "base_hash": "obsolete"}
        ).status_code
        == 409
    )
    code_block = "IntroducingTheShell.first_expression/text"
    b = administrator.get("/api/v1/admin/content/block", params={"id": code_block}).json()
    assert (
        administrator.post(
            "/api/v1/admin/content/drafts",
            json={
                "block_id": code_block,
                "body": b["base"].replace("1+2", "9+9"),
                "base_hash": b["base_hash"],
            },
        ).status_code
        == 422
    )
    restore = administrator.post(
        "/api/v1/admin/content/drafts", json={**payload, "body": base["base"]}
    ).json()
    administrator.post("/api/v1/admin/content/" + restore["id"] + "/publish", json={})
    assert other.get("/api/v1/course").json()["pages"][0]["title"] == base["base"]
    assert (
        len(
            administrator.get("/api/v1/admin/content/block", params={"id": block}).json()["history"]
        )
        == 4
    )


def test_resources_and_source_coverage(client):
    c = client.get("/api/v1/course").json()
    assert len(c["resources"]) == 50
    assert len({r["video_id"] for r in c["resources"]}) == 46
    for p in c["pages"]:
        assert p["sources"]
        for s in p["steps"]:
            assert s["sources"]
    for r in c["resources"]:
        assert r["source_revision"] and r["source_anchor"] and r["reading"] and r["after"]
        assert r["start"] >= 0 and (r["end"] is None or r["end"] > r["start"])


def test_websocket_server_owns_outcome_and_rejects_locked(client, administrator, monkeypatch, task):
    import asyncio
    import json
    from contextlib import asynccontextmanager
    from backend import execution

    # Use a second non-admin identity: administrator fixture promotes client.
    uid = client.get("/api/v1/me").json()["id"]
    with SessionLocal.begin() as db:
        db.get(Learner, uid).admin = False

    class Broker:
        def __init__(self):
            self.events = asyncio.Queue()

        async def send(self, raw):
            value = json.loads(raw)
            if value["type"] == "run":
                assert value["id"] != "browser-chosen"
                await self.events.put(
                    json.dumps(
                        {
                            "type": "result",
                            "id": value["id"],
                            "result": {"passed": value["entry"]["input"] == "1+2"},
                        }
                    )
                )

        def __aiter__(self):
            return self

        async def __anext__(self):
            return await self.events.get()

    @asynccontextmanager
    async def connect(*a, **kw):
        yield Broker()

    monkeypatch.setattr(execution, "connect", connect)
    monkeypatch.setenv("CT_BROKER_URL", "ws://test-only")
    monkeypatch.setenv("CT_BROKER_TOKEN", "t" * 40)
    steps = [
        s
        for p in published_course()["pages"]
        if p["track"] == "python"
        for s in p["steps"]
        if not s["reading"]
    ]

    def request(step, code):
        page, name = step.rsplit(".", 1)
        return {
            "type": "run",
            "id": "browser-chosen",
            "entry": {"page_slug": page, "step_name": name, "source": "shell", "input": code},
        }

    with client.websocket_connect(
        "/api/v1/runner", headers={"origin": "http://localhost:5173"}
    ) as ws:
        ws.send_json(request(steps[1]["id"], "1+2"))
        assert ws.receive_json()["type"] == "error"
        ws.send_json(request(task["step_id"], "0"))
        failed = ws.receive_json()
        assert not failed["result"]["passed"]
        assert failed["result"]["recorded"]
        ws.send_json(request(task["step_id"], "1+2"))
        done = ws.receive_json()
        assert done["result"]["passed"] and done["result"]["recorded"]
    state = client.get("/api/v1/progress").json()
    assert state["access"][steps[1]["id"]]["unlocked"]
    with SessionLocal() as db:
        attempts = db.scalars(select(Attempt).where(Attempt.learner_id == uid)).all()
        assert len(attempts) == 2 and {a.source for a in attempts} == {"server"}


def test_editorial_git_conflict_keeps_publication(administrator, other, monkeypatch):
    from backend import editorial

    block = "IntroducingTheShell/title"
    base = administrator.get("/api/v1/admin/content/block", params={"id": block}).json()
    draft = administrator.post(
        "/api/v1/admin/content/drafts",
        json={"block_id": block, "body": "기존 게시 문구", "base_hash": base["base_hash"]},
    ).json()
    administrator.post("/api/v1/admin/content/" + draft["id"] + "/publish", json={})
    original = editorial.base_course

    def changed():
        c = original()
        c["pages"][0]["title"] = "새 Git 기본본"
        return c

    monkeypatch.setattr(editorial, "base_course", changed)
    current = administrator.get("/api/v1/admin/content/block", params={"id": block}).json()
    assert current["conflict"] and current["base"] == "새 Git 기본본"
    assert other.get("/api/v1/course").json()["pages"][0]["title"] == "기존 게시 문구"
    assert (
        administrator.post("/api/v1/admin/content/" + draft["id"] + "/publish", json={}).status_code
        == 409
    )
    resolved = administrator.post(
        "/api/v1/admin/content/drafts",
        json={"block_id": block, "body": current["base"], "base_hash": current["base_hash"]},
    ).json()
    assert (
        administrator.post(
            "/api/v1/admin/content/" + resolved["id"] + "/publish", json={}
        ).status_code
        == 200
    )
    assert not administrator.get("/api/v1/admin/content/block", params={"id": block}).json()[
        "conflict"
    ]


def test_prose_rejects_unquoted_layout_and_missing_attribute_value():
    import pytest
    from fastapi import HTTPException
    from backend.editorial import validate_prose

    for body in ["<p class=hidden>text</p>", "<a href>text</a>", '<p onclick="alert(1)">text</p>']:
        with pytest.raises(HTTPException) as exc:
            validate_prose(body, "<p>text</p>")
        assert exc.value.status_code == 422


def test_all_existing_prose_blocks_round_trip_without_changing_code():
    from backend.editorial import base_course, blocks, validate_prose

    for block_id, (obj, key) in blocks(base_course()).items():
        validate_prose(obj[key], obj[key], block_id)


def test_story_prose_can_be_edited_without_changing_assessment(administrator, other):
    bid = "IntroducingTheShell/story/scene"
    info = administrator.get("/api/v1/admin/content/block", params={"id": bid})
    assert info.status_code == 200, info.text
    payload = info.json()
    assert payload["preview_hash"] == "concept/IntroducingTheShell/1"
    original = other.get("/api/v1/course").json()["pages"][0]
    edit = administrator.post("/api/v1/admin/content/drafts", json={"block_id": bid, "body": "사과를 하나씩 모아 봐요.", "base_hash": payload["base_hash"]})
    assert edit.status_code == 200, edit.text
    rid = edit.json()["id"]
    assert other.get("/api/v1/course").json()["pages"][0]["story"]["scene"] == original["story"]["scene"]
    assert administrator.post("/api/v1/admin/content/" + rid + "/publish", json={}).status_code == 200
    published = other.get("/api/v1/course").json()["pages"][0]
    assert published["story"]["scene"] == "사과를 하나씩 모아 봐요."
    assert published["steps"] == original["steps"]
