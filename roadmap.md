# Roadmap

## England federation picker label (9 Sep 2026)
- [x] Trace the picker label to its constants-file source and audit every other England Golf reference.
- [x] Name all three supported England products on the picker only, without changing connection-specific copy.
- [x] Verify the England card remains one line and unchanged in height at 320px.

## Courses browse rebuild (9 Sep 2026)
- [x] Diagnose 217 vs 256 and audit the facet RPC callers before UI changes.
- [x] Rebuild browse cards as flat 196px photo-led rows with unique figures and 6-10 category bars.
- [x] Replace controls with one filled filter row and outline board chips; remove duplicate search.
- [x] Rebuild the 260px tracked-round hero and separate Latest Reviews slots by 32px.
- [x] Verify direct counts, tier thresholds, card states, spacing, and 390px fit.

## Course detail snags 02 (9 Sep 2026)
- [x] Detect the Course tab row's true sticky boundary with a safe-area-aware sentinel observer.
- [x] Paint only the safe-area strip with the exact tab-row canvas while stuck.
- [x] Register adjacent sticky-row and inset-scrim z-layers.
- [ ] Verify transparent/restuck/return states with simulated insets and attach the 3x stuck screenshot.

## Course detail snags 01 (9 Sep 2026)
- [x] Share Explore's 340px hero height with both Course detail mounts and remove only the canvas fade.
- [x] Centre the four Course facts in equal grid columns with canonical figure treatment.
- [x] Change the Who plays here meta to golfer/golfers in all six locales.
- [x] Make the Course route root the single bottom-canvas owner.
- [x] Fold the unclaimed offer into the existing row group without deleting its old component.
- [x] Verify the public populated 340px hero, equal facts, root canvas, claim sheet, and 390px fit.
- [ ] Verify image-error/no-round, short-page overscroll, null fact fallbacks, and modal mount with authenticated fixtures.

## Tour match-the-mock (8 Sep 2026)
- [x] Restore `/tourhub` overview full-bleed notch hero with picker and controls islands; align hero event/location type with `/tour`.
- [x] Match the app canvas, 20px gutter, hero states, and single tour selector sheet.
- [ ] Match leaderboard heading, rows, counts, and terminal action.
- [ ] Rebuild Our Picks as horizontal cards with concerns and quiet record prose.
- [ ] Match the three-row Coming Up block.
- [ ] Match the image-first Tour News block.
- [ ] Verify the full page at mobile width and remove the stray Tour/Wire overlay.

- [x] Remove centred labels and secondary controls from story headers.
- [x] Preserve Discover News/Gallery tab and scroll across story/media round trips without URL or local storage.
- [x] Keep every story origin intact and make cold amateur story links fall back to Discover News.
- [x] Verify fresh Discover entry still opens Scores and round-trip restoration works.
- [x] Make the story tournament strip full-width and identical to the News index.
- [x] Verify the longest tournament at 320pt and audit article blocks for overflow.
- [x] Remove the Gallery hero and place Clips 18px below the fixed header.
- [x] Open review tiles into a review-first, course-bounded fullscreen media set.
- [x] Add poster-first Gallery autoplay with a two-video page-wide limit and accessibility/data gates.
- [ ] Verify Gallery behavior, viewer boundaries, 320px spacing, and autoplay cost.

## Scores two halves (BRIEF_SCORES_TWO_HALVES)
- [x] Course board axes in get_board_courses (p_sort) + rating/rating_count
- [x] ScoresTab: no hero, sticky filter, MEMBERS + COURSES halves, 10 member boards, 6 course boards
- [x] Course board rows + selected course drives How they played
- [ ] Signed-in runtime check (anon RPCs return empty; auth=external_unmanaged)

## Scores analytics card (BRIEF_SCORES_ANALYTICS_CARD)
- [ ] Move course title inside the card and label the filtered low-round window
- [ ] Reuse the Course page course card, chart, By par, and six-row hole preview
- [ ] Preserve no-round/sample/viewer-only gates and add the full-analytics terminal row
- [ ] Verify matching bars, 390px height, and 320px fit

## Scores section heads (BRIEF_SCORES_SECTION_HEAD)
- [x] Replace the sticky filter panel with a non-sticky applied-filter chip rail and Edit action
- [x] Make each selected board name the headline beneath a category/count eyebrow
- [x] Remove both universal column-header rows and match the two halves' construction
- [x] Verify 320px headline fit, board switching, and filter scroll-away behavior
- [x] Audit boards whose figures may need local labels without universal headers

## Scores three headlines (BRIEF_SCORES_THREE_HEADLINES)
- [x] Replace Members/Courses eyebrows with shared headline-and-count rows
- [x] Use board-aware member/round units for both headline and terminal action
- [x] Add the matching Course Analytics heading and 26px section gaps
- [x] Verify board switching, count agreement, and 320pt headline fit

## Scores canonical board entry (AMENDMENT_TO_BRIEF_SCORES_THREE_HEADLINES)
- [x] Share the filter sheet's ranking and feat order with the member rail
- [x] Let the existing recent/handicap/rotation ladder choose the opening board
- [x] Verify first-session Most recent, restored choices, and 320pt fit

