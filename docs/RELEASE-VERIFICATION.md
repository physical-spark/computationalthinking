# Release verification — 2026-10-15

## Reproducible checks

Final deployed application: `5ef7f51` ([successful final run](https://github.com/physical-spark/computationalthinking/actions/runs/38661404324)), image `sha256:369603725b5c30e475ab60eef321b36ae17dd17c9dd2083a7148643c72852f69`. App, runner and PostgreSQL are ready in the independent production namespace. The final run repeated the same complete checks listed below.

The [application verification/deploy run](https://github.com/physical-spark/computationalthinking/actions/runs/38660819092) completed successfully for `5a411c3`. It ran content/runtime validation, 12 backend tests with PostgreSQL, Ruff, 11 Playwright tests and the ARM64 production build/deploy. Browser tests compile a test driver only for the test build; the Docker production build omits it.

- `scripts/prepare_runtime.sh`: validates the complete Korean catalog and protected source fragments, runs the original upstream suite, runs 285 Korean native grading fixtures, builds content and records third-party licenses.
- `uv run pytest -q`: ownership/administrator boundaries, CSRF, anonymous-account merge, draft revisions, idempotent delivery, private questions, classroom membership and proxy trust.
- `VITE_TEST_DRIVER=1 npx playwright test` from `web/`: all 285 Korean Pyodide grading fixtures; eight Module 1 reference solutions; input, stop and debugger paths; desktop/mobile rendering; private administrator reply; restoration; administrator navigation without learning mutations. Eleven browser tests pass.
- Populated 390px and 1440px axe checks report zero violations within the rules tested. 320/390/768px checks show no horizontal overflow and no editor or Python-runtime download on mobile. Actual browser 200% zoom and keyboard dialog focus were inspected. Full screen-reader narration was not tested.

## Public deployment and authentication

DNS/TLS, Tunnel forwarding, the origin application and the real authenticated browser were checked separately. The app and runner are separate HTTPS origins; the runner does not receive account cookies or a management API. Existing Course Studio Access remained protected while these two new hosts remained publicly accessible.

A public HTTPS browser completed the first Python task and recovered its code/pass state after refresh, saved a private question, received HTTP 403 from the administrator API as a student, and rendered the mobile reading view without runtime requests or page errors. One independent headless browser used an explicit resolver mapping for only the two app hosts to address a cached local DNS miss; TLS verification stayed enabled. The authenticated Aside session subsequently accessed the ordinary public URL without that mapping.

Google Auth Platform shows External / In production, with scopes `openid email` and the exact server callback `/auth/google/callback`. The owner completed the real Google callback. Anonymous code, passed task and private questions stayed attached to the same learner. A server CLI explicitly granted the owner administrator status. The real administrator browser displayed the owner and preserved progress; a private reply was saved and displayed. No first-user administrator promotion exists.

## Concurrency and recovery

Thirty concurrent synthetic learners produced 480 API requests in 7.248 seconds, with zero errors, p95 0.608 seconds and maximum 1.234 seconds. The check used a disposable PostgreSQL database and an internal server endpoint. It does not establish external-network latency or Python performance on student PCs. The check exposed a session-commit race; committing request transactions before response transmission fixed it, and the same check passed afterward.

An encrypted backup created after Google connection restored into a separate temporary database. Counts showed nine learners, one Google connection, one administrator, four questions, one reply and one schema version. Only aggregate counts were inspected; private bodies and credentials were not published. The temporary restore database was removed without changing the live database. Encrypted copies synchronized to the operator Mac.

A disposable Kubernetes deployment was healthy, failed to start a deliberately missing image, then returned to its prior healthy image with HTTP 200. Its temporary deployment/database were removed. This checks rollout rollback mechanics, not a forced live-pipeline failure or a destructive database downgrade.

The restricted deployment script imports and validates each uploaded image archive before retaining it. It keeps two healthy generations outside containerd garbage collection and imports the preceding archive before rollback. The current archive was successfully reimported without restarting live pods. An incomplete manually exported bootstrap archive was quarantined; subsequent deployment archives come from the CI upload that passed containerd import.

## Content and operational limits

All 1,689 source terms are present, but the Korean prose is a local-model draft with 112 reviewed corrections, not a fully human-edited translation. Python source identifiers, example strings and prediction choices preserve original grading behavior. The Python Tutor option is a local Python Tutor-style trace viewer; it is not a claim of hosting the external Python Tutor service.

Pass records are browser-reported self-study progress, not official assessment or tamper-proof grades. Module 1 uses deterministic mock APIs, events, clocks and LLM responses and requires no external API keys.

Server backups run daily with seven-day retention. The Mac offsite sync also retains seven days and requires the Mac to be awake, the user session available and SSH connected. See [operations](OPERATIONS.md) for recovery paths and credential setup. Secrets, account records, production screenshots and database dumps are excluded from this public repository.

## 2026-10-15 evening correction

[Final follow-up CI](https://github.com/physical-spark/computationalthinking/actions/runs/38741386190) passed for bfd780f: backend 12, browser 12, original Korean grading fixtures 285, ARM64 deploy. Image: `sha256:0c83c65c7b427e1d9d0c7e54554c1af784769705875b2a0e697625ca99c2e1d7`. The added browser test covers stalled initialization, early Enter feedback, recovery preserving code and stale readiness after mobile/desktop switching. The learning core now uses a content-addressed gzip archive supported by the pinned Pyodide API.

`node scripts/verify_public.cjs` uses a new anonymous browser, ordinary DNS and verified HTTPS. At 13:24:37 UTC, Enter produced 3, restart preserved code, refresh restored code/pass and a subsequent button execution again produced 3; page errors were empty. The run including initial restart took 11.762 seconds to readiness, a single observation rather than a network performance guarantee. Earlier desktop screenshots captured an empty output after refresh and must not be used alone as proof of a fresh execution. The [Wiki evidence gallery](https://course-studio.futurereadycampus.com/course-network/wiki/futurecoder/verification-20261015.html) preserves these older images with that limitation and adds actual output and controlled recovery screenshots.

## 2026-10-16 thinking journal and simplified execution

Deployment `38dcb91` passed [CI run 38823959398](https://github.com/physical-spark/computationalthinking/actions/runs/38823959398): original/native content checks, 13 PostgreSQL backend tests, Ruff, 15 browser tests including 285 Korean Pyodide fixtures, ARM64 image build, backup/migration and healthy app/runner rollout. Image: `sha256:56cc6453f465f464137375f477805b040e4ae074c79607d6f87b3804138b8fd2`. Content version: `2c5498811de12b8e`.

The new thinking tests verify actual clipboard readback (including default code exclusion and explicit inclusion), blank-answer focus, clipboard-denial manual selection, server restore after removing only the synthetic browser note, per-step local drafts and automatic required Snoop/Python Tutor-style/Birdseye execution. Reflection ownership, UUID idempotency and anonymous-account merge are checked by the backend suite. The port configuration now refuses to reuse an unrelated development server and permits isolated test ports/databases.

A fresh anonymous public HTTPS smoke used ordinary DNS and verified TLS. Enter produced 3, retry retained code, refresh restored code/pass, and button rerun again produced 3. The actual clipboard contained the coaching prefix, task and learner explanation; code/output were excluded by default and included only after opt-in. A server-saved note returned after its browser copy was removed. A separate 390px browser read the goal and journal without requesting the editor/runner/Python runtime. There were zero page errors. Screenshots, timestamp and hashes are in the [Wiki follow-up](https://course-studio.futurereadycampus.com/course-network/wiki/futurecoder/verification-20261016.html). These checks do not measure improved computational-thinking outcomes or establish full screen-reader conformance.

## Production verification of server execution — 2026-10-16

Deployed commit `3fa0a36fa0a24d7c2ba3934a52cdc1b3df7426b7`, app image `sha256:edde56c08426962eb952af98148f0a5ee8310101b6d6b2ad1114e6a438b992a0`, native Python image `sha256:0bdf50326870f3d3c25f04bc0074e87d0f419cdca6f4b627324c04411c454563`. [Final CI and deployment](https://github.com/physical-spark/computationalthinking/actions/runs/38867728679) succeeded: 16 PostgreSQL backend tests, 15 browser tests, 285 Korean native grading cases, complete 500,050-byte output, flood cutoff and infinite-loop timeout.

Production checks: 30 independent synthetic sessions executed 1+2 simultaneously; all passed. Execution p95 **1.222s**, max **1.243s**; cold environment preparation p95 **21.452s**. The client ran in the app Pod against the private broker, excluding public OAuth and Cloudflare. Shell state persisted within a connection and remained isolated across learners. External network, host files, Docker socket and broker secrets were unavailable inside student sandboxes. Broker peak memory was 283,729,920 bytes with zero PID/memory-limit hits. Production output-boundary regression also passed; the infinite loop stopped after 30.18s.

The first production load check exposed the broker PID 128 limit (301 limit hits), despite passing staging. Final broker limits are PID 512 and 512MiB; student PID/memory limits were unchanged. Partial unbuffered writes under output backpressure were fixed with complete-frame writes. These failures and their retests are retained in the Wiki. The first deployment's uv cache-prune cleanup failed on a broker-held lock after deployment; caching was disabled, and the final whole workflow is green.

Public HTTPS fresh desktop/mobile browsers see the Google-required screen; learning APIs return 401 and do not open an execution socket or download Python. The real owner Google account was logged out and back in through Google; its code, progress and administrator role were preserved. No unrequested administrator claim exists. The owner was moved into a validation group and back to the lobby, then that group was archived. No other learner was modified. The final public owner browser executed 1+2 using Enter and reran after refresh: output 3, pass shown, no page errors.

[Wiki screenshots, measurements and limitations](https://course-studio.futurereadycampus.com/course-network/wiki/futurecoder/verification-server-20261016.html). These are self-study checks, not a claim of tamper-proof formal grading or a guarantee that 30 long-running tasks finish together.
