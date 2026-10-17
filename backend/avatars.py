"""Private, bounded, metadata-free profile images backed up with the database."""

import hashlib
import io
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, Response
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy import delete, select
from starlette.concurrency import run_in_threadpool

from .db import SessionLocal
from .models import Learner, ProfileImage

AVATARS = {row[0] for row in json.loads(
    (Path(__file__).resolve().parents[1] / "content/avatars.json").read_text()
)}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 20_000_000
router = APIRouter()


def normalize_image(raw):
    try:
        with Image.open(io.BytesIO(raw)) as source:
            if source.format not in {"JPEG", "PNG", "WEBP"}:
                raise ValueError("format")
            if source.width * source.height > MAX_PIXELS or getattr(source, "n_frames", 1) != 1:
                raise ValueError("dimensions")
            source.load()
            corrected = ImageOps.exif_transpose(source)
            thumb = ImageOps.fit(corrected.convert("RGBA"), (256, 256), Image.Resampling.LANCZOS)
            # A fresh canvas keeps no EXIF, XMP, ICC, comments or source filenames.
            clean = Image.new("RGB", (256, 256), "white")
            clean.paste(thumb, mask=thumb.getchannel("A"))
            out = io.BytesIO()
            clean.save(out, format="WEBP", quality=85)
            return out.getvalue()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise HTTPException(
            422, "사진을 읽을 수 없습니다. 2천만 화소 이하의 정지 사진(JPG·PNG·WebP)을 선택해 주세요."
        ) from exc


def store_image(user_id, image):
    from .learning import profile_data
    from .main import throttle

    with SessionLocal.begin() as db:
        user = db.scalar(select(Learner).where(Learner.id == user_id).with_for_update())
        throttle(db, f"avatar:{user.id}", 60)
        photo = db.get(ProfileImage, user.id)
        if photo:
            photo.image = image
        else:
            db.add(ProfileImage(learner_id=user.id, image=image))
        user.avatar_version = hashlib.sha256(image).hexdigest()
        user.avatar_id = user.avatar_id or "sprout"
        return profile_data(user)


@router.put("/api/v1/me/avatar")
async def upload(request: Request):
    from .main import identity

    with SessionLocal() as db:
        uid = identity(request, db, require_profile=False).id
    raw = bytearray()
    async for chunk in request.stream():
        if len(raw) + len(chunk) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "사진은 5MB 이하로 선택해 주세요.")
        raw.extend(chunk)
    image = await run_in_threadpool(normalize_image, raw)
    return await run_in_threadpool(store_image, uid, image)


class EmojiPayload(BaseModel):
    avatar_id: str


@router.patch("/api/v1/me/avatar")
def choose_emoji(payload: EmojiPayload, request: Request):
    from .learning import profile_data
    from .main import identity

    if payload.avatar_id not in AVATARS:
        raise HTTPException(422, "목록에서 프로필 이모지를 선택해 주세요.")
    with SessionLocal.begin() as db:
        uid = identity(request, db, require_profile=False).id
        user = db.scalar(select(Learner).where(Learner.id == uid).with_for_update())
        db.execute(delete(ProfileImage).where(ProfileImage.learner_id == uid))
        user.avatar_version = None
        user.avatar_id = payload.avatar_id
        return profile_data(user)


@router.get("/api/v1/avatars/{uid}")
def get_image(uid: str, request: Request):
    from .main import identity

    with SessionLocal() as db:
        user = identity(request, db, require_profile=False)
        if user.id != uid and not user.admin:
            raise HTTPException(404, "프로필 사진을 찾지 못했습니다.")
        photo = db.get(ProfileImage, uid)
        if not photo:
            raise HTTPException(404, "프로필 사진을 찾지 못했습니다.")
        return Response(photo.image, media_type="image/webp", headers={"Cache-Control": "no-store"})
