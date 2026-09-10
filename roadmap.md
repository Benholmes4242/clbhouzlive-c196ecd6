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
- [x] Match the Top 100 card list and loading media to the Courses tab's full-bleed geometry.

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
- [x] Complete static checks and the final course-detail dead-file report.

## WHS handicap index reconciliation (9 Sep 2026)
- [ ] Identify every current Handicap Index calculation and hardcoded model reference.
- [ ] Prove or correct the 40-score eligibility pool, latest-20 window, best-8 selection, differential formula, 9-hole normalization, and three-differential minimum.
- [ ] Diagnose the timeline spike and reconstruct historical points from score history where possible.
- [ ] Audit WHS score-history identity/upsert behavior for repeated or stale records.
- [ ] Align calculation explanations and all affected locales with the verified model.
- [ ] Validate against a reproducible fixture and report data/deployment limitations.

## Your 18 holes sheet (9 Sep 2026)

- [x] Separate the You-tab hole sheet from the course All 18 holes sheet URL state.
- [x] Build the 85dvh shared BottomSheet shell with fixed head and scrolling body.
- [x] Render member distribution, all 18 BEST rows, personal par tracks, and thirds analysis.
- [x] Preserve the 5-round entry gate and hide sort controls below 10 rounds.
- [x] Retire duplicated legacy callouts while keeping form and Within reach summary on the You tab.
- [ ] Verify populated personal data, sorting, generated opening-six copy, and dead-file candidates.

## Dead-file sweep — DONE 10 Sep 2026
- 56 files deleted in one pass: Cluster 1 (old TodayView tree, 17), Cluster 2 (old TrendsView tree, 10), Cluster 3 (old CircleView tree, 5), 6 CLEAN files, and the 28 secondary orphans they held alive. Stale comments updated in the same pass. Typecheck and full production build clean.
- Region-only entries below are branches inside files that STAY, not deletions.
- Tour hub and the round scorecard sheet contributed no whole-file entries: both were rebuilt in place rather than replaced.
- Name-collision lesson: two files named types.ts, one live (src/lib/whs/types.ts) and one dead (whs/types.ts), and every grep hit for the filename belonged to the LIVE one. A hand-check reads as conclusive and is wrong; only a resolved import graph separates them. Use the graph, never the filename, before any sweep.

