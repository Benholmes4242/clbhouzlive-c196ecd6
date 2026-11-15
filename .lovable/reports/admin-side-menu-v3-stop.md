# Admin side menu v3 — stopped on unexpected test failure

## Status
Source edits are complete; preview build OK (2026-11-15T19:23:07Z), and git diff --check passed. No screenshots or admin sign-in attempted, as instructed. No SQL, migrations, deployed functions, feed_config, pool cap, native config or excluded surfaces changed.

## Files
- src/features/admin/AdminDrawer.tsx — v3 drawer appearance, wrapping names, search Cancel, open-only full-admin default-window signals.
- src/features/admin/AdminDrawerStatus.tsx — v3 live card and red/green Health signals.
- src/features/admin/lib/doNowTotal.ts — new shared seven-count helper.
- src/features/admin/pages/DashboardPage.tsx — Do now meta uses shared helper; other page output unchanged.
- src/features/admin/AdminDrawer.test.tsx — complete hook mock/fixture, 12 new collected cases, one authorised assertion update.
- roadmap.md — task and stop status.
- .lovable/reports/admin-side-menu-v3-stop.md — this report.

## Authorised existing test change
Test: `BRIEF_ADMIN_SIDE_MENU > full admin all-clear exposes live figures, grouped destinations and identity`.
Before: `expect(screen.getAllByText('Command centre')).toHaveLength(2);`
After: `expect(screen.getAllByText('Command centre')).toHaveLength(1);`
Added: `expect(within(screen.getByRole('dialog')).getByText('Admin')).toBeInTheDocument();`
Why: the header subtitle is now Admin; only the navigation destination says Command centre. No other existing assertion changed. No tests deleted or renamed.

## Counts
Latest reported clean baseline is **8,834**, not the upload's older 8,814: profile-cover-fallback.md added 17 (8,814 → 8,831), profile-cover-fallback-followups.md added 3 (8,831 → 8,834).
AdminDrawer.test.tsx: **11 → 23** (+12); adminCommandCentreV3.test.tsx unchanged at 33.
Expected inventory: **8,846 = 8,834 + 12**, NOT a verified full-suite total.

New cases (parameterized cases counted individually):
1. shares all seven Do now counts and renders full-admin task and member signals
2. renders clear when all seven task counts are zero
3. suppresses both signals on loading even with cached figures
4. suppresses both signals on error even with cached figures
5. never requests Command centre for open=false role=full
6. never requests Command centre for open=true role=limited
7. never requests Command centre for open=true role=moderator
8. renders Health issues in bad and All clear in faint
9. uses no amber or brand/warn tokens in either drawer file or element
10. contains no text under 10px
11. wraps result names and shows usernames without ellipsis
12. Cancel clears and blurs search and restores the groups

## Executed command and stop
`npx vitest run src/features/admin/AdminDrawer.test.tsx src/test/adminCommandCentreV3.test.tsx --maxWorkers=2`
Result: **56 executed; 55 passed; 1 failed**, two files (drawer 22/23, unchanged dashboard 33/33).

Unexpected failure, verbatim:
```
FAIL src/features/admin/AdminDrawer.test.tsx > ADMIN_SIDE_MENU_V3 > wraps result names and shows usernames without ellipsis
Error: expect(element).toHaveStyle()

- Expected
+ Received

- overflowWrap: anywhere;
❯ src/features/admin/AdminDrawer.test.tsx:205:53
```
Assertion: `expect(within(link).getByText('Thomas Holmes')).toHaveStyle({ overflowWrap: 'anywhere' });`
The new assertion selects the nested InlineProMemberName span, while the wrapping declaration is on the enclosing name span at AdminDrawer.tsx:133. The existing name component was preserved. No failing assertion or source was changed after the failure.

Per the stop rule, full-suite shards 1–4 were NOT run. No known intermittent or existing coursesBrowseHighestRatedRemoval failures appeared in this focused scope. Full suite, authenticated flow and device appearance remain unverified. Narrow follow-up needed: authorise the new assertion to check the enclosing styled name span instead of its inner name span, then run the focused checks and four separate full-suite shards.
