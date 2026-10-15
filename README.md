# 컴퓨팅 사고력 · Computational Thinking

그림으로 이해하고, Python 코드로 확인하는 한국어 학습 서비스입니다.

- Futurecoder 기반 Python 기초 12개 장과 Module 1 자동화 모의실습 8개
- 가입 없이 학습·진도 저장·비공개 질문, 선택적인 Google 계정 연결
- 반 코드와 관리자 진도·질문 관리
- PC의 설명/코드 분할 화면과 모바일 읽기·복습 화면

공개 주소: https://computationalthinking.futurereadycampus.com

**구현 및 검증 상태는 [docs/STATUS.md](docs/STATUS.md)를 확인하세요. Google OAuth 자격증명은 저장소에 포함되어 있지 않습니다.**

## 실행

Python 3.12, uv, Node.js 22가 필요합니다.

```sh
uv sync --frozen
npm ci --prefix web
npm ci --prefix runner
./scripts/prepare_runtime.sh
npm run build --prefix runner
cp .env.example .env
```

`.env`에 개발용 DB 주소와 충분히 긴 임의의 세션 비밀값을 넣습니다. PostgreSQL은 운영 기본값입니다. 로컬 개발·테스트에서는 `DATABASE_URL=sqlite:///.cache/dev.db`도 사용할 수 있습니다.

```sh
mkdir -p .cache
set -a
. ./.env
set +a
uv run alembic upgrade head
uv run uvicorn backend.main:app --host 127.0.0.1 --port 8001
```

다른 터미널에서 화면과 실행기를 각각 시작합니다.

```sh
npm run dev --prefix web
```

```sh
cd runner
npx vite preview --host 127.0.0.1 --port 5174
```

http://localhost:5173 에서 학습합니다. 두 출처를 분리하며, 실행기에는 학습자 계정 쿠키와 관리 API가 없습니다. 모바일에서는 편집기와 실행기를 불러오지 않습니다.

## 검증

```sh
uv run pytest -q
uv run ruff check backend
VITE_TEST_DRIVER=1 npm run build --prefix web
VITE_TEST_DRIVER=1 npm run build --prefix runner
cd web
npx playwright install chromium
VITE_CONTENT_LANGUAGE=ko VITE_TEST_DRIVER=1 npx playwright test
```

브라우저 검증은 테스트용 API·화면·실행기를 직접 시작하며, 이미 사용 중인 포트의 서버를 재사용하지 않습니다. 다른 프로젝트를 중지하지 않고 검사하려면 아래처럼 포트와 DB를 분리합니다.

```sh
CT_WEB_PORT=5183 CT_RUNNER_PORT=5184 CT_API_PORT=8011 VITE_APP_ORIGIN=http://localhost:5183 VITE_TEST_DRIVER=1 npm run build --prefix runner
CT_WEB_PORT=5183 CT_RUNNER_PORT=5184 CT_API_PORT=8011 CT_BROWSER_DATABASE=sqlite:///.cache/thinking-e2e.db VITE_TEST_DRIVER=1 npm --prefix web test
```
 `VITE_TEST_DRIVER=1`은 회귀 검사 전용이며 운영 빌드에는 사용하지 않습니다.

전체 번역 검사는 `scripts/compile_korean.py`가 수행합니다. 원본 키·코드·치환 문자가 누락되면 빌드를 중지합니다. 번역 초안은 로컬 Qwen으로 작성하며, 검토한 수정은 `content/ko-overrides.json`에서 관리합니다. 모델은 서비스를 이용하는 학생의 코드를 처리하지 않습니다.

## 계정과 기록

Google 연결은 서버 OIDC 흐름입니다. 이메일·실명·프로필 사진을 학습자 프로필로 보관하지 않고 Google `sub`와 닉네임으로 식별합니다. 익명 세션은 해당 브라우저에서만 복구할 수 있습니다. 기존 Google 계정으로 연결할 때 통과 기록과 질문을 합치고, 서로 다른 코드 초안은 두 버전을 보존합니다.

질문과 답변은 본인과 관리자만 볼 수 있습니다. 코드 채점은 브라우저에서 이루어지므로 통과 기록은 자율학습 지원용이며 공식 평가나 부정행위 방지의 근거가 아닙니다.

Google에 연결한 소유자 계정에만 서버에서 관리자 역할을 부여합니다.

```sh
python -m backend.cli grant-admin <learner-id>
```

## 출처와 라이선스

Futurecoder의 고정 원본 판본은 `alexmojaki/futurecoder`의 `def491c2a348371f56249d05c64e0cf70f33ac2b`입니다. 실행 코어와 교재 원본을 `vendor/futurecoder/`에 보관하며 [원본 라이선스](vendor/futurecoder/LICENSE.txt)를 유지합니다. 한국어 번역, 새 화면, 계정·관리 API와 모의실습을 추가했습니다. 원본과 별개의 비공식 프로젝트입니다. 사용하지 않는 원본 GitHub CI 설정은 자격증명 재게시를 피하기 위해 제외했습니다.

이 저장소의 코드는 MIT입니다. 외부 패키지와 Pyodide/Python 런타임은 각 패키지의 라이선스가 적용됩니다. 기존 비공개 교안 원본, 학생 데이터, DB와 자격증명은 공개 저장소에 포함하지 않습니다.

## 공개 주소에서 첫 실행 확인

Python 준비 단계가 표시되는 동안 코드를 작성할 수 있습니다. 준비가 지연되면 `Python 다시 준비하기`로 코드 내용을 유지하면서 실행기만 다시 연결합니다. 준비 완료 후 Enter 또는 실행 버튼을 사용합니다.

`node scripts/verify_public.cjs`는 새 익명 브라우저로 운영 HTTPS의 첫 과제, 재시도, 새로고침 후 재실행을 확인하고 `.cache/public-verification/`에 화면과 결과를 남깁니다. 운영자 로그인 세션을 사용하지 않으며 별도의 익명 학습 기록이 생성됩니다.

## 사고 목표·생각 기록·AI 요청문

실행 방식은 문제에 맞춰 자동 선택됩니다. 기본 화면에는 실행·중지만 두고, 추가 분석 도구는 ‘코드 흐름 살펴보기’에서 엽니다. 원본 단계에서 요구하는 디버거는 실행 버튼으로 바로 연결됩니다.

`content/thinking.json`의 69개 페이지별 설명을 모든 문제·읽기 단계에 연결합니다. 입력과 출력, 상태 변화, 조건, 반복, 분해, 검증 등 해당 문제에서 연습할 관점과 질문을 보여 줍니다. 학습 효과를 측정한 결과를 뜻하지 않습니다.

‘내가 생각한 풀이’는 브라우저에 자동 보관되고, ‘내 생각 저장’을 누르면 본인 학습 기록에도 저장됩니다. ‘AI 피드백 요청문 복사’는 학습 코치 지시·문제 맥락·사고 목표·본인 답변을 클립보드에 넣습니다. 코드와 현재 출력은 선택했을 때만 포함하며, 서비스에서 외부 AI를 호출하지 않습니다. 클립보드 권한이 없으면 요청문 미리보기를 선택해 수동 복사를 안내합니다. 모바일에서도 생각 기록과 복사를 사용할 수 있습니다.
