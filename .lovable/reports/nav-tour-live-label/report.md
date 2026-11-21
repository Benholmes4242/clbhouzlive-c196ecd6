# Bottom navigation Tour live label — preview correction verified

## Implemented
Only the Tour tab's existing label span and button accessible name follow the existing `useAnyTourLive()` result:
- False: visible `Tour`, accessible name `Tour`.
- True: visible `Live`, accessible name `Tour, live now`.

Plain constants match `navigationTabs.ts`, which does not translate nav labels today. The same label span, labelColor, trophy, live colours, tab geometry, position, routes and fail-closed hook remain unchanged. Every other tab is unchanged. No SQL, migrations, feed_config or round_pool_cap changes.

## Sequential test run
Each shard ran as its own command, in order. Full stdout/stderr, including existing warnings, is retained alongside this report.

| Command | Files passed / executed | Tests passed / executed | Full output |
|---|---:|---:|---|
| `bunx vitest run --shard=1/4` | 211 / 211 | 2,311 / 2,311 | shard-1.log |
| `bunx vitest run --shard=2/4` | 211 / 211 | 2,292 / 2,292 | shard-2.log |
| `bunx vitest run --shard=3/4` | 211 / 211 | 2,349 / 2,349 | shard-3.log |
| `bunx vitest run --shard=4/4` | 209 / 209 | 2,450 / 2,450 | shard-4.log |
| **Total** | **842 / 842** | **9,402 / 9,402** | |

Before: **9,399 tests across 841 files**, the preceding View post rerun baseline. After: **9,402 tests across 842 files**. Entire delta is **+3** in added `src/test/navTourLiveLabel.test.tsx`:
1. `(a) not live shows Tour with the Tour accessible name`
2. `(b) live shows Live with Tour, live now and the existing live colour`
3. `(c) other tab labels are unchanged in both live states`

No existing test was deleted, renamed, rewritten or edited; no existing assertion changed. `roundsGateNav` (6), `navSq1` (3), and `postReviewTab` (2) all passed unchanged. New live-colour case checks the existing inactive alpha and active LIVE_INK token.

## Resolved type-error stop
The original finished edit reported the following errors in the new test selectors, not failed Vitest assertions; this output is preserved for history.

```text
src/test/navTourLiveLabel.test.tsx(25,63): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
src/test/navTourLiveLabel.test.tsx(34,73): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
src/test/navTourLiveLabel.test.tsx(55,65): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
src/test/navTourLiveLabel.test.tsx(57,73): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```

Original build output is preserved as `build-errors.log`. The next instruction expressly required clearing preview errors without asking. Removed only `exact: true` from the four `getByRole` options; string accessible names are already exact by default. No test name, assertion, mock, application code or test count changed in this correction.

Changed selector expressions (old → new):
- Case (a): `{ name: 'Tour', exact: true }` → `{ name: 'Tour' }`.
- Case (b): `{ name: 'Tour, live now', exact: true }` → `{ name: 'Tour, live now' }`.
- Case (c): `{ name: label, exact: true }` → `{ name: label }`, and `{ name: 'Post or review', exact: true }` → `{ name: 'Post or review' }`.

All assertions remain byte-identical, including `expect(button).toHaveAttribute('aria-label', 'Tour')`, `expect(button).toHaveAttribute('aria-label', 'Tour, live now')`, the existing token-colour equality checks, and the other-tab presence checks. No tests deleted, renamed or rewritten.

Correction check: `bunx vitest run src/test/navTourLiveLabel.test.tsx src/test/roundsGateNav.test.tsx src/test/navSq1.test.tsx src/test/postReviewTab.test.tsx` passed **14/14 across four files**, full output `correction-focused.log`. Preview reports **build OK at 2026-11-21T09:35:58Z**. Correction inventory before/after stays **9,402 across 842 files**, delta zero. The four-shard results above are the preceding full run, not a second full run after the selector correction.

## Completed screenshots — isolated actual navigation
Mounted the actual `GlobalBottomNavigation` in Chromium with `useAnyTourLive` mocked false/true and the other navigation dependencies isolated. No app-only testing affordance was added. Home remains selected, checking the unchanged inactive Tour/live colour. These are mocked-state presentation captures, not evidence of a live server event.

| State | 390px | 320px |
|---|---|---|
| Not live | [Tour 390](tour-390.png) | [Tour 320](tour-320.png) |
| Live | [Live 390](live-390.png) | [Live 320](live-320.png) |

Inspected all four screenshots: trophy and label centred, unchanged tab/pill widths between states, no overflow. The label retains 9px / 700 / 0.13em / uppercase. Exact icon/label centres agree at both widths; live label is the existing `rgba(52, 215, 127, 0.62)`. All navigation slot positions and widths are identical when toggling state. Browser page errors: zero. Measurements and reproducible capture setup are saved in `results.json`, `check_nav.py`, and `capture.log`.

No guest minted, no SQL or authenticated server flow needed for the expressly requested mocked-state checks.

## Files changed
- `src/components/GlobalBottomNavigation.tsx`: only Tour live label/accessible name and local ownership comment.
- `src/test/navTourLiveLabel.test.tsx`: three new requested cases; existing tests untouched.
- `roadmap.md`: request status and stop.
- `.lovable/reports/nav-tour-live-label/`: report, four full shard logs, preserved build errors, correction test log, four screenshots and capture evidence.