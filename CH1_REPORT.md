# CH1 — CLOSED (CH1_FIX_1, 2026-11-05)

- Fixture-only fix in `src/test/ch1ChampionsTidy.test.tsx:50` (direct-drilldown branch of `mount()`): added `fieldAvgOverPar={8} totalCourseRounds={40}`, matching the file's own `useCourseStatsDetail` mock (avg_over_par 8, rounds_tracked 40). Prop names/types confirmed against `GolfClubView.tsx` (`courseStats?.avg_over_par ?? null`, `courseStats?.rounds_tracked ?? null`) and `CourseLegendsDrilldown` Props (`number | null`). No assertion, case name, expected value or product file changed.
- Focused set (ch1ChampionsTidy, championsNetSource, championsElsewhere, championsState1/2/3, g2aCourseTabs): 7 files, 55/55 passed.
- Full suite, `--maxWorkers=2`, four shards: 1,829 / 1,659 / 1,782 / 1,757 = **7,027 tests / 619 files, zero failures, no flakes, no pre-existing failures**.
- Count vs brief's 6,980 / 614: +47 tests / +5 files come entirely from builds landed after CH1's baseline — FIX6 sign-up and pro fixes (expected 6,997 / 617) and pro polish (to 7,027 / 619), both already reported and closed.

---

# CH1 — completed edit, stopped on new check failures

## Preview type-error follow-up

The subsequent request explicitly authorised fixing preview type errors without asking. Added `courseRegion: null, courseCountry: null, courseType: null` to the new test's selection fixture at `src/test/ch1ChampionsTidy.test.tsx:44`; no assertion/case-name change. Preview log now reports **build OK at 2026-11-05T17:50:18Z**. The TS2739 stop below is historical and resolved. The independent Field-panel assertion failure remains unchanged; tests/shards were not rerun in this type-error-only follow-up. Suite inventory remains expected 6,980/614, not a fresh passing total.

## Current stop

Ben chose **Successful reads only**, accepting absent Within reach after failed/empty You reads. The prerequisite stop below is historical and resolved; You remains unchanged.

Implemented the scoped changes:
- Posted no longer renders What it takes; its function stays exported on disk to avoid an unused-function warning. Defence is retained.
- Course page passes `includeElsewhere={false}`; drilldown default is true, preserving possible non-course reuse and the on-disk Elsewhere module/helper.
- Posted course link uses the signed-off geometry, A.INK/A.DIM/A.TRACK, and the shared Button. Callback tracks `champions_you_link_tapped` with course_id and invokes GolfClubView's existing tab handler.
- The link alone resets the actual page/modal scroll ancestor on the next frame. The existing tab handler has no scroll call; ordinary pill behaviour is intentionally untouched rather than silently changed.
- FieldChampions, ProjectedChampions, CourseYouTab, existing cabinet/board/sheets and other frozen presentation are unchanged.

### Failure output, preserved without repair

Focused command: `bunx vitest run src/test/ch1ChampionsTidy.test.tsx src/test/championsNetSource.test.tsx src/test/championsElsewhere.test.tsx src/test/championsState1.test.tsx src/test/championsState2.test.tsx src/test/championsState3.test.tsx src/test/g2aCourseTabs.test.tsx --maxWorkers=2`.

Result: **54 passed, 1 failed / 55 tests**, six passed files and one failed file. Full output: `docs/verification/ch1/focused.log`.

```text
FAIL src/test/ch1ChampionsTidy.test.tsx > CH1 Champions tidy > field keeps What it takes without the You link
AssertionError: expected null not to be null
❯ src/test/ch1ChampionsTidy.test.tsx:78:66
expect(subtree?.querySelector('.champions-field-panel')).not.toBeNull();
```

The new direct-drilldown fixture omits `fieldAvgOverPar` and `totalCourseRounds`. The unchanged Field comparison requires both (`championsField.ts:12–14`); it correctly omits that panel. No passing production component was altered for this fixture, and no failing assertion was edited.

The finished edit also has this surviving harness type error; full log copied to `docs/verification/ch1/build-stop.log`:

```text
=== build 2026-11-05T17:48:52Z ===
--- typecheck ---
src/test/ch1ChampionsTidy.test.tsx(50,92): error TS2739: Type '{ courseId: string; courseName: string; }' is missing the following properties from type 'CourseSelection': courseRegion, courseCountry, courseType
```

Per **ANY NEW FAILURE IS STOP AND REPORT**, neither failure was repaired or rerun. No pre-existing failure observed; all six existing focused files passed. Shards 1–4 and browser verification were not started. The flake exception does not apply to a new file.

### Test inventory and assertion ledger

