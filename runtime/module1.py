"""Deterministic, local-only simulation exercises. Runs only inside Pyodide."""

import contextlib, io, json, traceback

PROJECTS = [
    dict(
        id="m1-day1",
        title="조건으로 로그 골라내기",
        goal="로그에서 실패한 요청만 추출합니다.",
        concept="조건 분기",
        prerequisite="IntroducingIfStatements",
        function="filter_failed",
        starter="def filter_failed(logs):\n    # 1. 결과를 담을 리스트를 만듭니다.\n    result = []\n    # 2. status가 FAIL인 항목만 담아 보세요.\n    for log in logs:\n        pass\n    return result\n",
        description='각 로그는 user와 status가 있는 딕셔너리입니다. status가 "FAIL"인 로그의 user만 순서대로 반환하세요. 빈 입력이면 빈 리스트를 반환합니다.',
        hints=[
            "for로 각 로그를 하나씩 확인하세요.",
            'log["status"] == "FAIL"이면 result에 log["user"]를 추가하세요.',
        ],
        solution='def filter_failed(logs):\n    return [log["user"] for log in logs if log["status"] == "FAIL"]',
        tests=[
            ([[{"user": "ana", "status": "OK"}, {"user": "bo", "status": "FAIL"}]], ["bo"]),
            ([[]], []),
            ([[{"user": "a", "status": "FAIL"}, {"user": "a", "status": "FAIL"}]], ["a", "a"]),
        ],
    ),
    dict(
        id="m1-day2",
        title="가상 로그 파일 읽기",
        goal="파일 내용을 줄 단위로 읽고 필드를 나눕니다.",
        concept="분해와 구조화",
        prerequisite="IntroducingLists",
        function="parse_log",
        starter="def parse_log(text):\n    result = []\n    # 1. text.splitlines()로 줄을 나눕니다.\n    # 2. 빈 줄은 건너뛰고 user,status를 분리합니다.\n    return result\n",
        description='가상 파일에서 읽은 text를 받습니다. 한 줄의 형식은 "user,status"입니다. 빈 줄은 무시하고 {"user": 이름, "status": 상태} 리스트를 반환하세요. 이름과 상태 양끝 공백도 제거합니다.',
        hints=[
            "줄을 나눈 다음 strip()으로 빈 줄인지 확인하세요.",
            'user, status = line.split(",")로 두 값을 분리할 수 있습니다.',
        ],
        solution='def parse_log(text):\n    return [{"user": u.strip(), "status": s.strip()} for line in text.splitlines() if line.strip() for u, s in [line.split(",")]]',
        tests=[
            (
                ["ana,OK\nbo,FAIL\n"],
                [{"user": "ana", "status": "OK"}, {"user": "bo", "status": "FAIL"}],
            ),
            (["\n ana , FAIL \n"], [{"user": "ana", "status": "FAIL"}]),
            ([""], []),
        ],
    ),
    dict(
        id="m1-day3",
        title="서로 다른 로그를 같은 모양으로",
        goal="다른 시스템의 결과를 공통 자료형으로 바꿉니다.",
        concept="추상화",
        prerequisite="IntroducingDictionaries",
        function="normalize",
        starter="def normalize(records):\n    result = []\n    # user 또는 username, status 또는 result를 읽습니다.\n    return result\n",
        description="입력에는 user/status 형식과 username/result 형식이 섞여 있습니다. 출력 키를 user와 status로 통일하고 status는 대문자로 바꾸세요. 원래 입력을 수정하지 마세요.",
        hints=[
            "딕셔너리의 get 메서드는 키가 없을 때 기본값을 줄 수 있습니다.",
            "문자열의 upper()로 상태를 대문자로 바꾸세요.",
        ],
        solution='def normalize(records):\n    return [{"user": r.get("user", r.get("username")), "status": r.get("status", r.get("result")).upper()} for r in records]',
        tests=[
            (
                [[{"username": "ana", "result": "fail"}, {"user": "bo", "status": "ok"}]],
                [{"user": "ana", "status": "FAIL"}, {"user": "bo", "status": "OK"}],
            ),
            ([[]], []),
        ],
    ),
    dict(
        id="m1-day4",
        title="모의 API 페이지 모으기",
        goal="성공 응답과 오류를 구분하고 여러 페이지를 수집합니다.",
        concept="인터페이스와 예외",
        prerequisite="DefiningFunctions",
        function="collect_pages",
        starter='def collect_pages(pages):\n    items = []\n    errors = 0\n    # status가 200이면 items를 합치고 아니면 errors를 늘립니다.\n    return {"items": items, "errors": errors}\n',
        description="pages는 모의 HTTP 응답 목록입니다. status가 200인 응답의 items만 순서대로 합치고, 나머지 응답 개수를 errors로 반환하세요. 실제 인터넷 요청을 보내지 않습니다.",
        hints=[
            '성공 여부는 response["status"] == 200으로 판단합니다.',
            "리스트 전체를 합칠 때 append와 extend의 차이를 생각해 보세요.",
        ],
        solution='def collect_pages(pages):\n    items = []\n    errors = 0\n    for page in pages:\n        if page["status"] == 200:\n            items.extend(page["items"])\n        else:\n            errors += 1\n    return {"items": items, "errors": errors}',
        tests=[
            (
                [
                    [
                        {"status": 200, "items": [1, 2]},
                        {"status": 429},
                        {"status": 200, "items": [3]},
                    ]
                ],
                {"items": [1, 2, 3], "errors": 1},
            ),
            ([[]], {"items": [], "errors": 0}),
            ([[{"status": 500}, {"status": 403}]], {"items": [], "errors": 2}),
        ],
    ),
    dict(
        id="m1-day5",
        title="가상 시계와 Webhook",
        goal="같은 이벤트의 중복 처리를 막고 실행 시점을 판단합니다.",
        concept="상태와 시간",
        prerequisite="IntroducingIfStatements",
        function="due_events",
        starter="def due_events(events, now):\n    seen = set()\n    result = []\n    # 1. at이 now 이하인지 확인합니다.\n    # 2. 이미 처리한 id는 건너뜁니다.\n    return result\n",
        description="각 모의 Webhook 이벤트에는 id와 at(예약 시각)이 있습니다. at <= now인 이벤트의 id를 입력 순서대로 반환하세요. 같은 id는 한 번만 반환합니다. 실제 시간이나 서버를 사용하지 않습니다.",
        hints=[
            "처리한 id를 set에 보관하면 중복 여부를 확인할 수 있습니다.",
            "아직 예약 시간이 되지 않은 이벤트는 seen에도 넣지 않습니다.",
        ],
        solution='def due_events(events, now):\n    seen = set()\n    result = []\n    for event in events:\n        if event["at"] <= now and event["id"] not in seen:\n            seen.add(event["id"])\n            result.append(event["id"])\n    return result',
        tests=[
            ([[{"id": "a", "at": 2}, {"id": "a", "at": 2}, {"id": "b", "at": 8}], 5], ["a"]),
            ([[{"id": "a", "at": 8}, {"id": "a", "at": 1}], 2], ["a"]),
            ([[], 0], []),
        ],
    ),
    dict(
        id="m1-day6",
        title="모의 LLM과 도구 라우터",
        goal="정해진 응답을 검사한 뒤 허용한 도구만 선택합니다.",
        concept="검증과 분기",
        prerequisite="IntroducingDictionaries",
        function="route_tool",
        starter='def route_tool(response):\n    allowed = {"search", "summarize"}\n    # 응답의 tool이 allowed에 있으면 반환합니다.\n    return "reject"\n',
        description='response는 모의 LLM이 만든 딕셔너리입니다. tool이 "search" 또는 "summarize"이면 그 값을 반환하고, 키가 없거나 다른 값이면 "reject"를 반환하세요. 실제 AI를 호출하지 않는 결정적 모형입니다.',
        hints=[
            'response.get("tool")은 키가 없어도 오류 대신 None을 반환합니다.',
            "허용 목록에 들어 있는지 in으로 검사하세요.",
        ],
        solution='def route_tool(response):\n    tool = response.get("tool")\n    return tool if tool in ("search", "summarize") else "reject"',
        tests=[
            ([{"tool": "search"}], "search"),
            ([{"tool": "summarize"}], "summarize"),
            ([{"tool": "delete_all"}], "reject"),
            ([{}], "reject"),
        ],
    ),
    dict(
        id="m1-day7",
        title="이벤트를 작은 보고서로",
        goal="수집한 로그의 핵심 수치를 일관된 결과로 만듭니다.",
        concept="집계 파이프라인",
        prerequisite="IntroducingDictionaries",
        function="make_report",
        starter='def make_report(logs):\n    failures = 0\n    users = set()\n    # 실패 건수와 실패한 사용자를 집계합니다.\n    return {"total": len(logs), "failures": failures, "users": sorted(users)}\n',
        description='입력 로그의 전체 수, status가 "FAIL"인 건수, 실패한 사용자 이름의 중복 없는 정렬 목록을 반환하세요. 출력 키는 total, failures, users입니다.',
        hints=[
            "실패 건수는 같은 사용자여도 매번 늘립니다.",
            "사용자 목록은 set으로 중복을 없애고 sorted로 정렬합니다.",
        ],
        solution='def make_report(logs):\n    failed = [log for log in logs if log["status"] == "FAIL"]\n    return {"total": len(logs), "failures": len(failed), "users": sorted({log["user"] for log in failed})}',
        tests=[
            (
                [
                    [
                        {"user": "z", "status": "FAIL"},
                        {"user": "a", "status": "FAIL"},
                        {"user": "z", "status": "FAIL"},
                        {"user": "b", "status": "OK"},
                    ]
                ],
                {"total": 4, "failures": 3, "users": ["a", "z"]},
            ),
            ([[]], {"total": 0, "failures": 0, "users": []}),
        ],
    ),
    dict(
        id="m1-day8",
        title="로그 분석 미니 프로젝트",
        goal="모의 수집·정규화·보고서 생성을 하나의 함수로 연결합니다.",
        concept="통합과 검증",
        prerequisite="DefiningFunctions",
        function="pipeline",
        starter='def pipeline(pages):\n    logs = []\n    errors = 0\n    # 1. 성공한 모의 API 응답의 items를 모읍니다.\n    # 2. user/username과 status/result 형식을 정규화합니다.\n    # 3. 실패 건수와 사용자 목록을 집계합니다.\n    return {"total": 0, "failures": 0, "users": [], "errors": errors}\n',
        description="Day 3·4·7의 구조를 연결합니다. 성공한 모의 API 응답에서 items를 모아 형식을 정규화한 다음 total, failures, users, errors를 반환하세요. 실패 응답은 건너뛰고 errors를 늘립니다. 입력은 수정하지 마세요.",
        hints=[
            "먼저 collect_pages처럼 성공 응답만 모으세요.",
            "그다음 normalize와 make_report의 구조를 재사용하세요.",
            "빈 입력과 실패 응답만 있는 경우도 확인하세요.",
        ],
        solution='def pipeline(pages):\n    logs = [item for p in pages if p["status"] == 200 for item in p["items"]]\n    normalized = [{"user": r.get("user", r.get("username")), "status": r.get("status", r.get("result")).upper()} for r in logs]\n    failed = [r for r in normalized if r["status"] == "FAIL"]\n    return {"total": len(logs), "failures": len(failed), "users": sorted({r["user"] for r in failed}), "errors": sum(p["status"] != 200 for p in pages)}',
        tests=[
            (
                [
                    [
                        {
                            "status": 200,
                            "items": [
                                {"username": "a", "result": "fail"},
                                {"user": "b", "status": "OK"},
                            ],
                        },
                        {"status": 500},
                    ]
                ],
                {"total": 2, "failures": 1, "users": ["a"], "errors": 1},
            ),
            ([[]], {"total": 0, "failures": 0, "users": [], "errors": 0}),
            ([[{"status": 429}]], {"total": 0, "failures": 0, "users": [], "errors": 1}),
        ],
    ),
]


