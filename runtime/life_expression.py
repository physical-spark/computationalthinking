"""An authored everyday problem layered over the preserved upstream course."""

import ast
import math

STEP_ID = "IntroducingTheShell.more_calculation"
EXAMPLE = "(4 * 8000 + 12000 - 4000) / 4"
TEXT = """<h2>친구 <code>4</code>명이 영화를 보러 가요</h2>
<p>영화표는 한 장에 <code>8000</code>원이에요. 네 명이 표를 한 장씩 사고, <code>12000</code>원짜리 팝콘 <code>1</code>세트를 함께 먹으려고 해요.</p>
<p>할인 쿠폰 <code>1</code>장으로 전체 금액에서 <code>4000</code>원을 빼 줘요. 할인을 받은 뒤 남은 금액을 <code>4</code>명이 똑같이 나눠 내기로 했어요.</p>
<p><strong>한 사람은 얼마를 내야 할까요?</strong> 답을 머리로 계산해서 적는 대신, 컴퓨터가 계산하도록 <strong>계산식(expression) 한 개</strong>를 써 보세요.</p>
<ol><li>영화표 네 장의 값을 구해요.</li><li>팝콘 한 세트의 값을 더해요.</li><li>전체 금액에서 쿠폰 금액을 한 번 빼요.</li><li>남은 금액을 네 명이 나눠 내요.</li></ol>
<p>문제에 나온 <code>4</code>, <code>8000</code>, <code>12000</code>, <code>4000</code>을 모두 사용해요. 곱셈은 <code>*</code>, 나눗셈은 <code>/</code>로 써요. 먼저 계산할 부분은 괄호 <code>( )</code>로 묶어요. 쉼표 없이 숫자를 적고 실행해 보세요.</p>"""
THINKING = {
    "focus": "생활 속 상황을 계산식으로 옮겨요",
    "why": "표 네 장의 값, 팝콘 값, 할인 금액을 찾아봐요. 더할 것과 뺄 것, 나눌 것을 정해 한 식으로 써요. 말로 된 문제를 컴퓨터가 계산할 수 있는 순서로 바꾸는 연습이에요.",
    "question": "영화표 값은 왜 네 배로 했나요? 할인 금액은 언제 뺐나요? 마지막에 네 명이 나누게 하려면 어느 부분을 괄호로 묶어야 하나요?",
    "activity": "상황을 읽고 식으로 표현해요",
}
HINTS = [
    "영화표는 네 장이지만 팝콘은 함께 먹을 한 세트예요. 각각 몇 번 더해야 할지 먼저 생각해 봐요.",
    "쿠폰은 한 장이에요. 네 사람 각각에게 4,000원씩 할인하는 것은 아니에요.",
    "네 명이 나눌 전체 금액을 먼저 구해요. 그 부분을 괄호로 묶은 다음 4로 나눠요.",
]


def assess(source):
    """Accept equivalent arithmetic models, not a memorized numeric answer."""
    try:
        tree = ast.parse(source.strip(), mode="eval")
    except (SyntaxError, ValueError, RecursionError):
        return (
            False,
            "계산식 한 개를 써 주세요. 곱셈은 *, 나눗셈은 /로 쓰고 괄호가 짝을 이루는지 확인해 봐요.",
        )
    allowed = (
        ast.Expression,
        ast.BinOp,
        ast.UnaryOp,
        ast.Constant,
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.UAdd,
        ast.USub,
    )
    nodes = list(ast.walk(tree))
    if len(nodes) > 80 or any(not isinstance(node, allowed) for node in nodes):
        return (
            False,
            "지금은 숫자와 +, -, *, /, 괄호를 사용한 계산식 한 개만 써 봐요. print나 변수는 필요하지 않아요.",
        )
    numbers = [node.value for node in nodes if isinstance(node, ast.Constant)]
    if (
        any(type(value) not in (int, float) for value in numbers)
        or not {4, 8000, 12000, 4000}.issubset(numbers)
        or not set(numbers).issubset({1, 4, 8000, 12000, 4000})
    ):
        return (
            False,
            "답 숫자만 적지 말고, 문제에 나온 4, 8000, 12000, 4000을 모두 넣어 계산식을 써 봐요.",
        )

    def value(node):
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.UnaryOp):
            return -value(node.operand) if isinstance(node.op, ast.USub) else value(node.operand)
        left, right = value(node.left), value(node.right)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        return left / right

    try:
        actual = value(tree.body)
    except (ArithmeticError, OverflowError, RecursionError):
        return False, "계산할 수 없는 부분이 있어요. 0으로 나누는 곳이 없는지 식을 다시 살펴봐요."
    if not math.isclose(actual, 10000, rel_tol=0, abs_tol=1e-8):
        return (
            False,
            "영화표는 네 장, 팝콘은 한 세트, 쿠폰은 한 장이에요. 할인한 전체 금액을 마지막에 네 명이 나누었는지 확인해 봐요.",
        )
    return True, "한 사람당 10,000원이에요. 생활 속 조건을 하나의 계산식으로 옮겼어요."


def apply(entry, result):
    if hasattr(entry, "to_py"):
        entry = entry.to_py()
    if entry["page_slug"] + "." + entry["step_name"] != STEP_ID:
        return result
    passed, message = assess(entry["input"])
    return {
        **result,
        "passed": bool(result.get("passed")) and passed,
        "message_sections": [{"type": "messages", "messages": [message]}],
    }
