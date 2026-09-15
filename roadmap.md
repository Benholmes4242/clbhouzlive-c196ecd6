# Roadmap

- [x] Deduplicate Explore round headlines across six locales; report pair and catalogue truncation.
- [x] Measure cumulative-span distribution and treatment mix from real round candidates.
- [x] Gate shape treatment by selected cumulative-span threshold with fall-through precedence.
- [x] Add opt-in layered-stroke glow to Explore shapes; preserve shared defaults.
- [x] Verify bright/dark cards, LEVEL baseline, 320/390 geometry, and render cost; provide screenshots.
- [x] Remove duplicated event categories from round kickers while preserving ring and age reasons.
- [x] Gate tick rows on three off-par holes, with an explicit quiet-ace exception.
- [x] Verify 390px width and no horizontal overflow; authenticated record/ace capture remains blocked by external auth.
- [x] Scope "This week at {club}" to the club's courses (per-course board reads), not its members.
- [x] Move standing and weekly-club dates from photos into consistently formatted caption rows.
- [x] Verify the deployed standing functions and measure five-board qualification for Benjamin Holmes.
- [x] Merge Explore Courses and Reviews into one four-chip view with seven rails, search and a place dropdown.
- [x] Dead-list the retired Reviews view: `EXPLORE_VIEWS` drops the chip, `ExploreView` keeps 'reviews' (server pool and client composition still read it). Unused locale keys, kept: `amateur.stream.view.reviews`, `amateur.stream.empty.reviews`, `amateur.shelf.topRated`. `useRecentCourseRatings` is now called disabled and stays as the reference reader.
- [ ] BLOCKED (external Supabase auth): authenticated acceptance of the merged view - reviewer-name search, the circle scope, and the merged server pages.
- [ ] UNAPPLIED, Ben's to run: `docs/sql/explore_courses_merged_search.sql` (server search path plus the one-pool merge for `get_explore_stream`).
- [x] Mirror the shared post footer: actions left, actor right, and both text lines flush left without extra glyphs.
- [x] Match Your circle captions to the weekly club rail height while retaining fixed name and HCP rows.
- [ ] Keep Your circle on Scores only, retain standing later in rotation, and remove every visible baseline label while preserving the dashed rule.
- [x] Rebuild the member scorecard sheet with owner-aware copy, canonical course identity, flat sections, and footer actions.
## Tour overview magazine rebuild
- [x] Map current overview data, destinations, and shared Explore grammar
- [x] Rebuild the overview stream and localized sentence headlines
- [x] Preserve all destinations and record retired section importer counts
- [x] Verify tests/build plus 320px and 390px screenshots without horizontal overflow
