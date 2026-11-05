# CH1 — prerequisite stop before product changes

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

## Action needed

Clarify whether the required parity applies only after successful You reads with nonempty reach rows, or authorise a change that provides the missing reach surface. The present brief freezes You; this task does not silently change its gating, invent rows, or weaken the prerequisite.

## Work and verification

- Read the uploaded brief and signed-off mock; inspected state routing, You eligibility, history/standings reads, reach rendering and production callers.
- Recorded CH1 in the roadmap and saved the user's course-tab ownership requirement.
- No product, test, assertion, case-name or fixture edits; no tests added, deleted or renamed.
- No tests or shards executed; last reported suite baseline remains **6,973 tests / 613 files**, delta **0 / 0**. No fresh suite claim or pre-existing test failure observed in this task.
- Latest preview log: `2026-11-05T17:44:43Z`, `build OK`; no manual build/typecheck or browser verification run.
- `git pull` was not run: repository stateful commands are forbidden by the workspace instructions.
- No SQL, migrations, deployed RPC/edge changes, feed_config, cap, native/Median, guest browsing, review wizard, news or round-plot changes.

The signed-off mock is authoritative for the new link only; frozen cabinet, board and other existing presentation have not been restyled.