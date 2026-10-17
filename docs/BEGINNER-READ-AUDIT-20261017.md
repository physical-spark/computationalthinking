# 처음 배우는 독자의 전수 읽기 검토 — 2026-10-17

검토 대상은 이 작업을 시작할 때의 `content/course.json`이다. 69개 페이지, 실행 단계 265개와 읽기 단계 69개(전체 334개)가 있었다. Python을 처음 만나는 중학생 독자가 화면의 문장만 읽고 무엇을 입력할지 알 수 있는지, 배운 적 없는 용어나 잘못된 번역 때문에 막히는지 확인한다.

이 기록은 실제 학생의 학습 성과나 숙달을 평가한 결과가 아니다. 이 검토자는 기존 코드를 아는 검토자가 초심자의 읽기 조건을 적용했으며, 이 보고서 작성 중 학생 코드를 실행해 통과를 확인하지 않았다. 실행·API·접근 제어 검증은 별도로 이루어진다. 개념도와 배포 화면까지 모두 직접 조작했다는 뜻도 아니다.

## 확인 범위와 진행 상태

- 전체 페이지 목록과 실행/읽기 단계 수를 확인했다.
- 본문·힌트·요구사항을 페이지 순서대로 읽는다. 긴 출력이 잘린 구간은 별도 호출로 다시 읽고 범위에 포함한다.
- 1차: `IntroducingTheShell`부터 `CallingFunctionsTerminology`까지 27개 페이지를 읽었다. `IntroducingElif`–`BuildingNewLists` 구간은 잘린 출력을 따로 다시 읽었다.
- 이후 범위와 후속 발견은 아래에 추가한다.

## 발견한 문제

우선순위 P1은 잘못된 동작을 지시하거나 필수 정의를 없애 다음 학습을 막는 문제다. P2는 이해를 어렵게 하거나 불필요한 혼동을 일으키는 문구다. 보고서의 “제안”은 적용 완료를 뜻하지 않는다.

