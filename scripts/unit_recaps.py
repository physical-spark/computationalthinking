"""Author-written CT reflections; research informs the framework, not grading."""
import html
import json
from pathlib import Path

RESEARCH = [
    {"label": "사고 틀 참고: Shute · Sun · Asbell-Clarke (2017), Demystifying computational thinking", "url": "https://doi.org/10.1016/j.edurev.2017.09.003"},
    {"label": "사고 실천 참고: Brennan · Resnick (2012), New frameworks for studying and assessing the development of computational thinking", "url": "https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/"},
]

def apply_recaps(pages, root: Path):
    recaps = json.loads((root / "content/unit-recaps.json").read_text())
    assert set(recaps) == {p["id"] for p in pages}, "Recaps must cover every unit exactly"
    for page in pages:
        recap = recaps[page["id"]]
        assert recap["did"] and recap["transfer"] and len(recap["skills"]) == 2
        esc = html.escape
        skills = "".join(
            f'<li><h3>{esc(skill["term"])}</h3><p>{esc(skill["action"])}</p></li>'
            for skill in recap["skills"]
        )
        prose = (
            '<p class="recap-eyebrow">단원 정리 · Computational Thinking</p>'
            '<h2>이번에는 어떤 생각을 연습했을까요?</h2>'
            f'<p class="recap-did">{esc(recap["did"])}</p>'
            f'<ol class="recap-skills">{skills}</ol>'
            '<h3>다른 상황에도 써 볼까요?</h3>'
            f'<p class="recap-transfer">{esc(recap["transfer"])}</p>'
            '<p class="recap-research-note">이 단원에서 해 본 일을 아래 연구의 사고 틀과 연결했어요.</p>'
            '<h3>더 알아보고 싶다면 · 연구 자료</h3>'
            '<ul class="recap-papers">'
            '<li><a href="https://myweb.fsu.edu/vshute/pdf/CT.pdf" target="_blank" rel="noopener noreferrer">Shute 외 (2017) · Demystifying computational thinking · 저자 공개 PDF</a><p>문제 분해·추상화·알고리즘·디버깅·반복 개선·일반화를 설명한 문헌 검토예요. 4절과 표 4에서 사고의 종류를 자세히 볼 수 있어요.</p></li>'
            '<li><a href="https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/" target="_blank" rel="noopener noreferrer">Brennan · Resnick (2012) · Computational Thinking 연구 틀 · MIT 원문</a><p>Scratch 활동을 바탕으로 개념뿐 아니라 시험하기·고치기·재사용하기 같은 실천과 학습자의 관점을 함께 살펴본 연구예요.</p></li></ul>'
        )
        final = next((s for s in page["steps"] if s["name"] == "final_text"), None)
        if final is None:
            final = {"id": page["id"] + ".final_text", "name": "final_text", "hints": [], "solution": None, "prediction": {"choices": None, "answer": None}, "requirements": [], "mode": "editor", "starter": "", "reading": True}
            page["steps"].append(final)
        final["text"] = prose
        final["recap"] = True
        final["thinking"] = {"focus": "이번 단원의 생각을 돌아봐요", "why": recap["did"], "question": recap["transfer"], "activity": "다른 상황에 연결해요"}
        final["sources"] = [{"label": "단원 회고 자체 작성: Computational Thinking", "url": "https://github.com/physical-spark/computationalthinking/blob/main/content/unit-recaps.json"}, *RESEARCH]
