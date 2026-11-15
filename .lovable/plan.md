# BRIEF_COURSES_LIST_PHOTO_CARDS — course list header, photo cards, "Lowest rounds"

Exact match of `courses-list-brief.html`, with the three stated exceptions: the existing
area/region dropdowns and search button stay untouched, the record names one holder, and the
ratings label keeps today's "N RATINGS" count. The Top 100 variant of `BrowseCourseCard`
does not change at all.

## 1. The "Lowest rounds" sort — `src/components/courses/useStatBrowse.ts`
- `STAT_LENSES`: append `'lowest'`. `COURSE_BROWSE_LENSES`: insert `'lowest'` after `'scoreable'`.
- `normaliseLensCounts` loops `STAT_LENSES`, so `lens_counts.lowest` is read and the
  fail-open path (null counts → every lens offered) comes free. No client-side eligibility.
- New exported helper `browseFiguresForScope(rows, scope)` in the same file: the same
  arithmetic `groupBrowseRegions` uses (course count, summed rounds, rounds-weighted
  `avg_to_par`), for `{ region }`, `{ country }` or `{}`. Rows come from
  `useCourseBrowseTruth`, which gains `baseRows` in its result so the helper has the rows
  the read already fetched — one read, no second query.
- `sampleLine` in `StatBrowse.tsx` gets a `'lowest'` branch identical to `'chase'`
  (`statBrowse.sample.record`).
- `browseBoards` gains the fifth chip, labelled **Lowest rounds**.
- Analytics needs no change: `stat_browse_lens_changed` / `stat_browse_viewed` already carry `lens`.
- `public/locales/en/courses.json` → `statBrowse.lens.lowest` = label "Lowest rounds",
  description "Courses by their record round, lowest first."

## 2. The header — replaces the "Every course we hold" section
- `CoursesBrowsePage.tsx`: delete the `section id={ALL_COURSES_ANCHOR}` block (SectionHead
  "Every course we hold" + the four-figure row) and the imports it alone used
  (`SectionHead`/`SECTION_WRAP`/`HEAD_GAP`, `HERO_FIGURE_LABEL`/`_VALUE`, `FiguresRowShell`,
  `useCourseBrowseTruth`). `GATE_IDS` is unchanged; the `'figures'` report moves with the header.
- New `src/components/courses/browse/ListScopeHeader.tsx`, rendered by `StatBrowse` above the
  sticky control bar (not sticky itself), carrying `id={ALL_COURSES_ANCHOR}` so By region
  tile taps still scroll here.
  - Caption 10px/800/0.18em uppercase `A.DIM`: "EVERY COURSE IN {REGION}" with a region,
    "EVERY COURSE IN {AREA}" with only an area, "EVERY COURSE PLAYED" with neither.
  - Figures: three equal centred columns, `paddingTop: 10`; label 9px/800/0.14em `A.DIM`
    (COURSES, ROUNDS, PLAYS TO) above 22px/700 `A.INK` tabular values.
  - PLAYS TO via `fmtToPar`, `level` shown as "Level", under par in `TOPAR_RED`.
  - No played courses in scope → caption only.
  - Header box sits 14px above the control row.
- `StatBrowse` reports `useSectionReady('figures', ...)` from the truth read it already makes.
- Search placeholder follows the scope: "Search Kent courses" / "Search England courses" /
  "Search courses" (new `t` keys with in-code defaults, matching the existing
  `statBrowse.search.*` idiom).

## 3. The card — browse variant only, `BrowseCourseCard.tsx`
- Container `position: relative; overflow: hidden; background: A.CANVAS; min-height: 190px`.
- Photo absolutely positioned at the top, full width, `PHOTO_H` 196 → **190** (the browse
  skeleton reads the constant), `object-fit: cover`, `object-position: center top`, same srcset.
- Fade: absolute over the photo, height 190, exactly
  `linear-gradient(180deg, rgba(10,10,12,0.15) 0%, rgba(10,10,12,0) 20%, rgba(10,10,12,0.62) 48%, rgba(10,10,12,0.97) 88%, #0A0A0C 100%)`,
  replacing the bottom-58% gradient (which the Top 100 branch keeps).
