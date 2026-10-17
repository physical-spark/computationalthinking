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
                    "sources": [{"label": "문제 원전: futurecoder · Alex Hall · MIT", "url": "https://github.com/alexmojaki/futurecoder/blob/def491c2a348371f56249d05c64e0cf70f33ac2b/" + pages[p["slug"]].__module__.replace(".", "/") + ".py", "revision": "def491c2a348371f56249d05c64e0cf70f33ac2b"}],
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
# Thinking prompts are authored per concept/page and adapted to the current activity.
profiles = json.loads((ROOT / "content/thinking.json").read_text())
assert set(profiles) == {p["id"] for p in out}, "Thinking profiles must cover every page exactly"
for profile in profiles.values():
    assert all(isinstance(profile[k], str) and profile[k].strip() for k in ("focus", "why", "question")), "Thinking guidance must not be empty"
for page in out:
    for step in page["steps"]:
        thinking = dict(profiles[page["id"]])
        if step["reading"]:
            thinking["activity"] = "내 말로 정리"
            thinking["question"] = "이 페이지에서 배운 규칙을 어떤 다른 문제에 적용할 수 있을까요? " + thinking["question"]
        elif step["prediction"].get("choices"):
            thinking["activity"] = "결과 예상과 비교"
            thinking["question"] = "실행 전 예상과 실제 결과를 비교해 보세요. " + thinking["question"]
        elif step["mode"] in {"snoop", "pythontutor", "birdseye"}:
            thinking["activity"] = "실행 상태 추적"
            thinking["question"] = "실행 도구에서 관찰한 값 하나를 근거로 설명해 보세요. " + thinking["question"]
        elif any(term in step["name"].lower() for term in ("broken", "error", "undefined", "invalid", "missing", "mismatched", "fix_")):
            thinking["activity"] = "오류의 원인 찾기"
            thinking["question"] = "예상과 달라진 첫 지점은 어디였나요? " + thinking["question"]
        elif "exercise" in step["name"].lower() or step["name"] == "solve":
            thinking["activity"] = "절차 설계와 검증"
            thinking["question"] += " 내 풀이를 확인할 작은 입력 사례도 하나 적어 보세요."
        else:
            thinking["activity"] = "실험하고 설명하기"
        step["thinking"] = thinking
        if lang == "ko":
            step["text"] = re.sub(r'<button\b[^>]*\bcopy-button\b[^>]*>.*?</button>', "", step["text"], flags=re.S)
            step["text"] = step["text"].replace("<p>존댓말로 번역한 내용은 다음과 같습니다:</p>", "")
            if step["mode"] in {"snoop", "pythontutor", "birdseye"}:
                tool = {"snoop": "변수 변화", "pythontutor": "한 줄씩 실행", "birdseye": "표현식 값"}[step["mode"]]
                # Adapt only UI instructions; preserve all original example code and grading.
                step["text"] = re.sub(r'(<code>)?(snoop|birdseye)(</code>)? 버튼', "실행 버튼", step["text"], flags=re.I)
                if step["id"] == "UnderstandingProgramsWithPythonTutor.run_with_python_tutor":
                    step["text"] = re.sub(r"^<p>.*?</p>", "<p>아래 코드를 입력하고 실행하세요. 실행 결과 아래에 나타나는 단계 슬라이더를 움직이며 줄 번호와 변수 값을 살펴보세요. 이 서비스는 화면 안에서 한 줄씩 실행을 보여줍니다.</p>", step["text"], count=1, flags=re.S)
                if step["id"] == "IntroducingBirdseye.first_birdseye_example":
                    step["text"] = step["text"].replace("시각화를 보여주는 새로운 브라우저 탭이 열립니다.", "실행 결과 아래의 ‘Birdseye 표현식 결과 열기’ 링크로 시각화를 볼 수 있습니다.")
                if step["id"] == "CallingFunctionsWithinFunctions.see_stack_in_birdseye":
                    step["text"] = re.sub(r"<p>Python Tutor에서.*?</p>", "<p>앞 단계의 실행 슬라이더에서 함수 이름과 지역 변수 값을 확인할 수 있습니다. 함수가 호출되거나 끝날 때 값이 어떻게 달라지는지 살펴보세요.</p>", step["text"], count=1, flags=re.S)
                step["text"] = f"<p><strong>이번 단계는 실행하면 {tool} 도구가 자동으로 적용됩니다.</strong></p>" + step["text"]

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
