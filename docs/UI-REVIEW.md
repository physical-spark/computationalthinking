# Interface review — 2026-10-15

## Scope and coverage

React, native controls, CodeMirror 6 and project CSS. Learning screen, class administration, account/question dialogs, code execution states and 320/390/768/1440px layouts. This independent repository has no prior application design convention; the approved bright surface, teal actions and dark editor are the baseline. Applied better-interface with better-accessibility, better-layout, better-writing, better-typography, better-colors and better-ui.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | App.tsx dialogs/skip link/focus, Editor.tsx names and keyboard shortcuts; axe WCAG 2/2.1/2.2 AA on populated 390/1440px learning screens | Fixed labels/focus and contrast; automated checks pass |
| Layout | App.tsx split pane; Diagram.tsx vertical SVG; learning.spec.ts 320/390/768px reflow and no runtime downloads | Clear within inspected states |
| Writing | App/Admin save errors, anonymous notice, optional reflections, simulation notices and private question copy | Clear; full curriculum prose remains machine translation with reviewed corrections |
| Typography | style.css Korean system-font fallback, line spacing, wrapping; actual Chrome desktop rendering | Clear within inspected states |
| Colors | Semantic CSS tokens and rendered input/SVG/editor contrast; accessibility.spec.ts | Fixed low contrast in editor comments, input border and diagram labels |
| UI | Native controls, focus/hover/pressed/disabled states, SVG stage buttons, restrained transitions | Clear within inspected states |

## Findings resolved

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | Colors | web/src/Editor.tsx | Default dark-theme comments had insufficient contrast | Explicit high contrast syntax colors, comment #a9beb2 | Korean starter hints must remain readable |
| HIGH | Colors | web/src/style.css | Input borders and diagram labels fell below required contrast | Darker border/label values | Users must distinguish controls and SVG explanations |
| HIGH | Accessibility | web/src/App.tsx | Dialog names and navigation focus needed explicit targets | aria-labelledby, focusable main and heading focus | Keyboard and assistive technology users need a reliable reading position |
| HIGH | Layout | web/src/Diagram.tsx | A horizontal three-box diagram shrank on narrow screens | Vertical SVG below 520px and equivalent caption | Preserve legibility at 320px |

## Verification

- `VITE_TEST_DRIVER=1 npx playwright test`: real Pyodide grading, original 285 fixtures, input/stop/debuggers, all eight Module 1 solutions, draft refresh, private admin reply and mobile reading. Administrator test was refined to target its unique synthetic student/thread when repeated against an existing development database.
- `npx playwright test tests/accessibility.spec.ts`: zero axe violations in populated 390px and 1440px learning screens.
- Chrome: inspected Module 1 split layout, SVG, native controls and code text rendering at desktop width.
- Aside at actual 200% browser zoom: learning content, SVG stage controls and question dialog remained reachable. Tab moved to the SVG control; Escape closed the question dialog and returned focus to its button. Restored browser zoom to 100%.
- Public HTTPS browser smoke: grading, draft/pass restoration, private question save, student administrator denial and mobile reading passed.
- Real owner Google callback: completed. Anonymous code, task pass and private questions remained attached to the same learner; explicit administrator access and a private reply were verified.
- Administrator navigation does not initialize a learning step or autosave a draft. Browser regression checks assert that /admin sends neither a view mutation nor a draft mutation. Administrator question cards identify their author by nickname.
- Not verified: full screen-reader narration.

## Verdict

Approve for inspected domains and states; this is not a claim of complete WCAG conformance. Full screen-reader narration remains follow-up verification; automated checks do not establish complete WCAG conformance.

## First-task follow-up — 2026-10-15 evening

Scope: first Python load, keyboard submission while loading, delayed initialization, restart and desktop return from the reading layout. A HIGH writing/recovery issue was confirmed: preparation had no stage information or recovery action, and early Enter was silently ignored. App.tsx now reports preparation stages and the action to take; Runner.tsx bounds initialization waiting and restarts the iframe without discarding code. The new browser regression forces a stalled iframe, advances a virtual clock, checks the delay message, then reconnects real Pyodide and verifies Enter execution. A public HTTPS smoke also verifies this path and refresh/rerun. This is a scoped follow-up, not a new claim of full interface or screen-reader review.

## Computational thinking follow-up — 2026-10-16

Applied better-writing, better-layout and better-accessibility to the changed learning controls. The execution-mode selector is removed; required tools are selected from the task definition and optional trace tools use native collapsed details. Reflections are available before passing, with distinct browser draft and server-save guidance. Quiz and private-question forms remain optional collapsed sections.

Each task shows its page’s authored thinking goal and an activity-adjusted question. The journal uses explicit labels, a bounded answer field, inline blank-answer feedback and a stable status region. The clipboard button generates a coaching prefix, task context and the learner’s own answer; code/output are opt-in. Clipboard denial opens and selects the read-only prompt with a keyboard-copy instruction. It sends no AI API request.

