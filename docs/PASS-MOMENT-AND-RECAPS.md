# 코드가 결과가 되는 순간과 단원 회고

새 실행의 서버 저장이 확인되고 채점이 통과하면 2.5초 동안 제출 코드 → 실제 출력 → “내 코드가 해냈어요!”를 보여 준다. 실제 출력이 없는 과제는 출력값을 만들어 넣지 않는다. 긴 코드는 160자, 출력은 80자 이내의 시각적 발췌이며 원본 편집기·전체 출력은 그대로 유지된다. 이 효과는 실행 추적기나 코드 한 줄씩의 실행 순서를 표현하는 것이 아니다.

실행 중·실패·저장 미확인·읽기·학생 읽기 전용 보기·통과 기록 복원에는 재생하지 않는다. 출력 예상 과제는 예상 답의 서버 확인까지 기다린다. 관리자 미리보기에서도 작동하며 학생 통계를 쓰지 않는다. 새로운 정상 실행은 다시 재생할 수 있고 중복 run_id는 다시 재생하지 않는다. 새 실행·단계 변경·화면 이동·컴포넌트 해제 때 정리한다. 다음 버튼을 기다리게 하거나 초점을 옮기지 않고 pointer-events:none으로 코드 작성을 막지 않는다.

모션은 no-preference에서만 코드 단어 등장·연결·결과 도착·작은 별을 짧게 순차 표시한다. reduced-motion은 이동·회전·크기 변화 없이 불투명도만 변경한다. 장식은 aria-hidden이며 기존 통과 상태/안내가 실제 결과를 전달한다. 소리·자동 반복·추가 애니메이션 라이브러리는 없다. Jakub better-ui와 better-accessibility를 적용했다. 독립 동영상이 아닌 기존 React 학습 화면의 성공 상태로 구현한다.

한국어 Python 61개 단원과 Module 1 8개에 개별 작성한 CT 회고를 제공한다. `content/unit-recaps.json`의 실제 활동·두 가지 사고 방식·다른 상황에 적용하는 질문을 빌드가 HTML 문구로 변환한다. 전문 용어와 구체적인 활동을 함께 표시한다. Module 1에는 `.final_text` 읽기 ID 8개를 추가하며 기존 모든 과제 ID와 순서는 유지한다. 읽기는 잠금 조건에 포함하지 않는다. 정리에서는 실행기·코드 편집기·무관한 선택 퀴즈를 로드하지 않는다. 필수 제출 없이 기존 하단 이전/다음으로 이동한다.

단원 문구는 기존 관리자 prose editor에서 편집·초안·게시·복원할 수 있다. 원전 아카이브·한국어 번역은 보존하며 학생 진도·채점·런타임 판본을 바꾸지 않는다. 원전 final_text의 학습자 표시를 자체 작성 회고로 대체했으므로 출처도 자체 작성과 연구 참고로 구분한다. 이 콘텐츠 변경만으로 이미 받은 통과 기록을 초기화하지 않는다.

연구 참고:
- Shute, Sun & Asbell-Clarke (2017), *Demystifying computational thinking*. https://doi.org/10.1016/j.edurev.2017.09.003 ; 저자 공개 PDF https://myweb.fsu.edu/vshute/pdf/CT.pdf
- Brennan & Resnick (2012), *New frameworks for studying and assessing the development of computational thinking*. MIT 원문 https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/

연구의 사고 틀을 이 수업에 연결한 것은 작성자의 교육적 해석이다. 코드 통과를 CT 숙달의 측정으로 주장하지 않는다. 논문 본문을 복제하지 않고 짧은 한국어 안내와 원문 링크를 제공한다.