- Last full-suite baseline: **6,973 / 613**. Source inventory after this edit: expected **6,980 / 614**, +7 cases/+1 file solely from `src/test/ch1ChampionsTidy.test.tsx`; full suite not executed, so this is not a passing total.
- New seven cases cover posted absence/link, Defence, Projected and Field preservation, course-only Elsewhere, and standalone/modal link navigation, analytics and real scroll owner.
- Only existing rewritten assertion: `src/test/championsNetSource.test.tsx:78`, case **PD2: Your defence replaces What it takes only when the selected board is owned**. Old `expect(document.querySelector('[data-section="what-it-takes"]')).not.toBeNull();` → new `expect(document.querySelector('[data-section="what-it-takes"]')).toBeNull();`. Reason: CH1 expressly removes that posted section on non-owned boards. Case name and all other assertions are unchanged.
- No tests deleted or renamed; no existing fixture additions. New coverage uses real I18nextProvider, MemoryRouter and QueryClientProvider, with local data fixtures.

### Needed to resume

Course selection fields are now repaired under the type-error follow-up. Authorise passing the existing field average/round-count props to the new direct-drilldown fixture, without changing its assertions or product behaviour; then rerun focused checks and four fresh shards.

`git pull` was not run because stateful repository commands are forbidden. All SQL/migration/server/native/feed_config/cap and protected-surface bans were preserved.

## Historical prerequisite audit (resolved by Ben's ruling)

## Required verification does not establish parity

The brief requires: “confirm that every viewer who reaches the posted state also gets the You tab's ‘Within reach’ section” and “STOP AND REPORT that case before removing anything.”

Posted Champions is selected when a WHS connection exists, the active actor is the signed-in member, and `meta.your_rounds > 0` (`CourseLegendsDrilldown.tsx:408,590`). It does not depend on the You tab's history, personal-status or member-standings reads.

The You tab has additional independent conditions:

- `CourseYouTab.tsx:181–182,345–350`: personal status and both round reads must succeed (`roundsSettled`) before anything beyond its skeleton renders. `useCoursePersonalStatus.ts:145–147` requires both independent queries to be successful. A failure in either leaves a posted Champions viewer without Within reach on You.
- `CourseYouTab.tsx:580–589`: even after settlement, `allRoundsLoading || !allRounds` returns the skeleton. `useMyRoundsAtCourse.ts:123` throws on history errors. A connected member with positive Champions meta and a failed You history read therefore remains posted on Champions but gets no Within reach on You.
- `ManySections.tsx:350–352`: `WithinReachSection` returns `null` when its `rows` array is empty. `CourseYouTab.tsx:620–645` populates those rows only from a visible gross holder plus a scored lifetime best, or stableford/differential/rounds standings. `useMemberStandings.ts:64–66` returns an empty list on read error. With no visible gross holder and empty/failed standings, posted eligibility can remain true while Within reach is absent. Champions' visible boards need not include gross.

These are source-confirmed render paths, not claims that a particular live member currently hits them. WHS ownership itself agrees between the two tabs; that alone does not satisfy the brief's universal guarantee. Loading can also differ, but the failed-read cases do not resolve merely by waiting for the successful Champions request.

## Caller and scope audit

Whole-src production caller search found only `GolfClubView.tsx:332` rendering `CourseLegendsDrilldown`. No additional production entrypoint needs an opt-in Elsewhere preservation prop today. Elsewhere remains rendered at `CourseLegendsDrilldown.tsx:685–688`. Posted What it takes and Defence remain unchanged at `PostedChampions.tsx:115`.

Independent read-only audit confirmed these cases. Actual Posted rendering also requires nonempty legends data (`CourseLegendsDrilldown.tsx:572–590`); the empty-reach case above assumes other visible categories remain, not an entirely empty legends response. The existing `GolfClubView.handleTabChange` at lines 186–203 changes tab/URL/analytics but does not itself scroll; any resumed link work must reconcile the brief's requested top scroll with that existing behaviour without silently altering the frozen You tab.

## Historical action needed (resolved)

Clarify whether the required parity applies only after successful You reads with nonempty reach rows, or authorise a change that provides the missing reach surface. The present brief freezes You; this task does not silently change its gating, invent rows, or weaken the prerequisite.

## Historical read-only verification before the ruling

- Read the uploaded brief and signed-off mock; inspected state routing, You eligibility, history/standings reads, reach rendering and production callers.
- Recorded CH1 in the roadmap and saved the user's course-tab ownership requirement.
- No product, test, assertion, case-name or fixture edits; no tests added, deleted or renamed.
- No tests or shards executed; last reported suite baseline remains **6,973 tests / 613 files**, delta **0 / 0**. No fresh suite claim or pre-existing test failure observed in this task.
- Latest preview log: `2026-11-05T17:44:43Z`, `build OK`; no manual build/typecheck or browser verification run.
- `git pull` was not run: repository stateful commands are forbidden by the workspace instructions.
- No SQL, migrations, deployed RPC/edge changes, feed_config, cap, native/Median, guest browsing, review wizard, news or round-plot changes.

The signed-off mock is authoritative for the new link only; frozen cabinet, board and other existing presentation have not been restyled.