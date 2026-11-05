# SAR1 — SAR1_FIX_1 close-out

## Close-out: green
- Scoped previous-query data to the new Standout shelf. `useStandoutRounds` now accepts a fifth optional `{ keepPrevious?: boolean }` argument, defaulting to false; `placeholderData: previous => previous` is included only when explicitly enabled. Query key, enabled flag, 60-second stale time, mapping and RPC arguments remain unchanged.
- Only `StandoutRoundsShelf` passes `{ keepPrevious: true }`. Audited all production callers: `StandoutRounds` and `ScoresLeaderboardsPage` omit the option and retain their previous pending behavior. `RoundsThisWeekShelf` has only a type import, not a hook call. `useStandoutFeats` is used only by the new shelf, so it is unchanged.
- The prior SAR1 regression in untouched `src/test/heldFrameCB28.test.tsx:56:71`, `AssertionError: expected 0 to be greater than 0`, is resolved. It was a regression, not a pre-existing failure or flake. No failures occurred in this fresh run; no flake reruns were needed.
- Added exactly one case to `src/test/sar1StandoutShelf.test.tsx`: `holds previous query data only by opt-in and keeps shelf tiles during a chip change`. Real QueryClient observers verify default data becomes undefined/pending on a query-key change while opted-in data remains placeholder data; the mounted shelf verifies all three scope reads opt in and its four tile nodes stay mounted during a chip change. Added option capture to its existing mock without changing any existing assertion or case name. `heldFrameCB28.test.tsx` is unchanged. No tests deleted, renamed or rewritten in SAR1_FIX_1; the original SAR1 rewrite ledger remains below.

Focused command: `bunx vitest run src/test/heldFrameCB28.test.tsx src/test/sar1StandoutShelf.test.tsx src/test/rsRoundsShelf.test.tsx src/test/standoutRounds.test.tsx --maxWorkers=2` — **100/100**, four files (6 / 42 / 31 / 21).

All four full-suite shards were run freshly, in order, using `bunx vitest run --maxWorkers=2 --shard=n/4`:

| Shard | Passed | Failed | Files |
| --- | ---: | ---: | ---: |
| 1 | 1,808 | 0 | 153 |
| 2 | 1,656 | 0 | 153 |
| 3 | 1,751 | 0 | 153 |
| 4 | 1,722 | 0 | 151 |
| Total | **6,937** | **0** | **610** |

Inventory reconciles from **6,936 / 610** to **6,937 / 610**, exactly **+1 case** in `sar1StandoutShelf.test.tsx` (41 → 42), no new files. The earlier 6,895 / 609 baseline plus the original SAR1 41 cases/one file and this fix's one case yields the same total.

Full focused and shard output retained at `docs/verification/sar1-fix-1/focused.log` and `shard1.log` through `shard4.log`. Original failing `docs/verification/sar1/shard4.log` retained. Guest browsing, review wizard, news, round plots, SQL, migrations, migration files, deployed RPCs/edge functions, feed_config and native/Median config remain untouched; round_pool_cap remains 30. Browser/320px checks remain unverified as previously recorded; this follow-up verifies retention through mounted UI tests, not hosted browser evidence.

---

# Historical SAR1 stop — superseded by the green close-out above

## Implemented, not signed off
- StandoutRoundsShelf mounted after Recent rounds under the existing All condition, before course videos. Parallel county/nation/Everyone reads, four-round default ladder, empty-chip hiding, per-viewer storage, interleaved RPC order and one hole-shapes hook batch.
- Added typed get_standout_feats mapping and optional standout round limit (default four, shelf ten); same-course nation field without changing county/country values. RegionKind now accepts region; BoardFilterPanel still offers only country/sub_country.
- Round/feat tiles, canonical squircle avatars, shared round sentences, hole strips, score/date/competition foot, feat hole emphasis, rarity and own-count line. Scorecard taps are ungated.
- Recent rounds loses only Leaderboards pill/end door and their handler/event. /rounds redirects to /amateur; scores query strips only view and stays on Explore. RoundsPage, ScoresLeaderboardsPage, RoundsGate and boards remain on disk.
- No other live /rounds links found: changed App route, AmateurPage scores redirect, and removed both shelf entrypoints. Course-detail /courses/:id/rounds is unrelated and unchanged. Dormant chrome/path checks remain.
- No SQL, migrations, deployed RPC/edge changes, guest code, review wizard, news, round plots, feed_config or native/Median changes. round_pool_cap unchanged. Requested git pull not run: platform prohibits stateful git commands.

