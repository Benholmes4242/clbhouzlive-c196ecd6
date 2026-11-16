# Course list view toggle

## Delivered
- Shared storage-safe Cards/List preference under `courses-list-view`, default cards, both tabs synchronised. Read/write failures fall back to cards; changes report `courses_view_changed` with from/to/surface.
- Signed-off icon pill through RailChips trailing: Courses sort row; Top 100 after existing search. Opt-in fixed trailing keeps controls visible and applies the exact 85% fade only when the chip scroll area overflows; other callers unchanged.
- Compact 22px/48px/minmax(0,1fr)/auto rows, shortCoursePart names, two-line name clamp, record-first detail and area-only ellipsis; Lowest rounds swaps detail to rounds. Canonical lead helper accepts no-fallback mode for missing figures; card fallback remains unchanged. TOPAR_RED and RECORD_GOLD roles preserved.
- Same parent-owned course navigation and analytics callback, full-list positions, Top 100 ranked/unrated split, scroll restore and existing paging/search/empty/directory logic. No new data reads.
- List-shaped loading shells on both list-loading paths and Top 100 whole-page fallback. Latest holes comment updated exactly.
- Cards and dropdown rows unchanged. Frozen mock differences remain as built: existing card typography/rating block and dropdown/chip styling were not restyled to the reference's hand-drawn variants.

## Tests
Baseline **8,927**; after **8,948**, exactly **+21**, all from new `src/test/courseListViewToggle.test.tsx`.
No existing test deleted, renamed or rewritten; no assertion changes to existing files.

New cases (parameterised cases counted separately):
- defaults to cards and exposes the two pressed segments (1)
- persists one preference across both mounted tabs and remount (1)
- storage read failures fall back to cards (1)
- storage write failures return both tabs to cards (1)
- each of played/rated/toughest/scoreable/lowest/longest/chase column and figure (7)
- missing figure for rated/toughest/scoreable/lowest/longest/chase rather than rounds (6)
- Lowest rounds swaps the record detail to rounds (1)
- Top 100 no rounds has no figure or record (1)
- search uses the same original position as cards (1)
- list and card taps invoke the same navigation callback (1)

Focused command:
`npx vitest run src/test/courseListViewToggle.test.tsx src/test/courseListCardV2.test.tsx src/test/coursesListPhotoCards.test.tsx src/components/courses/Top100CoursesHubPanel.test.tsx --maxWorkers=2`
**69 passed**, including all 21 new cases.

Four separate sequential full-suite commands:
1. `npx vitest run --maxWorkers=2 --shard=1/4`: **2,276 passed**, 194 files.
2. `npx vitest run --maxWorkers=2 --shard=2/4`: **2,170 passed**, 194 files.
3. `npx vitest run --maxWorkers=2 --shard=3/4`: **2,240 passed**, 194 files.
4. `npx vitest run --maxWorkers=2 --shard=4/4`: **2,262 passed**, 194 files.
Total **8,948 passed**, 776 files; zero failures/skips. Shard distributions shifted after adding one test file; total delta reconciles exactly +21.
Logs: `/tmp/course-view-focused.log`, `/tmp/course-view-shard1.log` through `shard4.log`.

## Render and flow checks
- Uploaded reference screenshot inspected. Live seven browse lenses and both Top 100 orders at 320/375/430; all root widths exactly viewport width. Shared List preference remained pressed through tab changes; returning Cards rendered the original cards.
- Browser-owned fixture matrix using the actual card/row components: both views, seven browse lenses and two Top 100 orders, full/long-name+long-area, no-record and no-image at all three widths. No horizontal overflow. At 320, `Record 63` width and scrollWidth both 63px: the record remains uncut while the area ellipsises.
- Live search preserved second-row position 2. Real list-row tap navigated to `/courses/35e9d5a0-ac61-47aa-8c56-1cc26aa41675`.
- Screenshots retained under `/tmp/browser/course-view/`; long-320 and switch320 visually inspected, as were live played/lowest/Top 100/cards.
- Public live data/fixture visual verification only. Authenticated member session unavailable for the external unmanaged backend; no authenticated claims made.
- An intermediate helper typo was corrected before finished-edit tests; current build log **build OK** at 2026-11-16T08:32:07Z.

## Constraints and save
No SQL, migrations, feed_config, round_pool_cap, backend, native or deployment changes. Existing cards unchanged; no change to chipForLens or fullscreen viewer.
Implementation saved by platform maintenance checkpoint `9c0f3e6c03`; final report and roadmap committed separately.