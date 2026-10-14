import csv
import hashlib
import io
import json
import os
import secrets
import time
from functools import lru_cache
from pathlib import Path
from typing import Annotated
from uuid import UUID

from authlib.integrations.starlette_client import OAuth
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sq_insert
from sqlalchemy.orm import Session as DBSession
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.sessions import SessionMiddleware

from .db import database
from .models import (
    Attempt,
    Cohort,
    Draft,
    DraftConflict,
    Learner,
    Membership,
    Progress,
    Question,
    RateBucket,
    Reflection,
    Reply,
    Session,
)

APP_ORIGIN = os.environ.get("APP_ORIGIN", "http://localhost:5173").rstrip("/")
SECURE = os.environ.get("COOKIE_SECURE", "true") == "true"
COOKIE = "__Host-ct-session" if SECURE else "ct-session"
SECRET = os.environ.get("SESSION_SECRET", "")
if len(SECRET) < 32:
    raise RuntimeError("SESSION_SECRET must contain at least 32 random characters")
ROOT = Path(__file__).resolve().parents[1]
app = FastAPI(title="Computational Thinking", docs_url=None, redoc_url=None)
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET,
    session_cookie="ct-oauth",
    https_only=SECURE,
    same_site="lax",
    max_age=600,
)
oauth = OAuth()
if os.environ.get("GOOGLE_CLIENT_ID"):
    oauth.register(
        name="google",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email"},
    )
DB = Annotated[DBSession, Depends(database)]


def data(row):
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}


def fail(status, message):
    raise HTTPException(status, message)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def throttle(db, key, limit, seconds=3600):
    bucket = f"{key}:{int(time.time() // seconds)}"
    ins = pg_insert if db.bind.dialect.name == "postgresql" else sq_insert
    count = db.execute(
        ins(RateBucket)
        .values(key=bucket, count=1)
        .on_conflict_do_update(index_elements=["key"], set_={"count": RateBucket.count + 1})
        .returning(RateBucket.count)
    ).scalar_one()
    if count > limit:
        fail(429, "요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.")


def identity(request, db):
    token = request.cookies.get(COOKIE)
    session = db.get(Session, digest(token)) if token else None
    if not session or session.expires < time.time():
        fail(401, "학습 세션을 다시 연결해 주세요.")
    user = db.get(Learner, session.learner_id)
    if not user:
        fail(401, "학습 세션을 다시 연결해 주세요.")
    return user


def admin(request, db):
    u = identity(request, db)
    if not u.admin:
        fail(403, "관리자만 사용할 수 있습니다.")
    return u


def session_cookie(response, db, user):
    token = secrets.token_urlsafe(32)
    db.add(Session(token_hash=digest(token), learner_id=user.id, expires=time.time() + 180 * 86400))
    response.set_cookie(
        COOKIE, token, max_age=180 * 86400, httponly=True, secure=SECURE, samesite="lax", path="/"
    )


@lru_cache(maxsize=1)
def published_course():
    return json.loads((ROOT / "content/course.json").read_text())


def validate_step(step, version=None, gradable=False):
    catalog = ROOT / "content/course.json"
    if not catalog.exists():
        fail(503, "학습 콘텐츠를 준비 중입니다.")
    course = published_course()
    known = {s["id"] for p in course["pages"] for s in p["steps"]}
    if gradable and any(
        s["id"] == step and s["reading"] for p in course["pages"] for s in p["steps"]
    ):
        fail(422, "읽기 단계는 코드 통과로 기록하지 않습니다.")
    if step not in known:
        fail(422, "알 수 없는 학습 단계입니다.")
    # Browser attempts retain their original content version, including uploads
    # queued before a release. Stable IDs represent the same learning objective.
    if version is not None and (not version or any(ord(c) < 32 for c in version)):
        fail(422, "학습 자료 판본을 확인해 주세요.")


def rows(db, model, user):
    return db.scalars(select(model).where(model.learner_id == user.id)).all()


