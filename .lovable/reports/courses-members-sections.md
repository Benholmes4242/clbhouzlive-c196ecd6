# BRIEF_COURSES_MEMBERS_SECTIONS — Latest holes pill + reviewer's rounds strip

## Built
- §1 `src/components/courses/browse/holePlays.ts` (new): rank row type, `playsFigure`
  (`level` / `+0.42` / `−0.15`), `rankPhrase` (rank 1 = "Hardest hole", else ordinal via the
  courses surface's own `ordinal` from `youBits`), `toRanksMap` (course AND hole keyed,
  incomplete rows dropped), `RANKS_MAX_IDS = 50`.
- `LatestHolesSection.tsx`: one `get_course_hole_ranks` read for the distinct loaded course
  ids (key `['gam_rpc','get_course_hole_ranks', sorted ids]`, `staleTime: 10 * 60_000`,
  batches of 50). Card shows the pill above the course name and extends its aria-label
  ("Hole 4, Ballybunion, plays +0.42, 3rd hardest hole"). Tile readiness unchanged: cards
  never wait on ranks; only the page-gate report does.
- `latestHoles.css`: `.latest-hole-plays` per the mock's `.plays` (inline-flex, baseline,
  gap 6, margin-bottom 8, padding 5px 9px, radius 999, rgba(10,10,12,.55), 1px
  rgba(255,255,255,.18), 11px/700 #FFFFFF, tabular; muted `em` 600 rgba(255,255,255,.7),
  max-width 100%, nowrap, overflow hidden, ellipsis). Under-par figure paints `TOPAR_RED`.
- §2 `src/components/courses/reviewAuthorRounds.ts` (new) + `useReviewAuthorRounds.ts` (new):
  one `get_review_author_rounds` read for the whole pool (key includes the viewer,
  `staleTime: 5 * 60_000`, ≤100 ids per call; pool cap is 80). `toParFigure` (+7 / E / −2),
  `roundsLabel` (1 = ROUND HERE), `bestLabel` (own = YOUR BEST).
- `ReviewRailSlot.tsx`: opt-in `authorRounds` / `viewerId` props; strip below the reviewer
  row (margin-top 10, gap 16, value 16/700 INK tabular, label 8.5/800/.14em INK_FAINT,
  to-par 11px INK_MUTE +2px, under par `TOPAR_RED`, no dividers). Absent row = no strip;
  null best = rounds only. Every other caller is unchanged.
- `LatestReviewsSection.tsx` passes both through; `CoursesBrowsePage.tsx` runs the read and
  adds `authorRounds.settled` to the `latestReviews` GateReport. `src/lib/batches.ts` (new)
  is the shared fixed-size batcher.

## Tests
- New `src/test/coursesMembersSections.test.tsx`: 23 cases (copy rules incl. 1st–23rd
  ordinals and signed figures; pill show/hide, rank-1 wording, under-par red, other-hole
  rank, ranks error; strip singular/null best/own review/absent row/no-props caller; both
  gates holding then opening, and no read for an empty pool).
- Harness only (no assertion changed): QueryClientProvider added to
  `coursesWholePageHold.test.tsx`, `coursesBrowseHighestRatedRemoval.test.tsx`,
  `coursesPhotoTopScrims.test.tsx` — the page and the rail now own a real read, so those
  mounts needed a client.
- Two assertions in `src/test/latestHolesSection.test.tsx` narrowed, both encoding "the tap
  performs no network read": `expect(f.holeRpc).not.toHaveBeenCalled()` became a
  before/after call-count comparison in
  "a tap opens the canonical viewer readOnly on the tapped shot across the whole rail" and
  "a tap opens immediately with no network wait", because the pill read itself fires on
  mount. No test deleted, renamed or rewritten.

## Counts
Baseline 8,858 → 8,881. Shards: 2,255 / 2,162 / 2,222 / 2,242 = 8,881
(= 8,858 + the 23 new cases; shard 2 and 4 shifted because the new file joins the run).
No failures; no known intermittent or pre-existing failure appeared.

## Render check (320px, live data)
document.scrollWidth 320 (no page overflow); 4 pills, all inside their tiles with no
truncation (e.g. "Plays +0.49 · 13th hardest hole"); 32 strips, no card overrun; at 1280
docScroll 1280, 0 overruns. Signed-out viewer reads THEIR BEST on every strip.

## Not done
No SQL, no migrations, no RPC/edge edits, feed_config untouched, round_pool_cap 30.