| ID | 우선순위 | 페이지·단계 | 실제 문구·근거 | 초심자가 막히는 이유와 제안 |
|---|---|---|---|---|
| B01 | P1 | `NavigatingShellHistory.final_text` | 이 페이지의 유일한 단계가 “전에 쓴 코드를 불러와 조금 고치고 다시 실행했어요”라는 정리뿐이다. | 실제 이전 코드 호출 방법을 설명하지 않고 배웠다고 말한다. 원전 정의를 별도 Learn에 보존하거나 정리 앞에 유지해야 한다. 이후 운영에서는 이 단원의 주제가 바뀔 예정이므로 새 Learn/실습과 다시 대조한다. |
| B02 | P1 | `BasicTerminology.final_text` | 유일한 본문이 “표현식·문장·반복문처럼 코드의 역할에 이름을 붙였어요”이다. | 원래 가르쳐야 할 표현식과 문장의 차이·값·리터럴·변수 등 정의가 사라져 정리가 정의를 대신한다. 필수 정의와 구체적인 코드 표시를 복원해야 한다. |
| B03 | P1 | `IntroducingForLoops.final_text`, `UsingBreak.final_text` 등 | 모든 읽기 단계 69개가 단원 정리로 바뀌었다. 앞의 반복문 구조와 변수의 다음 값, `break`를 처음 가르치는 설명이 빠졌다. | 정리를 만들면서 필수 교육 본문까지 덮으면 뒤의 힌트가 “배웠다”고 말하는 문법을 실제로 본 적이 없게 된다. 원전 final_text에서 새로 도입하는 정의를 추려 각 페이지 Learn에 보존해야 한다. |
| B04 | P2 | `BuildingUpStrings.empty_string` 등 요구사항 | `<code>&gt;&gt;&gt;</code>`만 있는 문단이 남아 있다. `indices_out_of_bounds`, `range_almost_the_same_as_list`, `range_versus_list`에서도 확인했다. | 통합 코드 편집기를 쓰는 화면에서 옛 셸 프롬프트가 입력할 코드처럼 보인다. 실행할 코드는 아닌 프롬프트를 제거한다. |
| B05 | P1 | `UsingVariables.name_assign` | 본문: “다른 문자열을 값으로 갖는 your_name 변수를 만들어 보세요.” 요구사항: “word = 'Hello'에서 word를 your_name로 바꾸고 실행해 봐요.” | 값도 바꾸라는 본문과 이름만 바꾸라는 요구사항이 상충한다. `your_name = '원하는 이름'`처럼 실제 이름을 넣는 예를 명확히 제시하되 정답을 특정 이름으로 제한하지 않는다. |
| B06 | P2 | `IntroducingVariables.word_assign` | “미리 알 수 없거나 바뀔 수 있는 값을 가리킬 방법이 필요해요. 이런 값을 변수라고 불러요.” | 값 자체가 변수라는 설명은 이름표 비유와 충돌한다. “값을 가리키는 이름을 변수라고 해요”로 고친다. |
| B07 | P2 | `Indentation.missing_indentation` | 같은 줄 `for character in name: print(character)`를 유효한 예로 보인 뒤 “반복할 코드는 콜론 다음 줄에서 시작해야” 한다고 한다. | 올바른 코드와 필수 문법이라는 설명이 모순된다. “여러 줄로 쓸 때에는” 또는 “이 과정에서는 읽기 쉽게”로 적용 범위를 정한다. |
| B08 | P1 | `BuildingUpStringsExercises.diagonal_name_bonus_challenge`, `IntroducingLists.strings_sum_bonus` | “꼭 풀지 않아도 괜찮아요”, “지금 바로 다음 페이지로 가도 돼요”. 서버 순서는 reading이 아닌 모든 미통과 단계를 앞선 필수 과제로 센다. | 자유로운 건너뛰기를 약속하지만 학습 잠금 규칙과 다르다. 사용자 승인 순차 진행은 유지하고 이 과정을 필수 확장 연습으로 안내하며 시작 코드와 작은 힌트를 충분히 제공한다. |
| B09 | P1 | `IntroducingIfStatements.excited_false_example` 요구사항 | “첫 줄이 excited = False가 되었나요?” 실제 전체 프로그램 첫 줄은 `sentence = 'Hello World'`이고 excited는 둘째 줄이다. | 첫 줄을 바꾸면 앞의 초기화가 사라진다. “excited를 정하는 줄”로 위치를 정확하게 지시한다. |
| B10 | P1 | `IfAndElse.if_upper_else_lower_false` 요구사항 | 여기에서도 첫 줄을 `excited = False`로 만들라고 한다. 실제 코드는 sentence가 첫 줄이다. | B09와 같은 잘못된 행 지시다. 변수 이름이 적힌 줄을 바꾸도록 한다. `IfAndElse.first_if_else_false`는 실제 condition이 첫 줄이므로 같은 일괄 변경을 하지 않는다. |
| B11 | P1 | `IntroducingElif.dna_example_with_else` | “char는 T에서 A로만 바뀌어야 해요. char가 처음부터 A였다면 바꾸면 안 되거든요.” | 과제는 A→T와 T→A를 모두 요구한다. “두 번째 T→A 변경은 처음부터 T였을 때만 해야 해요. 이미 A→T로 바꾼 글자는 다시 바꾸면 안 돼요”로 대상을 한정한다. |
| B12 | P2 | `OtherComparisonOperators.grades_example` | `percentage < 60`을 “40부터 59까지의 모든 수”라고 설명한다. | 실수 백분율을 떠올리면 59.5도 포함되므로 경계 설명이 부정확하다. “40 이상 60 미만”으로 쓰고 필요하면 정수 예를 따로 든다. |
| B13 | P2 | `UsingVariables.first_print` | “문자열 앞뒤에 붙은 따옴표가 계속 보이니 지루해요.” | 따옴표가 왜 보이는지 모르는 학습자에게 감상만 제시한다. “지금까지는 문자열 값의 양 끝 따옴표도 보였어요. print로 글자만 보여 줄 수 있어요”로 동작을 설명한다. |
| B14 | P2 | 여러 페이지 `final_text` | 같은 연구 두 편과 설명이 모든 69개 정리마다 반복된다. | 출처가 필요해도 초심자가 장마다 똑같은 긴 문장을 읽는 비용이 크다. 작은 공통 출처 영역·연구 안내 페이지로 연결하고 본문에는 해당 단원에서 한 생각과 새 의문을 남긴다. |

## 해답·채점 조건을 볼 때의 원칙

본문을 쉽게 바꾼다고 예제 식별자, 문자열, 기대 출력, 원래 단계 ID를 바꾸지 않는다. 같은 과제에서 “실행해 보세요”와 “직접 고쳐 보세요”를 구별하고, 오류가 의도된 단계에서는 오류가 실패가 아니라 관찰 대상임을 알려야 한다. 해답은 읽기 검토의 근거로만 사용하며 실제 통과 기록으로 취급하지 않는다.

## 현재 한계

진행 중인 콘텐츠 재생성 작업과 병행해 작성하므로 위 증거는 읽은 순간의 파일 내용이다. 다른 에이전트가 작성하는 `content/page-concepts.json`, `content/unit-recaps.json`은 수정하지 않았다. 최종 상태에서 해결 여부를 다시 확인할 필요가 있다.

## 2차 읽기 — 리스트·문자열·중첩 반복·함수

`FunctionsAndMethodsForLists`부터 `CallingFunctionsWithinFunctions`까지 읽었다. 본문뿐 아니라 해당 구간의 힌트와 사용자 지정 요구사항을 함께 확인했다.

