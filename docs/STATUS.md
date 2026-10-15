# Implementation and verification ledger — 2026-10-16

Public app: https://computationalthinking.futurereadycampus.com
Administrator: https://computationalthinking.futurereadycampus.com/admin
Public source: https://github.com/physical-spark/computationalthinking

Upstream: alexmojaki/futurecoder `def491c2a348371f56249d05c64e0cf70f33ac2b` (MIT). Korean content version: `2c5498811de12b8e`.

- Content: all 1,689 source terms, 12 chapters / 61 pages / 257 original tasks. Eight additional simulated projects bring the total to 69 pages / 265 graded tasks. Protected code, output choices, inline code and templates validated with zero missing entries. Translation combines a local-model draft and 112 reviewed corrections; every sentence has not received human editorial review.
- Grading: 285 original stored scenarios pass natively in English and Korean and in browser Pyodide with Korean content. All eight Module 1 reference solutions pass in the browser; deliberately wrong solutions fail the unit checks.
- Backend: 13 tests pass locally on SQLite and in CI on PostgreSQL. Ownership, private questions, CSRF, revisions, idempotency, classroom codes, anonymous-to-account merge and trusted proxy boundaries are covered.
- Browser: 15 tests pass, covering input, interruption, Snoop, local Python Tutor-style trace, Birdseye, drafts/refresh, private administrator replies, all original fixtures and all eight projects. Mobile 320/390/768px reading does not load the editor or Python runtime. Populated mobile/desktop axe checks pass. Actual 200% zoom and keyboard dialog behavior were inspected; see [UI review](UI-REVIEW.md) for scope.
- Public HTTPS: app and isolated runner return successfully through the existing Cloudflare Tunnel. Actual public browser execution, refresh restoration, private question save, student administrator denial and mobile reading passed. Existing Course Studio Access protection remains in place.
- Google: External / In production configured. The owner completed the real Google callback. The same anonymous learner retained its code, passed task and private questions after connection. Administrator role was assigned explicitly by server CLI; the authenticated administrator page and a private reply were verified in the real browser.
- Capacity: 30 concurrent synthetic learners, 480 API requests, zero errors, p95 0.608 seconds and maximum 1.234 seconds. This was an internal server/API check using a disposable PostgreSQL database; it does not measure Cloudflare latency or student-device Python execution speed.
- Recovery: encrypted production backup restored successfully into an isolated database, including records created after Google connection. A separate disposable deployment successfully returned to a healthy image after a deliberately missing image. This verifies Kubernetes rollback mechanics; it was not a forced failure of the live deployment pipeline. Two recent image archives are retained for recovery after node image garbage collection.
- Offsite: encrypted snapshots synchronize to the operator Mac, with seven-day retention. The daily Mac job requires that Mac, its user session and SSH connectivity to be available. This is not an always-on independent cloud backup.

Application deployment: `38dcb91`. [Verification and deployment run](https://github.com/physical-spark/computationalthinking/actions/runs/38823959398). Documentation-only updates may follow without replacing the deployed application image.

See [release evidence](RELEASE-VERIFICATION.md) and [operations](OPERATIONS.md). The public service is available; translation editing and full screen-reader narration remain follow-up quality work rather than verified claims.

## First-task loading correction — 2026-10-15 evening

The owner reported that 1+2 appeared unresponsive. The real browser showed prolonged preparation; entering code before readiness had no feedback. The previous suite waited for readiness and did not cover this path. The runtime now shows boot stages, reports a 120-second delay, offers an iframe-only restart preserving code, and resets readiness when returning from mobile reading to desktop. The learning-core transfer is gzip-compressed and content-addressed. A new deterministic stalled-load regression passes; full CI now passes 12 browser tests. A fresh anonymous public HTTPS browser verified Enter execution (3), restart preserving code, refresh restoration and rerun, with zero page errors. See the [Wiki screenshots and evidence](https://course-studio.futurereadycampus.com/course-network/wiki/futurecoder/verification-20261015.html).

## Simple execution and thinking journal — 2026-10-16

Removed the mode selector; task-required execution/debugging is automatic and optional tools are collapsed. Added authored goals for 69 pages, with activity-adjusted guidance across 265 graded and 61 reading steps. An optional, per-step thinking journal saves local drafts and server reflections, and copies a coaching prompt with task context and the learner’s explanation. Code/output are opt-in. Clipboard denial exposes a selected manual-copy preview. No external AI call is made. Existing reflection ownership and account-merge behavior is covered by a new backend test. Full CI passed 13 backend and 15 browser tests, plus 285 Korean browser grading fixtures. The public HTTPS smoke separately verified 1+2, restoration, real clipboard contents and mobile reading without a Python download. [Screenshots and detailed evidence](https://course-studio.futurereadycampus.com/course-network/wiki/futurecoder/verification-20261016.html).
