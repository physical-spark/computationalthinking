"""Run using the upstream Poetry environment, from vendor/futurecoder."""

import sys, json, shutil, tarfile, io, hashlib, html, re
from pathlib import Path
from pprint import pformat

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "vendor/futurecoder"))
sys.path.insert(0, str(ROOT / "runtime"))
from core.text import load_chapters, get_pages, pages
from core import translation as t
from module1 import PROJECTS

lang = sys.argv[1] if len(sys.argv) > 1 else "en"
t.set_language(lang)
chapters = list(load_chapters())
raw = get_pages()["pages"]
out = []
for ci, ch in enumerate(chapters):
    for meta in ch["pages"]:
        p = raw[meta["slug"]]
        steps = []
        for s in p["steps"]:
            cls = pages[p["slug"]].get_step(s["name"])
            steps.append(
                {
                    **s,
                    "id": p["slug"] + "." + s["name"],
                    "mode": getattr(cls, "expected_code_source", None)
                    or ("editor" if "\n" in getattr(cls, "program", "") else "shell"),
                    "starter": "",
                    "reading": s["name"] == "final_text",
                }
            )
        out.append(
            {
                "id": p["slug"],
                "title": html.unescape(re.sub(r"<[^>]+>", "", p["title"])),
                "chapter": ci + 1,
                "chapterTitle": ch["title"],
                "track": "python",
                "steps": steps,
                "diagram": ci,
                "concept": ch["title"],
            }
        )
for i, p in enumerate(PROJECTS):
    args, expected = p["tests"][0]
    call = p["function"] + "(" + ", ".join(pformat(arg, width=60) for arg in args) + ")"
    out.append(
        {
            "id": p["id"],
            "title": html.unescape(re.sub(r"<[^>]+>", "", p["title"])),
            "chapter": 13,
            "chapterTitle": "Module 1 · 자동화 모의실습",
            "track": "module1",
            "diagram": 12 + i,
            "concept": p["concept"],
            "prerequisite": p["prerequisite"],
            "steps": [
                {
                    "id": p["id"] + ".solve",
                    "name": "solve",
                    "text": f"<p><strong>목표:</strong> {html.escape(p['goal'])}</p><p>{html.escape(p['description'])}</p><p>함수를 이렇게 호출하면</p><pre><code>{html.escape(call)}</code></pre><p>다음 값을 반환해야 합니다.</p><pre><code>{html.escape(pformat(expected, width=60))}</code></pre>",
                    "hints": [html.escape(x) for x in p["hints"]],
                    "solution": {
                        "tokens": list(p["solution"]),
                        "mask": [True] * len(p["solution"]),
                        "maskedIndices": list(range(len(p["solution"]))),
                        "lines": None,
                    },
                    "prediction": {"choices": None, "answer": None},
                    "requirements": [],
                    "mode": "editor",
                    "starter": p["starter"],
                    "reading": False,
                }
            ],
        }
    )
content = {"language": lang, "upstream": "def491c2a348371f56249d05c64e0cf70f33ac2b", "pages": out}
content["runtime_version"] = hashlib.sha256(
    (ROOT / "runtime/module1.py").read_bytes()
    + b"".join(p.read_bytes() for p in sorted((ROOT / "vendor/futurecoder/core").rglob("*.py")))
).hexdigest()[:16]
content["version"] = hashlib.sha256(
    json.dumps(content, ensure_ascii=False, sort_keys=True).encode()
).hexdigest()[:16]
(ROOT / "content/course.json").write_text(json.dumps(content, ensure_ascii=False) + "\n")
runner = ROOT / "runner/public"
runner.mkdir(exist_ok=True, parents=True)
with (
    tarfile.open(ROOT / "vendor/futurecoder/frontend/src/python_core.tar.load_by_url") as original,
    tarfile.open(runner / "python-core.tar", "w") as output,
):
    for member in original:
        output.addfile(member, original.extractfile(member) if member.isfile() else None)
    for path, name in [
        (ROOT / "runtime/module1.py", "module1.py"),
        (ROOT / "runtime/regression.py", "regression.py"),
    ]:
        data = path.read_bytes()
        info = tarfile.TarInfo(name)
        info.size = len(data)
        output.addfile(info, io.BytesIO(data))
    if lang == "ko":
        for path in (ROOT / "vendor/futurecoder/translations/locales/ko").rglob("*.mo"):
            data = path.read_bytes()
            info = tarfile.TarInfo(str(path.relative_to(ROOT / "vendor/futurecoder")))
            info.size = len(data)
            output.addfile(info, io.BytesIO(data))
        path = ROOT / "vendor/futurecoder/translations/codes.json"
        data = path.read_bytes()
        info = tarfile.TarInfo("translations/codes.json")
        info.size = len(data)
        output.addfile(info, io.BytesIO(data))
shutil.copytree(
    ROOT / "vendor/futurecoder/frontend/public/birdseye", runner / "birdseye", dirs_exist_ok=True
)
print(
    f"{lang}: {len(out)} pages, {sum(not s['reading'] for p in out for s in p['steps'])} tasks, version {content['version']}"
)
