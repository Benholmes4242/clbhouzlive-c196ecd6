# EP3 — Your golf: STOP report

## Result

Implemented the hidden `/edit-profile-v2` Your golf group and panels 3B–3E, preserving `/edit-profile` and all visibility values. Work is **not all passing**; stopped at the first completed full-suite failure without modifying existing tests.

## Diff / files touched

- `src/features/edit-profile/EditProfileGolf.tsx` (new): five golf rows, handicap sheet, home-club and other-club sheets, live membership summaries, club location/photo lookup with an icon fallback. Handicap display comes exclusively from `resolveDisplayHandicap`.
- `src/features/edit-profile/golfRules.ts` (new): manual-entry validation preserving standard 0–54 and plus through +10, and same-day/past-day sync labels.
- `src/pages/EditProfile.tsx`: mount golf beneath You; golf partial saves share the existing saved/retry line and update the top card. No ManageProfile changes.
- `src/hooks/useProfileSave.ts`: opt-in `handicap`, `homeClub`, `additionalClubs` partial saves. Manual saves write only `manual_handicap_index`; clearing writes null. Home saves write `home_club` and `primary_club_id` together. Additional memberships retain the existing `user_home_clubs` source, not a nonexistent profile `additional_clubs` column. Visibility columns are never written by these paths; default saves are unchanged.
- `src/features/coach/CoachSheets.tsx`: opt-in row appearance using the existing `useMyCoach` read and unchanged find/manage/naming sheets. Existing callers retain the old appearance and read-error suppression.
- `src/features/edit-profile/edit-profile.css`: scoped EP3 styling following the supplied reference.
- `src/test/ep3EditProfileGolf.test.tsx` (new): 27 cases covering handicap authority, manual save/clear, club selection/add/remove, coach sheet entry, Top 10 refresh, isolated real save payloads, visibility omission, limits and sync formatting.
- `roadmap.md`: implementation status and test stop.
- Project memory: recorded EP3 visibility and shared-editor requirements.

## Shared entry points

**Top 10:** `AddCourseModal` from `src/components/profile/courses/AddCourseModal.tsx`, the same editor mounted in `src/pages/ProfilePageV2.tsx:1284`. Opens with `initialTab="manage"`, the member id and `existingCourseIds={[]}`. The row reads `useUserTopTenCourses`; closing invalidates `['user-top-ten-courses', userId]`.

**Club search:** `openHomeClubPicker({ onSelected })`, the exact picker entry used by `HomeClubCard`, preserving search, confirmation and course-request behaviour. No shared club-picker changes.

**Coach:** `YourCoachRow` with an opt-in appearance; no alternate coach read or new coach sheet.

## Test accounting

Command: `bunx vitest run`.

Last reported baseline: **4,256/4,256 across 446 files**.

Current: **4,272 passed, 11 failed, 4,283 total across 447 files**.

Delta: **+27**, all in new `src/test/ep3EditProfileGolf.test.tsx`, which passed **27/27**. No existing test was edited, deleted, renamed or rewritten; therefore no old → new assertion changes.

### Every failure

All in `src/test/ep1EditProfile.test.tsx`:

1. `EP1 frame > signed in renders the card; signed out renders no card`
2. `EP1 frame > tabs switch and Settings renders SettingsTabContent`
3. `EP1 card > shows name, username and city, and the cover at the personal aspect`
4. `EP1 card > username alone without a city`
5. `EP1 card > index tag only with an index`
6. `EP1 card > home club tag only with a club`
7. `EP1 photos > empty cover opens the square frame at the cover aspect and saves only the header`
8. `EP1 photos > empty avatar opens the squircle frame and saves only the profile photo`
9. `EP1 photos > a failed save shows the retry line and retrying saves again`
10. `EP1 photos > a filled cover opens change-or-remove and remove saves the cleared header`
11. `EP1 photos > a filled avatar offers Remove photo and saves the cleared profile photo`

Same tool error for all eleven:

```text
Error: No QueryClient set, use QueryClientProvider to set one
❯ Module.useQueryClient node_modules/@tanstack/react-query/src/QueryClientProvider.tsx:18:11
❯ EditProfileGolf src/features/edit-profile/EditProfileGolf.tsx:37:14
  const qc = useQueryClient();
```

These are new regressions in existing tests, not pre-existing failures. The EP1 isolated mounts do not provide the query context now required by the new golf group. A real QueryClientProvider in their mount wrapper is the appropriate follow-up, but no test change was made after the stop. **Authorisation is needed before proceeding.**

No pre-existing failure appeared in this run; the historical `ob1Welcome` flake did not fail.

## Verification / restrictions

Latest preview signal: `build OK`, `2026-10-29T05:08:27Z`. No manual build or typecheck was run; the harness owns those checks. Full authenticated browser and visual verification was not performed after the stop; this project reports `external_unmanaged`, so managed authenticated verification is unavailable.

No SQL, migrations, migration files, deployed RPC or edge-function edits, feed_config changes, pool-cap changes, or native/Median changes. `round_pool_cap` remains 30.