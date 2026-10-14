# 운영

앱: https://computationalthinking.futurereadycampus.com
실행기: https://computationalthinking-runner.futurereadycampus.com
Google 콜백: https://computationalthinking.futurereadycampus.com/auth/google/callback
개인정보 안내: https://computationalthinking.futurereadycampus.com/privacy

## Google 연결 준비

Google Cloud에서 웹 애플리케이션 OAuth 클라이언트를 만들고 위 콜백 URI를 정확히 등록합니다. 대상은 특정 Workspace에 제한하지 않는 외부 사용자이며, 공개 운영 시 테스트 사용자만 허용하는 상태를 해제해야 합니다. 사용 범위는 openid와 email입니다. 이메일은 프로필 DB에 저장하지 않습니다.

클라이언트 ID와 비밀값은 prod의 `computationalthinking/ct-secrets`에만 넣습니다. 채팅, Git, 빌드 산출물에 비밀값을 기록하지 않습니다. 설정 후 앱만 재시작하고 실제 Google 연결과 기존 익명 기록 이전을 확인합니다. 준비 전에는 익명 학습이 동작하며 Google 연결 버튼 대신 준비 상태를 표시합니다.

## 배포

main의 GitHub Actions가 PostgreSQL 기반 권한·보존 테스트, 콘텐츠 검사, 브라우저 검증을 수행하고 ARM64 이미지를 만듭니다. commit SHA 태그와 image digest를 기록한 뒤 전용 SSH 키로 이미지 archive를 전송합니다. 이 키의 forced command는 해당 저장소의 배포 스크립트만 실행합니다.

prod 위치: `/home/ubuntu/workspace/org_physical-spark/computationalthinking`
namespace: `computationalthinking`
앱 서비스: `10.43.200.54:80`
실행기 서비스: `10.43.200.55:80`

앱 배포는 DB 백업 후 가산적 마이그레이션을 적용합니다. 실패하면 이전 앱 이미지로 돌아가며 DB의 기록을 삭제하는 역마이그레이션은 수행하지 않습니다.

## 백업과 복원

매일 별도 systemd timer로 PostgreSQL dump를 만들고 7일간 보관합니다. 암호화된 서버 밖 사본을 함께 보관합니다. 실제 백업 경로와 복원 시험 결과는 STATUS에 기록합니다.

복원 시험은 운영 DB를 덮어쓰지 않고 별도 DB에 수행합니다. 운영 데이터가 생긴 후에는 초기화 스크립트나 개발용 테스트를 운영 DB에 실행하지 않습니다.

## 확인

`/healthz`는 앱의 DB 연결을 확인합니다. 실행기의 `/healthz`는 정적 파일 서비스 상태입니다. 학습자 코드, OAuth 토큰, 세션 쿠키와 질문 본문을 접근 로그에 기록하지 않습니다.

관리자 첫 지정은 Google 연결 후 학습자 ID를 확인하여 `backend.cli grant-admin`으로 수행합니다. 첫 가입자 자동 승격이나 공개 관리자 등록 API는 없습니다.

## 학습 자료 판본

브라우저에서 보류한 과거 판본의 실행·복습 기록도 원래 판본과 함께 저장합니다. 단순한 설명 수정 때문에 기록이 유실되거나 전송 대기열이 막히지 않도록 합니다. 같은 문제 ID는 같은 학습 목표를 뜻하며, 학습 목표와 통과 조건 자체를 바꾸는 새 과제에는 새 ID를 사용합니다. 통과는 학생 브라우저가 보고한 학습 기록이며 서버 검증 성적이 아닙니다.
