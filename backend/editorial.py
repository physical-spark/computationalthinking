"""Published Git content with audited prose-only overlays."""

import copy
import hashlib
import html
import json
import re
import time
from html.parser import HTMLParser

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select

from .db import database
from .models import ContentRevision

router = APIRouter()
CODE = re.compile(
    r"<pre\b[^>]*>.*?</pre>|<code\b[^>]*>.*?</code>|<table\b[^>]*>.*?</table>|<blockquote\b[^>]*>.*?</blockquote>|<hr\b[^>]*>",
    re.S | re.I,
)


def fingerprint(text):
    return hashlib.sha256(text.encode()).hexdigest()


def base_course():
    from .main import ROOT, published_course

    c = copy.deepcopy(published_course())
    c["concepts"] = json.loads((ROOT / "content/concepts.json").read_text())
    path = ROOT / "content/resources.json"
    c["resources"] = json.loads(path.read_text())["resources"] if path.exists() else []
    for p in c["pages"]:
        source = (
            {
                "label": "문제 원전: futurecoder · Alex Hall · MIT",
                "url": "https://github.com/alexmojaki/futurecoder/tree/"
                + c["upstream"]
                + "/core/chapters",
                "revision": c["upstream"],
            }
            if p["track"] == "python"
            else {
                "label": "자체 작성: Computational Thinking · Module 1",
                "url": "https://github.com/physical-spark/computationalthinking/blob/main/runtime/module1.py",
            }
        )
        p["sources"] = [source]
        for step in p["steps"]:
            step.setdefault("sources", [dict(source)])
    return c


def blocks(c):
    out = {}

    def add(prefix, obj, fields):
        for field in fields:
            if isinstance(obj.get(field), str):
                out[prefix + "/" + field] = (obj, field)

    for p in c["pages"]:
        add(p["id"], p, ["title"])
        if isinstance(p.get("story"), dict):
            add(p["id"] + "/story", p["story"], ["scene", "bridge", "term"])
        for step in p["steps"]:
            add(step["id"], step, ["text"])
            add(
                step["id"] + "/thinking", step["thinking"], ["focus", "why", "question", "activity"]
            )
            for i in range(len(step["hints"])):
                out[step["id"] + "/hint/" + str(i)] = (step["hints"], i)
            for i, source in enumerate(step["sources"]):
                add(step["id"] + "/source/" + str(i), source, ["label"])
    for i, concept in enumerate(c["concepts"]):
        add(
            "concept/" + str(i),
            concept,
            ["title", "idea", "analogy", "question", "explanation", "transfer"],
        )
    for resource in c["resources"]:
        add("resource/" + resource["id"], resource, ["title", "before", "after", "reading"])
    return out


class SafeProse(HTMLParser):
    def __init__(self):
        super().__init__()
        self.classes = []
        self.headings = []

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.headings.append(tag)
        if tag not in {
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "ul",
            "ol",
            "li",
            "strong",
            "b",
            "em",
            "i",
            "a",
            "br",
            "pre",
            "code",
            "span",
        }:
            raise ValueError("허용되지 않는 HTML 요소입니다.")
        for name, value in attrs:
            if value is None:
                raise ValueError("HTML 속성에는 값을 입력해 주세요.")
            if name == "class":
                self.classes.append(value)
            if name == "href" and tag == "a" and value.startswith(("https://", "http://", "#")):
                continue
            if name in {"class", "title"}:
                continue
            if tag == "a" and name == "target" and value in {"_blank", "_self"}:
                continue
            if tag == "a" and name == "rel" and set(value.split()) <= {"noopener", "noreferrer"}:
                continue
            raise ValueError("허용되지 않는 HTML 속성입니다.")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def rich_block(block_id):
    return block_id.endswith("/text") or "/hint/" in block_id


def validate_prose(body, original, block_id=None):
    if block_id and not rich_block(block_id) and re.search(r"<[^>]*>", body):
        raise HTTPException(422, "이 문구는 서식 없이 글자로 입력해 주세요.")
    if CODE.findall(body) != CODE.findall(original):
        raise HTTPException(422, "코드와 표 등 고정 블록은 웹에서 변경할 수 없습니다.")
    try:
        before, after = SafeProse(), SafeProse()
        before.feed(CODE.sub("", original))
        after.feed(CODE.sub("", body))
        if before.classes != after.classes or before.headings != after.headings:
            raise ValueError("레이아웃 클래스는 웹에서 변경할 수 없습니다.")
    except ValueError as e:
        raise HTTPException(422, str(e)) from e


