# GI1 Guest island — completed

## Scope
Only `ChromeIsland.tsx`'s guest right capsule changed. The registry's `condense: true` owns the opt-in: 16px radius, shared ISLAND_GLASS edge/shadow/blur/saturation, background0.55 at rest/0.84 folded, Join free radius12. Existing34px height,0 16px button padding, colors, font, copy and both action bodies are unchanged.

Log in folds by max-width/opacity using the existing split300ms geometry/200ms opacity easing; island padding/gap animate through the same fold token. Folded Log in is aria-hidden,tabIndex−1,disabled and pointer-events none; it restores on upward scrolling. Reduced motion has transition:none. Non-condense routes add no attributes/styles and keep existing23px island/17px button radii and canonical glass.

No guest browsing changes outside the authorized island; no review wizard, news, round plots, SQL, migrations, deployed RPC/edge-function, feed_config or native/Median changes. round_pool_cap remains30.

## Tests and reconciled inventory
Before: latest HB5 green6,291 tests/562 files. After:6,295 tests/563 files, all passing (+4/+1).
- `headerB1.test.tsx`:10→13 (+3); one authorized rewritten case remains one case.
- `islandSquircle.test.tsx`:8→8; one authorized rewrite, zero count change.
- New `gi1GuestIslandReducedMotion.test.tsx`:1 case (+1 file).
- No tests deleted. No other existing test case changed.

New case names:
1. `GI1 guest rest uses member squircle glass and preserves Join free dimensions`.
2. `GI1 non-condense guest capsule remains byte-identical through nav changes`.
3. `GI1 Log in restores after upward scroll and retains auth navigation`.
4. `guest glass and Log in fold have no transitions at rest or folded`.

Authorized rewrites, with assertions quoted:
- `headerB1.test.tsx`: `guest right capsule remains byte-identical through condensation` → `GI1 guest fold hides and disables Log in while Join free keeps its handlers`. Removed `await move(150); expect(guest?.outerHTML).toBe(before);`. Replaced with folded aria-hidden/tabIndex−1/disabled/pointer-events/maxWidth checks; visible enabled Join free; exact original `trackGuestGateShown({ surface: 'clubhouse', trigger: 'join_button' })` and `openGuestCard({ kind: 'join_button', surface: 'clubhouse' })` calls; folded glass0.84/padding0 6px/gap0. Reason: GI1 expressly replaces the capsule-freeze contract on condense routes.
- `islandSquircle.test.tsx`: `the guest right island keeps its round shape on a condense route` → `GI1 guest right island uses the squircle shape on a condense route`. Both rest/folded `expect(guest?.style.borderRadius).toBe('23px');` become `expect(guest?.style.borderRadius).toBe('16px');`. Reason: GI1 expressly adopts squircle geometry. Source assertion was23px, not999px; no999px assertion existed here.

Focused command:
`bunx vitest run src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/gi1GuestIslandReducedMotion.test.tsx --maxWorkers=2`
Result22/22 across3 files, zero failures/unhandled errors. Full output `/tmp/gi1/focused.log`.

Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, N=1,2,3,4.

|Shard|Passed tests|Failed|Passed files|
|---|---:|---:|---:|
|1|1594|0|141|
|2|1523|0|141|
|3|1554|0|141|
|4 completed rerun|1624|0|140|
|Total|6295|0|563|

Zero Vitest unhandled errors. Existing act warnings, jsdom CSS parsing warnings and stale Browserslist warning are not failing cases or Vitest unhandled errors. No pre-existing failing test observed against the latest green baseline.

The combined four-shard command exceeded the sandbox600s ceiling during shard4 after shards1–3 completed green. This was command interruption, not a failing test. Original partial output retained `/tmp/gi1/shard4-interrupted.log`; only shard4 rerun individually, green1624/1624. Final complete shard logs `/tmp/gi1/shard1.log` through `shard4.log`.

## Real browser verification
Fresh Chromium signed-out `/`,390×844,`--sat:47px`, actual guest feed, no fixture/auth/session manipulation:
- Rest: island168.359375×46 at top57px;16px radius,0.55 glass,padding0 6px 0 16px,gap12. Join free34px high/radius12, enabled.
- Actual Virtuoso feed scroller (`[data-virtuoso-scroller]`) scroll500 drives existing registered nav store through `CardFeed.tsx:1269–1277`. Folded:104.359375×46 at top57px,16px radius,0.84 glass,padding0 6px,gap0; Log in opacity0/aria-hidden/disabled/tabIndex−1; Join free remains34px high/enabled.
- Blur computed `blur(22px) saturate(1.5)` in both states. Join free tap opens the existing community join dialog (one accessible dialog). No page errors; final URL stays`http://localhost:8080/`.
- Visually inspected `/tmp/browser/gi1/rest.png`, `folded.png`, `join-open.png`; script/output`check_guest.py`/`result.log`.
- First browser apparatus mistakenly scrolled auto-registered`#root`, which is not this feed's inner scroller; it did not fold. Source inspection identified the actual Virtuoso registration; script-only selector corrected. No product/test change was made for that apparatus error.
- Signed-off mock matches the changed island shape and fold; fake logo, background and other frozen mock surfaces were not copied.

## Build
Automatic build observed `=== build 2026-11-03T16:58:14Z ===` / `build OK`; no surviving diagnostics. No manual project build/typecheck, per environment rules.

## Every file touched
Product: `src/features/chrome-v2/ChromeIsland.tsx`.
Tests: `src/test/headerB1.test.tsx`, `src/test/islandSquircle.test.tsx`, new `src/test/gi1GuestIslandReducedMotion.test.tsx`.
Documentation: new `GI1_GUEST_ISLAND_REPORT.md`, `roadmap.md`.
Memory: new `mem://features/chrome/gi1-guest-island.md`, `mem://index.md` (GI1 supersedes the earlier guest freeze only in its authorized scope).
Temporary test/browser apparatus and outputs live only under`/tmp/gi1` and`/tmp/browser/gi1`.