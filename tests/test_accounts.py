from uuid import uuid4
from backend.db import SessionLocal
from backend.main import merge_guest
from backend.models import Learner, Draft, Progress, DraftConflict, Question
from sqlalchemy import select


def test_google_identity_and_admin_denial(client):
    u = client.get("/api/v1/me").json()
    assert u["connected"] and not u["admin"]
    assert client.get("/api/v1/me").json()["id"] == u["id"]
    for path in [
        "/api/v1/admin/learners",
        "/api/v1/admin/questions",
        "/api/v1/admin/export.csv",
        "/api/v1/admin/stats",
    ]:
        assert client.get(path).status_code == 403
    assert client.patch("/api/v1/me", json={"full_name": "새 성명", "birth_date":"2000-01-01", "avatar_id":"cat"}).status_code == 200
    assert client.get("/api/v1/me").json()["nickname"] == "새 성명"


def test_origin_is_required(client, task):
    assert (
        client.post(
            "/api/v1/view", json=task, headers={"Origin": "https://untrusted.example"}
        ).status_code
        == 403
    )


def test_browser_cannot_claim_pass(client, other, task):
    event = {**task, "id": str(uuid4()), "code": "1+2", "passed": True}
    assert client.post("/api/v1/attempts", json=event).status_code == 409
    assert client.get("/api/v1/progress").json()["progress"] == []


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


def test_admin_moves_lobby_members_and_students_cannot_assign(administrator, other):
    uid = other.get("/api/v1/me").json()["id"]
    assert other.get("/api/v1/me").json()["group_name"] == "로비"
    c = administrator.post("/api/v1/admin/cohorts", json={"name": "D그룹"}).json()
    endpoint = "/api/v1/admin/learners/" + uid + "/group"
    assert other.put(endpoint, json={"group_id": c["id"]}).status_code == 403
    assert other.post("/api/v1/cohorts/join", json={"code": c["code"]}).status_code == 403
    assert administrator.put(endpoint, json={"group_id": c["id"]}).status_code == 200
    assert other.get("/api/v1/me").json()["group_name"] == "D그룹"
    assert len(administrator.get("/api/v1/admin/learners?cohort=" + c["id"]).json()) == 1
    administrator.patch("/api/v1/admin/cohorts/"+c["id"], json={"name":"D그룹", "archived":True})
    assert administrator.put(endpoint, json={"group_id": c["id"]}).status_code == 422
    assert administrator.put(endpoint, json={"group_id": None}).status_code == 200
    assert other.get("/api/v1/me").json()["group_name"] == "로비"
    from backend.models import GroupMove
    with SessionLocal() as db:
        assert len(db.scalars(select(GroupMove).where(GroupMove.learner_id == uid)).all()) == 2


def test_merge_preserves_progress_questions_and_both_drafts(client, other, task):
    guest_id = client.get("/api/v1/me").json()["id"]
    target_id = other.get("/api/v1/me").json()["id"]
    with SessionLocal.begin() as db:
        db.add(Progress(learner_id=guest_id, step_id=task["step_id"], version=task["version"], passed=True))
    client.put("/api/v1/drafts", json={**task, "code": "guest code", "revision": 0})
    other.put("/api/v1/drafts", json={**task, "code": "account code", "revision": 0})
    qid = str(uuid4())
    client.post(
        "/api/v1/questions",
        json={"id": qid, "step_id": task["step_id"], "body": "남겨 둔 질문입니다."},
    )
    with SessionLocal.begin() as db:
        guest = db.get(Learner, guest_id)
        guest.google_sub = None  # Historical anonymous records before login became required.
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


def test_csv_formula_is_escaped(administrator, other):
    other.patch("/api/v1/me", json={"full_name": "=IMPORTXML(1)", "birth_date":"2000-01-01", "avatar_id":"cat"})
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
        db.get(Learner, guest_id).google_sub = None
        merge_guest(db, db.get(Learner, guest_id), db.get(Learner, target_id))
    restored = other.get("/api/v1/progress").json()["reflections"]
    assert len(restored) == 1
    assert restored[0]["explanation"] == note["explanation"]
    assert restored[0]["learner_id"] == target_id


def test_logged_out_learning_and_websocket_are_denied():
    from fastapi.testclient import TestClient
    from backend.main import app
    from starlette.websockets import WebSocketDisconnect
    import pytest
    with TestClient(app, headers={"Origin":"http://localhost:5173"}) as c:
        assert c.get("/api/v1/me").json()["connected"] is False
        assert not c.cookies.get("ct-session")
        for path in ["/api/v1/course", "/api/v1/progress", "/api/v1/questions", "/api/v1/admin/learners"]:
            assert c.get(path).status_code == 401
        with pytest.raises(WebSocketDisconnect) as error:
            with c.websocket_connect("/api/v1/runner"):
                pass
        assert error.value.code == 4401