def own(db, model, key, user):
    r = db.get(model, key)
    if not r or r.learner_id != user.id:
        fail(404, "기록을 찾지 못했습니다.")
    return r


@app.middleware("http")
async def safeguards(request, call_next):
    if (
        request.method not in ("GET", "HEAD", "OPTIONS")
        and request.headers.get("origin") != APP_ORIGIN
    ):
        return JSONResponse({"detail": "허용되지 않은 요청 출처입니다."}, status_code=403)
    if int(request.headers.get("content-length", "0") or 0) > 100_000:
        return JSONResponse({"detail": "요청 크기가 너무 큽니다."}, status_code=413)
    r = await call_next(request)
    r.headers["X-Content-Type-Options"] = "nosniff"
    r.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    r.headers["X-Frame-Options"] = "DENY"
    if request.url.path.startswith(("/api/", "/auth/")):
        r.headers["Cache-Control"] = "no-store"
    return r


@app.get("/healthz")
def health(db: DB):
    db.execute(select(1))
    return {"status": "ok"}


@app.get("/api/v1/me")
def me(request: Request, response: Response, db: DB):
    try:
        u = identity(request, db)
    except HTTPException:
        ip = request.client.host if request.client else "unknown"
        throttle(db, "new:" + digest(SECRET + ip), 120, 60)
        u = Learner(nickname="학습자 " + secrets.token_hex(3))
        db.add(u)
        db.flush()
        session_cookie(response, db, u)
    u.active = time.time()
    return {
        "id": u.id,
        "nickname": u.nickname,
        "connected": bool(u.google_sub),
        "admin": u.admin,
        "current_step": u.current_step,
        "google_available": bool(os.environ.get("GOOGLE_CLIENT_ID")),
        "memberships": [m.cohort_id for m in rows(db, Membership, u)],
    }


class Nickname(BaseModel):
    nickname: str = Field(min_length=2, max_length=24)


@app.patch("/api/v1/me")
def nickname(payload: Nickname, request: Request, db: DB):
    u = identity(request, db)
    name = payload.nickname.strip()
    if len(name) < 2 or any(ord(c) < 32 for c in name):
        fail(422, "닉네임은 2~24자의 글자로 입력해 주세요.")
    u.nickname = name
    return {"nickname": name}


@app.post("/api/v1/logout")
def logout(request: Request, response: Response, db: DB):
    token = request.cookies.get(COOKIE)
    if token:
        db.execute(delete(Session).where(Session.token_hash == digest(token)))
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


@app.get("/api/v1/course")
def course():
    return published_course()


@app.get("/api/v1/progress")
def progress(request: Request, db: DB):
    u = identity(request, db)
    return {
        "progress": [data(r) for r in rows(db, Progress, u)],
        "drafts": [data(r) for r in rows(db, Draft, u)],
        "conflicts": [data(r) for r in rows(db, DraftConflict, u)],
        "reflections": [data(r) for r in rows(db, Reflection, u)],
    }


class StepPayload(BaseModel):
    step_id: str = Field(max_length=200)
    version: str = Field(min_length=1, max_length=80)


class ViewPayload(StepPayload):
    pass


@app.post("/api/v1/view")
def viewed(p: ViewPayload, request: Request, db: DB):
    u = identity(request, db)
    validate_step(p.step_id, p.version)
    entry = db.get(Progress, (u.id, p.step_id))
    if not entry:
        db.add(Progress(learner_id=u.id, step_id=p.step_id, version=p.version))
    else:
        entry.viewed = True
        entry.updated = time.time()
    u.current_step = p.step_id
    u.active = time.time()
    return {"ok": True}


class DraftPayload(StepPayload):
    code: str = Field(max_length=64000)
    revision: int = Field(ge=0)


