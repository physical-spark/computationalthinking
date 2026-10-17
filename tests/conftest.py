import os
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = os.environ.get(
    "CT_TEST_DATABASE_URL", "sqlite:///" + str(Path(tempfile.mkdtemp()) / "test.db")
)
os.environ["SESSION_SECRET"] = "local-test-only-" + ("x" * 40)
os.environ["COOKIE_SECURE"] = "false"
os.environ["APP_ORIGIN"] = "http://localhost:5173"
from backend.db import SessionLocal, engine
from backend.models import Base, Learner, Session
from backend.main import digest
import secrets, time
from datetime import date
from backend.main import app


@pytest.fixture(autouse=True)
def schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client():
    with TestClient(app, headers={"Origin": "http://localhost:5173"}) as c:
        token = secrets.token_urlsafe(32)
        with SessionLocal.begin() as db:
            u = Learner(nickname="테스트 회원", full_name="테스트 회원", birth_date=date(2000,1,1), avatar_id="sprout", google_sub="test-"+secrets.token_hex(12))
            db.add(u); db.flush()
            db.add(Session(token_hash=digest(token), learner_id=u.id, expires=time.time()+3600))
        c.cookies.set("ct-session", token)
        yield c


@pytest.fixture
def other():
    with TestClient(app, headers={"Origin": "http://localhost:5173"}) as c:
        token = secrets.token_urlsafe(32)
        with SessionLocal.begin() as db:
            u = Learner(nickname="테스트 회원", full_name="테스트 회원", birth_date=date(2000,1,1), avatar_id="sprout", google_sub="test-"+secrets.token_hex(12))
            db.add(u); db.flush()
            db.add(Session(token_hash=digest(token), learner_id=u.id, expires=time.time()+3600))
        c.cookies.set("ct-session", token)
        yield c


@pytest.fixture
def administrator(client):
    uid = client.get("/api/v1/me").json()["id"]
    with SessionLocal.begin() as db:
        u = db.get(Learner, uid)
        u.google_sub = "test-google-admin"
        u.admin = True
    return client


@pytest.fixture
def task():
    import json

    c = json.loads(Path("content/course.json").read_text())
    return {"step_id": c["pages"][0]["steps"][0]["id"], "version": c["version"]}