| ID | 우선순위 | 페이지·단계 | 짧은 증거 | 제안 |
|---|---|---|---|---|
| B15 | P1 | `FunctionsAndMethodsForLists.subscript_assignment_exercise`, `negative_index_concatenation_exercise`, `remove_exercise` | “아래 목록에서” 또는 “앞의 긴 목록”을 고르라고 하지만 현재 단계 본문에 그 목록이 없다. | 원전의 이어 읽는 설명을 단계별 화면에 옮기면서 참조 대상이 다른 화면으로 밀렸다. 관련 코드 선택지를 현재 단계에도 제공해야 한다. |
| B16 | P1 | `MoreListFunctionsAndMethods.average_exercise`, `sum_range_exercise`, `second_smallest_in_list_exercise` | 이 세 문제 역시 앞 단계의 17개 코드 목록에서 한 줄을 고르라고 한다. | B15와 동일하다. 문제와 선택지와 작성할 세 줄을 한 화면에서 비교할 수 있도록 한다. |
| B17 | P1 | `MoreListFunctionsAndMethods.count_in_sorted_sum`, 힌트 | 본문 입력은 `x = [1, 2, 0, 3]`인데 첫 힌트는 `x = ['a', 'b', 'c']`로 다른 문제의 값을 들고 온다. 또 “1가 x일 때예요!”라고 한다. | 원전에도 첫 입력 힌트 오류가 있다. 원전 그대로 유지할 이유가 없다. 본문 입력과 힌트를 일치시키고 “1이 x 안에 들어 있을 때예요”로 고친다. |
| B18 | P1 | `SingleAndDoubleQuotesInStrings.double_quote_exercise`, 힌트 1 | `aren't`를 포함한 문장을 출력하는 문제에서 “따옴표는 작은따옴표로 써야 해요”라고 한다. | 큰따옴표로 감싸야 하는 문제인데 반대로 안내한다. “글 안에 작은따옴표가 있으니 문자열 바깥은 큰따옴표로 감싸요”가 맞다. |
| B19 | P1 | `SingleAndDoubleQuotesInStrings.single_quote_exercise`, 힌트 1–2 | “따옴표가 하나 들어 있으면 … 큰따옴표”, “두 개 들어 있다면?” | 원전의 single/double quote가 기호의 종류가 아니라 개수 1개/2개로 읽히도록 번역됐다. “작은따옴표”와 “큰따옴표”의 종류를 명시하고 실제 표시할 큰따옴표를 바깥 작은따옴표로 감싸도록 안내한다. |
| B20 | P2 | `ModifyingWhileIterating.run_broken_with_python_tutor` | 설명은 “10보다 작은 숫자”를 지운다고 하지만 실제 조건은 `number <= 10`이다. | “10 이하인 숫자”로 바꾼다. 예제 첫 값 10이 실제로 지워지는 이유도 분명해진다. |
| B21 | P2 | `StringMethodsUnderstandingMutation.string_count_index` | 앞 단계 코드가 `print('the' in ...)`인데 “명령은 True를 반환했어요”라고 한다. | 이미 `print`가 None을 반환한다고 배웠다. “in으로 비교한 결과는 True이고 print가 그 값을 보여 줬어요”로 구분한다. |
| B22 | P2 | `FunctionsAndMethodsForLists.append_vs_concatenate` | 한 목록에서 `nums.append(4)`는 `[1,2,3,4]`가 된다고 쓴 뒤 `len(nums)`는 3이라고 한다. | 순서대로 실행하는 예제처럼 읽히면 모순이다. “아래의 각 예는 nums가 [1,2,3]인 상태에서 따로 시작해요”라고 밝힌다. |
| B23 | P2 | `IntroducingNestedLoops.times_table_exercise`, `crack_password_exercise` | 출력 예 안에 `(you get the idea...)`, `...skipping a few...`가 있다. | 영어 문장도 그대로 출력해야 하는지 오해할 수 있다. 예제를 생략한 표시이며 실제 출력에는 넣지 않는다는 문장을 코드 밖에 덧붙인다. |
| B24 | P1 | `CallingFunctionsWithinFunctions.see_stack_in_birdseye` | 현재 실행 모드는 birdseye인데 “실행 결과 아래의 단계 슬라이더를 움직여 봐요”라고 한다. | Python Tutor 단계의 슬라이더와 Birdseye 단계의 링크를 구분해야 한다. “앞 단계에서는 슬라이더로… 이번에는 실행 후 Birdseye 링크로…”로 안내한다. |
| B25 | P2 | `LoopingOverNestedLists.nested_list_nested_loop_example` | “버튼을 눌러 리스트를 편집기에 복사”라는 옛 UI 안내가 남아 있다. | 현재 사용하는 실제 복사 기능에 맞춰 안내하거나 두 코드 부분을 하나로 이어 쓰도록 단순히 말한다. 반복 코드만 복사하면 numbers 초기화가 빠진다는 것도 명확히 한다. |
| B26 | P2 | `DefiningFunctions.print_twice_exercise`, 힌트 0 | “머리를 써서 풀어야 하는 문제는 없어요” | 처음 문법을 익히는 학습자에게 할 수 있어야 한다는 압박을 준다. “함수 이름과 매개변수를 먼저 적어 봐요”처럼 다음 행동을 알려 준다. |
| B27 | P1 | 같은 페이지의 앞 코드 수정을 요구하는 여러 단계 | `App.tsx`는 새 단계에 저장 초안이 없으면 `step.starter`를 사용한다. 현재 원전 단계의 starter는 대부분 빈 문자열이다. 본문은 “첫 줄을 바꾸고 다시”, “앞 프로그램 아래에 추가”라고 한다. | 새 단계에서 앞 코드가 보이지 않으면 어느 프로그램을 바꿀지 모른다. 단계마다 필요한 기준 프로그램을 본문·시작 코드에 제공하거나 안전하게 직전 초안을 가져오는 기능이 필요하다. 실행 네임스페이스 격리와 학습자 코드 보존은 별도로 유지한다. |

