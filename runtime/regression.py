"""Public curriculum fixtures; used by native and browser regression tests."""

import json, random
from pathlib import Path


def verify(language="ko", golden_programs=None):
    import core.utils
    from core import translation as t
    from core.checker import check_entry, FullRunner
    from core.text import load_chapters, step_test_entries
    from core.utils import make_test_input_callback

    random.seed(0)
    core.utils.TESTING = True
    if t.current_language is None and language != "en":
        t.set_language(language)
    list(load_chapters())
    runner = FullRunner(filename="/my_program.py")
    count = 0
    failures = []
    for page, step, substep, entry in step_test_entries():
        input_callback = make_test_input_callback(step.stdin_input)

        def callback(kind, data):
            if kind == "input":
                return input_callback(data)

        step.pre_run(runner)
        result = check_entry(entry, callback, runner)
        if result["passed"] != (substep == step):
            failures.append(page.slug + "." + step.__name__)
        if golden_programs is not None and substep.program.splitlines() != golden_programs[count]:
            failures.append(page.slug + "." + step.__name__ + ": code changed")
        count += 1
    return {"cases": count, "failures": failures, "passed": not failures, "language": language}


if __name__ == "__main__":
    import sys

    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(root / "vendor/futurecoder"))
    original = json.loads(
        (root / "vendor/futurecoder/tests/golden_files/en/test_transcript.json").read_text()
    )
    report = verify(sys.argv[1] if len(sys.argv) > 1 else "ko", [x["program"] for x in original])
    print(json.dumps(report, ensure_ascii=False))
    if not report["passed"] or report["cases"] != 285:
        raise SystemExit(1)