@app.put("/api/v1/drafts")
def draft(p: DraftPayload, request: Request, db: DB):
    u = identity(request, db)
    validate_step(p.step_id, p.version)
    existing = db.get(Draft, (u.id, p.step_id), with_for_update=True)
    if existing and existing.revision != p.revision:
        return JSONResponse(
            {
                "detail": "다른 기기의 코드도 보존했습니다. 저장할 버전을 선택해 주세요.",
                "remote": data(existing),
            },
            status_code=409,
        )
    if not existing:
        existing = Draft(
            learner_id=u.id, step_id=p.step_id, code=p.code, version=p.version, revision=1
        )
        db.add(existing)
    else:
        existing.code = p.code
        existing.revision += 1
        existing.version = p.version
        existing.updated = time.time()
    db.flush()
    return data(existing)


@app.post("/api/v1/drafts/resolve")
def resolve_draft(p: DraftPayload, request: Request, db: DB):
    u = identity(request, db)
    validate_step(p.step_id, p.version)
    draft = db.get(Draft, (u.id, p.step_id), with_for_update=True)
    if not draft or draft.revision != p.revision:
        fail(409, "서버 코드가 다시 변경되었습니다. 새로고침 후 두 버전을 확인해 주세요.")
    if draft.code != p.code:
        db.add(
            DraftConflict(
                learner_id=u.id, step_id=p.step_id, code=draft.code, version=draft.version
            )
        )
        draft.code = p.code
        draft.revision += 1
        draft.updated = time.time()
    db.flush()
    return data(draft)


class AlternativePayload(StepPayload):
    id: UUID
    code: str = Field(max_length=64000)


@app.post("/api/v1/draft-alternatives")
def save_alternative(p: AlternativePayload, request: Request, db: DB):
    u = identity(request, db)
    validate_step(p.step_id)
    old = db.get(DraftConflict, str(p.id))
    if old and old.learner_id != u.id:
        fail(409, "이미 사용된 요청 번호입니다.")
    if not old:
        db.add(
            DraftConflict(
                id=str(p.id), learner_id=u.id, step_id=p.step_id, code=p.code, version=p.version
            )
        )
    return {"ok": True}


class AttemptPayload(StepPayload):
    id: UUID
    code: str = Field(max_length=64000)
    passed: bool
    hints: int = Field(default=0, ge=0, le=100)


@app.post("/api/v1/attempts")
def attempt(p: AttemptPayload, request: Request, db: DB):
    u = identity(request, db)
    validate_step(p.step_id, p.version, gradable=True)
    existing = db.get(Attempt, str(p.id))
    if existing:
        if existing.learner_id != u.id:
            fail(409, "이미 사용된 요청 번호입니다.")
        return {"ok": True, "duplicate": True}
    throttle(db, "attempt:" + u.id, 120, 60)
    db.add(
        Attempt(
            id=str(p.id),
            learner_id=u.id,
            step_id=p.step_id,
            version=p.version,
            code=p.code,
            passed=p.passed,
            hints=p.hints,
        )
    )
    progress = db.get(Progress, (u.id, p.step_id))
    if not progress:
        db.add(Progress(learner_id=u.id, step_id=p.step_id, version=p.version, passed=p.passed))
    else:
        progress.passed = progress.passed or p.passed
        progress.updated = time.time()
    u.current_step = p.step_id
    u.active = time.time()
    return {"ok": True}


class ReflectionPayload(StepPayload):
    id: UUID
    choice: int | None = Field(default=None, ge=0, le=10)
    explanation: str = Field(default="", max_length=4000)


@app.post("/api/v1/reflections")
def reflection(p: ReflectionPayload, request: Request, db: DB):
    u = identity(request, db)
    validate_step(p.step_id, p.version)
    old = db.get(Reflection, str(p.id))
    if old and old.learner_id != u.id:
        fail(409, "이미 사용된 요청 번호입니다.")
    if not old:
        db.add(
            Reflection(
                id=str(p.id),
                learner_id=u.id,
                step_id=p.step_id,
                version=p.version,
                choice=p.choice,
                explanation=p.explanation,
            )
        )
    return {"ok": True}