B27은 코드 읽기로 확인한 UX상 연결 문제이며 이 검토에서 운영 실행 실패를 재현했다는 뜻은 아니다. 최종 렌더러가 직전 코드를 별도로 보여 주거나 기준 코드를 채워 준다면 해결될 수 있다.

## 3차 읽기 — 반환·검사·논리·게임판

`ReturningValuesFromFunctions`부터 `MakingTheBoard`까지 읽었다. 한 줄짜리 실행 코드와 긴 틱택토 테스트의 보드·예상값도 함께 읽었다.

| ID | 우선순위 | 페이지·단계 | 짧은 증거 | 제안 |
|---|---|---|---|---|
| B28 | P2 | `IntroducingNotPage.NotPriority` | `filename.endswith('.png')`가 처음 나오지만 무슨 메서드인지 설명하지 않는다. | “파일 이름이 .png로 끝나면 True를 돌려줘요”라는 한 문장으로 필요한 동작을 먼저 알려 준다. |
| B29 | P2 | `IntroducingNotPage.NotPriority`, 힌트 | “특히 returns는 필요 없는 코드예요” | return 키워드를 전부 없애라는 뜻처럼 읽힌다. “if/else에서 True와 False를 따로 돌려주는 대신, 조건식의 결과를 바로 돌려줄 수 있어요”로 말한다. |
| B30 | P2 | `TestingFunctions.alert_exercise`, 힌트 10 | 본문은 +를 금지하지만 힌트는 “+=로 문자열을 어떻게 만들어 갈지 생각해 봐요”라고 한다. | +=를 직접 쓰라는 지시가 아니라 앞의 누적 방법을 떠올리라는 뜻이다. “같은 변수를 매번 새 결과로 바꿨듯, 이번에는 something = surround(...)로 바꿔요”로 한정한다. |
| B31 | P2 | `MultiLineExpressions.valid_multiline` | 줄바꿈 예제들 중 `is_friend = [name == ..., name == ...]`는 앞의 불리언 한 값과 달리 리스트를 만든다. | 줄바꿈 문법만 보여 주는 독립 예이며 모두 같은 값을 만든다는 뜻은 아님을 밝힌다. 대괄호 예에서는 값 두 개를 담은 리스트가 나온다. |
| B32 | P2 | `IntroducingOr.AnExercise` | 앞의 is_friend는 Alice와 Bob만 친구인데 in의 예제 목록에는 Charlie도 추가된다. | 코드 예를 유지한다면 “여기서는 Charlie도 친구로 추가한 별도 예예요”라고 밝혀 앞 테스트와 다른 규칙임을 알린다. |
| B33 | P1 | `NewlinesAndFormatBoard.format_board_bonus_challenge`, 힌트 0 | “-로 이어 붙인 +들로 된 줄” | 원전은 `-` 사이에 `+`를 넣으라는 뜻이다. 실제 해답은 `['-', '-', '-']`를 `'+'`로 이어 `-+-+-`를 만든다. 현재 번역은 결합 순서를 반대로 알려 준다. |
| B34 | P1 | `Types.fixing_type_errors_with_conversion` | “list['3']처럼 문자열을 리스트의 위치 번호로 써도 오류” | 앞에서 list를 내장 자료형으로 배웠다. 현대 Python의 `list['3']`는 타입 표기로 허용될 수 있으므로 실제 리스트 값을 인덱싱하는 예로 바꾼다. `[1, 2, 3]['3']` 또는 리스트라고 밝힌 변수 `numbers['3']`가 맞다. 본 검토는 이 코드의 운영 실행을 확인하지 않았다. |
| B35 | P1 | `NestedListAssignment.nested_assignment_two_lines` | 실행 모드는 editor인데 “실행 결과 아래의 단계 슬라이더”를 지시한다. | 해당 단계에 실제 추적 결과가 생성되는지 확인하고, 없다면 없는 조작을 지시하지 않는다. 공유 개념 단계 슬라이더와 학생 코드 실행 도구를 구별해야 한다. |
| B36 | P1 | `MakingTheBoard.fix_make_board` | 실행 모드는 editor인데 “Python Tutor로 코드를 실행해 보세요”라고만 한다. | 도구 선택 버튼을 없앤 현재 UI에서 어떻게 바꾸는지 알 수 없다. 자동 추적을 제공하거나 실제 이용할 수 있는 관찰 방법으로 설명한다. |
| B37 | P2 | `NestedListAssignment.nested_assignment_input`, 힌트 | “문자열로는 계산을 할 수 없어요. 숫자로만 할 수 있어요.” | 앞에서 문자열 + 연산을 이미 배웠다. “입력한 글자에서 숫자 1을 빼려면 먼저 정수로 바꿔야 해요”로 이 과제의 계산에 한정한다. |
| B38 | P2 | `InteractiveProgramsWithInput.convert_input_to_int`, 힌트 5 | “두 값이 같은지 확인하려면, 먼저 두 값이 같은 종류인지 확인해야” | 일반적으로 같은 자료형이어야 == 비교가 가능한 것은 아니다. 이 문제에서는 글자 '7'과 숫자 7을 맞추기 위해 변환하는 것이라고 한정한다. |

