# 생활 속 이야기로 배우는 Python

익숙한 물건과 행동을 먼저 보여 준다. 사과를 모으고, 이름표를 옮기고, 비 오는 날 우산을 챙긴다. 학생이 버튼으로 그림을 바꿔 본 다음 Python의 이름과 코드를 연결한다. 초등학생도 읽을 수 있는 문장을 목표로 재구성했으며 실제 아동의 이해도를 측정한 결과는 아니다.

## 문장과 그림의 기준

- 한 문장에는 한 행동이나 판단을 담고 짧은 해요체를 쓴다. 추상적인 목표보다 누가 무엇을 하는지 먼저 말한다.
- 낯선 말에는 `String(문자열) · 글자 조각`처럼 익숙한 설명을 붙인다. 그림 뒤에 이름을 소개한다.
- 비유 뒤에는 실제 규칙을 밝힌다. 변수는 고정된 상자가 아니라 값에 붙인 이름표이며, 그림에서는 이름표의 화살표가 다른 값을 가리킨다.
- 예제 코드·선택지·정답·단계 ID를 유지한다. 그림과 코드가 다른 예이면 코드 카드 앞에서 알려 준다. f 문자열은 안내판의 빈자리에 값 넣기, 예약은 현재 10시/예약 12시로 설명과 그림을 맞춘다.
- 그림은 직접 누르는 세 단계로 구성한다. 결과와 설명이 함께 바뀌며 자동 재생은 없다. 키보드 버튼·SVG 제목과 설명·상태 알림을 제공한다. 모바일도 그림은 조작하지만 Python 편집기는 받지 않는다.
- 시작 화면은 사과 `1 + 2`로 연다. 셸이라는 용어를 먼저 가르치지 않는다. 평소 코드 창의 Enter는 새 줄이며 실행 버튼 또는 Ctrl/⌘+Enter로 실행한다. 이력 읽기 페이지의 ↑·↓ 조작은 복습 자료로 남긴다.
- 관리자 문구 편집에 페이지별 이야기·연결 문장·용어 설명을 포함한다. SVG 배치와 동작, 코드와 채점은 소스로 관리한다.

## 구성과 검토

`content/story-course.json`은 13개 장·69개 페이지의 제목과 생활 장면, `content/concepts.json`은 20개 개념, `content/thinking.json`은 69개 페이지의 생각할 거리를 관리한다. `content/resource-prose.json`은 영상·출처를 유지하며 읽기 안내 수정본을 보관한다. Futurecoder 설명·힌트·피드백의 한국어 수정은 `content/ko-overrides.json`에 보관한다.

문장 재구성·SVG 제작·문제 설명 수정을 서브 에이전트에 나눠 맡겼다. Claude CLI는 도구를 비활성화한 텍스트 작업으로 수정과 독립 비평에 사용했다. 결과의 코드·표식 보존과 원전 의미를 별도 검사했다. Antigravity 경로는 설치 파일이 없는 연결이며 Gemini CLI는 인증되지 않아 사용하지 못했다. 해당 도구가 작업에 참여했다고 표시하지 않는다. 비밀값과 학생 기록은 외부 검토에 전달하지 않는다.

독립 검토에서 변수 상자 비유, f 문자열을 인덱싱으로 그린 문제, 예약 시각 불일치를 수정했다. SVG의 결과를 실제 Python 채점이나 학습 효과 측정으로 표시하지 않는다.

## 참고 자료

- [Apple, Everyone Can Code Curriculum Guide](https://images.apple.com/uk/education/docs/everyone-can-code-curriculum-guide.pdf): 생활 속 활동에서 명령·함수·반복·변수로 연결하는 구성과 그림/코드 피드백을 참고했다. Apple 그림·캐릭터·문제를 복제하지 않고 설명과 SVG를 새로 작성했다.
- [Apple, Swift Playgrounds 3, WWDC 2019](https://developer.apple.com/videos/play/wwdc2019/405/): 필요한 내용을 드러내고 불필요한 복잡함을 줄이는 콘텐츠 제작 방향을 참고했다.
- [Elementary Students’ First Approach to Computational Thinking and Programming (2021)](https://files.eric.ed.gov/fulltext/EJ1288644.pdf): 6–7세의 첫 수업에서 경험과 말·그림·활동을 연결한 관찰을 참고했다. 이 웹서비스의 효과를 검증한 연구는 아니다.
- [Greifenstein et al., Common Problems and Effects of Feedback on Fun When Programming Ozobots in Primary School (2022)](https://arxiv.org/abs/2208.13456): 116명·7개 워크숍의 피드백 연구를 참고해 작은 힌트와 다시 시도할 행동을 제시했다. 로봇 수업의 관찰을 Python 웹 학습의 효과 보장으로 일반화하지 않는다.

기존 과제 순서·잠금·진도 ID와 채점 조건을 유지한다. 말투를 바꿨다는 이유로 학습 기록을 초기화하지 않는다.
