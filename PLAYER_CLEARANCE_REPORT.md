# Player page measured clearance

## Result
`src/features/tourhub/player-v2/PlayerPage.tsx` now imports `CHROME_CLEARANCE` from `src/lib/chromeClearance.ts` and sets the populated `.player-v3` root's `paddingTop` to that token instead of `var(--island-clearance)`. The hero's existing 26px top padding and identity's existing 10px inset remain untouched. No extra safe-area expression was added. The module header records clearance ownership.

No guest rules, review wizard, news, round plots, RPCs, edge functions, SQL, migrations, feed_config, round_pool_cap or native/Median configuration changed.

## Exact authorised guard changes
Only `src/test/fixGridClearance.test.ts` changed; `playerRebuildPage.test.tsx` and every other test file are untouched.

- Line64 parameter list: four existing file paths → the same four paths plus `'src/features/tourhub/player-v2/PlayerPage.tsx'`. Adds one executed instance of “%s consumes measured clearance instead of the old reservation”. Its assertions require the token import, reject old clearance, and require `paddingTop: CHROME_CLEARANCE`.
- Line77 test name: “no bleeding page or shared shell consumes old clearance except the named PlayerPage” → “no bleeding page or shared shell consumes old clearance”. Same case, renamed because the exception is explicitly retired.
- Old lines81–84: deleted the two-line frozen-exception comment, `const exception = 'src/features/tourhub/player-v2/PlayerPage.tsx';`, and `expect(consumers).toContain(exception);`. New: no exception declaration or presence assertion; PlayerPage must no longer consume old clearance.
- Old line87 → new line83: `const violations = consumers.filter(file => file !== exception).flatMap(...)` → `const violations = consumers.flatMap(...)`. Every reachable bleeding-page consumer is now checked, including PlayerPage.
- Unchanged final assertion: `expect(violations, ...).toEqual([])`. Route mapping and unmapped-consumer checks remain unchanged.

No test cases were deleted or rewritten besides this explicitly authorised guard adjustment; one existing case renamed, one parameterized instance added. File inventory unchanged.

## Tests and reconciliation
Focused command:
`bunx vitest run src/test/fixGridClearance.test.ts src/test/playerRebuildPage.test.tsx --maxWorkers=2`

**23/23 tests, 2/2 files, exit0.** Guard8→9, player page14→14; focused22→23.

| Exact full-suite command | Passed / executed | Files |
|---|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,681 / 1,681 | 145 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,556 / 1,556 | 145 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,648 / 1,648 | 145 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,643 / 1,643 | 143 |
| **Total** | **6,528 / 6,528** | **578** |

All exit0; no failures or unhandled errors. Last reported TU1 baseline6,527/578 →6,528/578: exactly +1 player-path instance in `fixGridClearance.test.ts`, in shard4 (1642→1643). No pre-existing failure observed; no exemptions used. Historical cleared CM1/Picks failures are not current failures.

Full output retained in `docs/verification/player-clearance/{focused,shard-1,shard-2,shard-3,shard-4}.log`; no failing shard exists.

## Live browser verification
Real player directory rows opened real populated player pages without mocked data or guest-access changes:
- Mackenzie Hughes: `/tourhub/player/21ae5aee-d7b3-4410-a9e4-ba8d6df3e1d8`.
- Brandt Snedeker: `/tourhub/player/857f5f12-49f8-424a-8178-18a94dba2d58`.

Verified at390×844 and1280×1800. Rendered root inline `paddingTop` exactly reads `var(--chrome-clearance, calc(env(safe-area-inset-top, 0px) + var(--chrome-island-h, 46px) + 26px))`, the exported `CHROME_CLEARANCE` value, not old clearance; computed root padding72px. Hero top padding26px. Island and back button top10px/bottom56px. Headshot top98px, kicker108px, mobile name157.75px; all below the complete island row. Mobile Mackenzie name height63px confirms two lines. Brandt's real Vanderbilt stamp is visible. Both headshot images finished loading at naturalWidth800. Zero page errors.

Screenshots inspected: `/tmp/browser/player-clearance/{mackenzie-mobile,brandt-mobile,mackenzie-desktop,brandt-desktop}.png`; measurements retained in `geometry.json` alongside `check_players.py`. Both desktop names occupy one line; mobile names occupy two.

**Scope of browser proof:** the available real pages are signed-out and display Log in/Join free in the right island. Managed sign-in is unavailable (`external_unmanaged`), so the authenticated search/index island specifically is not browser-verified; no credentials requested or guest gate bypassed. The measured token is checked against the rendered full island row in the available state.

Automatic build telemetry: **2026-11-04T03:50:29Z — build OK**. No manual build/typecheck run.

## Files changed
- PlayerPage.tsx: token import/root padding/module ownership comment.
- fixGridClearance.test.ts: authorised exception removal and new player instance.
- roadmap.md and this report.
- Verification logs listed above. No other product files changed.