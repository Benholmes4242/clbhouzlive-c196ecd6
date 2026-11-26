# Brief 38 — The ten in the Clubhouse feed as the profile rail

## Files changed
- `src/components/topTen/TenRail.tsx` (new): shared rail body — measured card size (ResizeObserver, `chartCardSize`), `.clb-ten-rail` scroller, TenRailCard list, ticks, active index, TenBand (220ms, tap same closes, tap another moves, swipe never closes), hint row, TenPills, course comments sheet. Also `tenPostOpening` (feed opening rules) and `TenRailSkeleton`.
- `src/components/profile/hero/ProfileTopTenRail.tsx`: keeps heading, invitation, Manage, deep link sourcing and share sheet; renders TenRail.
- `src/components/feed/FeedCard.tsx`: top_ten branch renders TenRail / TenRailSkeleton edge to edge (`.clb-ten.ten-feed-rail`), no hint action, pills for visitors.
- `src/components/topTen/topTenModel.ts`: kind adds `new_number_one | new_course`; optional `courseId`, `pronoun`; block optional `post_course_id`, `post_pronoun`.
- `src/components/topTen/useTenBlocks.ts`: lifts `block.post_course_id`/`post_pronoun` to `courseId`/`pronoun` (null when absent → opens at #1).
- `src/styles/top-ten.css`: added `.ten-feed-rail` rules (padding 0, rail mt 12, dim/selected line, hint mt 12 when band open, pills mt 10 / 0 16) and skeleton rules. Profile rules untouched.

## Part C clean-up — NOT done (conflict, awaiting ruling)
Brief: "Once nothing imports TenBlock or TenBlockSkeleton, delete them" vs "the existing Brief 34 tests must pass unchanged".
`src/test/brief34ProfileTenRail.test.tsx` imports `TenBlock` (lines 20, 106, 143) and reads `src/components/topTen/TenBlock.tsx` (line 146); `brief31TopTen.test.tsx` and `topTenOwnerLabelRender.test.tsx` (`.ten-block .ten-tile` rule, line 98) also depend on the block and its CSS. The precondition is not met, so no file or selector was removed. TenBlock and TenBlockSkeleton are now imported by no app code, only by tests.

## Tests
- New `src/test/brief38FeedTenRail.test.tsx`: 7 tests (brief items 1–7), all pass. Item 8 = Brief 34 file passes unchanged.
- Rewritten (feed photo block, as the brief expects): `brief31TopTen.test.tsx` "missing feed rows render nothing and visible/pending cards never show post content" —
  old: `querySelector('[data-ten-block]')).not.toBeNull()` / `querySelector('[data-ten-skeleton]')).not.toBeNull()`;
  new: `querySelector('[data-ten-rail]')).not.toBeNull()` / `querySelector('[data-ten-rail-skeleton]')).not.toBeNull()`. Count unchanged.
- Four sequential shards (`npx vitest run --shard=i/4`): 2,575 + 2,568 + 2,717 + 2,900 = **10,760 tests / 940 files, 0 failures**. Baseline Brief 37A 10,753/939 → +7/+1, entirely `brief38FeedTenRail.test.tsx`.

## Responsive (temporary fixture harness, catalogue course photos, deleted before commit)
- 390: 264×322; 375: 253×308; 320: 213×259. No horizontal overflow at any width; names clamp at 2 lines (320).
- new_course fixture opens at scrollLeft 1370 = 5×(264+10) at 390.
- Skeleton: same rail, tick and hint height as loaded; visitor pills cannot be known before load, so a visitor post with pills grows by the pills row when it loads (owner posts do not). Reported, not invented.

## Captures (`captures/`)
`{390,375,320}_rest`, `_joined`, `_tap`, `_permalink`, `_profile`, `_skeleton`. Signed-out harness viewer, so cards show Golfers/Tens and the band has two columns; signed-in visitor (Golfers/You, three columns) verified by jsdom tests only — sign-in sessions cannot be minted for this project.

## Not verified
Live feed post and real permalink (no signed-in session); post_course_id behaviour against Ben's SQL (not yet run). Security findings not checked.

No SQL, no migrations, feed_config untouched, round_pool_cap 30.
