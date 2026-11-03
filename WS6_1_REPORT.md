# WS6.1 — Creator card width and names

## Result
- Multi-creator width is `min(340px, calc(100% - 18px))`, correcting the WS6 brief error. Single-creator full width, snap, padding, gap and dots are unchanged.
- Names remain 17px/700 and wrap without clipping, clamping, nowrap or ellipsis, using `overflowWrap: 'anywhere'`. VerifiedBadge remains inline immediately after the name. The head remains vertically centred and Follow retains `flex: 'none'`. The secondary line is unchanged and stays one line.

## Files touched
1. `src/features/explore-magazine/watch/spotlight.css` — width only.
2. `src/features/explore-magazine/watch/CreatorSpotlight.tsx` — name wrapping and inline badge only.
3. `src/test/ws3WatchBottom.test.tsx` — two new cases; existing cases untouched.
4. `roadmap.md` — WS6.1 task and verification status.
5. `WS6_1_REPORT.md` — this report.
6. Project memory `mem://features/watch/ws6-spotlights` — restored the missing referenced memory with WS6.1 correction; `mem://index.md` — updated its description.

No structural decision introduced; AGENTS.md unchanged. No guest browsing, review wizard, news, round plots, SQL, migrations, migration files, RPCs, edge functions, feed_config or native/Median configuration changes. round_pool_cap remains 30.

## Test inventory and changed-case accounting
Last reported baseline (WS6): **6,023 tests / 548 files**. After WS6.1: **6,025 executed and passed / 548 files**, delta **+2 tests / +0 files**. Entire delta is `ws3WatchBottom.test.tsx`, **39 → 41**.

No existing test was deleted, renamed or rewritten. The brief authorizes updating a WS6 width assertion, but no existing test asserted `100% - 50px`; therefore there is no changed case to quote. The prior width appears in WS6_REPORT.md as historical implementation documentation, left unchanged.

New cases:
1. **“WS6.1: card width uses min(340px, calc(100% - 18px))”** — asserts the new card rule, absence of the erroneous `100% - 50px` rule, and preserved single-card full-width override.
2. **“WS6.1: a 30-character name is uncut with inline verification and a nonshrinking Follow pill”** — renders `abcdefghijklmnopqrstuvwxyzabcd` in full; asserts absent nowrap/overflow/ellipsis/clamp styles, `overflowWrap: 'anywhere'`, unchanged 17px/700, inline VerifiedBadge, present Follow with `flex: '0 0 auto'`, and centred head.

## Exact test commands and results
Focused: `bunx vitest run src/test/ws3WatchBottom.test.tsx --maxWorkers=2` — **41/41**, 1 file; complete output `/tmp/ws6_1-focused.log`.

Full suite, all shards after completed code/test edits:
- `bunx vitest run --maxWorkers=2 --shard=1/4` — **1,501/1,501**, 137 files.
- `bunx vitest run --maxWorkers=2 --shard=2/4` — **1,469/1,469**, 137 files.
- `bunx vitest run --maxWorkers=2 --shard=3/4` — **1,501/1,501**, 137 files.
- `bunx vitest run --maxWorkers=2 --shard=4/4` — **1,554/1,554**, 137 files.

Total **6,025/6,025**, **548 files**, **0 failures and 0 unhandled errors**. No pre-existing failures observed. Complete output retained in `/tmp/ws6_1-shard1.log` through `/tmp/ws6_1-shard4.log`; each shard exited 0. Existing warnings are not failures.

## Build and visual verification
Automatic build log: **build OK, 2026-11-03T08:57:58Z**. No manual build/typecheck run, per environment policy.

Chromium isolated geometry fixture using the actual spotlight CSS and the updated head layout:
- 390px viewport: card 340px, next starts 366px, peek 24px.
- 375px: card 325px, next starts 351px, peek 24px.
- 320px: card 270px, next starts 296px, peek 24px.
- Thirty-character names wrap completely at all three widths, no overlap with Follow, Follow shrink 0; supporting line stays one line (its existing ellipsis remains on narrow widths).

Screenshots inspected at `/tmp/browser/ws6_1/geometry-390.png` and `geometry-320.png`; script and all three captures retained in `/tmp/browser/ws6_1/`. The mock's 340px-at-390px width now matches. This is isolated presentation evidence, not signed-in app readback. Authenticated end-to-end checks remain unavailable for this external_unmanaged project; no member follow-write or hosted full visual-parity claim.