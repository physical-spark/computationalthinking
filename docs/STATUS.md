# Implementation and verification ledger

Upstream: alexmojaki/futurecoder def491c2a348371f56249d05c64e0cf70f33ac2b (MIT).

- Korean content: all 1,689 source terms, 12 chapters / 61 pages / 257 original tasks. Eight additional simulated projects, 69 pages / 265 graded tasks total. Protected code, output choices, inline code and templates validated with zero missing entries. Translation is local-model draft plus 112 reviewed corrections, not a claim that every sentence has received human editorial review.
- Original grading: 285 stored scenarios pass natively in English and Korean, and in browser Pyodide with Korean content.
- Module 1: all eight reference solutions pass in browser; deliberately wrong solutions fail in unit tests.
- Backend: 11 tests pass locally on SQLite; PostgreSQL verification runs in CI. Ownership, private questions, CSRF, revisions, idempotency, classroom codes and anonymous-to-account merge covered.
- Browser: input, stop, Snoop, local Python Tutor-style trace, Birdseye, drafts/refresh, private administrator replies and 320/390/768px reading without runtime downloads verified. Populated mobile/desktop axe checks pass. See UI-REVIEW.md for scope and unverified checks.
- Production deployment, DNS, encrypted backup restore and disposable 30-learner load check: pending deployment verification.
- Real Google OAuth and owner administrator grant: pending owner OAuth client configuration. Anonymous learning remains available without it.

Do not describe this as the fully accepted public release until production, Google connection, backup restoration and the remaining acceptance checks are verified.
