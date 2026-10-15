from uuid import uuid4
from backend.db import SessionLocal
from backend.main import merge_guest
from backend.models import Learner, Draft, Progress, DraftConflict, Question
from sqlalchemy import select


def test_anonymous_identity_and_admin_denial(client):
    u = client.get("/api/v1/me").json()
    assert not u["connected"] and not u["admin"]
    assert client.get("/api/v1/me").json()["id"] == u["id"]
    for path in [
        "/api/v1/admin/learners",
        "/api/v1/admin/questions",
        "/api/v1/admin/export.csv",
        "/api/v1/admin/stats",
    ]:
        assert client.get(path).status_code == 403
    assert client.patch("/api/v1/me", json={"nickname": "새 닉네임"}).status_code == 200
    assert client.get("/api/v1/me").json()["nickname"] == "새 닉네임"


def test_origin_is_required(client, task):
    assert (
        client.post(
            "/api/v1/view", json=task, headers={"Origin": "https://untrusted.example"}
        ).status_code
        == 403
    )


def test_attempt_is_idempotent_and_progress_is_monotonic(client, other, task):
    event = {**task, "id": str(uuid4()), "code": "1+2", "passed": True, "hints": 0}
    assert client.post("/api/v1/attempts", json=event).status_code == 200
    assert client.post("/api/v1/attempts", json=event).json()["duplicate"]
    assert other.post("/api/v1/attempts", json=event).status_code == 409
    client.post("/api/v1/attempts", json={**event, "id": str(uuid4()), "passed": False})
    p = client.get("/api/v1/progress").json()["progress"]
    assert p[0]["passed"]
    assert not other.get("/api/v1/progress").json()["progress"]


def test_draft_revision_conflict_preserves_code(client, task):
    d = {**task, "code": "print(1)", "revision": 0}
    assert client.put("/api/v1/drafts", json=d).json()["revision"] == 1
    conflict = client.put("/api/v1/drafts", json={**d, "code": "print(2)"})
    assert conflict.status_code == 409 and conflict.json()["remote"]["code"] == "print(1)"
    assert (
        client.put("/api/v1/drafts", json={**d, "code": "print(2)", "revision": 1}).json()[
            "revision"
        ]
        == 2
    )


def test_question_and_reply_privacy(client, other, administrator, task):
    q = {"id": str(uuid4()), "step_id": task["step_id"], "body": "출력이 왜 다른지 알고 싶어요."}
    assert other.post("/api/v1/questions", json=q).status_code == 200
    assert client.get("/api/v1/questions").json() == []
    assert client.post("/api/v1/questions/" + q["id"] + "/read", json={}).status_code == 404
    assert (
        administrator.post(
            "/api/v1/admin/questions/" + q["id"] + "/reply",
            json={"id": str(uuid4()), "body": "괄호 안의 값을 비교해 보세요."},
        ).status_code
        == 200
    )
    assert (
        administrator.get("/api/v1/admin/questions").json()[0]["nickname"]
        == other.get("/api/v1/me").json()["nickname"]
    )
    own = other.get("/api/v1/questions").json()[0]
    assert "nickname" not in own
    assert own["unread"] and own["replies"][0]["body"]
    other.post("/api/v1/questions/" + q["id"] + "/read", json={})
    assert not other.get("/api/v1/questions").json()[0]["unread"]


def test_cohort_codes_and_archive(administrator, other):
    c = administrator.post("/api/v1/admin/cohorts", json={"name": "D반"}).json()
    assert other.post("/api/v1/cohorts/join", json={"code": c["code"]}).status_code == 200
    assert len(administrator.get("/api/v1/admin/learners?cohort=" + c["id"]).json()) == 1
    rotated = administrator.post("/api/v1/admin/cohorts/" + c["id"] + "/rotate", json={}).json()
    assert rotated["code"] != c["code"]
    assert other.post("/api/v1/cohorts/join", json={"code": c["code"]}).status_code == 404
    administrator.patch(
        "/api/v1/admin/cohorts/" + c["id"], json={"name": "D반 보관", "archived": True}
    )
    assert other.post("/api/v1/cohorts/join", json={"code": rotated["code"]}).status_code == 404
    assert administrator.get("/api/v1/admin/learners?cohort=" + c["id"]).json()


