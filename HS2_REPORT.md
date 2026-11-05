# HS2 — Handicap sync seat

## Result
Implemented the signed-off full and empty intro states. Circle readiness is `isFetched || isError`; errors suppress stale circle data and use empty state. Unsettled reads show only two headline bars and one CTA-shaped bar. The starting handicap still uses the existing profile reader/resolver, without blocking the circle screen. Three nearest followed golfers plus You use the existing strict-higher placement loop. Names wrap, the You slot is inert, and both existing actions remain wired.

## Verification
Baseline: **7,027 tests / 619 files**. After: **7,033 / 620**, all passed, zero failures and no flakes/pre-existing failures.

Command for each fresh shard: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed | Files |
|---|---:|---:|
| 1 | 1,824 | 155 |
| 2 | 1,673 | 155 |
| 3 | 1,774 | 155 |
| 4 | 1,762 | 155 |
| Total | **7,033** | **620** |

Shards 3–4 ran independently in parallel. Full logs: `docs/verification/hs2/shard1.log` through `shard4.log`.
Focused: `bunx vitest run src/test/hs2ConnectSeat.test.tsx src/test/connectIntroTryIt.test.tsx --maxWorkers=2`: **23/23** (12 + 11). Full output in `docs/verification/hs2/focused.log`.
Latest preview diagnostic: **build OK**, 2026-11-05T20:09:37Z. No manual build/typecheck command was run.

Phone checks mounted the actual intro and unchanged BackRow in an isolated member-fixture harness, with no session/guest creation. Full and empty at 390×844 and 320×844 had no horizontal overflow; 320 used a deliberately long unbroken member name and it wrapped. CTA bottom at 390: full 669.30px, empty 378.53px; both on the first screen. CTA and decline callbacks and end-place analytics passed in each state. Screenshots and measurements: `/tmp/browser/hs2/{390,320}-{full,empty}.png`, `results.json`. These are fixture geometry/action checks, **not hosted authenticated end-to-end verification**. Project auth is external/unmanaged, so live member reads and country-stage readback remain unverified. Initial harness failures were apparatus issues (duplicate QueryClient loading), resolved without product edits.

## Removed / kept
Removed from intro: FirstScreen, LegacyFallback, LastTwentySection, TrustSection, IntroFooter, old EndBlock, fitted-headline ResizeObserver, footer IntersectionObserver/refs/visibility state/hysteresis, verdict/field bars, illustrated 20 bars, numbered steps, home-club picker/CHANGE link and invalidations, home-club status/course/stats dependencies, unused local presentation constants, displayCourseName/suffixes and signedOne.
Removed unused course reader, analyse function, fallback IDs and ConnectIntroCourse type from `useConnectIntroCourse.ts`; retained the module and **unchanged stripClubSuffix** for WelcomeAboardScreen.
Kept **primaryCtaStyle and declineButtonStyle verbatim**, **DeclineButton/IntroText**, **chooseCirclePeople** (default four, optional count), startingHandicap, formatIndex, existing own-profile and circle queries/RPC contract, Stage, all shared stats/home-club hooks, Primitives/designTokens, RoundsGate and ConnectGlance. No later-stage, guest gate, SQL/migration, deployed RPC/edge, feed_config or native/Median changes; cap remains 30.

## Frozen mock differences
The mock draws CTA height/radius/color as 58px/18px/#F4F5F7; preserved export is 56px/16px/#F3F5F7. Decline typography/color and existing back chrome/clearance are also preserved rather than adopting the mock's fake 56px status strip and back margins. Accordingly this is not a pixel-identical replacement of frozen chrome. Changed content uses signed-off gutter, headline, row, pill and slot geometry/colors. Only new intro colors are semantic tokens in global CSS; no shared theme values changed.
`connect_intro_viewed` remains once per settled intro with `{h0}`; obsolete `source:'home'` was removed because there is no longer a course source. CTA remains `connect_intro_cta` with `{h, place:'end', circle_shown}`.

## Test inventory and exact authorized changes
Only existing test edited: `src/test/connectIntroTryIt.test.tsx`. No other existing test/fixture was changed. Original **17**, now **11**; new `hs2ConnectSeat.test.tsx` adds **12**, net **+6 cases / +1 file**.

Deleted five parameterized `formats course display name %s` cases, because their only consumer/helper was removed:
- `expect(displayCourseName('Sundridge Park Golf Club (East Course)')).toBe('Sundridge Park East')`.
- `expect(displayCourseName('Parkstone Golf Club')).toBe('Parkstone')`.
- `expect(displayCourseName("Royal St George's Golf Club")).toBe("Royal St George's")`.
- `expect(displayCourseName('The Grove')).toBe('The Grove')`.
- `expect(displayCourseName('AB Golf Club')).toBe('AB Golf Club')`.
Deleted `uses hysteresis for footer visibility`: `nextFooterHidden(false,0.6) === true`, `nextFooterHidden(true,0.45) === true`, `nextFooterHidden(true,0.25) === false`; footer and its observer were expressly retired.

Renamed/rewritten remaining obsolete presentation assertions:
- `does not request the fallback course while the session is unresolved`: `introSpy called with (null,false)` → **not called**, plus skeleton present; Parkstone absence kept.
- `keeps footer out of fixed positioning and hides it in embedded layout` → `keeps a single in-content CTA in page and embedded layouts`: page footer copy present / embedded absent, and wait for `takes 11.6 shots` → one `.connect-seat-cta` in each layout, circle list ready and old visible footer absent. No-fixed-position assertion retained.
- `shows the field verdict for the intro course and places the circle by the member's index` → `ignores the course verdict and places the circle by the member index`: headline present, `+11.6` count >0, `across 912 rounds...` present, field present → course hook never called, verdict/field absent. You existence/order retained structurally: previous row's text `connect to take your place` → `data-seat-person='you'`.
- `renders LegacyFallback when avg_over_par is null` → `keeps the circle seat when avg_over_par is null`: `Connect once.` present → circle list present, `Connect once.` absent; verdict absence retained.
- `keeps the circle second sentence at one connected golfer` → `exposes the live count at one connected golfer`: old sentence present → heading `data-connected='1'`; new tests use canonical i18n mock and structure, not translated words.
- `fires connect_intro_viewed once after the loaded state renders` → `fires connect_intro_viewed once after the circle settles`: payload `{source:'home',h0:13}` → `{h0:13}`; once-only assertion unchanged.

Four existing starting-handicap cases and the four-person chooser/order assertions remain unchanged. Existing translation fixture/mock was not converted; new test copies the required complete react-i18next mock with initReactI18next and defaultValue-or-empty behavior. New tests cover full/singular/empty/failed/unsettled/profile-pending states, three-plus-You order and terminal placement, both CTA payloads/callbacks, decline and default-four/explicit-three chooser behavior.

## Files
Product: EmptyStateScreen.tsx, connect-seat.css (new), useConnectIntroCourse.ts (unused-reader cleanup), src/index.css (intro tokens), public/locales/en/handicap.json (new defaults/keys).
Tests: connectIntroTryIt.test.tsx; hs2ConnectSeat.test.tsx (new).
Documentation: this report, roadmap.md, AGENTS.md ownership pointer, project memory.
No Git pull was run: stateful Git commands are prohibited by this environment.