Local verification: 11 changed/relevant browser checks passed (learning, thinking and populated axe), including actual clipboard readback, manual-copy focus/selection at 390px, server restoration after removing the synthetic local note, per-step drafts and automatic Snoop/Python Tutor-style/Birdseye execution. Backend reflection privacy/idempotency/merge checks passed with the existing suite. These are scoped interaction and automated accessibility checks, not full screen-reader narration or measured educational outcomes. Full deployment results are recorded separately in RELEASE-VERIFICATION.md.

## Jakub interface alignment follow-up — 2026-10-16

Scope: React/TypeScript learning header, editor toolbar, thinking journal and administrator controls. Existing CSS tokens and native controls retained. Applied installed Jakub Krehel better-interface plus accessibility, layout, writing, typography, colors and UI domain guidance. Parent AGENTS.md contains content/Discussion conventions; no app-specific AGENTS.md. No new Discussion.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Named navigation; keyboard order; axe at 320/390/768/1440px; journal save and admin group interaction | Passed scoped checks |
| Layout | Rendered narrow/desktop learning screens, toolbar bounding boxes, administrator filter bounding boxes | Fixed separated toolbar and inconsistent baselines |
| Writing | Group move confirmation and copy-option ordering | Fixed Korean particle ambiguity and decision order |
| Typography | Existing Korean fallback stack, small labels, long synthetic nickname | Removed disabled font synthesis; metadata minimum 12px |
| Colors | Existing semantic palette; populated axe checks; dark toolbar hover | Retained palette; explicit readable dark hover states |
| UI | Native buttons/fields, disabled execution, touch targets, reduced-motion rules | Unified 44px primary controls; removed frequent-action scaling |

Resolved findings:

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| MEDIUM | Layout | App.tsx coding-top | Python/save and Run/Stop split across two bars | One bar with identity leading and actions trailing | Related controls share a baseline and remain near code |
| MEDIUM | Layout | Admin.tsx learner-filters/group-assignment | Labels and variable-height fields inline with buttons | Labels above fields, 44px controls and aligned action rows | Scan filters and execute group moves without visual ambiguity |
| MEDIUM | UI | style.css header-actions | Plain admin link, stacked account, mismatched sizes | Consistent navigation controls with inline lobby badge | Stable rhythm across menu actions |
| MEDIUM | Layout | Thinking.tsx journal | Copy option followed copy action | Option and explanation precede save/copy row | Configure payload before acting; neutral secondary actions |
| LOW | Typography | style.css root/metadata | Synthetic weight disabled; some 10–11px captions | System fallback synthesis and at least 12px metadata | Korean fallback weight and supporting text remain readable |
| LOW | Colors | style.css hover | Generic light hover on dark Stop button | Explicit dark hover; hover only on supporting pointers | Preserve text contrast and avoid sticky touch hover |

Verification: `npm run build --prefix web` passed. `CT_WEB_PORT=5183 CT_RUNNER_PORT=5184 CT_API_PORT=8011 npx playwright test layout.spec.ts admin.spec.ts` (web cwd) passed all five checks. Four-size layout/axe checks and screenshots passed again after adding capture artifacts. Local execution broker is intentionally absent: local desktop capture shows the real connection-error recovery state, not successful Python execution. Production execution and full regression results are recorded after deployment. Full screen-reader narration and a fresh physical 200% browser zoom check are not verified in this follow-up.

Verdict: Approve for the inspected controls and states; no HIGH findings remain. This is not a full-site accessibility certification.

Production follow-up: commit `8a36acc`, Actions run `38870335151` completed successfully: 285 Korean native grading cases, 16 backend tests, 19 browser tests and execution-limit checks. App/runner deployed image `sha256:3e91edc2cd18c49c421f28a5e89c6207eedd9fb8869103be9873aa9cc5c85250`. Authenticated public Chrome verified Run on `1+2` produces `3`. All four admin filter controls measured height 44px and identical y=478.09375 in the observed viewport. At 390px document scroll width was 390 and CodeMirror count was zero. Saved desktop, admin-only filtered section and mobile screenshots; restored viewport. Evidence: https://course-studio.futurereadycampus.com/course-network/wiki/futurecoder/verification-ui-20261016.html .

## Curriculum and concept-first flow — 2026-10-16

