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