## Champions drilldown sweep — DONE 10 Sep 2026
- 18 files deleted in one commit: Cluster A (old panel/duel board and its deep sheet, 4), Cluster B (crown cabinet, You card, window toggle, 3), the 10 CLEAN files, and ChampionsHonoursBoard.tsx which lost its last importer with ChampionsInfoCarousel. Typecheck and full production build clean.
- KEPT: _shared/championsOrder.test.ts. A spec for a live module is not unreachable code. NEVER sweep test files on reachability from main.tsx.
- KEPT: the live spine (CourseLegendsDrilldown, DrilldownHeader, _shared/*, drilldown/_shared/*, flat/*, types.ts), untouched.
- HELD, NOT SWEPT: src/components/handicap/ConnectGhostPrompt.tsx. It has a second importer, src/features/courses/components/holes/CourseHolesTab.tsx, which is itself unreferenced but has never been ruled on. Deleting the prompt would break the typecheck of a file nobody has retired. Both need one ruling together.
- Region-only orphan left in place: WindowToggleVariant in course-legends/types.ts, annotated rather than removed.
- Comment species, third instance this week: a comment ASSERTING A RELATIONSHIP THAT HAD ALREADY BEEN SEVERED. WindowToggle's header claimed the live drilldown still owned it long after the drilldown stopped importing it. Moot now the file is gone; the species is not.

## Open — Champions has no connect prompt for unconnected members
- TWO surfaces now make no case at all to unconnected members: the Champions drilldown AND the course pages (the Holes tab carried the prompt until 10 Sep 2026). The handicap page's not-connected state is the pattern; src/components/handicap/ConnectGhostPrompt.tsx is the retained component to rebuild from.
- Roughly four in five accounts have never connected a handicap. They see a board they cannot appear on and no route to appearing on it. ChampionsInfoCarousel carried that prompt; the explainer copy survives as WhatCounts, the prompt does not. Not rebuilt in the sweep by decision.

## Sweep — course Holes tab retired, 10 Sep 2026 (11 files)
- DELETED, one commit: CourseHolesTab (155), HoleDataSheet (1319), ScoringBreakdownSection (1344), HolesEmptyState (25), HoleGlyph (117), analytical/HoleRows (183), HoleFeatureCards (184), PersonalHoleFeatureCards (112), BirdieMapSummary (96), HolesCredibilityHeader (50), HolesScoringKey (61) — 3646 lines.
- KEPT LIVE: src/pages/CourseHolesPage.tsx, the redirect from /courses/:courseId/holes into ?sheet=holes. The URL is in the wild.
- Deleting HoleGlyph CLOSES the open item about a fourth scoring-mark grammar. It was scoped as its own piece of work; the answer turned out to be that it dies with the tab it served. ScoreMark's shared list no longer names the Holes legend.
- RETAINED WITH WRITTEN REASON, not swept: AddHolePhotoRow, HolePhotoGallery (live admin queue reviewing a closed stream) and ConnectGhostPrompt (model for the connect-prompt gap). Header comments say so on each file.
- Typecheck and full production build pass. CourseDetailPage chunk 197.86 kB.

## Open — member hole-photo submission has no surface
- The only member upload/display path (AddHolePhotoRow, HolePhotoGallery) went unreferenced when the Holes tab was retired. useHolePhotoQueue, HolePhotoReviewSheet and the InboxPage triage counts are still live and can never receive another item. Capability decision, not cleanup.

## Practice — leave a route behind when a surface comes off
- The redirect at CourseHolesPage is the ONLY reason the Holes tab was decidable: a live route saying where the surface went is written evidence of a deliberate retirement. Two other surfaces retired this week left nothing written down and had to be reconstructed from import graphs. Do this deliberately next time something comes off a page.

## Handicap one-page brief — dead list (files below are now DELETED)
- src/components/profile/handicap/whs/sections/LastRoundCard.tsx (whole file, off the page at Section D)
- src/components/profile/handicap/whs/sections/last-round-card/CinemaCardMedia.tsx (whole file)
- src/components/profile/handicap/whs/sections/last-round-card/LastRoundHeroCard.tsx:60-120 (scrim + masked blur layers)
- src/components/profile/handicap/whs/sections/RoundsThatCountCard.tsx (whole file, off the page at Section E; still imported by views/TrendsView.tsx:2,52, which no route on the one-page handicap area renders). Inside it specifically: :125-128 the projectNextRound call at length >= 8, :279-289 the next-round footer figures, :302-308 the drop queue, :316-323 the legend/queue copy.
- src/components/profile/handicap/whs/sections/trends/StablefordCard.tsx — the POINTS half only, off the page at Section F: :324-497 PointsBody, of which :397-426 is the distribution ring, :428-487 the band chips this section restates flat, :489-494 plus ScoringRangeBlock the SCORING RANGE strip, :278-315 the 30D/90D/ALL scope chips, :239-276 the POINTS/SCORE STATS toggle. The SHOTS half (:649-886 ShotsBody, :897+ MilestoneLadder) is NOT dead — it has no other home on the page and awaits a ruling. Whole file still mounted by views/TrendsView.tsx:9,65.
- src/components/profile/handicap/whs/sections/trends/computeStablefordDistribution.ts (whole file, off the page at Section F; it never reads is_nine_hole). Still used by StablefordCard and StablefordDetailSheet.

## Open item — nine-hole disclosure beyond the handicap page
- Feed round card, friends' rounds rows, compare sheet, Discover board rows and profile round rows print gross/stableford without reading is_nine_hole or total_holes. Scope named, not fixed.
- PostRoundCard is the only entry that prints a gross to OTHER PEOPLE rather than to the member themselves, so a misread has a cost beyond confusion. It is currently unreachable in the Clubhouse feed (round posts are hidden there) but still renders on the profile posts tab, so it is live though quieter.
- All 30 nine-hole rounds carrying stableford points score under 33, so every one of them would land in OFF DAY by construction. That is the clearest proof the band thresholds (36+ / 33-35 / <33) assume eighteen holes without ever saying so.

## Section G — dead list and census (nothing deleted)
- src/components/profile/handicap/whs/sections/trends/GameEverywhereCard.tsx (whole file, off the page at Section G; the par-type rings move into HolesSection). Still imported by views/TrendsView.tsx.
- src/components/profile/handicap/whs/sections/trends/RoundShapePanel.tsx (whole file, off the page and RETIRED, not pending): the "no weak stretch" census returned 22 of 22 eligible connections (>= 10 mapped 18-hole rounds with hole detail), spread 0.12-1.25 against the 1.5 threshold, mean 0.60. The verdict does not vary, so the block cannot say anything, and its coaching paragraph advised warming up immediately after disproving the problem.
- StablefordCard.tsx SHOTS half: :735-870 the four-band ring and band chips are now dead (the distribution renders flat in Section G). :897+ MilestoneLadder still has no other home on this page and remains reported, not moved.

## Section H — dead list (nothing deleted)
- src/components/profile/handicap/whs/sections/records/PersonalBests.tsx (whole file, off the page at Section H). Inside it specifically: :137-163 the "Most Rounds in a Month" tile (volume is not a personal best) and :66-72 its empty placeholder, plus the rounded panel/skeleton block at :215-300. Still imported by views/TodayView.tsx and views/TrendsView.tsx.
- AchievementsPanel is deliberately STILL MOUNTED beneath Section H: the tile is the current trophy-room door and it stays until the new terminal row is verified in a signed-in session. When it comes off, GamMount stays and ?gam=trophies / &section=crowns / &badge=<id> must keep resolving.

## Open item — RoundShapePanel revival note
- The "no weak stretch" verdict fires when the spread between the best and worst six-hole third is under 1.5 shots (RoundShapePanel.tsx, spread < 1.5). Live census: 22 of 22 eligible connections fall under it, spread 0.12-1.25, mean 0.60. Anyone reviving the block starts from the fact that the threshold can never fire at this population, not from rediscovering it.

## Open item — mapped-course requirement on the par rings
- get_my_scoring_breakdown_all_courses requires whs_to_golf_course_map. Live: 3,511 of 3,524 eighteen-hole rounds survive it (99.6% on average, worst member 96.4%), so the rings describe the same golfer and the basis caption is sufficient. Not its own item.

## Section I — Your circle (Sep 2026)

- ACTIVE definition now written at `src/lib/whs/utils/buildLeaderboardCohorts.ts:51-60`: last posted round within 90 days; NULL last-round = inactive; self always active. All counts derive there.
- Nine-hole open item strengthened: **12 of 22 connected members would show a false best gross** if the `is_nine_hole` filter in Personal Bests were removed (a 43 beats a 68). Strongest argument in the codebase for reading `is_nine_hole` on every gross/stableford surface — see the nine-hole sweep list (PostRoundCard first: only surface printing a gross to other people; hidden from Clubhouse feed, live on profile posts tab).
- Club-name split resolved by batch-resolving the clbhouz `user_profiles.home_club` for every circle row with a clbhouz account (one read). WHS-only friends keep the England Golf value; no normaliser. Open item: 586 of 672 circle rows are WHS-only, so most rows still render England Golf's shorter form — the two flavours coexist by row type, not by field mixing.
- Dead-listed by Section I (not deleted): `sections/friends-leaderboard-v2/FriendsLeaderboardSection.tsx`, `StandingFigures.tsx`, `WeeklyBanner.tsx`, `sections/compare/CompareEntryPanel.tsx`, `sections/PulseSection.tsx`, `sections/invite-to-clbhouz/CircleInviteAction.tsx`. `LeaderboardRow.tsx` and `FullLeaderboardSheet.tsx` stay live (see-all destination).

## Section J — Friends' rounds (Sep 2026)

- [x] Replace the mounted panel with a flat owner-only section showing five newest rows and an 85dvh dark complete-list sheet.
- [x] Make synced score rows open `RoundDetailSheet`, clbhouz summary rows inert, and WHS-only rows expose one amber Invite using the existing `invite_sent` series.
- [x] Strictly bound fallback summaries to the stated 14-day window and carry `is_nine_hole` / `total_holes` on synced score rows.
- [ ] Authenticated populated verification: the external unmanaged auth context still blocks a representative signed-in run.
- Source limitation: `whs_friend_matches` has no hole-count field, so the WHS-only latest-round summaries cannot disclose nine-hole status. Synced score rows can and do.
- Accepted contradiction: Section I can still resolve a WHS-only row tap to an invite outcome, although Section J is the only explicit visible Invite action in the handicap page body.
- No files deleted. `FriendRoundRow` and `RecentlyPlayedFeed` retain their paths/exports; their implementations were replaced. `FriendsRoundsSheet` is additive.

## Section K (Sep 2026)

- K1 footer: `sections/HandicapFooter.tsx` replaces `RoundsArchivePanel`, `YourCoursesRail`,
  `WhsConnectionCaption` on the page. All three dead-listed, not deleted. Reuses the existing
  `RoundsArchiveSheet` and the existing `handicap_history_sheet_opened` event.
- K2 not-connected: `sections/NotConnectedSection.tsx` replaces the own-profile redirect to
  /manage/handicap in `WhsHandicapTab.tsx:96-101`. New events
  `handicap_not_connected_viewed` / `handicap_not_connected_cta`.
- Open: no handicap-specific "what's shared" explainer exists; the button goes to the existing
  /privacy document. A purpose-built data-sharing explainer is unbuilt work.
- Open: `AchievementsPanel` stays mounted until Ben confirms the TROPHY ROOM row on device.
- Section J sheet returned to the shared 85dvh default; stale "75dvh" comments corrected.

## K final amendment (2026-09-10)
- NotConnectedSection: "What's shared" button removed (promised an answer /privacy cannot give). One CTA: Connect handicap -> /manage/handicap. handicap_not_connected_cta kept with action:'connect' only.
- whatsShared locale keys dropped from all six locales.
- Redirect dependency audit: nothing depended on the old /handicap -> /manage/handicap redirect. Gam push routes (/handicap, /handicap?sheet=...) fire only for members with gam activity; an unconnected recipient now lands on the not-connected page instead of the connect flow - neither old nor new behaviour opened the sheet. In-app links to /handicap (ProfilePageV2, ManageProfile, RoundPage fallback, resolver, rivalry redirect, HandoffPage) assume the page, not the connect screen.

## Handicap page — device check (sections 0-K follow-up)

DEAD LIST ADDITION
- src/components/profile/handicap/gam/streaks/StreaksCard.tsx — the ON THE LINE
  - {n} ACTIVE rail. Unmounted from HandicapDashboard, retained on disk.
  Streak material lives in the trophy room (StreaksPanel via CareerRecordSheet);
  StreaksSheetMount stays at page level so ?gam=streaks still resolves.

OPEN ITEMS
- Circle club names: linked accounts resolve to the clbhouz club value, England
  Golf-only rows keep theirs, so "Sundridge Park Golf Club" and "Sundridge Park"
  now appear in one list (3 rows vs 2 on the live record). Data is correct and the
  batch resolve is working as specified. NO NORMALISER by ruling — awaiting a
  decision on which value is canonical for display.
- AchievementsPanel stays mounted until both the streaks unmount and the
  Personal bests TROPHY ROOM row are confirmed on device.
- Holes basis definition: birdie-or-better is now derived as
  total_holes_in_window minus pars minus bogey minus double_plus. The RPC's
  aces/albatross/eagles/birdies window counts overlap (an ace on a par 3 is also
   gross = par - 2), which is the 4034-vs-4032 gap. 4032 is right. RPC unchanged.
- ACE DOUBLE-COUNT SWEEP (report only, nothing changed). Two other places add
  overlapping ace/eagle/albatross counts. Both are outside the handicap page.
  1. src/components/profile/handicap/whs/sections/trends/StablefordCard.tsx:716-727
     sums aces + albatross + eagles + birdies from get_trophy_aggregates window
     counts. Same defect the Holes section had; the file is already dead-listed
     (only importer is views/TrendsView.tsx:65, itself dead-listed), so it is not
     rendered on any live route.
  2. src/features/business/clubAnalytics/sections.tsx:283 (o.birdie + o.eagle +
     o.albatross + o.ace for the distribution strip) and sections.tsx:576
     (rows.reduce fallback total). get_club_course_analytics defines ace as
     actual_gross = 1 while eagle/albatross are to-par, so every ace is counted
     twice. Line 283 is LIVE on the claimed-club analytics surface. Line 576 only
     bites when outcomes_total is absent; the primary path uses outcomes_total,
     which is the true scored-hole count. Fix shape is the same subtraction:
     birdie-or-better = outcomes_total minus par minus bogey minus double_plus.
  NOT affected, verified: get_course_hole_analysis excludes ace from the eagle and
  albatross filters, so HoleDataSheet.tsx:1041/1201/1220 and HoleRows.tsx:72 sum
  mutually exclusive bands; get_trophy_aggregates' own
  birdies_or_better_prev_window uses OR, so it counts each hole once;
  useCompareStats.ts:141-154 / CompareSheet.tsx:251-276 and the trophy catalogue
  read the fields individually; useWinnerScorecardStats.ts:53 sums one field
  across rounds. Scope is two files, so it is an open item, not a sweep.
- ?sheet= break provenance (corrected framing): the dispatcher never regressed —
  it has emitted ?sheet= throughout. The client stopped honouring that vocabulary
  when the in-app links moved to ?gam=, so the break dates from whenever the
  ?sheet= reader was dropped, not from the August link change. The client alias
  STAYS permanently after the Part 2 dispatcher change: it is what keeps the 591
  already-delivered notifications working.

## Trophy room / career record rebuild (sections A-F)
- OPEN: `get_course_field_sizes(uuid[], uuid)` batched read is NOT deployed. Until Ben runs it,
  CourseRecordsPanel states record counts only and claims no won/uncontested split. Per-course
  `get_course_hole_field` calls were rejected: 255 courses = 255 round trips on one list.
- OPEN (reported, not fixed): head says 245 rounds (gam_round_stats, owner, limit 1000) vs the
  handicap hole sections' 243. Same open reconciliation item.
- OPEN (correctness, not labelling): gam_user_badges.earned_at looks like a bulk evaluation
  artefact for the July 2026 cluster - 218 rows across 16 members on 2026-07-24 spread over 131
  distinct seconds. The date is now labelled "Tier {n} reached {month}", but if that column is a
  backfill stamp it should not render at all. Needs a data ruling.
- Dead list: CrownsPanel.tsx (replaced by CourseRecordsPanel), useCourseFieldSizes.ts (legacy
  crown-HOLDER head count, still read by CrownDetail's field line). Neither deleted.
- FILED (scope named, derivation NOT attempted): badge and milestone attained_at is a BACKFILL
  timestamp for the rows written on 24 Jul 2026 -- 201 rows / 14 members between
  11:59:02.143Z and 13:20:17.479Z, plus 15 rows / 4 members between 15:52:46.765Z and
  16:23:35.128Z. A real attained-at would have to be derived from the triggering round. Until
  then those rows carry NO date: suppression is windowed in src/lib/gam/badgeBackfill.ts and
  every row outside the windows renders its labelled date normally.
- PENDING BEN: get_course_field_sizes(uuid[], uuid) to be run in production. On confirmation,
  section C calls it once with all crown course ids, threshold from src/lib/gam/fieldGate.ts,
  contested-first sort. Its 0 can mean "not mapped" as well as "nobody else played" -- safe for
  the split, not reusable elsewhere.
