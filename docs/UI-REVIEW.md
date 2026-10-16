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