def check(entry, callback):
    if hasattr(entry, "to_py"):
        entry = entry.to_py()
    p = next(p for p in PROJECTS if p["id"] == entry["page_slug"])
    output = io.StringIO()
    ns = {}
    messages = []
    passed = False
    try:
        with contextlib.redirect_stdout(output):
            exec(compile(entry["input"], "/module1.py", "exec"), ns)
            fn = ns.get(p["function"])
            if not callable(fn):
                raise ValueError(f"{p['function']} 함수를 정의해 주세요.")
            for i, (args, expected) in enumerate(p["tests"]):
                copied = json.loads(json.dumps(args))
                before = json.dumps(copied, sort_keys=True)
                actual = fn(*copied)
                if actual != expected:
                    raise ValueError(f"확인 사례 {i + 1}: 예상 {expected!r}, 실제 {actual!r}")
                if json.dumps(copied, sort_keys=True) != before:
                    raise ValueError("입력 자료를 수정하지 말고 새 결과를 만들어 주세요.")
                messages.append(f"확인 사례 {i + 1} 통과")
            passed = True
    except Exception as e:
        messages.append(f"{type(e).__name__}: {e}")
    callback(
        "output",
        {"parts": [{"type": "stdout", "text": output.getvalue() + "\n".join(messages) + "\n"}]},
    )
    import html

    return {
        "passed": passed,
        "error": None,
        "message_sections": [{"type": "messages", "messages": [html.escape(m) for m in messages]}],
    }
