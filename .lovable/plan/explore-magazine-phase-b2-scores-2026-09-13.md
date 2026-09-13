# Explore Magazine Phase B2 — Scores

## Goal
Add the Scores view between All and Watch, using the accepted consequence engine for geographically scoped round cards. Preserve All and Watch behavior.

## Build
1. Reuse the standing shelf’s ordinal formatter for all rank consequence headlines. English receives ordinal suffixes; de/es/ja/ko receive plain figures.
2. Add a reusable viewer geography hook that resolves:
   - canonical primary club from the profile;
   - county from that club’s course, falling back to the viewer’s most-played course;
   - country from the profile, falling back to the club course’s sub-country.
3. Add the Scores chip and a Scores-only scope row. Default to My club, then county, then World when neither exists.
4. Filter the accepted round stream by club, county, country, or World. Rank it with the existing weights, then apply consequence-kind cadence for this single card type.
5. Render the standing shelf first. For club/county scope with a resolved club, add the reusable “This week at {club}” shelf using the existing club recent board and its real `pool_rounds` total.
6. Replace the standing shelf only for viewers with no played courses with the localized handicap-connect sentence and existing connect flow. Round cards remain visible below it.
7. Add and label Scores view, scope-change, and connect events; retain existing standing/card events.

## Technical details
- Query keys include the viewer ID and scope inputs.
- `gam_round_stats.course_id` joins directly to `golf_courses.id`; no WHS bridge.
- Every rank field size continues to come only from `get_viewer_standing.field_now`.
- Loading gates use `isFetched`; unresolved data is not treated as absent.
- Empty scoped round content renders no empty message; the connect sentence is the sole Scores empty-state copy.
- Shared changes remain additive and preserve existing defaults.
- No database migration or SQL is required for this client-composed phase.

## Verification and report
- Run focused checks plus the project build harness.
- Inspect 320px and 390px source/render geometry for horizontal overflow and island clearance where authenticated data permits.
- Report resolver paths available for test accounts, reused helper name, consequence-kind cadence, analytics invocation grep, contradictions, and all device checks as landed but not verified.
