# MEDIA_RETAG_1 report

Changed: `src/components/course-media-tab/CourseGalleryTagger.tsx` (one-step retag; no lock, no Remove row, selection-driven primary label via the existing `primaryLabel` prop, so ShotTagCard is unchanged) and `public/locales/en/courses.json` (`media.v3.taggedHole`, `taggedPlace`, `moveHole`, `movePlace` beside `tagHole`/`tagPlace`).
HolePhotoFastPaths and the other adapters are untouched.

New tests: `src/test/mediaRetagOneStep.test.tsx` (+7). No existing test edited.

Shards (`bunx vitest run --maxWorkers=2 --shard=N/4`), logs in `docs/verification/retag/`:
1. 1,995 passed / 12 failed (2,007)
2. 1,847 passed / 8 failed (1,855)
3. 1,990 passed
4. 1,895 passed
Total 7,727 passed, 20 failed, 7,747 executed.

All 20 failures are in hole-tiles board build areas (Also this week, hero board, ties, POS alignment, player rings, round plot gross strip); none touches the gallery tagger. Ruling (Ben, 8 Nov 2026): do NOT repair any of them in this stream — they are pre-existing, owned by the Tour leaderboard / hole-tiles stream, which is mid-build; one touches round plots, off-limits here. Recorded by file and test name:

- src/test/alsoWeekSection.test.tsx
  - weekly section membership and heading > carousel order and four-event cap remain unchanged
  - weekly section membership and heading > no live events hide the count
  - weekly section membership and heading > two live events count as two live in the section head
  - weekly section membership and heading > viewed event is excluded from rows and live count
- src/test/alsoWeekSpacing.test.ts
  - Also this week signed-off spacing > board rows are 33px and your row bleeds 20px
  - Also this week signed-off spacing > who gap is 8px and row faces are 22px
  - Also this week signed-off spacing > faces keep the 34% squircle owned by SquircleAvatar, no pixel-radius overrides
  - Also this week signed-off spacing > tie bracket sits 19px from the edge, 39px on your row
- src/test/cb57HeroBoardRemovals.test.tsx
  - CB57 hero board removals > uses identical position-cell brackets for top and lower ties in completed
  - CB57 hero board removals > uses identical position-cell brackets for top and lower ties in live
- src/test/feedGrossDots.test.tsx
  - FGD1 gross strip beneath the net trace > five gross birdies off three retain five red cells and no allowance-created gold cells
  - FGD1 gross strip beneath the net trace > renders a gross birdie strip cell on a stroke hole in the birdie tone, not gold
- src/test/homeRailEmpty.test.tsx
  - Home rail bands render nothing when empty > round of the week with no featured round mounts nothing
- src/test/playerInitialAvatar.test.tsx
  - PlayerInitialAvatar loading shimmer > load fades the image in and removes the shimmer, with the ring back
  - PlayerInitialAvatar loading shimmer > when every candidate is exhausted the initials show, with no shimmer
- src/test/searchOrderAndFallback.test.tsx
  - FIX3 IN ACTION rail fallback avatars > uses the ResultTile plate, border and initials colour like the Players rows
- src/test/tourHeroRefinements.test.tsx
  - Tour hero refinements > centres every round and total header/cell on independent 32px tracks
- src/test/tourOverviewDesignA.test.ts
  - one board geometry > BoardTable centres THRU and round columns and keeps POS centred
- src/test/tourOverviewMergedAiry.test.tsx
  - Merged Airy lower sections > compresses only the completed hero board
  - Merged Airy lower sections > compresses only the live hero board

`tourIsland.test.tsx:235` did not appear.

Unverified: 320px overflow (no browser pass), device checks 1–3.
