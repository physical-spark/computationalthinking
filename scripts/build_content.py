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
import life_expression
import number_operators
from unit_recaps import apply_recaps
from clarify_exercises import apply_clarity

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
                    "text": f"<p><strong>해볼 일:</strong> {html.escape(p['goal'])}</p><p>{html.escape(p['description'])}</p><p>이렇게 함수에 값을 넣으면</p><pre><code>{html.escape(call)}</code></pre><p>다음 값을 돌려줘야 해요.</p><pre><code>{html.escape(pformat(expected, width=60))}</code></pre>",
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
# Add two explicit models to the previously reading-only History URL.
number_page = next(p for p in out if p["id"] == number_operators.PAGE)
for name, problem in number_operators.PROBLEMS.items():
    number_page["steps"].insert(-1, {
        "id": number_operators.PAGE + "." + name, "name": name,
        "text": "<h2>" + problem["title"] + "</h2><p>" + problem["text"] + "</p>",
        "hints": problem["hints"], "solution": {"tokens": [problem["example"]], "mask": [True], "maskedIndices": [0], "lines": None},
        "prediction": {"choices": None, "answer": None}, "requirements": [{"type": "custom", "message": "<p>문제에 나온 두 수와 새 연산자로 식 한 개를 써요.</p>"}],
        "mode": "shell", "starter": "", "reading": False, "thinking": problem["thinking"],
        "sources": [{"label": "Exercise 자체 작성: Computational Thinking", "url": "https://github.com/physical-spark/computationalthinking/blob/main/runtime/number_operators.py"}]
    })

# Child-readable titles and everyday scenes do not change stable exercise IDs or grading.
if lang == "ko":
    stories = json.loads((ROOT / "content/story-course.json").read_text())
    assert set(stories["pages"]) == {p["id"] for p in out}, "Story catalog must cover every page"
    assert set(stories["chapters"]) == {str(p["chapter"]) for p in out}
    for page in out:
        story = stories["pages"][page["id"]]
        chapter_story = stories["chapters"][str(page["chapter"])]
        assert all(story.get(k) for k in ("title", "term", "scene", "bridge"))
        page["title"] = story["title"]
        page["story"] = story
        page["chapterTitle"] = chapter_story["title"]
        page["chapterScene"] = chapter_story["scene"]
        page["chapterTerm"] = chapter_story["term"]

# Thinking prompts are authored per concept/page and adapted to the current activity.
profiles = json.loads((ROOT / "content/thinking.json").read_text())
assert set(profiles) == {p["id"] for p in out}, "Thinking profiles must cover every page exactly"
for profile in profiles.values():
    assert all(isinstance(profile[k], str) and profile[k].strip() for k in ("focus", "why", "question")), "Thinking guidance must not be empty"
for page in out:
    for step in page["steps"]:
        thinking = dict(profiles[page["id"]])
        if step["reading"]:
            thinking["activity"] = "내 말로 이야기해요"
            thinking["question"] = "어디에 또 써볼 수 있을까요? " + thinking["question"]
        elif step["prediction"].get("choices"):
            thinking["activity"] = "답을 먼저 생각해요"
            thinking["question"] = "생각한 답과 실행한 답이 같았나요? " + thinking["question"]
        elif step["mode"] in {"snoop", "pythontutor", "birdseye"}:
            thinking["activity"] = "값을 따라가요"
            thinking["question"] = "화면에서 바뀐 값 하나를 찾아봐요. " + thinking["question"]
        elif any(term in step["name"].lower() for term in ("broken", "error", "undefined", "invalid", "missing", "mismatched", "fix_")):
            thinking["activity"] = "어디서 달라졌는지 찾아요"
            thinking["question"] = "어느 줄부터 생각한 답과 달라졌나요? " + thinking["question"]
        elif "exercise" in step["name"].lower() or step["name"] == "solve":
            thinking["activity"] = "직접 만들고 확인해요"
            thinking["question"] += " 다른 값으로도 한번 시험해 봐요."
        else:
            thinking["activity"] = "바꿔 보고 이야기해요"
        step["thinking"] = step.get("thinking", thinking)
        if lang == "ko":
            step["text"] = re.sub(r'<button\b[^>]*\bcopy-button\b[^>]*>.*?</button>', "", step["text"], flags=re.S)
            step["text"] = step["text"].replace("<p>존댓말로 번역한 내용은 다음과 같습니다:</p>", "")
            if step["mode"] in {"snoop", "pythontutor", "birdseye"}:
                tool = {"snoop": "변수 변화", "pythontutor": "한 줄씩 실행", "birdseye": "표현식 값"}[step["mode"]]
                # Adapt only UI instructions; preserve all original example code and grading.
                step["text"] = re.sub(r'(<code>)?(snoop|birdseye)(</code>)? 버튼', "실행 버튼", step["text"], flags=re.I)
                if step["id"] == "UnderstandingProgramsWithPythonTutor.run_with_python_tutor":
                    step["text"] = re.sub(r"^<p>.*?</p>", "<p>아래 코드를 쓰고 실행해요. 결과 아래의 슬라이더를 움직여 봐요. 지금 읽는 줄과 바뀐 값을 한 줄씩 볼 수 있어요.</p>", step["text"], count=1, flags=re.S)
                if step["id"] == "IntroducingBirdseye.first_birdseye_example":
                    step["text"] = step["text"].replace("시각화를 보여주는 새로운 브라우저 탭이 열립니다.", "실행 결과 아래의 ‘Birdseye 표현식 결과 열기’ 링크로 시각화를 볼 수 있습니다.")
                if step["id"] == "CallingFunctionsWithinFunctions.see_stack_in_birdseye":
                    step["text"] = re.sub(r"<p>Python Tutor에서.*?</p>", "<p>앞 Exercise에서는 Python Tutor의 슬라이더를 써 봤어요. 이번에는 실행한 뒤 ‘Birdseye 표현식 결과 열기’로 함수 안의 값을 살펴봐요.</p>", step["text"], count=1, flags=re.S)
                step["text"] = f"<p><strong>실행하면 {tool} 그림도 함께 볼 수 있어요.</strong></p>" + step["text"]

for page in out:
    for step in page["steps"]:
        if step["id"] == life_expression.STEP_ID:
            step.update(
                text=life_expression.TEXT,
                thinking=life_expression.THINKING,
                hints=life_expression.HINTS,
                solution={"tokens": [life_expression.EXAMPLE], "lines": None, "mask": [True], "maskedIndices": [0]},
                requirements=[{"type": "custom", "message": "<p>4, 8000, 12000, 4000을 모두 사용해 한 사람당 낼 돈을 계산하는 식 한 개를 써요.</p>"}],
                sources=[
                    {"label": "문제·설명 자체 작성: Computational Thinking", "url": "https://github.com/physical-spark/computationalthinking/blob/main/runtime/life_expression.py"},
                    {**step["sources"][0], "label": "학습 흐름 참고: futurecoder · Alex Hall · MIT"},
                ],
            )

if lang == "ko":
    apply_clarity(out, ROOT)
    apply_recaps(out, ROOT)

content = {"language": lang, "upstream": "def491c2a348371f56249d05c64e0cf70f33ac2b", "pages": out}
content["runtime_version"] = hashlib.sha256(
    (ROOT / "runtime/module1.py").read_bytes()
    + (ROOT / "runtime/life_expression.py").read_bytes()
    + (ROOT / "runtime/number_operators.py").read_bytes()
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
        (ROOT / "runtime/life_expression.py", "life_expression.py"),
        (ROOT / "runtime/number_operators.py", "number_operators.py"),
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
