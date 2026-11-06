# PK1_RECORD_1 — record placement and fixture close-out

The record hook/button now belongs to PicksBlock immediately after the heading; the member-band record door and onRecord prop are removed. Cards, members' picks door, its CSS, existing sheet and old locale keys were not changed. New fromEvents plural keys were added to en and pseudo en-XA.

## Previous build error (fixture corrected)

Latest preview check, 2026-11-06T07:21:50Z:
```text
src/test/guestTournamentPickLock.test.tsx(25,277): error TS2322: Type '{ tournamentId: string; tourCode: string; seasonYear: number; phase: "upcoming"; currentRound: null; pickResults: undefined[]; startedPlayers: Set<string>; onPick: () => void; onRecord: () => void; }' is not assignable to type 'IntrinsicAttributes & { tournamentId: string; tourCode: string; seasonYear: number; phase: "completed" | "live" | "upcoming"; currentRound: number; pickResults: ...; startedPlayers: Set<...>; onPick: ...; }'.
Property 'onRecord' does not exist on type 'IntrinsicAttributes & { tournamentId: string; tourCode: string; seasonYear: number; phase: "completed" | "live" | "upcoming"; currentRound: number; pickResults: ...; startedPlayers: Set<...>; onPick: ...; }'.
```

The subsequent instruction to fix preview type errors without asking authorized the minimal fixture correction: removed only `onRecord={() => {}}` from guestTournamentPickLock.test.tsx:25. All five cases and every assertion remain unchanged. Old mount ending: `onPick={() => {}} onRecord={() => {}}`; new ending: `onPick={() => {}}`. No production change was made in this close-out. Validation recorded below.

## Tests

Focused command:
`bunx vitest run src/test/pickSheetV2.test.tsx src/test/tournamentPickInsights.test.tsx src/test/pk1RecordHeading.test.tsx --maxWorkers=2`

85/85 passed (19 + 56 + 10), three files.

Each shard was a separate command:
`bunx vitest run --maxWorkers=2 --shard=n/4`

| Shard | Passed | Files | Failed |
|---|---:|---:|---:|
| 1 | 1,875 | 160 | 0 |
| 2 | 1,749 | 160 | 0 |
| 3 | 1,849 | 160 | 0 |
| 4 | 1,761 | 157 | 0 |
| Total | 7,234 | 637 | 0 |

Baseline 7,224 tests /636 files →7,234/637: +10 cases in the one new pk1RecordHeading.test.tsx file. No tests deleted or renamed. Known pre-existing tourIsland.test.tsx:235 failure did not recur. No test failure occurred. These shards ran before the one-prop fixture correction; complete output retained under /tmp/pk1-record/focused.log and shard-1.log through shard-4.log. Fixture close-out changes the test count by0 (still7,234/637).

### Existing test changes (authorized)

1. pickSheetV2.test.tsx, “record continuation reads ten events not thirty picks”:
   - Mount: PickMemberBands → PicksBlock with the same event/season and empty picks.
   - Old: `expect(document.querySelector('[data-our-record-door] small')?.textContent).toBe('from 10 events ›')`
   - New: `expect(document.querySelector('[data-our-record-door] [data-pick-record-events]')?.textContent).toBe('from 10 events')`
   - Why: event part moved to heading and chevron became its own element; ten events, not thirty picks, preserved.
2. tournamentPickInsights.test.tsx, “followed singular and record row use server counts; zero hides both”:
   - Followed assertion unchanged: `expect(document.querySelector('[data-followed-picks]')?.textContent).toContain('1 of your circle has picked.')` on PickMemberBands.
   - Record mount moved to PicksBlock after unmounting the bands. Existing `expect(door?.textContent).toContain('1 win · 1 top 10')` and `expect(onRecord).toHaveBeenCalledOnce()` unchanged.
   - Added read-settlement assertion before checking record and added zero-picks assertion: `expect(block.container.querySelector('[data-our-record-door]')).toBeNull()` after updating the record cache to picks0.
   - Why: preserve existing server-count and tap intent at its new owner and explicitly exercise zero hiding.

Fixture-only removed props in these two files: pickSheetV2 guest See picks, locked members door and record-continuation mounts; tournamentPickInsights guest upcoming, guest Pick and singular record mounts. No other existing test assertions changed.

### New case reconciliation (+10)

pk1RecordHeading.test.tsx:
- record follows heading and precedes intro in upcoming /live /completed (3).
- zero picks hides record.
- error suppresses even stale record.
- member bands no longer own a record door.
- no intro places record directly above tiles.
- guest record still opens existing record callback once.
- unknown event count omits only events part.
- picks block never repeats record kicker.

## Requested checks

1. 390px live PGA and LPGA: not verified; build blocker and external unmanaged auth prevent authenticated live checks.
2. Upcoming/completed: structural fixtures pass, live phases unverified.
3. Tap: existing opener called once in focused fixtures; actual sheet opening not verified end-to-end.
4. 320px normal/long counts: unverified; browser not run after build stop. No claim of measured wrapping/overflow.
5. Guests: fixture confirms relocated record/opener with no guest-session creation; live guest check unverified.

No SQL, migrations, RPC/edge deployment, guest-browsing edits, review/news/round-plot changes, feed_config or cap/native/Median changes.