## STOP
Fresh shard 4 failed in untouched `src/test/heldFrameCB28.test.tsx:56:71`:

```text
FAIL src/test/heldFrameCB28.test.tsx > CB28 held frame: standout > a filter change while rows are showing does not unmount the section
AssertionError: expected 0 to be greater than 0
expect(view.container.querySelectorAll('[data-held-row]').length).toBeGreaterThan(0);
```

This is a new regression from applying placeholderData to the shared useStandoutRounds hook, which changes the existing section's pending/held-row behavior. It is not classified as pre-existing or flaky, and the untouched test was not edited or rerun. Stop rule applied. Next correction should scope placeholder behavior to the new shelf while preserving the existing hook consumer's pending behavior. No corrective product edit made after the failure.

Full failing output retained: `docs/verification/sar1/shard4.log`. Browser/device/320px checks not performed after this stop; authenticated browser status is external_unmanaged, so hosted signed-in verification is unavailable. Exact visual sign-off is not claimed. Frozen Recent rounds avatar (32px), name truncation and existing rail/header spacing were preserved rather than copied from the mock; new tiles use 34px wrapping names. New title tracking remains zero under platform typography restrictions rather than mock -0.015em.

## Tests and counts
Focused: `bunx vitest run src/test/sar1StandoutShelf.test.tsx src/test/rsRoundsShelf.test.tsx src/test/standoutRounds.test.tsx --maxWorkers=2`: **93/93**, three files (new shelf 41, existing shelf 31, existing Standout 21).

Fresh ordered commands: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed | Failed | Files |
| --- | ---: | ---: | ---: |
| 1 | 1,807 | 0 | 153 |
| 2 | 1,656 | 0 | 153 |
| 3 | 1,751 | 0 | 153 |
| 4 | 1,721 | 1 | 151 |
| Total | **6,935** | **1** | **610** |

Executed inventory **6,936 / 610**, baseline **6,895 / 609** plus **41 cases / one file** (`sar1StandoutShelf.test.tsx`). Existing test counts unchanged. Latest harness build **OK 2026-11-05T14:59:09Z**. Intermediate new-test ByRoleOptions exact-field type errors fixed before shards; no assertion changed by that selector correction. All logs retained in docs/verification/sar1.

## Authorized rewritten existing tests
Only `src/test/rsRoundsShelf.test.tsx` changed, no tests deleted, four cases retained:

1. `loads the next page when the sentinel shows, with a skeleton, and stops at total_count` (line 307): end element `toBeInTheDocument()` → `toBeNull()`; pagination assertions unchanged.
2. Renamed `shows the end tile only when everything is loaded, and it goes to /rounds` → `ends on the final round without an end tile or Rounds navigation` (line 311). End presence → absence; end title `toContain("That's the last 14 days")` → query `toBeNull()`; door text `toContain('Leaderboards, feats and every round')` → query `toBeNull()`; rounds-route presence → absence; `toHaveBeenCalledWith('rounds_door_tapped', { from:'end' })` → `not.toHaveBeenCalledWith(...)`. Removed click on retired door, added three actual round-card count assertion.
3. Renamed `the header pill goes to /rounds and there is no door bar` → `the header has no Leaderboards pill or Rounds door` (line 322). Leaderboards presence → query absence; rounds-route presence → absence; header door event called → not called. Removed click on retired pill; existing absent door-bar/text/All-rounds assertions unchanged.
4. Renamed `/amateur?view=scores redirects to /rounds keeping other params` → `/amateur?view=scores stays on Explore and strips only view` (line 477). Existing `data-search='?tab=x'` assertion retained; marker now mounted beside AmateurPage, with added Explore-presence assertion. This confirms the changed destination without losing query preservation.

New `sar1StandoutShelf.test.tsx`: 41 cases covering requested scope/default/retention, tile order and figures, headline/rarity/shape, no-handicap doors, batch IDs, RPC/default-limit and same-source geography contracts. All passed; no other existing assertions changed.