B33은 원전 `core/chapters/c11_tic_tac_toe_project.py`의 해당 힌트와 정답 함수를 직접 대조했다. B34는 내장 자료형 이름과 인스턴스 변수 이름이 다르다는 읽기/의미 검토이며 실행 검증 결과로 제시하지 않는다.

## 4차 읽기 — 딕셔너리 끝부분·Module 1·전체 해답

`TheFullTicTacToeGame`부터 마지막 `m1-day8`까지 본문·힌트·요구사항을 읽었다. 앞서 읽은 원전 전체 단계의 `solution.tokens`도 순서대로 이어 만든 코드를 모두 읽었다. 원전의 오류 관찰 단계는 코드가 일부러 오류를 내므로 “해답 코드에 오류가 있다”는 이유로 결함으로 처리하지 않았다. Module 1은 시작 코드와 모범 해답을 나란히 대조했다.

| ID | 우선순위 | 페이지·단계 | 짧은 증거 | 제안 |
|---|---|---|---|---|
| B39 | P2 | `UsingDictionaries.shopping_cart4`, 힌트 0 | “prices와 quantities의 키는 같아요.” 실제 예에서 prices의 키는 4종류이고 quantities는 2종류다. | “cart의 각 item을 두 딕셔너리에서 키로 쓸 수 있어요”처럼 필요한 포함 관계만 말한다. 키 전체가 같다는 말은 사실과 다르다. |
| B40 | P2 | `UsingDictionaries.shopping_cart4`, 힌트 2 | “price는 prices에 들어 있는 값이어야 해요. quantity도 마찬가지예요.” | quantity 역시 prices에서 가져오라는 뜻으로 읽힐 수 있다. “price는 prices[item], quantity는 quantities[item]에서 찾아요”로 각 역할을 구별한다. |
| B41 | P2 | `CreatingKeyValuePairs.buy_quantity_exercise`, 힌트 5 | “'dog'는 위에서 500였어요.” | 키인 문자열 dog가 숫자 500이라는 뜻처럼 읽힌다. “‘dog’에 해당하는 수량이 500이었어요”라고 관계를 말한다. |
| B42 | P2 | `DictionaryKeysAndValues.keys_are_iterable` | “keys 메서드는 이름에서 짐작할 수 있는 일을 해요.” | 영어를 모르는 초심자는 keys의 뜻을 추측할 수 없다. “키만 하나씩 꺼내 볼 수 있게 돌려줘요”라고 동작을 직접 적는다. |
| B43 | P1 | `m1-day2`–`m1-day7`의 새 도구 | `splitlines`, `strip`, `get`, `extend`, `set`, `add`가 시작 코드와 힌트에 등장한다. 원전에서는 일부가 수정하지 않는 완성 코드의 내부에만 있었다. | 각 페이지 Learn에서 필요한 메서드 하나마다 아주 작은 입력과 결과를 먼저 보여 준다. 필요한 경우 이미 배운 리스트 +=, in, append만으로 푸는 길도 제시한다. 영상에 등장한다는 사실만으로 정의를 배웠다고 가정하지 않는다. |
| B44 | P2 | `m1-day1`, `m1-day2`, `m1-day3`, `m1-day6`, `m1-day7`, `m1-day8`의 모범 해답 | 시작 코드는 기본 for/if 구조인데 공개하는 해답에는 리스트·집합 컴프리헨션, 한 줄의 여러 for, 조건 표현식이 등장한다. | 학생이 힌트의 기본 구조를 따라 풀다가 정답을 열었을 때 갑자기 더 어려운 문법을 만난다. 직접 작성한 Module 1 해답은 기본 for·if·append와 중간 변수로 풀어 쓸 수 있다. 원전 예제와 채점 조건은 별도로 보존한다. |
| B45 | P1 | `CombiningCompoundStatements.final_text` | “반복문 안에 조건문”을 만들었다는 정리지만 현재 유일한 실습은 `for_inside_if`, 즉 조건문 안의 반복문이다. | 원전 final_text가 보여주던 반대 배치 설명이 사라져 정리와 실제 활동이 어긋났다. 새 Learn에서 두 배치를 각각 보여 주거나 현재 활동에 맞춰 정리한다. |
| B46 | P2 | 오류를 관찰하는 원전 단계 전반 | `sunshine`, 들여쓰기 오류, `print(1 + 2 = 3)`, 문자열의 따옴표 오류 등은 의도된 코드다. | 초심자는 빨간 오류 화면을 과제나 서비스의 실패로 볼 수 있다. 이 단계는 오류를 관찰하는 것이 목표이고, 목표에 맞는 오류를 확인하면 통과할 수 있다는 짧은 안내를 준다. 오류를 고쳐야 하는 다음 과제와 구별한다. |

## 최종 확인 범위

이 보고서 작성자는 다음 구간을 직접 읽었다.