def test_admin_binding_requires_verified_email_and_pins_sub(client, other, monkeypatch):
    from backend.main import bind_configured_admin
    monkeypatch.setenv("CT_ADMIN_EMAILS", "energy.to.chan@gmail.com")
    uid=client.get("/api/v1/me").json()["id"]
    oid=other.get("/api/v1/me").json()["id"]
    with SessionLocal.begin() as db:
        u=db.get(Learner,uid)
        bind_configured_admin(db,u,{"email":"energy.to.chan@gmail.com","email_verified":False})
        assert not u.admin
        bind_configured_admin(db,u,{"email":"someone@example.com","email_verified":True})
        assert not u.admin
        bind_configured_admin(db,u,{"email":"energy.to.chan@gmail.com","email_verified":True})
        assert u.admin
        attacker=db.get(Learner,oid)
        bind_configured_admin(db,attacker,{"email":"energy.to.chan@gmail.com","email_verified":True})
        assert not attacker.admin


def test_oauth_callback_preserves_existing_records_and_assigns_configured_admin(client, task, monkeypatch):
    from types import SimpleNamespace
    from fastapi.responses import RedirectResponse
    import backend.main as main
    uid=client.get("/api/v1/me").json()["id"]
    client.post("/api/v1/reflections",json={**task,"id":str(uuid4()),"explanation":"로그인 전 보존한 생각"})
    with SessionLocal.begin() as db:
        db.get(Learner,uid).google_sub=None
    class Google:
        async def authorize_redirect(self,*args,**kwargs):return RedirectResponse("https://accounts.google.com/test")
        async def authorize_access_token(self,*args):return {"userinfo":{"sub":"verified-oauth-sub","email":"energy.to.chan@gmail.com","email_verified":True}}
    monkeypatch.setattr(main,"oauth",SimpleNamespace(google=Google()))
    monkeypatch.setenv("GOOGLE_CLIENT_ID","test-client")
    monkeypatch.setenv("CT_ADMIN_EMAILS","energy.to.chan@gmail.com")
    assert client.get("/auth/google/start",follow_redirects=False).status_code==307
    assert client.get("/auth/google/callback",follow_redirects=False).status_code==303
    profile=client.get("/api/v1/me").json()
    assert profile["id"]==uid and profile["admin"] and profile["connected"]
    assert profile["group_name"] is None
    assert client.get("/api/v1/progress").json()["reflections"][0]["explanation"]=="로그인 전 보존한 생각"


def test_administrators_are_not_lobby_or_group_members(administrator, other):
    profile = administrator.get("/api/v1/me").json()
    assert profile["admin"] and profile["group_name"] is None
    assert profile["groups"] == [] and profile["memberships"] == []
    group = administrator.post("/api/v1/admin/cohorts", json={"name":"관리 테스트"}).json()
    for target in (None, group["id"]):
        assert administrator.put("/api/v1/admin/learners/"+profile["id"]+"/group", json={"group_id":target}).status_code == 422
    for suffix in ("", "?cohort=lobby", "?cohort="+group["id"]):
        assert profile["id"] not in [u["id"] for u in administrator.get("/api/v1/admin/learners"+suffix).json()]
    assert other.get("/api/v1/me").json()["group_name"] == "로비"


def test_admin_membership_migration_preserves_students_and_history(administrator, other, monkeypatch):
    import importlib
    import json
    from backend.models import Membership, GroupMove
    migration = importlib.import_module("backend.migrations.versions.20261016_admin_no_groups")
    aid = administrator.get("/api/v1/me").json()["id"]
    sid = other.get("/api/v1/me").json()["id"]
    cid = administrator.post("/api/v1/admin/cohorts", json={"name":"기존 반"}).json()["id"]
    with SessionLocal.begin() as db:
        db.add_all([Membership(learner_id=aid,cohort_id=cid), Membership(learner_id=sid,cohort_id=cid)])
        db.flush()
        monkeypatch.setattr(migration.op,"get_bind",lambda:db.connection())
        migration.upgrade()
        db.expire_all()
        assert db.get(Membership,(aid,cid)) is None
        assert db.get(Membership,(sid,cid)) is not None
        history=db.scalar(select(GroupMove).where(GroupMove.learner_id==aid))
        assert json.loads(history.previous_groups)==[cid]
        assert history.group_id is None


def test_oauth_returns_to_shared_lesson_without_open_redirect(client, monkeypatch):
    from types import SimpleNamespace
    from fastapi.responses import RedirectResponse
    import backend.main as main
    from urllib.parse import quote

    uid = client.get("/api/v1/me").json()["id"]
    with SessionLocal() as db:
        sub = db.get(Learner, uid).google_sub
    class Google:
        async def authorize_redirect(self, *args, **kwargs):
            return RedirectResponse("https://accounts.google.com/test")
        async def authorize_access_token(self, *args):
            return {"userinfo": {"sub": sub}}
    monkeypatch.setattr(main, "oauth", SimpleNamespace(google=Google()))
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client")
    for lesson, expected in [("#concept/IntroducingTheShell/2", "#concept/IntroducingTheShell/2"),
                             ("https://evil.example", ""), ("#x\r\nLocation:evil", "")]:
        assert client.get("/auth/google/start?lesson=" + quote(lesson, safe=""), follow_redirects=False).status_code == 307
        callback = client.get("/auth/google/callback", follow_redirects=False)
        assert callback.headers["location"] == main.APP_ORIGIN + "/?connected=1" + expected
