"""Deterministic, local-only simulation exercises. Runs only inside Pyodide."""

import contextlib, io, json, traceback

PROJECTS = [
    dict(
        id="m1-day1",
        title="실패한 기록만 골라요",
        goal="여러 기록에서 실패한 사람의 이름만 골라요.",
        concept="조건에 맞는 것 고르기",
        prerequisite="IntroducingIfStatements",
        function="filter_failed",
        starter="def filter_failed(logs):\n    # 1. 결과를 담을 리스트를 만듭니다.\n    result = []\n    # 2. status가 FAIL인 항목만 담아 보세요.\n    for log in logs:\n        pass\n    return result\n",
        description='컴퓨터가 한 일을 남긴 기록을 로그라고 해요. 각 기록에는 사람 이름인 user와 결과인 status가 있어요. status가 "FAIL"인 기록만 골라 user를 리스트에 순서대로 담아 돌려주세요. 기록이 하나도 없으면 빈 리스트를 돌려줘요.',
        hints=[
            "for로 기록을 하나씩 꺼내 확인해 봐요.",
            'log["status"] == "FAIL"이면 result에 log["user"]를 하나 더 담아요.',
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
        title="기록을 줄과 칸으로 나눠요",
        goal="긴 글을 한 줄씩 읽고 이름과 결과를 나눠 담아요.",
        concept="필요한 값 꺼내기",
        prerequisite="IntroducingLists",
        function="parse_log",
        starter="def parse_log(text):\n    result = []\n    # 1. text.splitlines()로 줄을 나눕니다.\n    # 2. 빈 줄은 건너뛰고 user,status를 분리합니다.\n    return result\n",
        description='가상 파일에서 읽은 글이 text로 들어와요. 한 줄에는 "user,status"처럼 이름과 결과가 쉼표로 나뉘어 있어요. 빈 줄은 건너뛰어요. 나머지 줄을 {"user": 이름, "status": 상태}로 바꾸어 리스트에 담고 돌려주세요. 이름과 상태의 앞뒤 빈칸도 지워요.',
        hints=[
            "줄을 나누고 strip()으로 앞뒤 빈칸을 지워 봐요. 아무 글자도 남지 않으면 빈 줄이에요.",
            'user, status = line.split(",")로 쉼표 양쪽의 값을 나눌 수 있어요.',
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
        title="다른 기록을 같은 칸에 담아요",
        goal="서로 다른 모양의 기록을 같은 이름과 같은 글자 모양으로 맞춰요.",
        concept="같은 규칙으로 맞추기",
        prerequisite="IntroducingDictionaries",
        function="normalize",
        starter="def normalize(records):\n    result = []\n    # user 또는 username, status 또는 result를 읽습니다.\n    return result\n",
        description="어떤 기록에는 user와 status가 있고, 다른 기록에는 username과 result가 있어요. 같은 뜻인데 이름이 달라요. 새 기록에서는 이름을 user와 status로 맞춰 주세요. status의 글자는 대문자로 바꿔요. 원래 들어온 기록은 바꾸지 않아요.",
        hints=[
            "딕셔너리에서 get으로 값을 찾아봐요. 찾는 키가 없을 때 대신 쓸 값도 정할 수 있어요.",
            "글자에 upper()를 쓰면 대문자로 바꿀 수 있어요.",
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
        title="잘 도착한 답만 모아요",
        goal="성공한 답에서 항목을 모으고, 실패한 답은 몇 개인지 세어요.",
        concept="답에 따라 할 일 고르기",
        prerequisite="DefiningFunctions",
        function="collect_pages",
        starter='def collect_pages(pages):\n    items = []\n    errors = 0\n    # status가 200이면 items를 합치고 아니면 errors를 늘립니다.\n    return {"items": items, "errors": errors}\n',
        description="다른 프로그램에 부탁하면 답이 돌아와요. 여기서는 그 답을 미리 만들어 pages에 담아 두었어요. status가 200이면 성공한 답이에요. 그 답의 items만 순서대로 합쳐요. 나머지 답은 실패한 것으로 세고, items와 errors에 담아 돌려주세요. 실제 인터넷으로 부탁을 보내지는 않아요.",
        hints=[
            'response["status"] == 200이면 성공한 답이에요.',
            "리스트의 항목들을 하나씩 이어 담아야 해요. append와 extend 중 어느 쪽이 맞을까요?",
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
        title="시간이 된 소식만 꺼내요",
        goal="예약 시간이 된 소식을 고르고 같은 소식은 한 번만 담아요.",
        concept="시간과 중복 확인하기",
        prerequisite="IntroducingIfStatements",
        function="due_events",
        starter="def due_events(events, now):\n    seen = set()\n    result = []\n    # 1. at이 now 이하인지 확인합니다.\n    # 2. 이미 처리한 id는 건너뜁니다.\n    return result\n",
        description="새 소식이 도착했다고 알려 주는 방법을 Webhook이라고 해요. 여기서는 소식을 미리 만들어 두었어요. 각 소식에는 이름표인 id와 예약 시각인 at이 있어요. 현재 시각은 now예요. at <= now인 소식의 id만 들어온 순서대로 돌려주세요. 같은 id는 한 번만 담아요. 실제 시계나 서버는 쓰지 않아요.",
        hints=[
            "이미 담은 id를 set에 남겨 두면 같은 소식이 또 왔는지 확인할 수 있어요.",
            "아직 시간이 안 된 소식은 seen에도 넣지 않아요.",
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
        title="AI가 고른 도구를 확인해요",
        goal="AI의 답을 살펴보고 써도 되는 도구만 골라요.",
        concept="제안을 확인하고 고르기",
        prerequisite="IntroducingDictionaries",
        function="route_tool",
        starter='def route_tool(response):\n    allowed = {"search", "summarize"}\n    # 응답의 tool이 allowed에 있으면 반환합니다.\n    return "reject"\n',
        description='글로 답하는 AI를 LLM이라고도 불러요. response에는 AI가 골랐다고 가정한 도구가 담겨 있어요. tool이 "search" 또는 "summarize"이면 그 값을 돌려주세요. tool이 없거나 다른 값이면 "reject"를 돌려줘요. 실제 AI를 부르지 않아요. 같은 입력에는 언제나 같은 답이 나오도록 연습해요.',
        hints=[
            'response.get("tool")은 tool이 없어도 멈추지 않고 None을 돌려줘요.',
            "in으로 써도 되는 도구 목록에 있는지 확인해 봐요.",
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
        title="기록을 세어 보고서를 만들어요",
        goal="기록 수와 실패 수를 세고 실패한 사람을 정리해요.",
        concept="세고 모아 보여 주기",
        prerequisite="IntroducingDictionaries",
        function="make_report",
        starter='def make_report(logs):\n    failures = 0\n    users = set()\n    # 실패 건수와 실패한 사용자를 집계합니다.\n    return {"total": len(logs), "failures": failures, "users": sorted(users)}\n',
        description='모든 기록의 수를 total에, status가 "FAIL"인 기록 수를 failures에 담아요. 실패한 사람의 이름은 users에 담되, 같은 이름은 한 번만 남기고 정렬해요. 이 세 값을 total, failures, users라는 키로 묶어 돌려주세요.',
        hints=[
            "같은 사람이 여러 번 실패했다면 실패 수는 매번 늘려요.",
            "사람 이름은 set으로 같은 이름을 한 번만 남기고 sorted로 정렬해요.",
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
        title="모으고 맞추고 보고해요",
        goal="앞에서 만든 세 가지 일을 하나의 함수로 이어 봐요.",
        concept="작은 일을 이어 큰 일 완성하기",
        prerequisite="DefiningFunctions",
        function="pipeline",
        starter='def pipeline(pages):\n    logs = []\n    errors = 0\n    # 1. 성공한 모의 API 응답의 items를 모읍니다.\n    # 2. user/username과 status/result 형식을 정규화합니다.\n    # 3. 실패 건수와 사용자 목록을 집계합니다.\n    return {"total": 0, "failures": 0, "users": [], "errors": errors}\n',
        description="Day 3·4·7에서 해 본 일을 이어 봐요. 먼저 성공한 모의 API 답에서 items를 모아요. user/username과 status/result는 같은 이름으로 맞추고 상태는 대문자로 바꿔요. 그런 다음 total, failures, users, errors를 돌려주세요. 실패한 답은 건너뛰고 errors를 하나 늘려요. 원래 들어온 값은 바꾸지 않아요.",
        hints=[
            "먼저 collect_pages에서 했듯 성공한 답만 모아 봐요.",
            "그다음 normalize로 모양을 맞추고 make_report로 정리했던 방법을 다시 써 봐요.",
            "아무 값도 안 들어왔을 때와 실패한 답만 들어왔을 때도 확인해 봐요.",
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
