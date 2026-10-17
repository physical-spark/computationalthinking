"""Authored arithmetic models layered beside the fixed upstream course."""
import ast

PAGE = "NavigatingShellHistory"  # Keep old lesson links valid.
PROBLEMS = {
    "remainder": {
        "title": "봉지에 담고 남은 사탕",
        "text": "사탕 17개를 한 봉지에 5개씩 담아요. 꽉 찬 봉지에 넣고 남는 사탕은 몇 개일까요? 17과 5, 나머지 연산자 %를 사용해 계산식 한 개를 써 보세요.",
        "example": "17 % 5", "answer": 2, "numbers": {17, 5}, "operator": ast.Mod,
        "hints": ["17 // 5는 꽉 찬 봉지 수예요. 지금 묻는 것은 남은 사탕 수예요.", "나머지는 %로 구해요. 사탕 수 % 한 봉지에 넣을 수처럼 적어 봐요."],
        "thinking": {"focus": "같은 나누기에서도 필요한 답을 골라요", "why": "봉지 수와 남은 사탕 수는 서로 달라요. 질문이 무엇을 묻는지 보고 //와 % 중 맞는 연산을 골라요.", "question": "사탕 수가 20개라면 남는 수는 얼마일까요? 꽉 찬 봉지 수와 어떻게 다른가요?", "activity": "필요한 연산을 골라요"},
    },
    "square": {
        "title": "정사각형의 타일 수",
        "text": "정사각형 바닥의 한 변에 타일을 6개씩 놓아요. 가로 6개, 세로 6개라면 모두 몇 개가 필요할까요? 6과 2, 제곱 연산자 **를 사용해 계산식 한 개를 써 보세요. 6 ** 2는 6을 두 번 곱한다는 뜻이에요.",
        "example": "6 ** 2", "answer": 36, "numbers": {6, 2}, "operator": ast.Pow,
        "hints": ["6 * 2는 여섯 개를 두 묶음 모으는 계산이에요. 정사각형은 여섯 줄에 여섯 개씩 있어요.", "제곱 연산자는 별표 두 개 **예요. 6의 제곱은 6 ** 2로 적어요."],
        "thinking": {"focus": "반복되는 곱셈을 짧은 규칙으로 써요", "why": "여섯 줄의 타일을 하나씩 세는 대신 한 변의 길이를 두 번 곱해요. 같은 모양의 다른 크기에도 쓸 수 있는 규칙이에요.", "question": "한 변이 8개라면 식의 어느 숫자를 바꾸면 될까요? 6 * 2와 6 ** 2는 왜 다른가요?", "activity": "반복되는 관계를 표현해요"},
    },
}

def handles(entry):
    if hasattr(entry, "to_py"):
        entry = entry.to_py()
    return entry["page_slug"] == PAGE and entry["step_name"] in PROBLEMS


def assess(name, source):
    problem = PROBLEMS[name]
    try:
        tree = ast.parse(source.strip(), mode="eval")
    except (SyntaxError, ValueError, RecursionError):
        return False, None, "숫자와 연산자로 계산식 한 개를 써 주세요."
    allowed = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Constant, ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod, ast.Pow, ast.UAdd, ast.USub)
    nodes = list(ast.walk(tree))
    if len(nodes) > 40 or any(not isinstance(n, allowed) for n in nodes):
        return False, None, "지금은 숫자와 연산자로만 식을 써 봐요. print나 변수는 필요하지 않아요."
    values = [n.value for n in nodes if isinstance(n, ast.Constant)]
    if any(type(v) not in (int, float) for v in values) or set(values) != problem["numbers"]:
        return False, None, "답 숫자만 쓰지 말고 문제에 나온 두 수로 계산식을 만들어 봐요."
    def value(n):
        if isinstance(n, ast.Constant):
            return n.value
        if isinstance(n, ast.UnaryOp):
            return -value(n.operand) if isinstance(n.op, ast.USub) else value(n.operand)
        a, b = value(n.left), value(n.right)
        if isinstance(n.op, ast.Pow) and (abs(a) > 1000 or abs(b) > 8):
            raise ValueError
        operations = {ast.Add: lambda: a+b, ast.Sub: lambda: a-b, ast.Mult: lambda: a*b, ast.Div: lambda: a/b, ast.FloorDiv: lambda: a//b, ast.Mod: lambda: a%b, ast.Pow: lambda: a**b}
        result = operations[type(n.op)]()
        if not isinstance(result, (int, float)) or abs(result) > 1_000_000:
            raise ValueError
        return result
    try:
        actual = value(tree.body)
    except (ArithmeticError, ValueError, RecursionError):
        return False, None, "0으로 나누거나 너무 큰 계산을 하지 않는지 식을 확인해 봐요."
    if not any(isinstance(n, problem["operator"]) for n in nodes):
        op = "%" if name == "remainder" else "**"
        return False, actual, f"이번에는 {op} 연산자로 상황을 표현해 봐요."
    if actual != problem["answer"]:
        return False, actual, "어떤 수를 나누거나 제곱할지 순서를 다시 살펴봐요."
    return True, actual, "남은 사탕은 2개예요. 필요한 연산을 골랐어요." if name == "remainder" else "타일은 36개예요. 가로와 세로가 같은 규칙을 제곱으로 나타냈어요."


def check(entry, callback):
    if hasattr(entry, "to_py"):
        entry = entry.to_py()
    passed, output, message = assess(entry["step_name"], entry["input"])
    if output is not None:
        callback("output", {"parts": [{"type": "stdout", "text": str(output) + "\n"}]})
    return {"passed": passed, "message_sections": [{"type": "messages", "messages": [message]}]}