class QuestionPayload(BaseModel):
    id: UUID
    step_id: str = Field(max_length=200)
    body: str = Field(min_length=3, max_length=4000)


@app.post("/api/v1/questions")
def question(p: QuestionPayload, request: Request, db: DB):
    u = identity(request, db)
    validate_step(p.step_id)
    existing = db.get(Question, str(p.id))
    if existing:
        if existing.learner_id != u.id:
            fail(409, "이미 사용된 요청 번호입니다.")
        return {"id": existing.id}
    throttle(db, "question:" + u.id, 10)
    throttle(
        db,
        "question-ip:" + digest(SECRET + (request.client.host if request.client else "unknown")),
        60,
    )
    db.add(Question(id=str(p.id), learner_id=u.id, step_id=p.step_id, body=p.body))
    return {"id": str(p.id)}


def question_json(q, db):
    replies = db.scalars(
        select(Reply).where(Reply.question_id == q.id).order_by(Reply.created)
    ).all()
    return {
        **data(q),
        "replies": [data(r) for r in replies],
        "unread": any(r.created > q.read_at for r in replies),
    }


@app.get("/api/v1/questions")
def questions(request: Request, db: DB):
    return [question_json(q, db) for q in rows(db, Question, identity(request, db))]


@app.post("/api/v1/questions/{qid}/read")
def read_question(qid: str, request: Request, db: DB):
    q = own(db, Question, qid, identity(request, db))
    q.read_at = time.time()
    return {"ok": True}


class JoinPayload(BaseModel):
    code: str = Field(min_length=4, max_length=20)


@app.post("/api/v1/cohorts/join")
def join(p: JoinPayload, request: Request, db: DB):
    u = identity(request, db)
    throttle(db, "join:" + u.id, 10, 60)
    throttle(
        db,
        "join-ip:" + digest(SECRET + (request.client.host if request.client else "unknown")),
        60,
        60,
    )
    c = db.scalar(
        select(Cohort).where(Cohort.code == p.code.strip().upper(), Cohort.archived.is_(False))
    )
    if not c:
        fail(404, "사용 가능한 반 코드를 찾지 못했습니다.")
    if not db.get(Membership, (u.id, c.id)):
        db.add(Membership(learner_id=u.id, cohort_id=c.id))
    return {"id": c.id, "name": c.name}


class CohortPayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CohortEdit(CohortPayload):
    archived: bool = False


@app.get("/api/v1/admin/cohorts")
def cohorts(request: Request, db: DB):
    admin(request, db)
    return [data(c) for c in db.scalars(select(Cohort)).all()]


@app.post("/api/v1/admin/cohorts")
def create_cohort(p: CohortPayload, request: Request, db: DB):
    admin(request, db)
    c = Cohort(name=p.name, code=secrets.token_hex(4).upper())
    db.add(c)
    db.flush()
    return data(c)


@app.patch("/api/v1/admin/cohorts/{cid}")
def edit_cohort(cid: str, p: CohortEdit, request: Request, db: DB):
    admin(request, db)
    c = db.get(Cohort, cid)
    if not c:
        fail(404, "반을 찾지 못했습니다.")
    c.name = p.name
    c.archived = p.archived
    return data(c)


@app.post("/api/v1/admin/cohorts/{cid}/rotate")
def rotate(cid: str, request: Request, db: DB):
    admin(request, db)
    c = db.get(Cohort, cid)
    if not c:
        fail(404, "반을 찾지 못했습니다.")
    c.code = secrets.token_hex(4).upper()
    return data(c)


