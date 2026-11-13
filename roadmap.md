# Roadmap

## Blocked: Read-only WAGR feasibility probe
- Add and deploy only probe-wagr-profile with existing service-role/admin authentication, sequential public reads and complete response evidence.
- Invoke once for lewy-hayward-41967; save the full response and invocation auth in .lovable/reports/wagr-probe.md, or report unavailable access and stop.
- No SQL, migrations, persistence, scheduling or client changes.
- Validation stopped: index.ts:7:29 TS2307 Cannot find module 'npm:@supabase/supabase-js@2/cors'. Not deployed or invoked; full error and auth status in the report.

## Complete: Member-shot vertical paging follow-up
- Latest holes opens one synthetic page per ready shot; course rail opens one page per loaded course with sideways media.
- Preserve the tap snapshot and append neighbour media without moving existing slides; add scoped tests and run four separate shards.
- Focused 92/92 passed; shard 1 executed 2,183 (2,181 passed, 2 failed). Shards 2–4 unrun under the stop rule.
- Applied the authorised coursesPhotoTopScrims mock exports only; existing memberShot fields refresh in place with repeat-call identity stability.
- Separate shards 2,183 / 2,039 / 2,185 / 2,186 = 8,593 passed, zero failures; +11 from the 8,582 baseline, no delta in this follow-up.
- Reports: .lovable/reports/member-shots-vertical-paging.md and member-shots-vertical-paging-followup.md; authenticated browser checks remain unavailable for the externally managed service.

## Complete: Member-shot gallery layout
- Share one gallery-layout predicate for rect, backdrop, gradient and notch protection; leave chrome and open calls unchanged.
- Nine new synthetic/non-synthetic regression cases; separate shards 2,170 / 2,036 / 2,179 / 2,197 = 8,582 passed (+9 from 8,573).
- Changed lines, CSS loading and assertion accounting: .lovable/reports/member-shot-gallery-layout.md. Real-member browser checks remain unverified.

## Complete: Follow tile posted-age lines
- New pure tilePostedLine (days/weeks/months/over-a-year) replaces activityLine on the tile only; active ring unchanged.
- findPeople.tile.* keys added to all six locale files; +16 tests.
- Shards 2,170 / 2,032 / 2,181 / 2,190 = 8,573 passed. Report: .lovable/reports/follow-tile-posted-age.md.

## Complete: Counting eight A2 tile grid + NET
- NET via one useRoundNetScores call; detail block lines swapped (counts right of course, date after DIFF).
- Two-column tile grid replaces the chip box; dimming only when the selected round counts.
- Authorised test edits (a)–(d) only; shards 2,168 / 2,020 / 2,183 / 2,186 = 8,557 passed. Report: .lovable/reports/counting-eight-a2.md.

## Complete: Follow tile buttons + Tour slot photo height
- Follow/dismiss Buttons drop variant/size classes; in-tile CSS raised to two-class specificity, values unchanged.
- Tour slot photo is TOUR_SLOT_PHOTO_HEIGHT = HERO_PHOTO_HEIGHT - 10 (340); overlay bottom-anchored.
- Authorised rail-only assertion fix in proVerification2B (old inline-style line quoted in report).
- Four separate shards: 2,168 / 2,020 / 2,183 / 2,185 = 8,556 passed, zero failures. Report: .lovable/reports/follow-tile-buttons-tour-photo.md.

## Complete: Signed-off Option B follow tiles
- Shared rail tiles use settled media → cover → no-image selection with poster-only video glyphs; follow/dismiss/session/order/header/analytics preserved.
- Authorised test-side fixes: kindRails Follow selector, proVerification2B settled covers/media mocks.
- Verified within the 8,556 full-suite run above; earlier stop reports: .lovable/reports/follow-tiles-option-b-stop.md, follow-tiles-option-b-authorised-fix.md, follow-tiles-option-b-mock-fix.md.

## Complete: Tour slot placement and shared photo height
- Move the slot after post 8 and Pros after post 10; all sibling placements stay unchanged.
- Import the shared hero photo height without moving the overlay or changing other styles.
- Two placement cases updated; separate shards passed 2,168 / 2,020 / 2,173 / 2,173 (8,534, unchanged). Report: .lovable/reports/tour-slot-placement-height.md.

## Complete: Four-build test verification and authorised repairs
- Both final test-only repairs applied exactly; CSS assertions and Tour slot binding assertions preserved.
- Four separate shards: 2,155 / 2,026 / 2,159 / 2,187 passed; full suite 8,527 passed, 748 files, zero failures.
- Notch/tie, observer repair, Option E and saved Tour slot are suite-verified; all new/changed cases, old assertions and count reconciliation: .lovable/reports/combined-tour-final-tests.md.
- Ben's 390/320 comparison and real-member like/comment verification remain pending; no application code changed in these final repairs.