| 순서 | 페이지 범위 | 확인한 것 |
|---|---|---|
| 1 | `IntroducingTheShell`–`BasicTerminology` (14개) | 본문, 힌트, 요구사항, 읽기 정리 |
| 2 | `IntroducingIfStatements`–`CallingFunctionsTerminology` (13개) | 본문, 힌트, 요구사항. 긴 출력에서 잘린 `IntroducingElif`–`BuildingNewLists`는 따로 다시 읽음 |
| 3 | `FunctionsAndMethodsForLists`–`MoreListFunctionsAndMethods` (2개) | 전체 코드 선택지, 과제별 세 줄, 힌트, 요구사항 |
| 4 | `StringMethodsUnderstandingMutation`–`IntroducingFstrings` (7개) | 문자열·복사·따옴표·f 문자열 설명과 과제 |
| 5 | `IntroducingNestedLoops`–`CallingFunctionsWithinFunctions` (6개) | 중첩 반복·중첩 데이터·함수 정의·추적 도구 안내 |
| 6 | `ReturningValuesFromFunctions`–`IntroducingOr` (4개) | 반환·테스트·종료 범위·논리 연산의 실제 예 |
| 7 | `IntroducingAnd`–`IntroducingNotPage` (4개) | 비교 체인·여러 줄 표현식·우선순위·not·메서드 사용 |
| 8 | `IntroducingTicTacToe`–`NewlinesAndFormatBoard` (2개) | 각 방향의 승리 테스트와 빈칸 조건, 줄바꿈, 구분선 |
| 9 | `Types`–`MakingTheBoard` (4개) | 자료형·입력·자리 수정·리스트 공유와 복사 |
| 10 | `TheFullTicTacToeGame`–`UsingDictionaries` (3개) | 전체 게임 연결, 코드 제공 범위, 딕셔너리 조회·가격·대응표 |
| 11 | `DictionaryKeysAndValues`–`CreatingKeyValuePairs` (2개) | 키 반복·중첩 딕셔너리·삽입·새 대응표·값 중복 |
| 12 | `m1-day1`–`m1-day8` (8개) | 본문, 모든 시작 코드, 힌트, 모범 해답, 모의 기능 표시 |
| 13 | 전체 69개 읽기 정리 | 단원별 고유 문장과 공통 연구 출처. 잘린 뒷부분은 별도 호출로 다시 읽음 |
| 14 | 전체 265개 실행 단계 해답 | `solution.tokens`를 이어 만든 실제 코드. 처음 큰 출력에서 잘린 앞 39개 페이지 해답은 따로 다시 읽음 |

총 69개 페이지, 265개 실행 단계, 69개 읽기 단계를 대상으로 했다. 위 46건은 하나의 반복 원인을 여러 단계에 묶어 적었으므로 “46개 버그를 실행 재현했다”는 뜻이 아니다. 마지막 생성본과 화면을 대상으로 해결 여부를 다시 확인해야 한다.

## 읽기 이후의 반성

처음 작성한 20개 공용 개념이 정확하더라도, 그것을 69개 페이지에 반복해서 보여 주면 실제 학습 목표와 설명이 달라질 수 있다. 또 원전 문장을 쉬운 한국어로 바꾸는 것만으로 단계별 화면에 맞게 바뀌지는 않는다. 이전 코드, 선택지, 실행 기록을 계속 볼 수 있었던 원전의 전제를 함께 점검해야 한다.

이번 읽기에서는 “같은 값”, “같은 키”, “이 줄”, “아래 목록”, “앞 프로그램”처럼 단독으로는 쉬워 보이는 말이 실제 코드나 화면의 어느 부분을 가리키는지 확인하는 것이 가장 유용했다. 모르는 단어를 괄호로 설명하는 것만으로는 뒤바뀐 지시, 잘못된 경계값, 없는 조작을 해결할 수 없다. 다음 생성본은 각 페이지의 독립된 예와 실제 과제의 연결을 다시 읽고, 같은 장면에서 입력·중간 값·출력이 이어지는지 확인해야 한다.

## 새 Learn 재검토

이 절은 앞의 원전 실행 단계 읽기와 별개로, 새로 작성된 `content/page-concepts.json`을 다시 읽은 결과다. 69개 항목의 idea, analogy, code, 질문·선택지·정답·해설, walkthrough의 intro와 모든 frame을 읽었다. 파일에는 서로 다른 코드 69개, 서로 다른 질문 69개, 총 207개 frame이 있었다. Python 코드를 실행해 통과시킨 결과는 이 검토에 포함하지 않는다. `expected_output`은 작성자가 별도로 검사했으며 root도 직접 실행 검사를 준비하고 있다.

### 이전 문제에서 실제로 보완된 부분