- Content `position: relative; z-index: 1; padding: 63px 0 14px`, horizontal padding 16 throughout.
  - Name 22px/800/-0.01em, `text-shadow 0 1px 8px rgba(0,0,0,0.35)`, one line with ellipsis;
    location 12.5px `rgba(255,255,255,0.85)`.
  - Record row (new, `padding: 12px 16px 0`, flex, gap 10, centred): renders only when
    `row.course_record != null` AND the holder read returned a non-empty `holder_name` whose
    `record_gross` equals `row.course_record` — the Top 100 card's rule, never a username.
    `SquircleAvatar` 26 (canonical gradient + initials fallback), middle column
    "COURSE RECORD" 9px/800/0.14em `RECORD_GOLD` above the holder name 13.5px/600 `A.INK`
    with ellipsis, right column `margin-left: auto`, never wrapping: score 22px/700
    `RECORD_GOLD` tabular above "GROSS" 8.5px/800/0.14em `A.DIM`.
    `RECORD_GOLD = '#E2B04A'` as a named constant.
  - Plays line `padding: 10px 16px 0`, 13px, `rgba(248,250,252,0.62)`, figures `A.INK`/700,
    `white-space: normal` so it wraps instead of overflowing at 320px. Wording and the
    80%/20% comparison rule unchanged.
  - Ratings `padding: 10px 16px 6px`: the existing `CategoryScores` split layout with its
    lead; lead figure 28px/700, lead label 8.5px/800/0.14em `A.DIM`, still "N RATINGS".
    The Top 100 lead keeps its current 24px/800 + 9px/700 treatment.
  - `RankBadge` stays at `top: 14, left: 16`.
- `STAT_BROWSE_CARD_GAP` 24 → **0** for the list and its skeleton.
- New `src/components/courses/useCourseRecordHolders.ts`: key `['course-record-holders', sortedIds]`,
  `staleTime: 10 * 60_000`, `get_course_record_holders(p_course_ids)` in chunks of ≤100
  (cast `as never` like other new RPCs), then the sequential `user_profiles` read
  (`id, profile_photo_url`, `deleted_at` null) exactly as `useTop100Enrichment` reads faces.
  Guests may call it. `StatBrowse` hands the entry for each row to the card.

## Tests
New `src/test/coursesListPhotoCards.test.tsx`:
- lens list + chip: `lowest` last in `STAT_LENSES`, after `scoreable` in `COURSE_BROWSE_LENSES`,
  "Lowest rounds" as the fifth chip, and the facets fail-open path (null `lens_counts`) still
  offering it; `sampleLine`'s `lowest` branch emits the record sentence.
- header: the three scopes, and a region scope equal to that region's By region tile figures
  straight out of `groupBrowseRegions`; caption-only when the scope has no played courses.
- record row: shown for a matching holder; hidden for a missing holder, a blank name, and a
  `record_gross` that does not equal `row.course_record`.
- Top 100 variant unchanged: same props as `Top100CoursesHubPanel` still produce the
  178px photo, the members line, "Best N by X" and no "COURSE RECORD"/"GROSS" row.
- one `PHOTO_H`/`min-height` case: a card with nothing under the name is still 190px.

Existing tests touched, named with their assertion:
- `src/test/coursesBrowseHighestRatedRemoval.test.tsx:50` asserts
  `expect(view.container.querySelector('#${ALL_COURSES_ANCHOR}')).not.toBeNull()` on a page
  whose `StatBrowse` is mocked — the anchor now lives inside `StatBrowse`, so that line moves
  to the new header's test. Nothing else in that file changes.

## Checks
- Render at 320, 375 and 430 with a long course name, a long holder name, no record, no rounds
  and no ratings: nothing overflows, the score never wraps, an empty-below-name card is 190px.
- Full suite in four separate shard commands, total reported against the 8,881 baseline.

## Not doing
No SQL, no migrations, no migration files, no RPC or edge-function edits. `feed_config`
untouched, `round_pool_cap` stays 30. Two things the brief is silent on, reported not changed:
`lensUnavailableReason` gives `lowest` the generic "Nothing tracked" reason (only
rated/longest/chase have specific ones), and `chipForLens` has no `lowest` branch (returns null,
as it already does for any unlisted lens).
