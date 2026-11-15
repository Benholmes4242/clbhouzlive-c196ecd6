# Pro OWGR at approval

## Result
- Full suite before: **8,748** (last passing baseline, commit `446da406e6`).
- Full suite after: **8,760 executed / 8,760 passed / 0 failed / 0 skipped**.
- Reconciliation: **8,748 + 11 original approval cases + 1 chosen-player regression = 8,760**. No tests deleted or renamed; no file loses collected tests in the baseline-to-finish test diff. The earlier 8,736 total is superseded by this complete four-shard run.
- Latest harness build signal: `/tmp/observability/build-errors.log`, `2026-11-15T10:55:31Z`: **build OK**. `git diff --check` passed. No manual build/typecheck run.

## Files
- `src/features/admin/components/VerificationsReview.tsx`: unlinked tour-pro OWGR input and explicit no-page confirmation; verification followed by OWGR attachment and sync only for a valid unlinked source. The gate uses the drawer's selected `proPlayerId`; chosen players bypass both confirmation and OWGR attachment.
- `src/features/admin/components/AdminVerifiedCard.tsx`: no-results-source safety warning with failed-read suppression.
- `src/features/admin/hooks/useAdminVerified.ts`: optional tour-player id for the warning.
- `src/test/proOwgrAtApproval.test.tsx`: 11 original cases plus the new chosen-player case; the Supabase mock adds `limit` for the real player-search interaction.
- `src/test/proVerification1.test.tsx`: authorised confirmation click retained; original assertion unchanged.
- `roadmap.md`: finish task and verification outcome.
- `.lovable/reports/pro-owgr-at-approval.md`: this report.

## Authorised existing test update
`src/test/proVerification1.test.tsx` — **“Verify as pro sends the request with the chosen player id (none suggested here)”**.

Added the single interaction:
```tsx
fireEvent.click(await screen.findByRole('button', { name: 'He has no OWGR page — verify' }));
```
The existing assertion remains:
```tsx
expect(f.reviewMutate).toHaveBeenCalledWith(
  expect.objectContaining({ id: 'p1', type: 'golfer', decision: 'approved', playerId: null }),
  expect.anything(),
);
```
Why: this fixture has no chosen player (`playerId: null`), exactly the brief's new confirmation case; explicitly authorised by the user's option B. The accompanying explanatory comment remains. No assertion was changed, and the test count is unchanged.

## New case
`src/test/proOwgrAtApproval.test.tsx` — **“a tour_pro with a player picked verifies on the first click without a confirm or OWGR attachment”**.

Uses the real drawer's Change/search/pick interaction, then clicks Verify once. Asserts exactly one review mutation with `playerId: 'sp-picked'`, no “No OWGR page?” dialog, and, after successful verification, zero `admin_set_pro_owgr` calls and no sync invocation. File count: **11 → 12**.

## Four separate sequential commands
Each ran in its own command, without concurrent shards:
```text
bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/owgr-approval/shard-1.json
bunx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/owgr-approval/shard-2.json
bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/owgr-approval/shard-3.json
bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/owgr-approval/shard-4.json
```

| Shard | Collected | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| 1 | 2,236 | 2,236 | 0 | 0 |
| 2 | 2,106 | 2,106 | 0 | 0 |
| 3 | 2,203 | 2,203 | 0 | 0 |
| 4 | 2,215 | 2,215 | 0 | 0 |
| **Total** | **8,760** | **8,760** | **0** | **0** |

All four reports have `success: true`. No count mismatch or unexpected test failure occurred.

## Boundaries
No SQL, migration, `feed_config`, or pool-cap changes. No production sync invoked. Approval behavior is verified through mocked service calls and the real drawer interaction; authenticated production end-to-end verification remains unverified.