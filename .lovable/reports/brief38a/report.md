# Brief 38A — Brief 38 Part C: remove the old ten block

## Tests retargeted (TenBlock → TenRail)
brief31TopTen.test.tsx
- "null member scores leave corners empty, while 9.1 appears plainly" (name kept): `[data-ten-position="n"] [data-ten-corner-score]` → `[data-ten-rail-rank="n"] [data-ten-corner-score]`.
- "tile 6 opens after row 7, toggles closed, and tile 2 moves it after row 4 with other tiles dimmed" → "tapping course 6 opens the band after the ticks, toggles closed, and course 2 replaces it with other cards dimmed". Old: `[data-ten-band-after="7"]`, `previousElementSibling` has `data-ten-position=7`/`4`. New: `[data-ten-rail-band]`, `previousElementSibling` has class `clb-ten-ticks`; dimming/toggle the same; after tapping 2, one band whose `.ten-band-name` is "Course 2".
- "owner and signed-out bands have two score columns; signed-in visitors have three" (name kept): mounts TenRail; same expectations.
- "course deep links open the band and course comments retain owner/course/comment identity" (name kept): `initialCourseId` → `openBandOnCourseId`; old `[data-ten-band-after="7"]` not null → new `[data-ten-rail-band] .ten-band-name` is "Course 6"; dialog owner/course/comment assertions unchanged.

brief34ProfileTenRail.test.tsx
- "the feed block pill carries the glass background" → "the feed rail pill carries the glass background": `[data-ten-rail-rank="1"] [data-ten-corner-score]`, same `rgba(10, 10, 12, 0.5)`.
- "no surface renders \"clbhouz Ten\"" (name kept): TenBlock mount → TenRail mount; file list `TenBlock.tsx` → `TenRail.tsx` + `TenBand.tsx`.

## Tests deleted
- brief31 "gapped positions stay empty at 4,7,8,9,10 and owner empty slots use Add" — listed in brief.
- topTenOwnerLabelRender "positions two to ten are square with rank at the top left" — listed in brief.
- brief31 "tile names are held to one line with ellipsis" — NOT named in the brief; it mounted TenBlock and asserted `.ten-name` nowrap/ellipsis. Rail names (`.clb-ten-name`) intentionally clamp to two lines, so the behaviour no longer exists; deleted under the brief's rule. Flagged for Ben.
- (Row-placement assertions were part of the retargeted tap test, not a separate test.)

## Removed
- `src/components/topTen/TenBlock.tsx` (TenBlock, TenBlockSkeleton). TenBand and TenPills moved to `src/components/topTen/TenBand.tsx`; TenRail and brief31 imports updated.
- `tenRowEnd` from topTenModel.ts (no other user).
- CSS in top-ten.css: `.ten-block`, `.ten-block .ten-tile`, `.ten-block .ten-tile-one`, `.ten-tile[data-dimmed]`, `.ten-photo`, `.ten-fade`, `.ten-tile-one .ten-fade`, `.ten-tile[aria-expanded] .ten-fade` and `::before`, `.ten-rank`, `.ten-tile-one .ten-rank`, `.ten-empty .ten-rank`, `.ten-score`, `.ten-tile-one .ten-score`, `.ten-bottom`, `.ten-name`, `.ten-loc` and their `.ten-tile-one` variants, `.ten-band-wrap`, `.ten-feed-block`, `.ten-skeleton .ten-tile`, `@keyframes ten-pulse`, reduced-motion `.ten-tile` rule. Kept `.ten-score-pill`, `.ten-rail-score`, all `.ten-band*`.
- Two code comments naming TenBlock reworded (SnapFeed.tsx, useGlobalSearchV2.ts).

## Grep
`rg "\bTenBlock\b|TenBlockSkeleton|\.ten-block|\.ten-tile|tenRowEnd" src` → no matches. TenBlockData/useTenBlock(s) remain.

## Tests
Four sequential shards (`npx vitest run --shard=n/4`): 2,575 + 2,568 + 2,715 + 2,899 = 10,757 tests / 940 files, 0 failures. Brief 38 baseline 10,760 / 940: −3 = the three deletions above. Build OK.

## Screenshots (390, temporary fixture harness with catalogue course photos, signed-out viewer; deleted before commit)
`390_feed.png`, `390_profile.png`: cards 264×322, no horizontal overflow, same as Brief 38. Not Ben's live account; permalink and Courses chart not recaptured (unchanged code paths, covered by tests).

No SQL, no migrations, feed_config untouched, round_pool_cap 30. No security "Fix all".