def learner_stats(db, cohort=None):
    q = select(Learner)
    if cohort == "free":
        q = q.where(~Learner.id.in_(select(Membership.learner_id)))
    elif cohort:
        q = q.where(
            Learner.id.in_(select(Membership.learner_id).where(Membership.cohort_id == cohort))
        )
    result = []
    for u in db.scalars(q.order_by(Learner.active.desc())).all():
        ps = rows(db, Progress, u)
        ats = rows(db, Attempt, u)
        result.append(
            {
                "id": u.id,
                "nickname": u.nickname,
                "connected": bool(u.google_sub),
                "active": u.active,
                "current_step": u.current_step,
                "viewed": len(ps),
                "passed": sum(p.passed for p in ps),
                "attempts": len(ats),
                "failed": sum(not a.passed for a in ats),
                "hints": sum(a.hints for a in ats),
                "current_failures": sum(not a.passed and a.step_id == u.current_step for a in ats),
            }
        )
    return result


@app.get("/api/v1/admin/learners")
def learners(request: Request, db: DB, cohort: str | None = None):
    admin(request, db)
    return learner_stats(db, cohort)


@app.get("/api/v1/admin/learners/{lid}")
def learner(lid: str, request: Request, db: DB):
    admin(request, db)
    u = db.get(Learner, lid)
    if not u:
        fail(404, "학습자를 찾지 못했습니다.")
    return {
        "id": u.id,
        "nickname": u.nickname,
        **{
            m.__tablename__: [data(x) for x in rows(db, m, u)]
            for m in [Progress, Attempt, Reflection, Draft]
        },
        "questions": [question_json(q, db) for q in rows(db, Question, u)],
    }


@app.get("/api/v1/admin/questions")
def admin_questions(request: Request, db: DB):
    admin(request, db)
    return [
        question_json(q, db)
        for q in db.scalars(select(Question).order_by(Question.created.desc())).all()
    ]


class ReplyPayload(BaseModel):
    id: UUID
    body: str = Field(min_length=1, max_length=4000)
    resolved: bool = True


@app.post("/api/v1/admin/questions/{qid}/reply")
def reply(qid: str, p: ReplyPayload, request: Request, db: DB):
    u = admin(request, db)
    q = db.get(Question, qid)
    if not q:
        fail(404, "질문을 찾지 못했습니다.")
    old = db.get(Reply, str(p.id))
    if old and old.question_id != qid:
        fail(409, "이미 사용된 요청 번호입니다.")
    if not old:
        db.add(Reply(id=str(p.id), question_id=qid, author_id=u.id, body=p.body))
    q.resolved = p.resolved
    return {"ok": True}


@app.get("/api/v1/admin/export.csv")
def export(request: Request, db: DB, cohort: str | None = None):
    admin(request, db)
    items = learner_stats(db, cohort)
    stream = io.StringIO()
    stream.write("\ufeff")
    keys = [
        "id",
        "nickname",
        "connected",
        "active",
        "current_step",
        "viewed",
        "passed",
        "attempts",
        "failed",
        "hints",
        "current_failures",
    ]
    writer = csv.DictWriter(stream, fieldnames=keys)
    writer.writeheader()
    for item in items:
        writer.writerow(
            {
                k: (
                    "'" + v
                    if isinstance(v, str) and v.startswith(("=", "+", "-", "@", "\t", "\r"))
                    else v
                )
                for k, v in item.items()
            }
        )
    return Response(
        stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="progress.csv"'},
    )


@app.get("/api/v1/admin/stats")
def stats(request: Request, db: DB, cohort: str | None = None):
    admin(request, db)
    ids = [x["id"] for x in learner_stats(db, cohort)]
    attempts = db.scalars(select(Attempt).where(Attempt.learner_id.in_(ids))).all()
    summary = {}
    for a in attempts:
        s = summary.setdefault(
            a.step_id,
            {
                "step_id": a.step_id,
                "attempts": 0,
                "failures": 0,
                "learners": set(),
                "passed_learners": set(),
            },
        )
        s["attempts"] += 1
        s["failures"] += not a.passed
        s["learners"].add(a.learner_id)
        if a.passed:
            s["passed_learners"].add(a.learner_id)
    return [
        {**s, "learners": len(s["learners"]), "passed_learners": len(s["passed_learners"])}
        for s in summary.values()
    ]