def test_merge_preserves_progress_questions_and_both_drafts(client, other, task):
    guest_id = client.get("/api/v1/me").json()["id"]
    target_id = other.get("/api/v1/me").json()["id"]
    client.post(
        "/api/v1/attempts", json={**task, "id": str(uuid4()), "code": "1+2", "passed": True}
    )
    client.put("/api/v1/drafts", json={**task, "code": "guest code", "revision": 0})
    other.put("/api/v1/drafts", json={**task, "code": "account code", "revision": 0})
    qid = str(uuid4())
    client.post(
        "/api/v1/questions",
        json={"id": qid, "step_id": task["step_id"], "body": "남겨 둔 질문입니다."},
    )
    with SessionLocal.begin() as db:
        guest = db.get(Learner, guest_id)
        target = db.get(Learner, target_id)
        target.google_sub = "test-sub"
        merge_guest(db, guest, target)
    with SessionLocal() as db:
        assert db.get(Learner, guest_id) is None
        assert db.get(Draft, (target_id, task["step_id"])).code == "account code"
        assert (
            db.scalar(select(DraftConflict).where(DraftConflict.learner_id == target_id)).code
            == "guest code"
        )
        assert db.get(Progress, (target_id, task["step_id"])).passed
        assert db.get(Question, qid).learner_id == target_id


def test_csv_formula_is_escaped(administrator):
    administrator.patch("/api/v1/me", json={"nickname": "=IMPORTXML(1)"})
    result = administrator.get("/api/v1/admin/export.csv")
    assert result.status_code == 200 and "'=IMPORTXML(1)" in result.text


def test_unknown_content_rejected(client, task):
    assert (
        client.post("/api/v1/view", json={**task, "step_id": "not-a-real-step"}).status_code == 422
    )
    assert (
        client.post("/api/v1/view", json={**task, "version": "previous-release"}).status_code == 200
    )
    assert client.get("/api/v1/progress").json()["progress"][0]["version"] == "previous-release"


def test_explicit_draft_resolution_preserves_server_alternative(client, task):
    client.put("/api/v1/drafts", json={**task, "code": "server version", "revision": 0})
    result = client.post(
        "/api/v1/drafts/resolve", json={**task, "code": "browser version", "revision": 1}
    )
    assert result.status_code == 200 and result.json()["revision"] == 2
    state = client.get("/api/v1/progress").json()
    assert state["drafts"][0]["code"] == "browser version"
    assert state["conflicts"][0]["code"] == "server version"


def test_proxy_ip_is_explicit_and_validated(monkeypatch):
    from starlette.requests import Request
    from backend.main import client_ip

    def request(peer, header):
        return Request(
            {
                "type": "http",
                "client": (peer, 1234),
                "headers": [(b"cf-connecting-ip", header.encode())],
            }
        )

    monkeypatch.delenv("TRUST_CLOUDFLARE_IP", raising=False)
    assert client_ip(request("10.42.0.1", "203.0.113.9")) == "10.42.0.1"
    monkeypatch.setenv("TRUST_CLOUDFLARE_IP", "true")
    assert client_ip(request("10.42.0.1", "203.0.113.9")) == "203.0.113.9"
    assert client_ip(request("10.42.0.1", "invalid")) == "10.42.0.1"
    assert client_ip(request("8.8.8.8", "203.0.113.9")) == "8.8.8.8"


def test_reflections_are_private_idempotent_and_survive_account_merge(client, other, task):
    guest_id = client.get("/api/v1/me").json()["id"]
    target_id = other.get("/api/v1/me").json()["id"]
    note = {
        **task,
        "id": str(uuid4()),
        "explanation": "입력과 처리 규칙을 나눠 생각했습니다.",
        "choice": None,
    }
    assert client.post("/api/v1/reflections", json=note).status_code == 200
    assert client.post("/api/v1/reflections", json=note).status_code == 200
    assert len(client.get("/api/v1/progress").json()["reflections"]) == 1
    assert other.get("/api/v1/progress").json()["reflections"] == []
    assert other.post("/api/v1/reflections", json=note).status_code == 409
    with SessionLocal.begin() as db:
        merge_guest(db, db.get(Learner, guest_id), db.get(Learner, target_id))
    restored = other.get("/api/v1/progress").json()["reflections"]
    assert len(restored) == 1
    assert restored[0]["explanation"] == note["explanation"]
    assert restored[0]["learner_id"] == target_id
