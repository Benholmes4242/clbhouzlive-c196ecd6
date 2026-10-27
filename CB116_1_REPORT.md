# CB116.1 — coach regressions

## Diff
- `src/features/coach/CoachSheets.tsx`: `no_handicap` calls only `onNoHandicap()`, not `onClose()`. Flow remains mounted and switches to connect; no toast or invalidation. Other errors unchanged.
- `src/components/profile/hero/ProfileHero.tsx`: removed coach import; added optional `coachLine?: React.ReactNode`, forwarded unchanged to `afterSubline`. Absent prop is undefined.
- `src/pages/ProfilePageV2.tsx`: imports and supplies `<CoachProfileLine profileUserId={profile.id} viewerId={user?.id} />` as `coachLine`.
- `AGENTS.md`: recorded page ownership of coach reads; roadmap updated.

## Tests
No existing tests deleted, renamed, rewritten or retargeted. Existing coach-line tests already render the line directly, so no old/new name change is needed. Original `server no_handicap opens connect and no success toast` passes unchanged. All original hero tests remain unchanged and pass.

Three additions to `src/test/cb116NameCoach.test.tsx` (41 → 44):
1. `no_handicap refusal keeps flow open with connect and no toast or invalidation`: asserts connect renders, name disappears, close/success/error toast/invalidation are not called.
2. `ProfileHero has no coach imports and its absent optional prop leaves the line empty`: source ownership check asserting no coach import, optional node and direct afterSubline forwarding without default. Standalone runtime coverage is provided by unchanged hero suites.
3. `ProfilePageV2 passes the member and viewer coach line through the hero prop`: source wiring check asserting import and member/viewer props.

## Verification
Command: `bunx vitest run`.
Before: 3,704 passed / 27 failed / 3,731 total, 414 files.
After: **3,732 passed / 2 failed / 3,734 total**, 414 files (413 passed, 1 failed).
Delta: +3 tests, all named above; no removals. Against last green 3,670 / 411 files: +64 tests / +3 files = earlier 9 Media +41 coach +11 place-tagging +3 CB116.1.

Coach suite: 44/44. Original hero suites: heroConnectExample 16/16, heroConnectPanel 5/5, profileBioFull 6/6. All 25 CB116 regression failures resolved.
Automatic preview build: `build OK`, 2026-10-27T21:26:13Z. No authenticated browser check performed; signed-in waiver remains applicable.

## Remaining pre-existing failures — not touched
The uploaded brief names older Media failures that were already corrected by the preceding Media ruling. This run confirms both pass:
- `holeInlineAutoplay.test.tsx`: “batch-open pauses the underlying walk and Close releases it”.
- `holeMediaVideos.test.tsx`: “video-only hole uses poster and count one and opens the viewer with the stream”.

The only current failures are those recorded in the latest Media follow-up report before this brief:
- `src/test/coursePlaceTagging.test.tsx:17:660`: “submit copies owned metadata and invalidates place plus hole key”.
- `src/test/coursePlaceTagging.test.tsx:18:488`: “remove deletes the owned row and invalidates both keys”.

Tool output for each: `AssertionError: expected "invalidateQueries" to be called with arguments: [ { queryKey: [ …(3) ] } ]` and `Number of calls: 0`.

No new failures. Full green is blocked by these separately owned Media failures, which remain untouched; the requested exact pair of old failures cannot be truthfully reported as failing.

No SQL, migrations, migration files, deployed RPC/edge edits, feed_config, cap, native or Median changes.