- **공용 개념 재사용:** 이전 20개를 반복하던 것과 달리, 현재는 69개 페이지마다 독립된 코드·질문이 있다. 변수 사용과 계산값 저장, 누적과 역순 누적, 중첩 반복과 중첩 자료 순회, 함수 정의와 함수 조합이 서로 다른 예로 구별된다. 코드가 서로 다르다는 수치만으로 이해가 보장되지는 않지만, 이번에는 실제 설명의 의미도 페이지 목표에 맞춰 달라졌다.
- **B02의 Learn 부분:** BasicTerminology에 표현식·값·리터럴·대입문·평가·문장·복합문 정의와 `total = 2 + 3`의 구체적 구분이 복원됐다. 한꺼번에 많은 용어가 나오는 부담은 아래 잔여 의견에 남겼다.
- **B03의 ForLoops·Break Learn 부분:** `for`, `in`, 콜론, 들여쓰기, 반복 전 다음 글자의 대입을 설명한다. UsingBreak에도 실제로 `break`가 실행되어 남은 coin을 읽지 않는 독립 예가 생겼다.
- **B01의 주제 변경:** NavigatingShellHistory는 예전 코드 호출법 대신 몫·나머지·거듭제곱의 실제 Learn으로 바뀌었다. 과거 조작을 배웠다고 주장하는 정리만 남은 문제를 더는 그대로 이어 쓰지 않는다. 이 항목의 안정된 ID와 새로운 주제가 다르다는 점은 목차 제목·실습과 함께 관리해야 한다.
- **B43의 일부:** Module 1 Day 2에서는 split의 구분자 역할을, Day 4에서는 extend가 항목을 이어 넣는 동작임을 실제 값과 함께 설명한다. Day 7의 set은 중복 이름을 제거하는 뜻도 설명한다. Day 2의 strip/splitlines, Day 3의 get, Day 5의 set/add까지 모두 설명된 것은 아니다.
- **EqualsVsIs의 수정 재확인:** 첫 검토에서 지적한 c 연결과 비교 순서는 root가 수정했다. 다시 읽은 frame은 line 3에서 세 이름과 두 목록을 만든 뒤 line 5의 내용·대상 비교, line 6의 같은 대상 비교를 보여 주므로 코드 순서와 맞는다.

### 새 Learn에서 발견한 점과 전달 상태

| ID | 분류 | 페이지 | 발견·제안 | 상태 |
|---|---|---|---|---|
| N01 | 첫 도구 정의 | `NavigatingShellHistory` | print가 첫 사용인데 무엇을 하는 함수인지 한 문장이 없었다. | root가 “화면에 보여 주는 함수” 설명 추가를 알렸다. 최종 빌드와 연결은 root 검증 범위다. |
| N02 | 선행 정의 | `BasicForLoopExercises` | range(2)가 등장하지만 0과 1을 차례로 주어 두 번 반복한다는 설명이 없었다. | root가 정의 추가를 알렸다. |
| N03 | 선행 자료 구조 | `Indentation` | 리스트 단원 전에 `['map', 'hat']`를 사용한다. 준비물 둘을 묶어 적은 리스트라는 짧은 설명이 필요하다. | root가 보완을 알렸다. |
| N04 | 정의 상충 | `AddingStrings` | “값을 계산하지 않고” 글자를 잇는다고 하면 뒤의 표현식 평가 정의와 충돌한다. “숫자를 더하는 대신 글자를 이어요”가 정확하다. | root가 교정을 알렸다. |
| N05 | 첫 도구 정의 | `BuildingNewLists`, `IntroducingIfStatements` | append의 끝에 넣는 동작과 True/False의 참/거짓 대응을 처음 쓰는 지점에서 알려야 한다. | root가 정의 추가를 알렸다. |
| N06 | 읽기 표기 | `HowToFindInformationWithGoogleAndMore` | 질문의 `insert(1, eraser 문자열)`는 코드인지 설명인지 애매하다. 실제 코드 `insert(1, 'eraser')`로 표시하는 편이 분명하다. | root에 전달. |
| N07 | 실행 순서 | `EqualsVsIs` | c=a는 line 3인데 line 6에서 새 이름을 붙이는 것처럼 설명했었다. | 수정 후 재독 확인. 현재 3→5→6 순서로 정합적이다. |
| N08 | 실행 상태 | `m1-day5` frame 0 | line 6의 print를 강조하면서 노드에 “a 추가”라고 했는데 seen.add는 line 7이다. 이 frame을 line 7까지 진행한 상태로 맞추면 다음 frame의 중복 검사가 자연스럽다. | root에 즉시 전달. 마지막 생성본의 적용 여부는 이 절 작성 시 아직 재확인하지 않았다. |
| N09 | 반복 내 처리 순서 | `m1-day8` frame 0–1 | 세 줄을 먼저 모두 분리하고 그 뒤 모두 정규화하는 것처럼 말하지만 코드는 한 줄마다 split 직후 append한다. | 첫 frame은 첫 기록의 분리·정규화(line 6, 한 기록), 다음 frame은 나머지 기록까지 같은 처리를 마친 상태(line 6, 세 기록), 마지막은 필터·출력(line 8)으로 바꾸도록 root에 전달. |
| N10 | 설명의 밀도 | `BasicTerminology` | 필수 정의는 복원됐으나 한 단락에 리터럴·평가·문장·복합문 등 여러 용어가 몰려 있다. | 코드의 각 부분에 붙이는 라벨과 짧은 후속 카드로 나누는 개선 의견. 명백한 코드/정답 오류는 아니다. |
| N11 | 추가 메서드 | `m1-day2`, `m1-day3`, `m1-day5` | Learn에는 split이 있지만 실습의 strip/splitlines, get, set/add가 모두 정의된 것은 아니다. 특히 Day 5에서 쓰는 set/add는 Day 7에 와서야 set의 뜻이 설명된다. | 이번 검증 문서의 잔여 의견으로 남긴다. 모르는 도구의 이름·입력·결과를 한 줄씩 보여 주면 좋아진다. |
| N12 | Learn→Exercise 연결 | `m1-day1`, `m1-day2`, `m1-day3`, `m1-day6` | Learn의 fail은 소문자지만 실제 실습은 FAIL 대문자다. Day 2 Learn은 \|와 time/user/status를 쓰지만 실습은 쉼표의 user/status다. Day 3 Learn은 표기 대응표지만 실습은 키 이름과 대문자 정규화다. Day 6 Learn은 count 함수를 호출하지만 실습은 허용 도구 이름을 반환한다. | 독립 예라는 사실을 분명히 하고 “실습에서는 어떤 키·대소문자·반환값을 약속했는지 다시 읽어요”라는 짧은 연결을 권장한다. 각 예 자체가 틀렸다는 의미는 아니다. |

