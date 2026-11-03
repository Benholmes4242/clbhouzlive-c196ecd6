# Authorised Picks continuation — stopped at shard 2

## Delivered
- Scoped only the existing integrated circle-copy assertion to the circle text's own span; expected wording, test name and other assertions unchanged.
- Added the public scalar guest lock/time query, isolated from the unchanged member-state hook. Signed-out, anonymous and guest-store viewers use `tournament_pick_locks_at` and `tournament_pick_is_locked`; members keep `get_tournament_pick_state`.
- Shared PickMemberBands supplies guest lock state to overview/tournament cards. Server `locked=true` removes the guest card. No guest member/circle figures are invented. Guest read errors suppress the card; the existing pre-read guest presentation remains until the read settles.
- Guest time uses existing local HH:mm/weekday formatting; null time reads “One pick before the first tee, scored the same way as ours.” Member wording unchanged.
- No SQL, migrations, deployed RPC/edge edits, feed_config, round_pool_cap, native/Median, news, review wizard or round-plot changes.

## Exact authorised existing-test change
`src/test/integratedPicks.test.tsx`, retained case **“no pick combines question, exact lock copy, digit circle count and action”**:
```diff
-expect(document.querySelector('[data-followed-picks]')?.textContent).toBe('6 of your circle have picked. Most picked: Ghim.');
+expect(document.querySelector('[data-followed-picks] > span:last-child')?.textContent).toBe('6 of your circle have picked. Most picked: Ghim.');
```
Why: the wrapper includes the avatar initials DG; only the circle line's own text is the asserted copy. No component markup changed for this assertion. File remains **23 tests before/after**. No tests deleted, renamed or rewritten elsewhere.

## New rule tests and counts
New `src/test/guestTournamentPickLock.test.tsx`: **5 tests /1 file**:
1. “signed-out viewers read both public scalar functions and never member state” — asserts both function names with `p_tournament_id: 'event'` and absence of member read.
2. “anonymous viewers also use public lock reads” — asserts public function for anonymous identity and no member read.
3. “the server locked flag removes the guest card” — query resolves `locked: true`; Pick is absent.
4. “null lock time stays null and unlocked rather than inventing a timestamp” — asserts `{locks_at: null, locked: false}` and available Pick.
5. “members retain the member-state function and issue no public lock reads” — asserts the member function and absence of both guest functions.

Last verified full baseline is **6,472 tests /576 files** (FIX_GRID_1). Last reported candidate is **6,509 /577** (CM1 +14/net0 files, then Integrated Picks +23/+1). This continuation's candidate is **6,514 /578**, solely **+5/+1** from the named guest test file; the preceding authorised CM1 mock correction added zero cases. Candidate totals are historical inventory accounting, **not a completed current full-suite result**. Only shards 1–2 executed; no full current-suite total can be claimed.

## Commands and executed results
Focused:
`bunx vitest run src/test/guestTournamentPickLock.test.tsx src/test/integratedPicks.test.tsx src/test/tournamentPickInsights.test.tsx src/test/yourPickSheet.test.tsx src/test/tournamentV3Page.test.tsx --maxWorkers=2`

**115/115 tests, 5/5 files, exit0; zero unhandled errors.** Integrated Picks 23/23; guest lock 5/5; insights 56/56; sheet 28/28; tournament page 3/3. These unchanged 110 existing tests plus five new tests reconcile the focused total.

| Command | Passed | Failed | Executed | Files |
|---|---:|---:|---:|---|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,681 | 0 | 1,681 | 145 passed |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,540 | 3 | 1,543 | 144 passed /1 failed |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | — | — | Not run | Required stop |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | — | — | Not run | Required stop |

Both executed shards had **zero unhandled errors**. Combined execution: **3,224 tests, 3,221 passed /3 failed**, not a full-suite total. Full outputs retained in `docs/verification/picks-authorised/{focused,shard-1,shard-2}.log`.

## Exact stop
```text
FAIL src/test/tourOverviewMergedAiry.test.tsx > Merged Airy lower sections > adds the picks hairline and tighter cards in upcoming
FAIL src/test/tourOverviewMergedAiry.test.tsx > Merged Airy lower sections > adds the picks hairline and tighter cards in live
FAIL src/test/tourOverviewMergedAiry.test.tsx > Merged Airy lower sections > adds the picks hairline and tighter cards in completed
AssertionError: expected '16px' to be '14px' // Object.is equality
Expected: "14px"
Received: "16px"
❯ src/test/tourOverviewMergedAiry.test.tsx:78:98
```
No fix or assertion rewrite attempted. These cases are unrelated to this turn's changed code, but were not previously reproduced in CM1's first shard; they are unexpected failures and triggered the required stop. Previously documented integratedPicks DG6 failure is now resolved (focused and shard 1). Previously documented CM1 scrollTo error did not recur in executed shards. Shards 3–4, browser checks and TU1 did not start.

Build is clean in available automatic log: **2026-11-03T22:42:13Z — build OK**. Hosted anon grants are user-supplied, not independently queried (no SQL run); existing typed function contracts were confirmed. Real guest live-server end-to-end rendering was not verified following the shard stop.

## Files touched this continuation
- `src/test/integratedPicks.test.tsx`
- `src/test/guestTournamentPickLock.test.tsx` (new)
- `src/features/tourhub/hooks/useTournamentPick.ts`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PickMemberBands.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard.tsx`
- `public/locales/en/tourhub.json`
- `AGENTS.md`, `roadmap.md`, this report
- `docs/verification/picks-authorised/focused.log`, `shard-1.log`, `shard-2.log`
- Memory: `mem://features/tourhub/guest-lock-authority`, `mem://index.md`. Earlier referenced picks memory files were unavailable; current requirement saved separately.