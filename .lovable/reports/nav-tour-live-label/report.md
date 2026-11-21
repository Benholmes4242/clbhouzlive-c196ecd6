# Bottom navigation Tour live label — stopped verification

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

## STOP — surviving type error
The preview's current typecheck reports the following after the finished edits. These are errors in the newly added test selectors, not failed Vitest assertions.

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

Full current build output is saved as `build-errors.log`. Under the project finished-edit stop rule, no test repair or rerun was attempted. A ruling is needed for the four unsupported `exact` selector options. The app change is not reported as fully verified.

## Outstanding screenshots
390px and 320px in both mocked live states were **not captured** following the type-error stop. Centring, stable widths and no-overflow browser checks remain unverified. No guest was minted and no authenticated live-state flow was claimed.

## Files changed
- `src/components/GlobalBottomNavigation.tsx`: only Tour live label/accessible name and local ownership comment.
- `src/test/navTourLiveLabel.test.tsx`: three new requested cases; existing tests untouched.
- `roadmap.md`: request status and stop.
- `.lovable/reports/nav-tour-live-label/`: report, four full shard logs and preserved build errors.