def merge_guest(db, guest, target):
    if guest.id == target.id:
        return
    if guest.google_sub:
        fail(409, "다른 Google 계정의 기록을 합칠 수 없습니다.")
    for p in rows(db, Progress, guest):
        old = db.get(Progress, (target.id, p.step_id))
        if old:
            old.passed = old.passed or p.passed
            old.viewed = old.viewed or p.viewed
            old.updated = max(old.updated, p.updated)
            db.delete(p)
        else:
            p.learner_id = target.id
    for d in rows(db, Draft, guest):
        old = db.get(Draft, (target.id, d.step_id))
        if old:
            if old.code != d.code:
                db.add(
                    DraftConflict(
                        learner_id=target.id, step_id=d.step_id, code=d.code, version=d.version
                    )
                )
            db.delete(d)
        else:
            d.learner_id = target.id
    for m in rows(db, Membership, guest):
        if db.get(Membership, (target.id, m.cohort_id)):
            db.delete(m)
        else:
            m.learner_id = target.id
    for model in [Attempt, Reflection, Question, DraftConflict]:
        db.execute(update(model).where(model.learner_id == guest.id).values(learner_id=target.id))
    db.execute(delete(Session).where(Session.learner_id == guest.id))
    db.flush()
    db.delete(guest)


@app.get("/auth/google/start")
async def google_start(request: Request, db: DB):
    if not os.environ.get("GOOGLE_CLIENT_ID"):
        fail(503, "Google 연결을 준비 중입니다. 익명 학습은 계속 사용할 수 있습니다.")
    u = identity(request, db)
    request.session["guest_id"] = u.id
    return await oauth.google.authorize_redirect(request, APP_ORIGIN + "/auth/google/callback")


@app.get("/auth/google/callback")
async def google_callback(request: Request, db: DB):
    if not os.environ.get("GOOGLE_CLIENT_ID"):
        fail(503, "Google 연결을 준비 중입니다.")
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(APP_ORIGIN + "/?login=failed", status_code=303)
    info = token["userinfo"]
    sub = info.get("sub")
    if not sub:
        fail(401, "Google 계정을 확인하지 못했습니다.")
    u = identity(request, db)
    if request.session.pop("guest_id", None) != u.id:
        fail(401, "로그인을 시작한 브라우저에서 다시 시도해 주세요.")
    target = db.scalar(select(Learner).where(Learner.google_sub == sub))
    if target:
        merge_guest(db, u, target)
    else:
        if u.google_sub and u.google_sub != sub:
            fail(409, "로그아웃한 뒤 다른 계정을 연결해 주세요.")
        u.google_sub = sub
        target = u
    db.execute(delete(Session).where(Session.token_hash == digest(request.cookies.get(COOKIE, ""))))
    response = RedirectResponse(APP_ORIGIN + "/?connected=1", status_code=303)
    session_cookie(response, db, target)
    request.session.clear()
    return response


class ConflictChoice(BaseModel):
    use_saved: bool


@app.post("/api/v1/conflicts/{cid}")
def conflict(cid: str, p: ConflictChoice, request: Request, db: DB):
    u = identity(request, db)
    c = own(db, DraftConflict, cid, u)
    d = db.get(Draft, (u.id, c.step_id))
    if p.use_saved and d:
        old = d.code
        d.code = c.code
        d.revision += 1
        d.updated = time.time()
        c.code = old
        return {"draft": data(d), "alternative": data(c)}
    db.delete(c)
    return {"ok": True}


class SPAFiles(StaticFiles):
    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404 and path in ("admin", "privacy"):
                return await super().get_response("index.html", scope)
            raise


if (ROOT / "web/dist").exists():
    app.mount("/", SPAFiles(directory=ROOT / "web/dist", html=True), name="web")
