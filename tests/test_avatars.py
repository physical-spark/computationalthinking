import io
import json
from pathlib import Path

from PIL import Image
from fastapi.testclient import TestClient

from backend.avatars import AVATARS, MAX_UPLOAD_BYTES
from backend.db import SessionLocal
from backend.main import app
from backend.models import Learner, ProfileImage


def picture(fmt="PNG", size=(800, 400), **kwargs):
    out = io.BytesIO()
    Image.new("RGB", size, "teal").save(out, format=fmt, **kwargs)
    return out.getvalue()


def test_catalog_preserves_existing_ids():
    catalog = json.loads(Path("content/avatars.json").read_text())
    assert len(catalog) == len(AVATARS) == 100
    assert all(len(row) == 3 and len(row[0]) <= 20 for row in catalog)
    assert {"sprout", "cat", "dog", "fox", "panda", "koala", "tiger", "lion", "rabbit",
            "bear", "penguin", "owl", "whale", "dolphin", "turtle", "octopus"} <= AVATARS


def test_upload_private_normalized_and_deleted(client, other):
    before = client.get("/api/v1/me").json()
    exif = Image.Exif()
    exif[270] = "private-source-metadata"
    uploaded = client.put("/api/v1/me/avatar", content=picture("JPEG", exif=exif)).json()
    url = uploaded["avatar_url"]
    assert uploaded["avatar_id"] == before["avatar_id"]
    assert client.get("/api/v1/me").json()["avatar_url"] == url
    own = client.get(url)
    assert own.status_code == 200
    assert own.headers["content-type"] == "image/webp"
    assert own.headers["cache-control"] == "no-store"
    assert own.headers["x-content-type-options"] == "nosniff"
    with Image.open(io.BytesIO(own.content)) as im:
        assert im.size == (256, 256)
        assert not im.getexif() and not im.info.get("xmp")
    assert b"private-source-metadata" not in own.content
    assert other.get(url).status_code == 404
    other_id = other.get("/api/v1/me").json()["id"]
    with SessionLocal.begin() as db:
        db.get(Learner, other_id).admin = True
    assert other.get(url).content == own.content
    assert client.patch("/api/v1/me", json={"full_name": "사진 회원", "birth_date": "2000-01-01", "avatar_id": "owl"}).json()["avatar_url"] == url
    changed = client.patch("/api/v1/me/avatar", json={"avatar_id": "rocket"})
    assert changed.json()["avatar_url"] is None
    assert changed.json()["avatar_id"] == "rocket"
    assert client.get(url).status_code == 404
    with SessionLocal() as db:
        assert db.get(ProfileImage, before["id"]) is None


def test_invalid_upload_preserves_existing_photo(client):
    url = client.put("/api/v1/me/avatar", content=picture()).json()["avatar_url"]
    original = client.get(url).content
    for raw in [b"", b"<svg xmlns='http://www.w3.org/2000/svg'></svg>", b"corrupt", picture("GIF"), picture("PNG", (5000, 4001))]:
        assert client.put("/api/v1/me/avatar", content=raw).status_code == 422
    assert client.put("/api/v1/me/avatar", content=b"x" * (MAX_UPLOAD_BYTES + 1)).status_code == 413
    # Chunked requests cannot bypass the limit even without Content-Length.
    assert client.put("/api/v1/me/avatar", content=iter([b"x" * MAX_UPLOAD_BYTES, b"x"])).status_code == 413
    assert client.patch("/api/v1/me/avatar", json={"avatar_id": "invalid"}).status_code == 422
    assert client.get(url).content == original
    assert client.get("/api/v1/me").json()["avatar_url"] == url


def test_upload_auth_csrf_and_onboarding(client):
    me = client.get("/api/v1/me").json()
    raw = picture()
    with TestClient(app) as anonymous:
        assert anonymous.get(f"/api/v1/avatars/{me['id']}").status_code == 401
        assert anonymous.put("/api/v1/me/avatar", content=raw, headers={"Origin": "http://localhost:5173"}).status_code == 401
    assert client.put("/api/v1/me/avatar", content=raw, headers={"Origin": "https://evil.example"}).status_code == 403
    with SessionLocal.begin() as db:
        u = db.get(Learner, me["id"])
        u.full_name = u.birth_date = u.avatar_id = None
    result = client.put("/api/v1/me/avatar", content=raw)
    assert result.status_code == 200
    assert result.json()["profile_complete"] is False
    assert client.get(result.json()["avatar_url"]).status_code == 200
    assert client.get("/api/v1/course").status_code == 428
    assert client.patch("/api/v1/me", json={"full_name": "사진 회원", "birth_date": "2000-01-01", "avatar_id": "sprout"}).json()["profile_complete"] is True


def test_admin_avatar_without_required_profile(administrator):
    me = administrator.get("/api/v1/me").json()
    with SessionLocal.begin() as db:
        u = db.get(Learner, me["id"])
        u.full_name = u.birth_date = u.avatar_id = None
    result = administrator.put("/api/v1/me/avatar", content=picture())
    assert result.status_code == 200 and result.json()["profile_complete"]
    assert result.json()["birth_date"] is None