## BRIEF_TOP_TEN_VISIBILITY_ROUNDTRIP (7 Sep 2026)
- [x] useTopTenVisibility takes visibility as an argument; user_profiles query deleted
- [x] Owner/public/private/no-viewer resolved with zero queries; isLoading false when no query needed
- [x] ProfilePageV2 passes profile?.top_ten_visibility down to ProfileTopTenRail
- [x] FavouritesCarousel + barrel line deleted (only consumer was the barrel)
- OPEN: public_profiles view does not expose top_ten_visibility, so stranger/anon viewers
  coerce to 'public' (same as before this brief). Needs its own decision.

## Amateur cutover (single change, blocked on device report)
- All 16 call sites + nav switch + /media route + 2 legacy shims + /explore redirect shim land together.
- Error escapes are NOT main-surface links: CoursesContent -> /courses, RoundPage -> /handicap.
- NewsChromeBridge: rewrite fallback state to none (Amateur has no tabs; scroll owned by amateurScrollMemory).
- Extra sites found: App.tsx VideoIdToPostRedirect malformed link -> /media; WatchGate dormant bounce -> /amateur.
- Do not repoint chunkLoaders / AppPrefetchProvider before the nav switch.

## Explore hero full-width round shape (8 Sep 2026)
- [x] Align the round shape and level-par rule to the hero content edges without moving surrounding content.
- [x] Verify the shape uses the measured full-width hero content column; signed-in data was unavailable for a populated screenshot.

## Courses hero and kickers (8 Sep 2026)
- [x] Match the Courses hero to Explore's fixed 340px, full-bleed, hard-cut frame with chrome as the only safe-area owner.
- [x] Move and restyle the existing Courses hero kicker inside its bottom content block without changing the remaining content.
- [x] Replace the Courses board's slogan/title pair with a dynamic factual kicker and one supporting description.
- [x] Unify Courses and Top 100 supporting-description typography.
- [x] Audit visible slogan-style kickers and report any additional candidates without changing unrelated surfaces.
- [x] Verify both Courses tabs at mobile width.
## Course detail snags 03 (9 Sep 2026)
- [x] Align all five course-detail tab lead-ins and centre the You stat strip.
- [x] Resolve the Your Form marker and reuse the canonical media strip for Your Moments.
- [x] Remove the duplicate hero rank-badge ground.
- [x] Correct Courses sort-chip containment and browse-card scrim.
- [x] Unify all three hero heights and straight bottom edges.
- [x] Apply the approved I1/I2 fixes: semantic form deltas and no repeated unranked area.
- [x] Complete source, type, anonymous 390px overflow, and console checks.
- [ ] Verify populated/authenticated You, moments, course hero, and browse-card states (external unmanaged auth).

## Top 100 tab rebuild (9 Sep 2026)
- [x] Suppress every round-derived figure when tracked rounds are zero.
- [x] Extend the shared browse card with the ranked Top 100 treatment.
- [x] Replace the region dropdown/search with outline board chips and live regional counts.
- [x] Flatten the Top 100 rate nudge without changing its default treatment.
- [x] Verify named course states, 32px rhythm, and 390px fit.

## Immersive sticky safe-area scrim (9 Sep 2026)
- [x] Extract the course-detail notch scrim into one opt-in shared component.
- [x] Replace the Courses page scroll threshold with a safe-area-aware sentinel observer.
- [x] Audit every immersive route and verify top/restuck/no-notch/landscape states.

## All 18 holes sheet (9 Sep 2026)
- [x] Replace the pushed all-holes page with an 85dvh analytical bottom sheet.
- [x] Move course context and field/viewer figures into a fixed sheet head without repeating the 18-bar chart.
- [x] Render the distribution summary and all 18 compact hole rows without truncation or see-all.
- [x] Render one-track par comparisons and the full flat stroke-index ladder without its colour legend.
- [x] Preserve the 20-round gate and retain the routed fallback because the You tab also links here.
- [ ] Capture populated viewer/unplayed 390px states when authenticated preview data is available.

## Your rounds sheet (9 Sep 2026)
- [x] Replace the pushed rounds page with the same 85dvh BottomSheet shell as All 18 holes.
- [x] Add the fixed course/figures/sort head and compact fixed-column rows.
- [x] Load the complete round history with an exact total and preserve scorecard navigation and analytics.
- [x] Keep the routed fallback and move the sole in-app caller to sheet URL state.
- [ ] Verify the populated 390px state when authenticated preview data is available.
- [ ] Complete static checks and the final course-detail dead-file report.

## WHS handicap index reconciliation (9 Sep 2026)
- [ ] Identify every current Handicap Index calculation and hardcoded model reference.
- [ ] Prove or correct the 40-score eligibility pool, latest-20 window, best-8 selection, differential formula, 9-hole normalization, and three-differential minimum.
- [ ] Diagnose the timeline spike and reconstruct historical points from score history where possible.
- [ ] Audit WHS score-history identity/upsert behavior for repeated or stale records.
- [ ] Align calculation explanations and all affected locales with the verified model.
- [ ] Validate against a reproducible fixture and report data/deployment limitations.