Scope: signed-in entry, syllabus, sidebar, concept lesson and practice transitions; administrator membership semantics. React/TypeScript and existing semantic CSS tokens retained. Applied the installed Jakub better-* guidance to the complete entry-to-practice flow.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Named sidebar navigation, native prediction radios, heading/route focus, no disclosures, axe at four widths | Scoped checks pass |
| Layout | 69-unit syllabus, desktop sidebar, 320/390/768/1440px concept-to-practice flow and rendered captures | No horizontal overflow; sidebar alone can be collapsed |
| Writing | Administrator role vs group, concepts with analogies/examples/feedback/transfer, explicit optional prediction | Administrator is never described as lobby; read and pass remain distinct |
| Typography | Existing Korean font stack, responsive heading, reading measure, line spacing | Clear within inspected screens |
| Colors | Reused teal/neutral tokens, native radio/focus and axe contrast | Clear within inspected screens |
| UI | Syllabus cards, persistent desktop path, openly displayed practice sections | No content accordion; action priority follows concept then practice |

Resolved findings: MEDIUM layout — the practice-only entry gave no curriculum context; replaced with a syllabus linking all 61 Python units and eight applied projects. MEDIUM writing — a role was presented as a lobby group; backend excludes administrators from student/group statistics and rejects group assignment, and the account screen states that administrators have no group. MEDIUM comprehension — concepts and predictions were mixed with immediate execution; 20 authored concept foundations support 69 unit pages with unit-specific thinking goals, SVGs, worked examples and feedback before the explicit practice action. MEDIUM discoverability — requirements, hints, solutions, reflection, private questions, prompt preview and code-flow tools were hidden in disclosures; all are now sections. No HIGH findings remain in inspected states.

Validation: backend tests include rejecting admin assignment to a group or lobby, excluding admins from rosters, and migrating old admin memberships while keeping student membership and group-move history. Curriculum browser tests cover all 69 catalog mappings, no execution connection or code draft before practice, wrong/right prediction feedback, sidebar navigation, browser Back and draft preservation, four widths and axe. Existing direct step hashes still open practice; normal chapter progression enters the next concept. Concept reading uses the existing read marker and never sets code pass. Local Python broker is absent, so native execution remains a CI/public deployment verification step. Full screen-reader narration and fresh physical browser 200% zoom are not verified here.

Verdict: Approve for the inspected flow; not a claim of full-site WCAG conformance.

### Page-by-page refinement after Swift Playgrounds research

User clarified that concept learning must advance through short pages, with scrolling only inside an explanation when necessary. Replaced the long concept article with six pages: everyday situation, core rule, diagram, code reading, prediction, transfer/practice. Previous/Next remain outside the scrollable reading region. The URL stores the concept page, so refresh and browser Back preserve location. Narrow-screen sidebar temporarily occupies the learning area and selecting a unit returns to its content; it is the only collapsible navigation.

Primary sources inspected on 2026-10-16:
- Apple, *A Quick Start to Code*, January 2022, p.3: https://education-static.apple.com/geo/sg/teaching-code/quick-start-to-code.pdf . Downloaded and read the text and rendered p.3. It pairs introductions with small puzzles and explicitly describes sidebar/arrow page navigation.
- Apple, *Everyone Can Code Puzzles Solution Guide*, pp.1–19: https://education-static.apple.com/teaching-code/learn-to-code-solutions.pdf . It states that its order follows the apps, which can differ from the student/teacher guides. Learn to Code 1 progresses through Commands, Functions, For Loops, Conditional Code, Logical Operators, While Loops and Algorithms, and compares alternative solutions.
- Apple, *Everyone Can Code Curriculum Guide*: https://www.apple.com/education/docs/everyone-can-code-curriculum-guide.pdf . Search-indexed official text describes everyday connections, experimentation, application and reflection. Direct PDF extraction was unavailable; it is supporting context, not evidence for app screen layout.

Design inference: adopt short introductions, bounded practice and page navigation in our own Korean Python material. Apple's characters, puzzles and book artwork are not copied into this repository. The existing Python dependency order remains intact. Four responsive tests now traverse all six pages, check the navigation remains in the viewport with no body-level vertical scroll, refresh on page 5, verify feedback and transition to practice, and check axe. All four passed locally. This supersedes the previous long-scrolling concept layout.

Production follow-up: commit `c0e23f3`, Actions `38874716031` succeeded with 285 Korean grading cases, 18 backend tests, 23 browser tests and execution-limit checks. Deployed app image: `sha256:bb8f051035cab3fb753f502e845e59ca2ebf615fd79be449d97c58ef957871f8`. Authenticated public Chrome verified syllabus → six concept pages → practice; refreshing page 5 restored it; choosing 14 showed the explanation; Run on the retained `1+2` produced `3` and a fresh pass announcement. At 390×740, document scroll width/height were 390/740 and CodeMirror count was zero. Account dialog explicitly showed administrator without group. Six production screenshots are published with official-source references at https://course-studio.futurereadycampus.com/course-network/wiki/futurecoder/verification-curriculum-20261016.html . Viewport override was reset after verification. No student accounts were changed during the browser check.
