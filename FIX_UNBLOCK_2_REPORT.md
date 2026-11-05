# FIX_UNBLOCK_2 — implemented, verification stopped

## Scope and rulings
- Island only: `useOwnHandicapState(userId, { island: true })` uses `chip.settled && status.verifiedKnown`; all default callers still use `chip.settled && !status.unknown`.
- `MyProStatus.verifiedKnown` is exactly `!userId || !profileLoading`. `unknown` and its meaning are unchanged.
- Verified comes solely from `profile.pro_verified_at`. Source confirmation: `useMyProStatus.ts` uses `row?.pro_tour ?? profile.pro_tour` and `row?.pro_club ?? profile.pro_club`; with a pending request and no row, profile details are available. HcpCell prints only PRO plus tour/club, never pending, declined or reviewReason. The new pro regression asserts both profile tour and club while the request is pending.
- The scope clarification explicitly preserves full-read waiting on Settings and other consumers. No guest, review wizard, News or round-plot source changed. No SQL/migrations/server/edge/native/Median changes; feed_config and round_pool_cap untouched.

## Files changed
Product: `src/features/pro-verification/useMyProStatus.ts`, `src/lib/whs/useOwnHandicapState.ts`, `src/features/chrome-v2/ChromeIsland.tsx`.

Existing tests, **fixture-only; no assertions, case names or expected values changed**:
- `islandsNav.test.tsx:33,57`: mutable settled-amateur `mockPro` including `verifiedKnown: true`; mock delegates to that fixture.
- `proOwnHandicapState.test.tsx:5`: `verifiedKnown: !f.unknown`; original three cases untouched.
- `headerB1.test.tsx:34`, `overflowRightIsland.test.tsx:15`, `hb6Group1.test.tsx:18`: `verifiedKnown: true` in existing settled-amateur mocks.
- `proStatusControls.test.tsx` unchanged.

New `src/test/fixUnblock2.test.tsx`: four cases for amateur pending request (also asserts default consumer remains unsettled), verified pro profile detail during pending request, profile-loading suppression, and unchanged pending-request unknown.

No test deleted, renamed or rewritten. Before **6,874 / 607**; after expected **6,878 / 608**, delta exactly **+4 tests / +1 file**, all in fixUnblock2. Shard redistribution is not a count change.

## Verification
Focused command:
`bunx vitest run src/test/islandsNav.test.tsx src/test/fixUnblock2.test.tsx src/test/proOwnHandicapState.test.tsx src/test/proStatusControls.test.tsx src/test/proStatusSurfaceCoverage.test.tsx src/test/overflowRightIsland.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/fixTourNotif1.test.tsx src/test/fixLiveDot1.test.tsx --maxWorkers=2`

**102 passed / 10 files**; `docs/verification/fix-unblock-2/focused.log`.

Full-suite commands: `bunx vitest run --maxWorkers=2 --shard=n/4`, in order.

| Shard | Passed | Failed | Executed | Files |
|---|---:|---:|---:|---:|
| 1 | 1,753 | 0 | 1,753 | 152 |
| 2 | 1,653 | 0 | 1,653 | 152 |
| 3 | 1,739 | 11 | 1,750 | 152 |
| 4 | Not run | — | — | — |

Executed **5,145 passed + 11 failed = 5,156 / 456 files**. Remaining expected **1,722 / 152** is unrun shard 4; no full-suite green or executed inventory confirmation claimed. Previous shard totals differ because adding a file redistributes shard assignment.

## Required STOP — named pre-existing ST2 failure persists
Only failing file: `src/test/st2SettingsHandicapCard.test.tsx`, untouched in FIX_UNBLOCK_2. These same 11 failures were already reported by the prior standing-fixture repair; they are not claimed new or flaky.

First error, `src/test/st2SettingsHandicapCard.test.tsx:48:33`:
`TestingLibraryElementError: Unable to find an accessible element with the role "button" and name /England Golf.*Connected · synced.*Manage/`

Other failures at 51, 52, 53, 54, 55 (loading/error cases), 56, 59, 61 (connected=true), 62: missing card/provider/switch. Exact complete output retained in `docs/verification/fix-unblock-2/shard3.log`.

Applied the untouched-file flake rule: `bunx vitest run src/test/st2SettingsHandicapCard.test.tsx --maxWorkers=2` failed **11 / 22** on its first isolated run. It cannot qualify for 3/3 passing runs, so stopped without further edits, shard 4 or browser checks. Full output `docs/verification/fix-unblock-2/st2-isolated1.log`.

Harness latest source-edit signal: **build OK, 2026-11-05T12:30:04Z**.

## Browser checks not performed
The brief orders browser verification after the suite. The surviving isolated ST2 failure stops that sequence. Live halo historical geometry, condensed halo absence, 320/430 News labels, authenticated Activity → Tour → back, and non-pro/Mason cold-load cells remain unverified; no signed-out or synthetic check substitutes for them.

PRO_STATUS_CONTROLS_REPORT.md retained because its all-four-green deletion condition is still unmet. Roadmap records the blocker and outstanding checks.