### 69개 재독의 한계와 판단

이번 재독에서는 코드의 명백한 결과와 퀴즈 정답이 서로 뒤집힌 추가 오류를 발견하지 않았다. 다만 frame은 여러 실행을 묶어 설명하는 교육 장면이므로 실제 Python 추적기의 매 순간 스냅샷과 같다고 가정하면 안 된다. N08·N09처럼 설명이 실행 순서를 잘못 암시하는 경우를 root에 전달했다. root가 진행할 코드 실행 검사와 실제 렌더링 검사는 별도로 필요하다.

이는 “Python을 모르는 실제 중학생이 69개를 모두 이해했다”는 증거가 아니다. 기존 지식을 가진 검토자가 모르는 도구의 등장 순서, 한 화면 안의 정의, 코드와 그림의 연결을 확인한 기록이다. 다음 개선은 쉬운 비유를 더 많이 넣기보다 이미 제시한 비유·코드·중간 값·실제 실습의 약속을 일치시키는 데 집중하는 것이 좋다.

## 적용 후 확인 기록

위 표는 발견 당시의 기록이며, 아래는 이번 변경에 실제로 반영한 범위다.

- 69개 Lesson에 각각 독립된 Learn 코드·질문·3개 장면을 연결했다. 모든 예제의 실제 Python 출력과 문서의 `expected_output`을 대조하는 검사를 추가했다.
- History 읽기를 몫·나머지·제곱으로 바꾸고 `%`, `**`를 사용하는 두 Exercise를 추가했다. 기존 URL과 이전 통과 기록은 유지한다.
- 30개 단계의 오역·경계값·잘못된 코드 지시를 교정했다. 목록 문제 6개의 사라진 선택지를 복원하고, 이전 코드를 고치는 문제는 학습자 자신의 앞선 초안을 이어받도록 했다.
- Module 1의 모범 해답 8개에서 처음 배우는 학습자가 추적하기 어려운 축약식을 기본 반복문으로 풀었다. 과제의 입력·정답·채점 조건은 바꾸지 않았다.
- N01–N09: 첫 print/range/리스트/append/불리언 정의, 실제 insert 코드 표기, 동일성·Day 5·Day 8의 장면 순서를 보완했다. Day 8 Learn의 리스트 축약식도 기본 반복문으로 바꿨다.
- N11–N12: splitlines/strip/get/upper/set/add를 등장 지점에 설명하고, 작은 Learn 예와 실제 Exercise의 대소문자·구분자·반환값이 다를 수 있음을 연결 문장으로 알렸다.
- 69개 Review에 핵심 개념, 쓰기 전의 어려움, 익숙해진 사고 방법과 새로운 의문을 넣었다. Review는 코드 편집기 없이 읽고 질문을 쓰는 화면이며, 실제 개념과 질문이 포함된 AI 프롬프트를 복사한다.

N10의 용어 밀도와 B01–B46의 모든 제안이 완전히 해결됐다는 뜻은 아니다. 실제 초보자의 장기 학습·이해도는 이번 자동 검사로 측정하지 않았다. 정적 읽기, 코드 출력 검사, 브라우저 상호작용, 운영 확인을 구분해 기록한다. 최종 CI 결과와 운영 화면 증거는 Futurecoder Wiki에 별도로 남긴다.

- B08의 두 보너스 문제는 실제 순차 잠금 정책에 맞춰 필수 확장 Exercise로 안내했다. 건너뛰어도 된다는 잘못된 약속을 제거했다.
- 전체 브라우저 검사에서 모범 코드가 길어지자 관리자 정답 영역의 키보드 스크롤 접근 문제가 드러났다. 정답 영역과 코드에 키보드 초점을 제공했다. 데스크톱 Learn의 불필요한 2px 스크롤은 출처 영역 위 간격을 줄여 바로잡았다. 두 검사 모두 실패를 무시하지 않고 수정 후 다시 실행한다.
