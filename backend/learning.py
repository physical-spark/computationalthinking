"""Learning eligibility and server-owned assessment receipts."""

import time
from datetime import date

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select

from .avatars import AVATARS
from .db import SessionLocal
from .models import Attempt, ExecutionRecord, Learner, Progress


def profile_complete(user):
    return bool(user.admin or (user.full_name and user.birth_date and user.avatar_id in AVATARS))


def profile_data(user):
    return {
        "full_name": user.full_name,
        "birth_date": user.birth_date.isoformat() if user.birth_date else None,
        "avatar_id": user.avatar_id,
        "avatar_url": (f"/api/v1/avatars/{user.id}?v={user.avatar_version}"
                       if user.avatar_version else None),
        "profile_complete": profile_complete(user),
    }


class ProfilePayload(BaseModel):
    full_name: str = Field(min_length=1, max_length=80)
    birth_date: date
    avatar_id: str


def update_profile(user, payload):
    name = " ".join(payload.full_name.split())
    if (
        not name
        or any(ord(c) < 32 for c in payload.full_name)
        or payload.birth_date > date.today()
        or payload.avatar_id not in AVATARS
    ):
        raise HTTPException(422, "성명, 생년월일, 프로필 이모지를 확인해 주세요.")
    user.full_name, user.birth_date, user.avatar_id = name, payload.birth_date, payload.avatar_id
    return profile_data(user)


def access_map(db, user):
    from .main import published_course

    passed = set(
        db.scalars(
            select(Progress.step_id).where(
                Progress.learner_id == user.id, Progress.passed.is_(True)
            )
        )
    )
    blocked, access, current = {}, {}, {}
    for page in published_course()["pages"]:
        track = page["track"]
        for step in page["steps"]:
            sid = step["id"]
            lock = None if user.admin or step["reading"] or sid in passed else blocked.get(track)
            access[sid] = {"unlocked": lock is None, "requires": lock}
            if not step["reading"] and sid not in passed and track not in blocked:
                blocked[track] = sid
                current[track] = sid
    return {"access": access, "next_steps": current}


def require_step(db, user, sid):
    rule = access_map(db, user)["access"].get(sid)
    if not rule:
        raise HTTPException(422, "알 수 없는 학습 단계입니다.")
    if not rule["unlocked"]:
        raise HTTPException(
            403,
            {
                "code": "step_locked",
                "requires": rule["requires"],
                "message": "앞선 과제를 먼저 통과해 주세요.",
            },
        )


def finish_execution(db, run, prediction=None):
    from .main import published_course

    if run.outcome is None:
        raise HTTPException(409, "실행 결과를 기다려 주세요.")
    step = next(
        s for p in published_course()["pages"] for s in p["steps"] if s["id"] == run.step_id
    )
    if (
        run.outcome
        and step["prediction"].get("choices")
        and prediction != step["prediction"]["answer"]
    ):
        raise HTTPException(422, "예상 결과를 다시 확인해 주세요.")
    # Serialize completions from concurrent tabs before creating/updating progress.
    learner = db.scalar(select(Learner).where(Learner.id == run.learner_id).with_for_update())
    if not run.completed:
        if not db.get(Attempt, run.id):
            db.add(
                Attempt(
                    id=run.id,
                    learner_id=run.learner_id,
                    step_id=run.step_id,
                    version=run.version,
                    code=run.code,
                    passed=run.outcome,
                    source="server",
                    hints=0,
                )
            )
        p = db.get(Progress, (run.learner_id, run.step_id))
        if not p:
            db.add(
                Progress(
                    learner_id=run.learner_id,
                    step_id=run.step_id,
                    version=run.version,
                    passed=run.outcome,
                )
            )
        else:
            p.passed = p.passed or run.outcome
            p.updated = time.time()
        run.completed = True
        learner.current_step = run.step_id
        learner.active = time.time()
    return {"passed": run.outcome, "run_id": run.id}


router = APIRouter()


class Prediction(BaseModel):
    answer: str = Field(max_length=10000)


@router.post("/api/v1/executions/{rid}/prediction")
def prediction(rid: str, payload: Prediction, request: Request):
    from .main import identity

    with SessionLocal() as db:
        user = identity(request, db)
        run = db.scalar(select(ExecutionRecord).where(ExecutionRecord.id == rid).with_for_update())
        if not run or run.learner_id != user.id:
            raise HTTPException(404, "실행 기록을 찾지 못했습니다.")
        require_step(db, user, run.step_id)
        result = finish_execution(db, run, payload.answer)
        db.commit()
        return {**result, **access_map(db, user)}
