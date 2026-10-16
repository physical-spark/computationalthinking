# 운영

앱: https://computationalthinking.futurereadycampus.com
실행기: https://computationalthinking-runner.futurereadycampus.com
Google 콜백: https://computationalthinking.futurereadycampus.com/auth/google/callback
개인정보 안내: https://computationalthinking.futurereadycampus.com/privacy

## Google 연결 준비

Google Cloud에서 웹 애플리케이션 OAuth 클라이언트를 만들고 위 콜백 URI를 정확히 등록합니다. 대상은 특정 Workspace에 제한하지 않는 외부 사용자이며, 공개 운영 시 테스트 사용자만 허용하는 상태를 해제해야 합니다. 사용 범위는 openid와 email입니다. 이메일은 프로필 DB에 저장하지 않습니다.

클라이언트 ID와 비밀값은 prod의 `computationalthinking/ct-secrets`에만 넣습니다. 채팅, Git, 빌드 산출물에 비밀값을 기록하지 않습니다. 설정 후 앱만 재시작하고 실제 Google 연결과 기존 익명 기록 이전을 확인합니다. Google 로그인이 학습의 필수 조건입니다. 기존 익명 기록은 로그인 시 연결하며 새 익명 학습은 받지 않습니다.

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

브라우저에서 보류한 과거 판본의 실행·복습 기록도 원래 판본과 함께 저장합니다. 단순한 설명 수정 때문에 기록이 유실되거나 전송 대기열이 막히지 않도록 합니다. 같은 문제 ID는 같은 학습 목표를 뜻하며, 학습 목표와 통과 조건 자체를 바꾸는 새 과제에는 새 ID를 사용합니다. 실행과 검사는 서버의 격리 컨테이너에서 수행합니다. 통과 기록은 자율학습 지원용이며 공식 성적 또는 부정행위 방지 판정이 아닙니다.

## 현재 운영 설정

Google 프로젝트는 `frc-computational-thinking`입니다. 웹 클라이언트는 해당 프로젝트의 Google Auth Platform에 있으며 Audience는 External / In production입니다. 애플리케이션 홈페이지와 개인정보 안내 URL을 등록했습니다. 실제 소유자의 첫 연결과 관리자 지정 결과는 STATUS에서 확인합니다.

OAuth JSON을 내려받으면 공개 저장소 밖에 보관한 뒤 서버에서 다음을 실행합니다. 이 도구는 정확한 콜백 등록을 검사하고 비밀값을 출력하지 않습니다.

```sh
python3 scripts/configure_google.py /home/ubuntu/.config/ct-google-client.json
```

공개 origin은 Cloudflare Tunnel을 통한 ClusterIP만 제공합니다. 이 구성에서만 `TRUST_CLOUDFLARE_IP=true`로 Cloudflare가 덮어쓰는 `CF-Connecting-IP`를 요청 제한에 사용합니다. 직접 인터넷에 origin을 노출할 때는 이 옵션을 끄거나 신뢰할 프록시 경계를 다시 구성해야 합니다.

최근 성공 배포 이미지 두 개는 `/home/ubuntu/ct-images`에 압축 보관합니다. 노드의 이미지 정리로 이전 이미지가 사라져도 롤백 전에 이 사본을 다시 가져옵니다. 학생 DB는 되돌리지 않습니다.

서버 백업 timer는 매일 19:50 UTC에 동작합니다. 운영자 Mac의 LaunchAgent `com.physical-spark.computationalthinking-backup`은 매일 05:05 KST 및 로그인 시 암호화 사본을 동기화합니다. Mac이 켜져 있고 해당 사용자 세션과 SSH 연결이 가능해야 합니다. 서버와 Mac 사본은 7일간 보존합니다. Mac의 사본과 복원 키는 `~/Library/Application Support/ComputationalThinking/`의 권한 제한된 폴더에 보관하며 Git에 넣지 않습니다.

## 서버 Python 실행과 그룹 운영 — 2026-10-16

- `ct-execution.service`는 전용 Docker 브로커를 관리합니다. `10.42.0.1:8766`에만 바인드하고 Cloudflare 호스트를 추가하지 않습니다. 앱 Pod가 전용 Bearer 토큰으로 연결합니다.
- 학생 Python은 gVisor `runsc` 컨테이너에서 실행합니다. 네트워크·호스트 마운트·Docker 소켓·DB·OAuth 비밀값이 없습니다. 읽기 전용 루트, 비특권 사용자, 32MiB 임시 파일, 512MiB 메모리, 0.5 CPU와 PID 64 제한을 적용합니다.
- 동시 실행은 4개, 세션은 최대 32개(회원당 2개), 실행 시간은 30초입니다. 입력 대기는 최대 120초이며 실행 시간을 소모하지 않습니다. 실행 대기 60초, 연결 유휴 10분, 출력 2MB 제한이 있습니다. 중지·재연결 시 셸 변수는 초기화되고 작성 코드는 유지됩니다.
- 모든 학생 컨테이너의 합계 한도는 `/ct-execution` cgroup의 CPU 2개·메모리 6GiB입니다. 브로커 자체는 0.5 CPU·512MiB·PID 512입니다. 브로커의 Docker 연결 프로세스도 이 한도에 포함되며 학생 컨테이너의 PID 64 제한과는 별개입니다. 사용 전 환경 4개를 미리 준비하며 사용한 환경을 다른 회원에게 재사용하지 않습니다.
- 배포 이미지는 앱과 Python 코어 두 개입니다. 배포 전에 DB를 백업하고 브로커와 앱을 교체하며 실패하면 이전 두 이미지로 복구합니다. Docker 전체 재시작은 하지 않습니다.
- 브로커 비밀값은 `/home/ubuntu/.config/ct-execution.env`와 k3s `ct-secrets`의 `CT_BROKER_TOKEN`입니다. API 쪽 `CT_BROKER_URL=ws://10.42.0.1:8766`이며 학생 컨테이너에는 전달하지 않습니다.
- `CT_ADMIN_EMAILS`의 승인된 소유자는 Google 콜백의 `email_verified=true`와 이메일을 확인한 뒤 `sub`에 고정합니다. 동일 이메일의 다른 Google `sub`에는 다시 부여하지 않습니다. 기존 명시적 관리자 지정은 유지합니다. 새 회원에게 자동 관리자 역할을 주지 않습니다.
- 그룹 미배정은 로비입니다. 관리자 그룹 이동은 이전 그룹·새 그룹·처리 관리자와 시간을 별도 이력으로 기록합니다. 기존 그룹 코드는 참여 수단으로 허용하지 않습니다.
