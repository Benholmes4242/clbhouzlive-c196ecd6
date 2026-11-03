# G2F Activity — STOP, not verified complete

## Files touched
- `src/features/chrome-v2/registry.ts`: Activity route dark/bleeding/soft/condensing history-back islands, fallback /.
- `src/features/activity-v2/ActivityPageV2.tsx`: removes useHideHeader, Activity-only shell opt-in, shared title/h1 observer and chips dock; keeps existing goBack callback unchanged through canonical IslandBackCapsule in a flush left slot. Mark all read moves to trailing action (13px/700, foreground75%); handler/invalidation/toast unchanged. Both chip copies share state/counters. Bottom-nav hook and content untouched.
- `src/components/manage/ManagePageShell.tsx`: opt-in headerB skips FixedPageHeader plus owned spacer and uses island clearance; default caller behavior unchanged. No shell suppression introduced.
- `src/test/g2fActivityHeader.test.tsx`: nine added cases.
- `roadmap.md`, `G2F_ACTIVITY_REPORT.md`: stop/accounting.

No existing tests deleted, renamed or rewritten. No SQL/migrations, feed_config, deployed RPC/edge functions, native/Median, guest browsing, wizard, news or plots changes. round_pool_cap remains30. Shared PageTitle/IslandDock unchanged. Slot ownership documented beside Activity.

## New failure and surviving type error — verbatim
`bunx vitest run src/test/g2fActivityHeader.test.tsx src/test/ac2ActivityFold.test.tsx --maxWorkers=2`:
**32 passed / 1 failed / 33 executed**, 1 passed / 1 failed / 2 files. Full output `/tmp/g2f/focused.log` retained.

```
FAIL src/test/g2fActivityHeader.test.tsx > G2F Activity header > docks only past its chips and shares filters/counters across copies
Error: Missing observer
❯ pass src/test/g2fActivityHeader.test.tsx:35:159
❯ src/test/g2fActivityHeader.test.tsx:66:94
```

Latest automatic build entry, 2026-11-03T19:21:54Z:
```
--- typecheck ---
src/test/g2fActivityHeader.test.tsx(3,70): error TS2305: Module '"react-router-dom"' has no exported member 'InitialEntry'.
```

Stopped without changing the failing test or correcting the finished-edit type error, under the explicit unexpected-failure stop rule. Build is **not clean**. No reruns, full-suite shards or browser screenshots. The dock test's observer lookup targets the chip row, whereas the actual dock observes its containing ref wrapper; no correction made or authorized by this report.

## Counts
Before: prior candidate **6440 tests / 573 files**. After: candidate **6449 / 574** (+9/+1 from g2fActivityHeader), not a verified all-green inventory or full passing total.
New cases:
1. registers dark soft condensing history-back islands
2. opts Activity out of FixedPageHeader and spacer without suppression
3. preserves the default ManagePageShell header and spacer
4–5. replaces default/push exits with /
6. uses history for a normal Activity entry and restores nav
7. shows Mark all read only when unread and preserves writes/invalidation/toast
8. observes the actual Activity title for the expanded back name
9. docks only past its chips and shares filters/counters across copies (failed)

Existing AC2 24/24 passed; new G2F8/9 passed. No unhandled-error summary in focused output. No full-suite execution total available for this task.

## Pre-existing failures, not rerun
- `roundNotificationOverlay.test.ts:11:68`: `AssertionError: expected { chrome: 'island', …(6) } to deeply equal { chrome: 'island', …(4) }`; old expectation lacks condense:true/scrim:soft.
- Three `tourPlayoffShortenedEvents.test.tsx` page cases: awaiting-playoff pulse live, awaiting-playoff pulse completed and normal finished four-round event: `Error: No QueryClient set, use QueryClientProvider to set one`, useTournamentPick.ts:37:10 → TournamentPage.tsx:89:20. Runner gives no test line.
- `headerB1.test.tsx:97:39` expected23px/received16px; `g2aCourseTabs.test.tsx:104:34` expected `env(safe-area-inset-top, 0px)`/received empty string.
- Existing siLadder/SiLadder import-case issue untouched. Suspected tourOverviewBand fixture not a confirmed failure.

Full four-shard zero-failure result and top/docked screenshots remain blocked by this new test failure/type error. No mock parity, browser or clean-build claim.