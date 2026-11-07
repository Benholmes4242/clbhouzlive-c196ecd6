# Courses archive independent filters

## Result and cause evidence
Removed only the Global→GB&I side effect in AllCoursesList's Top100 handler. All/Top100 and region now change independently; pagination reset remains unchanged.

Before production edits, a Playwright fixture rendered the actual AllCoursesList, FilterBar and RailChips with QueryClient-seeded Mason/Mannings Heath data (All1, Top1000). Tapping Top100 produced `aria-selected=true`, Global=false, GB&I=true and the existing “No Top 100 Courses Yet” / “Mason hasn't played any Top 100 courses yet.” empty state. **The return to All did not reproduce.** After the fix the same interaction produced Top100=true, Global=true, GB&I=false and the same empty state.

The proven region-jump cause was AllCoursesList's explicit `setActiveCountry('gb-i')`, not RailChips. RailChips does not disable zero counts or reset selection. ProfileCoursesTab currently passes neither controlled region props nor a region-dependent key; no click-triggered remount/reset was found. AllCoursesList initializes All on actual remount, but there is no evidence attributing Ben's return-to-All observation to a remount in this checkout. No invented remount fix, shared control change or masking was added. Mason's hosted authenticated profile was not verified: externally managed authentication is unavailable here. Browser fixture is isolated seeded evidence, not a live-profile claim. Fixture generated one unrelated400 resource response; no page error after setup corrections.

## Files/tests
- `src/components/profile/courses/AllCoursesList.tsx`: deleted the three-line forced-region branch only.
- `src/test/profileCoursesArchive.test.tsx`: three new cases; fixture can opt into actual FilterBar and zero Top100 activity, existing tests keep their original mock output. No existing assertion changed, no test deleted or renamed. No assertion pinning GB&I auto-switch found in the archive/profile-course tests, so no old/new assertion delta exists.
- `roadmap.md`, this report.

New cases:
1. “on Global, tapping Top 100 keeps Global selected and selects Top 100” — both selected states concrete.
2. “with zero Top 100 courses, Top 100 stays selected and renders the existing empty state” — Top1000 selected, All unselected, existing Mason empty state and zero articles.
3. “changing region keeps the selected All or Top 100 tab, including controlled region updates” — actual rail with controlled-region wrapper; All persists on GB&I, Top100 persists across USA/Global/Europe including empty regions.

New-test selector typing was corrected by removing unsupported Testing Library `exact` options; names and assertions unchanged. This happened after shards; final focused rerun passed. All production stayed identical throughout the shard run.

## Verification
Focused (initial and final): `bunx vitest run src/test/profileCoursesArchive.test.tsx src/test/profileCoursesRecord.test.tsx --maxWorkers=2` — **19 passed /2 files**. Archive10→13 cases; record6 unchanged. Existing record fixture logs a caught missing rpc mock warning, no failed case.

| Separate command | Passed | Failed | Files |
|---|---:|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` |1936|0|164|
| `bunx vitest run --maxWorkers=2 --shard=2/4` |1790|0|164|
| `bunx vitest run --maxWorkers=2 --shard=3/4` |1913|0|164|
| `bunx vitest run --maxWorkers=2 --shard=4/4` |1851|1|163|

Full suite **7490 passed +1 failed =7491 tests /655 files**. Before7488/655→after7491/655; +3 named cases above, no other delta. FW1 “reserves no right padding on the meta line” did not recur; no failure classified as known.

## Mandatory stop
Unchanged failure from the preceding task is **not authorized as known in this brief**; left untouched:

```text
FAIL src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts
notifRoute handled-type coverage > handles the same notification types in both files
src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts:318:46
AssertionError: expected { …(2) } to deeply equal { Object (missingFromPort, extraInPort) }
Expected: { extraInPort: [], missingFromPort: [] }
Received: { extraInPort: [], missingFromPort: ["video_credit"] }
```

Latest preview telemetry **build OK**,2026-11-07T15:52:19Z; intermediate new-test syntax/typing issues resolved. Logs `/tmp/archive-filter-focused.log`, `/tmp/archive-filter-focused-final.log`, `/tmp/archive-filter-shard-{1,2,3,4}.log`. Browser script `/tmp/browser/archive-selection/check_archive.py`; before screenshot observed, final DOM state verified with same script. No SQL/migrations/server/native/Median/feed_config/pool-cap changes.

Remaining: reported hosted return-to-All cause is unproven, so not claimed fixed; no fresh full-shard rerun after final test-selector-only typing correction due mandatory stop.