def rendered_course(db, draft=None):
    c = base_course()
    lookup = blocks(c)
    revs = db.scalars(
        select(ContentRevision)
        .where(ContentRevision.state == "published")
        .order_by(ContentRevision.created)
    ).all()
    if draft:
        row = db.get(ContentRevision, draft)
        if not row:
            raise HTTPException(404, "초안을 찾지 못했습니다.")
        revs = [*revs, row]
    used = []
    for r in revs:
        if r.block_id in lookup:
            obj, key = lookup[r.block_id]
            obj[key] = r.body
            used.append(r.id)
    c["text_version"] = fingerprint(
        json.dumps(c, ensure_ascii=False, sort_keys=True) + json.dumps(used)
    )[:16]
    return c


def revision_json(r):
    return {
        "id": r.id,
        "body": r.body,
        "base_hash": r.base_hash,
        "state": r.state,
        "author_id": r.author_id,
        "created": r.created,
    }


@router.get("/api/v1/admin/content")
def catalog(request: Request, db=Depends(database)):
    from .main import admin

    admin(request, db)
    return [
        {"id": k, "preview": html.unescape(re.sub("<[^>]+>", "", obj[key]))[:100]}
        for k, (obj, key) in blocks(base_course()).items()
    ]


@router.get("/api/v1/admin/content/block")
def block(request: Request, id: str, db=Depends(database)):
    from .main import admin

    admin(request, db)
    item = blocks(base_course()).get(id)
    if not item:
        raise HTTPException(404, "문구를 찾지 못했습니다.")
    obj, key = item
    revs = db.scalars(
        select(ContentRevision)
        .where(ContentRevision.block_id == id)
        .order_by(ContentRevision.created.desc())
    ).all()
    published = next((r for r in revs if r.state == "published"), None)
    target = id.split("/")[0]
    if id.startswith("resource/"):
        target = "resource/" + id.split("/")[1] + "/1"
    elif id.startswith("concept/"):
        page = next(p for p in base_course()["pages"] if p["diagram"] == int(id.split("/")[1]))
        card = {
            "title": 1,
            "analogy": 3,
            "idea": 2,
            "question": 5,
            "explanation": 5,
            "transfer": 6,
        }.get(id.split("/")[-1], 1)
        target = "concept/" + page["id"] + "/" + str(card)
    elif "/story/" in id:
        card = 1 if id.endswith("/scene") else 2
        target = "concept/" + target + "/" + str(card)
    elif "." not in target:
        target = "concept/" + target + "/1"
    return {
        "preview_hash": target,
        "rich_text": rich_block(id),
        "id": id,
        "base": obj[key],
        "base_hash": fingerprint(obj[key]),
        "published": published.body if published else obj[key],
        "conflict": bool(published and published.base_hash != fingerprint(obj[key])),
        "history": [revision_json(r) for r in revs],
    }


class Edit(BaseModel):
    block_id: str = Field(max_length=300)
    body: str = Field(max_length=50000)
    base_hash: str = Field(max_length=64)


@router.post("/api/v1/admin/content/drafts")
def save(p: Edit, request: Request, db=Depends(database)):
    from .main import admin

    user = admin(request, db)
    item = blocks(base_course()).get(p.block_id)
    if not item:
        raise HTTPException(404, "문구를 찾지 못했습니다.")
    obj, key = item
    if p.base_hash != fingerprint(obj[key]):
        raise HTTPException(409, "기본 문구가 바뀌었습니다. 다시 불러온 뒤 수정해 주세요.")
    validate_prose(p.body, obj[key], p.block_id)
    row = ContentRevision(
        block_id=p.block_id, body=p.body, base_hash=p.base_hash, author_id=user.id
    )
    db.add(row)
    db.flush()
    return revision_json(row)


@router.get("/api/v1/admin/content/preview")
def preview(request: Request, revision: str, db=Depends(database)):
    from .main import admin

    admin(request, db)
    return rendered_course(db, revision)


@router.post("/api/v1/admin/content/{rid}/publish")
def publish(rid: str, request: Request, db=Depends(database)):
    from .main import admin

    user = admin(request, db)
    row = db.scalar(select(ContentRevision).where(ContentRevision.id == rid).with_for_update())
    if not row:
        raise HTTPException(404, "문구 이력을 찾지 못했습니다.")
    item = blocks(base_course()).get(row.block_id)
    if not item or fingerprint(item[0][item[1]]) != row.base_hash:
        raise HTTPException(
            409, "기본 문구가 변경됐습니다. 새 기본본 또는 유지할 문구로 새 초안을 저장해 주세요."
        )
    validate_prose(row.body, item[0][item[1]], row.block_id)
    # Always append, including restoration; drafts and old publications stay immutable.
    new = ContentRevision(
        block_id=row.block_id,
        body=row.body,
        base_hash=row.base_hash,
        author_id=user.id,
        state="published",
        created=time.time(),
    )
    db.add(new)
    db.flush()
    return revision_json(new)
