"""Keep each paged exercise self-contained without changing upstream grading."""
import html
import json
import re
from html.parser import HTMLParser

class PlainCode(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)

def code_text(block):
    parser = PlainCode()
    parser.feed(block)
    return "".join(parser.parts).strip()

def apply_clarity(pages, root):
    lookup = {s["id"]: s for p in pages for s in p["steps"]}
    patches = json.loads((root / "content/exercise-clarity.json").read_text())
    for sid, patch in patches.items():
        step = lookup[sid]
        for old, new in patch.get("replacements", []):
            assert old in step["text"], f"Stale clarity patch: {sid}: {old[:60]}"
            step["text"] = step["text"].replace(old, new)
        if patch.get("prefix"):
            step["text"] = patch["prefix"] + step["text"]
        for field in ("requirements", "hints"):
            if field in patch:
                step[field] = patch[field]
    groups = {
        "FunctionsAndMethodsForLists": ("pop_remove_index_subscript_assignment", ["subscript_assignment_exercise", "negative_index_concatenation_exercise", "remove_exercise"]),
        "MoreListFunctionsAndMethods": ("count_in_sorted_sum", ["average_exercise", "sum_range_exercise", "second_smallest_in_list_exercise"]),
    }
    for page_id, (source, targets) in groups.items():
        blocks = re.findall(r"<pre\b[^>]*>.*?</pre>", lookup[page_id + "." + source]["text"], re.S)
        assert blocks
        for name in targets:
            step = lookup[page_id + "." + name]
            step["context_html"] = "<p>이 Exercise에서는 아래 목록에서 한 줄을 골라요. 맞지 않는 줄도 섞여 있어요.</p>" + blocks[0]
    for page in pages:
        previous = None
        for step in page["steps"]:
            if step["reading"]:
                continue
            if previous:
                step["previous_exercise"] = previous["id"]
                # Carry only the learner's own previous draft into a requested edit.
                if step["mode"] == previous["mode"] == "editor" and re.search(r"(바꿔|고쳐|수정)", step["text"]):
                    step["starter_from"] = previous["id"]
            blocks = re.findall(r"<pre\b[^>]*>.*?</pre>", step["text"], re.S)
            for block in blocks:
                plain = code_text(block)
                if "insert_one_line_from_above" in plain:
                    step["starter"] = plain
                    break
            if "insert_one_line_from_above" in step["text"]:
                step["text"] = '<p><code>insert_one_line_from_above</code>는 빈자리를 알려 주는 표시예요. 그대로 실행하지 말고, 목록에서 고른 한 줄로 바꿔요.</p>' + step["text"]
            # >>> is a shell prompt, not a command to copy into this editor.
            if step["id"] == "BuildingUpStrings.empty_string":
                step["requirements"] = [{"type": "custom", "message": "<p>빈 문자열을 나타내는 <code>''</code>를 실행해 보세요. 따옴표 사이에는 공백도 넣지 않아요.</p>"}]
            previous = step
