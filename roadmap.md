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

## Trophy room — course counts (CLOSED, not a fault, 10 Sep 2026)
NOT A DISAGREEMENT: the two counts answer different questions and both are right.
The sheet's "N COURSES" beside course records counts DISTINCT COURSES WHERE THE
MEMBER HOLDS RANK 1 (gam_course_legends_view, is_current = true, rank <= 1) — 22
for member 8c240997. The 34 is distinct courses at ANY current rank (rank 1-15),
i.e. it includes 12 courses where the member is placed but holds no record.
Nothing to reconcile, nothing changed, struck from the open list.

CONSEQUENCE: the earlier 8 contested / 22 thin / 4 nobody-else split was computed
over all 34 ranked courses and must NOT be quoted as the sheet's split. The bands
over RANK-1 COURSES ONLY (the set the sheet counts), member 8c240997, mirroring
get_course_field_sizes exactly: 22 courses = 4 contested (5+ others, the only band
that reads WON) / 15 thin (1-4 others, of which 5 have exactly 1 other) / 3 with
nobody else. Headline therefore shows 4 WON, 18 UNCONTESTED.

## Backfill gap row (CLOSED — keeps its date, 10 Sep 2026)
One row falls in the 13:20:17.479-15:52:46.765 UTC gap on 24 Jul 2026:
badge_id 'founder', user 370e6b6b, 14:58:28.163529 UTC. Single row, single
member, a one-off grant rather than a third partial run — it renders a date, by
ruling. Recorded in src/lib/gam/badgeBackfill.ts so nobody reads that rendered
date as the suppression rule leaking.

## Circle leaderboard — one row, two consumers (10 Sep 2026)
- CircleRow + useCircleClubs are the shared row and the single club source for the
  handicap page's CircleSection and the see-all FullLeaderboardSheet.
- Rank-movement chip and its "30D RANK" header retired: the slot was empty on held
  positions, unknown deltas and every stale row. Sheet header now reads "By index".
- LeaderboardRow.tsx (with RankDeltaChip, imported nowhere else) is on the dead list,
  unreferenced, not deleted in this pass.
- useFriendLeaderboardRankDeltas now has no consumer on this surface; hook retained.
- OPEN (ruling wanted): the flame and the viewing member's own row are both #F7931E,
  so on the viewer's own flamed row one colour carries two meanings.

POSTED HISTORY SHEET — REBUILD (10 Sep 2026)
- OPEN (labelling, on the COURSE page, not here): the course detail page's round count
  for a course is EIGHTEEN-HOLE ONLY (gam_round_stats, holes_played = 18) and does not
  say so. The posted-history sheet's per-course count includes nine-hole rounds because
  it lists them, so Sundridge Park-West reads 76 in the sheet and 74 on the course page —
  exactly that member's two nine-hole rounds. Neither figure is wrong; the course page
  needs the basis stated. Nine-hole rows now carry "9 holes" on the date line here, so
  the difference is visible from the sheet's side.
- ONE COUNTER SET: is_counter as it arrives on useAllScores (whs_scores) is the single
  source for both the posted-history sheet and RoundsThatCountSection. fetchCounters
  (useCounters) survives for HandicapDashboard's rounds_counting analytics property only,
  and its hard .limit(8) is gone — eight counters is a WHS rule at 20+ rounds, not a
  schema fact.

- INSTRUMENTATION CUTOVER (10 Sep 2026): `rounds_counting` on `handicap_viewed`
  changed meaning. fetchCounters carried `.limit(8)`, so the property was the
  counter count CAPPED AT 8; the cap is removed and it is now the true count of
  is_counter rows. Series spanning 10 Sep 2026 show a STEP at that date that is
  this change, not member behaviour — read in two halves, as with the handicap
  subtab cutover of Aug 2026. Reason for removal: eight counters is a WHS rule
  that applies at twenty or more rounds, and the query asserted it at every
  round count, a second copy of the same assumption.
- OPEN (reported, not fixed; filed with fix shape 10 Sep 2026):
  gam_round_stats.is_counter is a COPY of whs_scores.is_counter, written once by
  gam-evaluator at first evaluation and never revisited, because
  evaluator_version_last gates the row. Drift is detected only opportunistically
  by _shared/counter-requeue.ts around the sync upsert (sync-whs-one,
  sync-whs-due): it only sees flips that happen while it is watching, skips
  rounds absent from its snapshot, and fails silently on every path — it is not
  a partial reconciliation, it is a mechanism that makes the divergence look
  handled. MEASURED 10 Sep 2026: 80 of 3,554 mapped rounds disagree, across 20
  members — 57 where the copy says counter and England Golf does not, 23 the
  other way — with play dates running to 5 Sep 2026, so it is current drift, not
  a historical artefact. gam-weekly-digest and gam-refresh-streaks-weekly both
  filter on the copy, so both act on a counter set that is wrong for those
  rounds, and neither surfaces it. 19 rounds carry counter_settled = false,
  which is a KNOWN unknown and a different state that must not be folded into
  the same fix.

  FIX SHAPE (do not start from scratch; do NOT propose a reconciliation sweep —
  a sweep keeps two columns and adds a third thing that can fail; removing the
  read removes the class): STOP READING THE COPY FIRST, DROP IT LATER. Point
  gam-weekly-digest and gam-refresh-streaks-weekly at whs_scores.is_counter,
  verify they agree with the client, and only then decide whether the mirror
  column is worth keeping at all. Stop reading first, drop later — the order the
  programme settled in August — makes the change reversible at every step.

  READ SURFACE (measured 10 Sep 2026): the move is a JOIN, not a swap.
  gam-weekly-digest's main read (index.ts:175-181) selects whs_score_id,
  user_id, play_date, course_id, course_name, course_par, gross_score, birdies,
  eagles, albatrosses, holes_in_one, delta_index alongside is_counter, and its
  rival-rounds count (index.ts:277-283) filters play_date on the mirror too.
  gam-refresh-streaks-weekly (index.ts:48-54 and 254-260) needs only
  whs_score_id + play_date + is_counter — a pure swap for the streak job, a
  join for the digest.

## OPEN — A VISITOR CANNOT BE SHOWN A ROUND TOTAL (filed 10 Sep 2026, do not build)

BRIEF_PROFILE_PASS_ONE §B. The profile hero's ROUNDS counter is owner-only by
CONSTRUCTION, not by policy: gam_user_courses() keys off auth.uid(), so it can
only ever resolve for the signed-in member looking at their own profile. The
hero now DROPS the column for visitors rather than dashing it (absence reads as
not-shown; an em dash in a row of figures reads as zero-or-unknown).

A member's round total is NOT private — their rounds already appear in friends'
feeds — so this is a TECHNICAL LIMITATION, not a privacy decision, and must be
named as one. FIX SHAPE (not started): a read-only function that takes a user id
as an argument instead of reading auth.uid(), returning the same round total, so
the fourth counter can render for visitors too. Nothing here should be built
until that function exists and is verified.

## BRIEF_SHEET_BACKGROUND_CANON_03 (10 Sep 2026)

- OPEN — TWO SHEET PRIMITIVES. `components/ui/BottomSheet` (72 consumers) and
  vaul `Drawer` (4 consumers: `ui/drawer.tsx` shadcn wrapper, `FriendSheet`
  direct, `ScheduledPostsList`, `RankHistorySheet`). No consumer uses a vaul
  feature BottomSheet lacks — no snap points, no nested drawers, no scaled
  background. CLOSED by BRIEF_SHEET_BACK_BEHAVIOUR §1: BottomSheet survives,
  vaul retired, drawer.tsx on the dead-file list.
- OPEN — HARDWARE BACK AND SHEETS. BottomSheet has no history handling: back
  or edge-swipe leaves the route with the sheet on it. Only URL-addressed
  sheets behave (handicap `?gam=`/`?sheet=`/`?score=`, course detail
  `?sheet=`, college compare picker, auth form). CLOSED by
  BRIEF_SHEET_BACK_BEHAVIOUR §2 — see that section, including the correction
  that those URL sheets use replace, not push.
- CLOSED — `FriendSheet` `className="hcp-light"` investigated under
  BRIEF_SHEET_BACK_BEHAVIOUR §1d: inert, kept, nothing reads it.
- CLOSED — All Holes empty distribution band draws nothing (was a 2px 28%
  stub). Local to `AllHolesSheet`, not shared.
- CLOSED — every hardcoded `#15171F` replaced by a token from
  `src/lib/tokens/surfaces.ts` (PAGE_CANVAS / SHEET_SURFACE / INK_ON_LIGHT /
  STATUS_BAR_CANVAS). Two literals deliberately retained: the CSS root
  declarations of `--bg-page`/`--background`, and `CT_DARK.surface` (a ramp
  step on the composer's own darker canvas, not a page or sheet ground).

## BRIEF_SHEET_BACK_BEHAVIOUR (10 Sep 2026)

- CLOSED — VAUL RETIRED. `FriendSheet`, `RankHistorySheet` and
  `ScheduledPostsList` now use `components/ui/BottomSheet`. Zero vaul
  consumers remain in `src/`.
- DEAD FILE LIST (not deleted, dependency untouched):
  `src/components/ui/drawer.tsx` — the shadcn vaul wrapper, now unreferenced.
  The `vaul` entry in package.json is left in place; removing a dependency is
  the sweep's job and is not reversible the way a file is.
- CLOSED — `hcp-light` ON FRIENDSHEET IS INERT AND WAS KEPT. `.hcp-light`
  redefines the `--hcp-*` variables to light values AND applies
  `background: var(--hcp-bg-0); color: var(--hcp-t-100)` to its scope. Nothing
  in `src/components/friend-sheet/**` reads a `var(--hcp-*)` token (the parts
  use hardcoded hexes in `parts/_shared/tokens.ts`, precisely because the sheet
  portals outside `.hcp-dark`), and both the class background and colour lose
  to BottomSheet's own `SHEET_SURFACE` (applied after caller styles) and the
  inline `color: T100`. Removing it changes nothing on screen; kept so the
  removal is a separate, visible change.
- CLOSED — SHEET STACK, AUTOMATIC REGISTRATION. `src/components/ui/
  sheetHistory.ts` owns one `history.pushState` marker per open sheet and pops
  the top entry on `popstate`. `BottomSheet` pushes/pops from its existing
  `open` + `onClose`, so no sheet author registers anything and none can
  forget. Opt-out prop: `urlOwnsHistoryEntry`.
- ONE MOUNTING PATTERN DEFEATED THE SINGLE-PRIMITIVE DEFAULT: the post
  composer has its OWN sheet chrome at
  `src/features/post-v2/components/BottomSheet.tsx` (StageComposer, ActorSheet,
  AdjustSheet, CourseTagSheet, CoverFrameSheet, CreateSheetV3, DraftsSheetV2,
  ScheduleSheetV2, ScheduledPostsSheetV2). It was wired into the SAME stack
  rather than left silently unregistered. That primitive still has no
  escape-key handling — backdrop tap and the X are its only dismiss paths.
- CONTRADICTS THE BRIEF (§2 bullet 2, AT5). The six URL-addressed sheets do
  NOT own a history entry: every one writes its param with
  `setSearchParams(next, { replace: true })` — handicap `?gam=`/`?sheet=`/
  `?score=` (HandicapPage.tsx:300-380, which also strips the param on arrival),
  course detail `?sheet=rounds`/`?sheet=your-holes` (GolfClubView.tsx:136-148),
  `?sheet=holes` (HowItPlays.tsx:260-278), college `?compare=`
  (CollegeHubPage.tsx:72-110). Opting them out would make back LEAVE THE ROUTE
  with the sheet still on screen — the bug the brief is closing. They are left
  on automatic registration, close on ONE back, and `urlOwnsHistoryEntry`
  exists unused for a future sheet that genuinely pushes.
- CONTRADICTS THE BRIEF (§3). No sheet in the app confirms before discarding a
  draft on backdrop tap or escape today — the strictest existing behaviour is
  silent discard. Back routes through each sheet's own `onClose`, the same
  function backdrop and escape call, so back is exactly as safe as the two
  paths that already exist and introduces NO new data-loss path. Adding a
  confirmation is a three-path change to the composer and forms; not done
  unilaterally. OPEN.
  - DRAFT-HOLDING: post composer `StageComposer` (caption/media), its stage
    sheets `AdjustSheet`, `CoverFrameSheet`, `CourseTagSheet`, `ActorSheet`,
    `ScheduleSheetV2` (date/time selection), `CreateSheetV3`,
    `RequestCourseSheet` (name/location/note), `ClaimCourseSheet`,
    `AddCourseModal`, `NewConversationSheet` (query/selected/title).
  - SAFE TO CLOSE (read-only or write-on-tap, nothing typed to lose):
    AllHolesSheet, YourHolesSheet, YourRoundsSheet, CardScorecardSheet,
    CourseDirectorySheet, CourseStatsSheet, CourseNewsSheet, LatestReviewsSheet,
    BoardSeeAllSheet, CoursesPlayedSeeAllSheet, FriendsRoundsSheet,
    FriendsRoundsSeeAllSheet, FindGolfersSheet, RegionSheet, LikesSheet,
    InviteFriendsSheet, SentInvitesSheet, FriendSheet, RankHistorySheet,
    ScheduledPostsList, ScheduledPostsSheetV2, DraftsSheetV2, GamSheet,
    CompareSheet, FlatBoardSheet, FullLeaderboardSheet, RecentRoundsCard,
    RoundsArchiveSheet, Top100ListProgressSheet, Top100MoversSheet,
    Top100VerdictExplainerSheet, CourseAnalyticsPanels, CourseCardPanel,
    YourCourseAnalyticsSheet, HomeClubPickerSheet, PhotoActionSheet,
    FeedActorPicker, PickerSheet, TourPickerSheet, InsightSheet, FullListSheet,
    StatsSheet, TournamentsSection, AllTeeTimesSheet, CourseSection,
    FullBoardSheet, MomentsSection, ConversationRow, ConversationSettingsSheet,
    RatingFilterChips.
- OPEN — §4 DEVICE TESTS NOT RUN. iOS PWA edge-swipe, Android hardware back
  and long-press-back, app background/restore, and the media-viewer-over-feed
  stack all need a signed-in device; this project is `external_unmanaged`, so
  no authenticated runtime is available here. Verified in isolation instead
  (stack harness, 10 Sep 2026): two stacked entries pop one at a time, then
  history leaves the route; closing a sheet through its own UI unwinds only its
  own entry and does not cascade to the parent.
- REFRESH / SHARED URL: the pushed entry carries no URL change (state marker
  only), so a refresh with a sheet open resolves to the underlying route and a
  URL captured with a sheet open never sends anyone to a broken state.
- FORWARD AFTER A BACK-DISMISS: forward does NOT reopen the sheet, and that is
  the behaviour we want. A sheet is a transient view of the page beneath, not a
  destination; a reopened sheet with stale data is worse than a page the member
  can tap again.

## BRIEF_PROFILE_PASS_ONE §C — THE THREE ROUND COUNTS (10 Sep 2026)

THREE COUNTS, THREE QUESTIONS. Measured on test member
`8c240997-b6a1-408c-a953-794bc17ee35c`, 10 Sep 2026:
- 245 — PLAIN TOTAL: every `whs_scores` row on the member's connection.
  Nine-hole rounds, penalty scores and unmapped courses all included.
- 243 — EIGHTEEN-HOLE BASIS: `is_nine_hole` excluded (also the count with hole
  detail fetched, and `gam_round_stats.holes_played = 18`). The basis of every
  per-round handicap figure. It keeps its place and states its own basis.
- 239 — MAPPED, NON-PENALTY: summed from `gam_user_courses()`. The basis of the
  per-course analytics rows.
They are not a disagreement to reconcile. Each surface now names which it uses.

EVERY SURFACE RENDERING A MEMBER'S ROUND TOTAL OR COURSE COUNT:
- Profile header ROUNDS (`ProfileHero` via `ProfilePageV2`) — WAS the 239
  analytics sum, NOW the plain total 245 via `hooks/profile/useMemberRoundTotal`.
  Owner-only by construction (unchanged).
- Handicap footer "All {n} rounds" (`HandicapFooter`, `useAllScores`) — plain
  total 245. Already agreed with posted history.
- Posted history sheet (`RoundsArchiveSheet` / `RecentRoundsCard`) — plain
  total 245, same `useAllScores` population.
- Career record header (`CareerHeader`, `useCareerRounds`) — `gam_round_stats`
  rows, 245 today; that table's own population, capped at 1,000 newest rows.
- Profile Courses tab PLAYED / COUNTRIES (`JourneySummaryCard` via
  `useUserCourseSummary`) — distinct `user_course_activity` rows, 49.
- Handicap sections F/G and Scoring — windowed samples, not totals; F excludes
  nine-hole rounds (the 243 population), G counts holes and includes them.
- `GolfDNASheet` renders `roundsThisYear` / `coursesPlayed` but has NO importer:
  dead, not a live fourth reader. Not swept in this pass.

CONFIDENT ZEROES REMOVED (same three-state rule as §A):
- `useUserCourseSummary` no longer defaults both counts to 0; a failed or unrun
  read is null and `JourneySummaryCard` renders the label without a figure.
  Only a fetched 0 reaches the "No courses logged yet" empty state.
- `usePersonalReviewsCount`'s `= 0` default in `ProfilePageV2` removed; RATED
  carries `ratedCountState`.
- Round total carries its own state; `profile_counter_read_failed` gains
  `source: whs_scores.count | usePersonalReviewsCount | useUserCourseSummary`
  on the existing series.

- DEAD LIST ADDITION — `ProfileTop100Chip.tsx`. Nothing mounts it. Its
  zero-on-error fault was fixed before listing: a fault fixed in a file about to
  be swept costs nothing, one left in a file that turns out to be live costs a
  lot. Not deleted here.

- THE `isLoading` GATE HAZARD — TWO INSTANCES, BOTH FOUND BY ASKING WHICH FLAG
  THE GATE READS, NEITHER BY ANYTHING FAILING. A DISABLED React Query v5 query
  is pending with `fetchStatus: 'idle'`, so `isLoading` is FALSE before it has
  ever run: an `isLoading` gate renders a placeholder that never resolves, and a
  permanent em dash is a value — the exact thing the three-state treatment
  exists to prevent, defeated by the gate rather than by the fallback.
  1. `ChromeIsland.tsx:230-246` — documented in its own comments.
  2. `ProfilePageV2` social counters — was `isLoading`, now `isFetched`.
  Every new counter gate in this pass reads `isFetched`.

## Explore rotating hero — pool ladder and net source (10 Sep 2026)

- Pool ladder is three steps and runs PER WINDOW: circle if it clears 5 rounds / 3
  members in that window, everyone otherwise, no-cards only if everyone fails too.
  With 271 rounds from 22 members over 90 days, step 3 is unreachable in practice,
  so the latest-round hero is a genuine emergency fallback and not a normal state.
- Every card names its own pool in its context line, because a member can be shown
  a circle card at 90 days and an everyone card at 14 in the same session.
- `hasCircle` is taken from the circle rounds read itself, NOT `useCircleSize`.
  OPEN CONTRADICTION: `useCircleSize` counts `follows` (`follower_user_id`) while
  the circle pool is `user_friends` (accepted, either direction) UNION outbound
  `user_follows`. Two live follow tables; not resolved here.
- `gam_round_net` is a VIEW, not a table: it selects from `gam_round_stats` where
  `holes_played = 18` and computes `net_score` as `gross_score -
  whs_course_handicap(hcp_at_time, slope_rating, course_rating, course_par)`. So it
  is derived on read, is nine-hole-free by definition, and 3,376 of its 3,524 rows
  carry a net (the 148 without are missing a handicap or rating input). No app-side
  net formula exists; missing net rows simply do not qualify.
- `useRoundNetScores` SILENTLY RETURNS AN EMPTY MAP if the read fails or the view is
  missing. The hero degrades to "no net cards" with no error surfaced — worth an
  instrumented failure later.

## Profile counts §D and two recorded rulings (10 Sep 2026)

- "243 is identical to the hole-detail population" IS TRUE FOR THE TEST MEMBER
  ONLY, and the comments now say so. Three separate definitions return 243 for
  this member — eighteen holes posted (`is_nine_hole` false), hole detail fetched,
  and `gam_round_stats.holes_played = 18` — because their only gaps are two
  nine-hole rounds. Base-wide they diverge: 568 of 3,554 rounds cannot draw a card
  (420 hole rows with no scores, 195 partial, 148 with no hole rows). Each surface
  names the definition it uses; none claims they are the same population.
- CAREER RECORD HEADER IS CAPPED AT 1,000 ROWS (`useCareerRounds`), and the cap
  stays for now, documented at the read. Correct below 1,000 rounds, silently
  wrong above it, nobody near it: the heaviest member on the platform has 345
  `gam_round_stats` rows and zero members exceed 1,000. THE HEADER NEEDS ONLY A
  COUNT, and a `head: true` count query has no cap — that is the fix when it is
  wanted. The sheet's other consumers (course split, best round for a counting
  stat, earliest milestone round) need ROWS including the oldest, so lifting the
  cap blind means fetching an entire career on sheet open. Cost filed, not paid.
- §D BASIS LINES WRITTEN AT THE SURFACES. 49 = `user_course_activity` rows (course
  legacy; includes courses with no imported round). 35 = courses with mapped,
  non-penalty imported rounds from `gam_user_courses()`, whose `rounds_count` sums
  to the 239 analytics round basis. Neither derives from the other — a mapped
  round at a course with no activity row would appear in 35 and not in 49 — and
  49 minus 35 is not a shortfall.

## BRIEF_SHEET_BACK_BEHAVIOUR_02 (build + report)

REMOVAL. `urlOwnsHistoryEntry` is gone from `BottomSheetProps`, from the
destructuring, and from the registration condition. It never had a consumer;
passing it is now a compile error. `sheetHistory.ts` no longer documents an
opt-out. Every open `BottomSheet` registers exactly one history entry.

DRAFT CLASSIFICATION (code read, 52 direct `BottomSheet` consumers + 2 bespoke
overlays). DRAFT-HOLDING — now guarded:
 - `RequestCourseSheet` — typed course name / location / note, nowhere else
   until submit. Dirty measured against the prefill, form status only.
 - `ConversationSettingsSheet` — group-name editor only. Every other control
   commits on tap.
 - `CommentsSheetV2` — composer text or attached-but-unsent image, plus an
   in-progress comment edit.
SAFE TO CLOSE — search, filter, picker and read-only sheets whose state is
either committed on tap or a view preference: `AddCourseModal` (adds/removes
write immediately; only a search query is transient), `FindGolfersSheet`,
`CourseDirectorySheet`, `CoursesPlayedSeeAllSheet`, `HomeClubPickerSheet`,
`PickerSheet`, `RatingFilterChips`, `CompareSheet`, `Top100MoversSheet`,
`Top100ListProgressSheet`, `FullListSheet`, `YourHolesSheet`,
`YourRoundsSheet`, `YourCourseAnalyticsSheet`, `AllTeeTimesSheet`,
`NewConversationSheet`, `FeedActorPicker`, `InviteFriendsSheet` (search only;
the invite link is generated, not authored), `RecentRoundsCard`,
`CourseSection`.

ONE DISMISS PATH. `useDraftDismissGuard` wraps the caller's `onClose`, which is
the single function backdrop tap, Escape, the sheet-stack history entry and any
explicit close/done button already call — so the question is asked once per
dismissal on all four paths, and never when the sheet is clean.

HISTORY COST, NAMED. A back gesture has already consumed the sheet's history
marker by the time the guard runs, so "keep editing" leaves the sheet open with
its marker spent and a second back closes it (asking again). Re-pushing from
inside a popstate handler cannot be made reliable on iOS edge-swipe, so it is
not attempted.

CONTRADICTIONS FOUND, NOT SWEPT.
 - `CommentsSheetV2` is a bespoke portal overlay, not a `BottomSheet`: no
   Escape handler, no sheet-stack entry. Backdrop tap is its only dismiss, and
   hardware back leaves the route with the sheet open. Guard wired to the path
   that exists; migration is a separate change.
 - `RateCourseSheet` inside `CoursesContent.tsx` is a second bespoke bottom
   sheet with its own portal and backdrop, outside the primitive and the stack.
   Holds a search query only, so nothing is lost today.
 - Media/full-screen overlays own history inconsistently: `AvatarLightbox`
   pushes its own `{ lightbox: true }` entry and closes on popstate,
   `FullscreenFeedOverlay` handles Escape but registers nothing, and
   `MomentFullscreenViewer` (Radix Dialog) registers nothing. RECOMMENDATION:
   route all three through `sheetHistory` so back closes the top layer in one
   order; `AvatarLightbox`'s private entry should be retired in that change,
   not before.

COPY. `draftGuard.question` / `.body` / `.keepEditing` / `.discard` added to
`common.json` in all six locales (en, de, es, ja, ko, en-XA), following the
existing convention that de/es/ja/ko carry English pending translation and
en-XA carries pseudo-text. No amber in the confirmation: keeping is the filled
action, discarding is plain text and never the default.

DEVICE TESTS OWED, ALL UNVERIFIED. iOS installed-PWA edge-swipe, Android
hardware back, stacked sheets, refresh with a sheet open, cold URL capture and
open, and background/restore have NOT been run — no authenticated device
runtime is available here. Typecheck and full production build pass; the eight
runtime/history tests remain blocking on sign-off.

## FOLLOW TABLES: ONE CIRCLE, THREE TABLES, ONE WRITER (report, 10 Sep 2026)

Measured on the live database. `public.follows` is NOT a legacy table and NOT a
second live writer. It is the actor-generic table, and it is the ONE the app
writes; `user_follows` and `business_follows` are mirrors maintained BY TRIGGER
in both directions.

  follows        554 rows   96 distinct followers   latest 2026-09-09 07:19:00Z
  user_follows   460 rows   48 distinct followers   latest 2026-09-09 07:19:00Z
  user_friends   163 rows (100 accepted)  27 distinct users (23 accepted)
                                          latest 2026-09-08 11:56:20Z

follows splits personal->personal 460 / personal->business 94. There are ZERO
personal->personal rows in follows without a matching user_follows row, and ZERO
user_follows rows without a matching follows row. Same for business_follows: 94
rows, 94 mirrored. Triggers: trg_mirror_follows_to_legacy_ins/_del on follows,
trg_mirror_user_follows_ins/_del and trg_mirror_business_follows_ins/_del back
the other way, plus fill_follower_actor_id. So they are kept in step by the
database, not by convention, and they do not disagree for a single member today.

AUTHORITATIVE: follows. Writers: useToggleFollow.ts and lib/auth/followClbhouz.ts
insert into follows; delete-account deletes from follows; useFollow.ts still
writes user_follows (mirrored back). Nothing writes only one side.

THE DEFECT IS NOT DIVERGENCE, IT IS THE FILTER. useCircleSize.ts counts
follows for the member with NO following_actor_type filter, so following a golf
club counts as having a circle. 48 of 101 members appear in follows but not in
user_follows -- every one of them follows only BUSINESSES. Those 48 are told
they have a circle and then shown an empty circle board with the wrong
explanation (C1 quiet fortnight instead of C2 cold start). Cross-check: 0
members are in user_follows without being in follows, 0 have accepted friends
without a user_follows row, and only 5 members have nothing in any of the three.

THE 52-OF-99 FIGURE STANDS. Measured from user_follows, which is exactly the
personal->personal slice of follows: 48 of 101 members follow at least one
person, so 53 follow nobody. user_friends adds nobody new. The three design
decisions taken on that figure are safe.

THE POOL LADDER IS ALREADY RIGHT. useCircleLatestRounds builds the circle from
accepted user_friends plus user_follows -- the people-only definition -- so the
pool never contained a business. Only the head-count question is wrong.

OPEN (not fixed, awaiting ruling): point useCircleSize at the same people-only
definition the pool uses, or filter follows to following_actor_type='personal'.
Either makes "do you have a circle" and "who is in it" the same question. No
reconciliation sweep is needed -- the tables agree.

## AGGREGATE HERO FAMILY (built, 10 Sep 2026)

Rotation now offers all eight metrics. Aggregate cards: no round, so no shape
band and no course name -- the spread line ("Across 6 rounds, 4 courses") takes
that slot, the subject is the card's own member (never the fallback round's), the
backdrop is the flat tone rather than a borrowed course photograph, and the tap
opens /profile/<user_id>. Depth test held at 3 members per Ben's ruling.
Also tightened: a busiest-line card on the everyone pool from a TRUNCATED read is
now rejected, matching every other place a fetch cap must not print as a count.

OPEN (recorded, not urgent): useRoundNetScores returns an empty map without
complaint if gam_round_net is unreadable -- the two net cards would silently
leave the rotation with only a console line as evidence. Same silent-failure
shape as the cron jobs.

## PROFILE PASS ONE, E AND F (10 Sep 2026)

CAP ITEM AMENDED — the 1,000-row cap in useCareerRounds has TWO failure modes,
and the second is the dangerous one. The cap keeps the 1,000 NEWEST rows; the
three rows-needing consumers want the OLDEST (milestoneRoundFor takes the LAST
match). So above 1,000 rounds:
  1. the header count is VISIBLY wrong -- reports 1,000 and stops;
  2. the milestone detail is PLAUSIBLY wrong -- "your first eagle" silently
     becomes the oldest eagle still inside the window: a real round of theirs,
     correct format, plausible date, not the first.
A wrong count is noticed. A wrong first round is believed. Both now named at the
read. Nothing built: heaviest member 345 rows, nobody near the cap.

E -- HOME CLUB PROMPT REMOVED from ProfilePageV2 (import and render). It was the
only mount: nothing else in the tree rendered it. The file
src/features/home-club/HomeClubPrompt.tsx is DEAD-LISTED, not deleted, and its
default export is now unused too. ClubsCard already states the owner's empty
case and opens the same picker (openHomeClubPicker), so the prompt was a second
door to one destination sitting directly above the first.
  LOST WITH IT, recorded rather than rebuilt: the PENDING club treatment
  (BRIEF_HOME_CLUB_PICKER §3.5) lived only in that prompt, and nothing else reads
  a pending club (§3.6). A member with a pending club now sees the same empty
  state as a member with none until it is approved. Open question for Ben's
  structural call, not fixed on my own authority.
  OTHER sessionStorage-DISMISSED PROMPTS IN THE PROFILE TREE: none. The only
  other sessionStorage user in the profile tree is
  ProfileAvatarRing.tsx (RING_ANIMATED_KEY) and it gates an ANIMATION once per
  session, not a dismissal. Everything else is elsewhere (review composer drafts,
  amateur hero rotation, amateur scroll memory, admin ops panel).

F1 -- STILL TO RATE REMAINDER. The text was never clipped; the TILE was. Three
96px tiles plus gaps are 318px against a 326px inner width at 390pt
(390 - 32 page - 32 panel), leaving 8px for the fourth -- so the remainder tile
rendered as a sliced "+1". The remainder now sits OUTSIDE the scroller, sized to
its own text (padding 0 10, nowrap), with the thumbnail row taking the remaining
width. Measured at 390pt: remainder box 88.2px, fully inside the panel, not
truncated, and unchanged in behaviour for a three-digit value because the box is
content-sized.

F2 -- LEGACY STRIP LABELS, ALL FOUR ON ONE LINE AT 390pt. Four items share
81.5px a column. Measured at the label's canon 11/700/0.13em:
  WORLD TOP 100  105.5px  -- cannot fit at any legal type size; broke after
                             "TOP", which read as a separate "100" column
  AVG RATING      80.9px  -- fitted by 0.6px, a wrap waiting to happen
  COUNTRIES       75.8px
  PLAYED          49.6px
Copy shortened to WORLD 100 (75.3px) and RATING (50.2px), both still naming what
they count, with the measurements written at the items. StatRow gained an OPT-IN
labelNoWrap (default false, every other StatRow byte-identical) so a longer
locale string ellipsizes instead of wrapping -- a truncation reads as one label,
a wrap reads as two. Verified at 390pt: four labels, one line each (1.09 line
boxes), zero truncated.
  NOT FIXED, and it predates this pass: legacy.* has NO keys in any of the six
  locale files, so all four labels fall back to the English defaults everywhere.

## THE CIRCLE HAS FOUR DEFINITIONS, NOT TWO (10 Sep 2026) -- REPORT, NOTHING BUILT

### 1. WHAT WRITES EACH TABLE

Not two code paths. ONE conceptual write, mirrored by DB triggers in BOTH
directions, which is why the newest rows match to the microsecond:

  follows          -> trg_mirror_follows_to_legacy_ins/_del -> mirror_follows_to_legacy()
                      personal/personal edge  -> user_follows
                      personal/business edge  -> business_follows
  user_follows     -> trg_mirror_user_follows_ins/_del -> mirror_user_follows_to_follows()
                      -> follows as personal/personal
  business_follows -> trg_mirror_business_follows_ins/_del -> follows as personal/business

So follows is the SUPERSET and the two legacy tables are its two typed
projections. Both mirrors use ON CONFLICT DO NOTHING, so the round trip
terminates rather than looping.

App writers: useToggleFollow, useBusinessFollow, followClbhouz (all -> follows);
useFollow.ts and join-request edge fn still write user_follows directly (mirror
carries them up); useBlockActions deletes from user_follows AND user_friends;
delete-account deletes from follows. THE FOURTH WRITER IS A TRIGGER:
auto_follow_on_friend_accept inserts TWO user_follows rows when a
user_friends row flips pending -> accepted. Accepting a friend therefore creates
a mutual follow, which is why accepted friendships add almost no members the
follow tables do not already have (1 across the base).

### 2. WHO READS WHAT (app-wide, not confined to Explore)

follows (5 readers): useToggleFollow, useFollowState, useBusinessFollow,
useCircleSize, useSuggestedGolfers, plus compute-golfer-eligibility-signals and
delete-account edge fns.

user_follows (18 readers): useFollow, useBlockActions, useFollowingIdSet
(Explore course-led), usePlayedWith + useInboxStarters (messaging),
usePostLikers, useNetworkActivity, useCircleLatestRounds, useMembersWhoPlayedCourse,
useTopTenVisibility, useFriendsTop100Progress, useDiscoveryExclusions,
useRealtimeSocialCounts, admin useUserDetails + useUsers (follower/following
counts on the admin user record), join-request edge fn.

user_friends (14 readers): useFriendship, useFriendActions, useFriendRequestsV2,
useFriendsLeaderboard, useFriendIdSet, useTopTenVisibility, useNetworkActivity,
useDiscoveryExclusions, useBlockActions, useEditorialCards, useCircleLatestRounds,
FindGolfersSheet, notify-friend-review edge fn.

BECAUSE THE MIRRORS ARE BIDIRECTIONAL, the personal-edge readers do NOT disagree
with each other. The only disagreement is TYPE: a reader of follows sees business
edges, a reader of user_follows does not. Every wrong branch traces to that.

### 3. WHAT user_friends IS FOR -- IT IS LIVE AND CANNOT BE FOLDED IN

It is not a legacy layer. It is the FRIEND REQUEST model and follows cannot
express it: 100 accepted, 62 PENDING, 1 declined. The pending state is read and
written by useFriendRequestsV2 (accept/decline), useFriendActions, useFriendship
and the Activity feed; two notification triggers fire on it
(create_friend_request_notification, create_friend_accepted_notification) and
prevent_friend_if_blocked guards it. Blocked is NOT stored here (0 rows) -- that
moved to blocked_actors.
  So user_friends stays. What it must stop being is A SOURCE OF CIRCLE
MEMBERSHIP, because accepted friendship already implies a mutual follow via
auto_follow_on_friend_accept: only 1 member base-wide is in an accepted
friendship without a follow edge, and that one is a pre-trigger row.

### 4. THE FOURTH DEFINITION, WHICH THE BRIEF DID NOT NAME

board_pool() -- the shipped leaderboard's own SQL -- builds `circle` as
user_friends WITH NO STATUS FILTER, union user_follows, union the viewer. So a
PENDING friend request puts a stranger's rounds on the circle board. 65 members
appear in user_friends at any status against 43 accepted, and 18 members have
pending-only rows and no other circle edge. That is the same class of fault as
the business one, in the opposite direction: the server pool is too WIDE while
useCircleSize is too wide in TYPE and useCircleLatestRounds is correct.

  useCircleSize          follows, all actor types, no filter  -> too wide (business)
  board_pool             user_friends any status + user_follows -> too wide (pending)
  useCircleLatestRounds  user_friends accepted + user_follows   -> correct today
  BRIEF definition       "people the member chose"              -> the intent

### 5. THE COUNTS, RECOMPUTED

101 member rows in user_profiles. 48 follow at least one golfer. 94 personal->
business edges; 48 members follow a business and NO golfer (Ben's 47 plus one --
the extra is a member with a business follow whose only other edge is nothing;
all 48 also have no accepted friendship, so none is rescued). 5 members have no
edge of any kind. 1 member has an accepted friendship without a follow row.
  AND THE FIGURE WE DESIGNED AGAINST: "follows no golfers" = 53 of 101 (101 - 48).
Read from follows it looks like 3, which is the business edges masking it. 52/99
was right for the question and right by accident, and it is now stated with the
question attached.

### 6. PROPOSED FIX -- NOT BUILT

Agreed with Ben's instinct, with one addition, because user_friends' pending
state means the fix has to name a status rather than drop the table:

ONE definition, in ONE file (`src/lib/social/circle.ts`, new):
  THE CIRCLE = follows WHERE follower_actor_type = 'personal'
                     AND following_actor_type = 'personal'
                     AND follower_actor_id = viewer
  Outbound only. No user_friends term at all: accepted friendship already
  guarantees a follow edge via auto_follow_on_friend_accept, and including
  user_friends is what let pending requests in.
  ONE MIGRATION IS REQUIRED and it is the only server change: board_pool()'s
  `circle` CTE is replaced with the same predicate, which simultaneously drops
  pending friends and keeps business follows out. Nothing else in the RPC moves.
  THE ONE PRE-TRIGGER ROW (accepted friendship, no follow edge) is backfilled in
  the same migration rather than kept as a special case in the definition.
  useCircleSize then becomes a count of that predicate, so size and membership
  are the same query with a different projection and CANNOT disagree.
  KEEP user_follows/user_friends readers as they are for now -- they are correct
  for what they ask (personal follows; friendships) and the mirrors keep them
  true. This item is about the CIRCLE, not about collapsing the tables.

### 7. WHY THIS ONE WAS INVISIBLE

The five before it were quantities: two numbers on a screen, one of them wrong,
visible to anyone who looked twice. This one is a CONCEPT, and a concept
disagrees in BRANCHES. Nobody saw a wrong figure -- 48 members saw a correct
empty board, reached by asking the wrong question, on a page whose brief exists
to prevent exactly that. The hero's pool ladder has been silently compensating
for it since the day it was built.

## BRIEF_SHEET_BACK_BEHAVIOUR_03 (report)

1a DONE: ReviewComposerV2 step-0 back now guarded (useDraftDismissGuard +
DiscardDraftDialog). Dirty = overall score, any category score, typed text, or
attached media. Tee label / share toggle alone are not dirty. It is a ROUTE, not
a sheet: only the header arrow is guarded; browser/OS back leaves the route
without calling it, and that path is safe for create mode (sessionStorage draft
`review-draft:<courseId>`, 24h) but NOT for edit mode, which never persists.
RateCourseSheet (CoursesContent.tsx) is a course search, holds no authored text,
no guard needed.

1b post composer: the SHELL already owns a guard. StageComposer.handleClose ->
'close-guard' BottomSheet offering Save draft / Discard on state.dirty. Stage
sheets (Actor, CourseTag, Adjust, CoverFrame, Drafts, more) write into that same
composer state, so dismissing one returns to the composer with everything
intact - no per-sheet guard. GAP: useDrafts.save persists caption + course tags
ONLY. Media and scheduled time are NOT in post_drafts, so "Save draft" from the
close guard loses attached media. Filed, not built.

1c ScheduleSheetV2 assembles date + hour + minute locally and commits only in
apply(); dismiss discards the assembled time. Left unguarded deliberately: it
re-seeds from `value` on every open and is three stepper taps, not authored
content. ScheduledPostsList holds no state; every action commits on tap.

2 SPENT MARKER - CONTRADICTION. sheetHistory pops the entry BEFORE close runs,
so after a hardware back the guard's keepEditing leaves the sheet open with NO
marker. The next back is therefore taken by whatever is below: for a sheet, the
parent sheet's marker; for the review ROUTE, the router - the route leaves while
the composer is conceptually open. The existing comment claiming "the second
back asks again" is wrong for the no-parent case. Not re-pushed here (would need
a pushState during popstate); filed for ruling.

3 MEDIA VIEWERS - none of the three own a history entry. FullscreenFeedOverlay
(global, App.tsx:1105), MomentFullscreenViewer (Radix Dialog, MomentsTimeline),
MediaPreviewViewer (portal; ReviewBottomSheet:854, MessageBubble:459). Back
falls through to the router or to a parent BottomSheet marker. Confirmed
ReviewBottomSheet never clears viewerIndex on sheet close (only viewer onClose),
so a back-press closes the host sheet with the viewer still mounted. Fourth,
out of scope: AvatarLightbox does push/pop its own entry.

4 AMBER: non-member uses inventoried (nav unread badge, activity glyph tiles and
active chip, crowns for other members' records, rating band BAND_AMBER, business
status/waiting chips, connect/request/report CTAs, tab-underline vars,
SectionHeader amber eyebrow). TugStat documents itself as a deliberate
exception. Report-only, nothing recoloured.

5 Eight device/runtime history tests STILL UNRUN - authenticated device runtime
unavailable. Nothing deleted this pass.

## Pass one closing rulings (10 Sep 2026)

### 1. Pending home club restored - in ClubsCard, not in a prompt
`ClubsCard` gained `pendingClubName`, read on the owner's own profile from the
same `useHomeClubStatus` hook the removed prompt used
(`user_profiles.home_club_pending_name`, plus the open `course_requests` check
the hook already makes). NOTHING RECONSTRUCTED - no data ClubsCard could not get
from the canonical source. Pending now outranks the empty state: a member with a
club on the way is shown their answer with a Pending status instead of being
asked the question again. `HomeClubPrompt.tsx` stays dead-listed, not deleted.

### 2. RATING keeps its short label; the basis line carries "average"
The strip's basis line was a CODE COMMENT ONLY before this ruling - section D
wrote the PLAYED definition into `JourneySummaryCard`'s header comment, and no
sentence rendered beneath the strip. There is now a visible one, own-profile
only, in the panel footer:

  "Played counts every course on your record, rated rounds or not.
   Rating is the average of your 49 course ratings."

The rating count comes from the same `course_ratings` read that produces the mean
(mock rows and zero ratings excluded); the query now returns `{ avg, n }`. The
rating clause is OMITTED when the count is unknown rather than naming a
population it has not counted. Third population stated where it renders: played
(49) is not rated (n) is not imported-round courses (35).

`WORLD 100` accepted as shipped.

### 3. OPEN - `legacy.*` locale keys missing in all six locales
Every label and both basis sentences in `JourneySummaryCard` fall back to the
English `defaultValue` in en/de/es/ja/ko/en-XA. Pre-existing, unrelated to the
correctness pass. SCOPE IF PICKED UP: `legacy.played`, `legacy.countries`,
`legacy.top100World`, `legacy.avgRating`, `legacy.basisPlayed`,
`legacy.basisRating` (plural-aware), `legacy.kickerOwn/kickerOther`,
`legacy.emptyTitle*/emptyBody*`, `legacy.findCourses`, plus `toRate` from F1 -
six locales' worth of new copy, which is a translation pass and not a
correctness one.

### Also on the open list
- `useCareerRounds` 1,000-row cap: header count visibly wrong above 1,000,
  milestone "first round" plausibly wrong above it. Heaviest member 345.
- `useDrafts.save` does not persist post media or schedule time.
- Eight sheet back-behaviour device tests still unrun.

### Over to Ben on device
Two counter error states, the three-figure visitor hero, ROUNDS reading 245, the
remainder tile at three digits, and the four legacy labels on one line.

### 4. OPEN - BottomSheet does the weaker scroll lock, for all 52 consumers
`lockBodyScroll` (src/lib/bodyScrollLock.ts) is reference-counted and does
position-fixed locking with scroll-position capture and restore, route-aware
restore on navigate-away, and a force-release escape hatch. `BottomSheet` only
sets `body.style.overflow = 'hidden'`, so under it the page can still rubber-band
on iOS and nested overlays cannot stack their locks. ProfileSheetV2 used the
helper before BRIEF_ACCOUNT_SHEET_REBUILD E and now uses the primitive, so that
one sheet regressed knowingly. SCOPE IF PICKED UP: move `BottomSheet` onto
lock/unlockBodyScroll and verify all 52 consumers, especially sheets opened over
an inner scroller and sheets that navigate on close. Deliberately NOT bundled
with E: 52 consumers is not a side effect of tidying one sheet.

### Also from BRIEF_ACCOUNT_SHEET_REBUILD E
- ProfileSheetV2 no longer animates its close (BottomSheet unmounts on close,
  as it does for every other consumer). Accepted.
- Drag-to-dismiss is touch-only on the shared primitive: no mouse drag on
  desktop. Noted, not fixed - it matches every other sheet.

### 5. OPEN - two cross-member counts run under RLS and are shown as totals
`countMomentsLibrary` (src/features/media-library/libraryTotals.ts:27) and the
video-post count in admin `useAnalytics.ts:429` count OTHER members' post_media
rows through the caller's own RLS. Correct today only because every one of the
756 rows belongs to a public-profile author, so the narrow SELECT siblings admit
all of them. The day a private-profile member posts, both figures drift
PER-VIEWER while still being labelled a total. FIX: a SECURITY DEFINER count
function, one per figure. Deliberately NOT part of dropping
`public_read_post_media` - the drop moved no number.

### 6. FOR BEN - venue backfill match list
Seven upcoming club names are weak enough to risk mismatching on their own
(Albany The Bahamas, El Cardonal at Diamante, Hammock Beach, Pleasant Valley,
St. Andrews, The Cliffs at Walnut Cove, Vidanta Vallarta) and Hoakalei Country
Club is currently unmapped in sr_course_map.

### 7. OPEN (from 3 Aug) - views that run as their creator, now a list
18 public views are readable over the API and do NOT have security_invoker set,
so they run with the owner's rights and the caller's RLS never applies:
reachable WITHOUT signing in - course_pooling_watch, course_rating_aggregates,
course_rating_stats, explore_moments, public_golfer_blurbs, public_profiles,
round_post_like_count_drift, season_leaderboard_view, stat_browse_base,
tourhub_leaderboard_latest, vw_course_activity_30d, vw_region_activity_30d,
vw_theme_activity_30d.
signed-in only - user_achievements_view, user_course_activity,
user_top100_progress_view, whs_friend_matches, whs_friend_window_rankings.
Nine views already set the flag (cron_job_health, gam_course_legends_view,
gam_round_net, gam_user_course_record_view, post_comments,
user_top100_rated_courses, user_top_ten_courses_view, whs_friend_course_bests,
whs_invite_status) - that is the part closed in August. Seven more owner-run
views (admin_audit_feed, business_profile_daily_insights,
gam_friend_handicap_leaderboard_view, gam_rivalry_results_flat_view,
sr_tournament_course_resolution, user_friend_pairs, user_season_xp_view) are not
granted to anon or authenticated at all and are not exposed.
NOT TO BE FIXED IN PASSING: several feed live surfaces, and setting the flag
changes which rows they return. Own pass, own verification.

Also open, same census: 7 public tables with RLS off (_feed_v3_backup,
_par_race_test, _round_post_fn_backup, geo_region_aliases, major_tournaments,
spatial_ref_sys, tour_push_rotation) and 11 with RLS on and no policy at all
(admin_email_notifications, invite_requests, leaderboard_snapshots,
page_path_map, page_route_manifest, push_drain_debounce, site_gate_attempts,
system_state_daily, system_state_history, web_vitals,
whs_friend_leaderboard_snapshots) - the second group is closed to members
already, since RLS with no policy denies everything.

### 7a. TRIAGE of item 7 - three tiers
TIER 1, ops artefacts open to the internet, no reader in the app:
round_post_like_count_drift, _feed_v3_backup, _round_post_fn_backup,
_par_race_test. Only appearance anywhere in src/ or supabase/functions is the
generated types file. Fix is REVOKE on anon/authenticated - not a policy, not the
invoker flag, not a drop. Zero live surfaces.
TIER 2, the five member-scoped creator-run views needing security_invoker, each
with its live readers: whs_friend_matches (src/lib/whs/api.ts, friendViewRivalries,
friend-content-recompute, snapshot-friend-leaderboard), whs_friend_window_rankings
(api.ts), user_course_activity (useUserCourseSummary, useUserCourseActivity,
useTop100ProgressForUser), user_achievements_view (useUserAchievements),
user_top100_progress_view (useTop100ProgressForUser, useUserTop100Progress).
Per-view pass with its own verification. Edge functions use the service role and
are unaffected by the flag; the client hooks are the risk.
TIER 3, confirmed deliberate: the aggregates and reference views. explore_moments
carries member post media (see note below) and is the one to decide.

### 8. CLOSED - page_path_map now read through a trusted function
src/features/admin/hooks/useScreenAnalytics.ts:84 selects page_path_map directly.
The table has RLS on and NO policy, so a member (admin included) gets 0 rows from
1,656. The hook then returns [] at its own empty-path guard, and the screen's top
events list renders as "no events" for every screen. Same class as the counter
faults: something unknowable rendered as something known. FIXED: get_screen_event_paths(route_pattern) is
SECURITY DEFINER, admin-gated, granted to authenticated and service_role only,
and page_path_map keeps NO policy. The panel now has three states: loading, an
unreadable lookup that says so, and a real zero.

### 9. FAULT LOG - 'F THRU', a hardcoded literal presented as a live reading
src/features/tourhub/components/overview-v3/HybridHero.utils.ts:213 returns
thruLabel: 'F THRU' for EVERY live tournament. It is not a reading: it says the
leader has finished every round of every live event, forever, and nothing in the
app would have reported it. Eighth instance of the class today (backfilled
timestamps, invented handicap curve, error rendering as zero, and the rest), and
the first caught while building rather than while auditing.
NOT FIXED, DELIBERATELY: HeroTournament carries neither thru nor num_rounds, so
there is nothing to derive a true figure from. The Section B hero fact DROPS the
THRU slot rather than printing the literal. When the hero cache exposes them,
thruLabel derives from the leader's own thru through the canonical
features/tourhub/utils/formatThruDisplay.ts (F, stale F, shotgun, status
overrides all handled), and totalRounds comes off num_rounds instead of the
"LPGA is 54 holes, everything else 4" guess on the line above.

## BRIEF_TOUR_OVERVIEW_STRUCTURAL — sections F and G

### F. College Franchise compressed, and instrumented
`src/features/tourhub/overview/sections/CollegeFranchise.tsx` now renders kicker,
meta "All franchises", one 14/1.5 sentence with the leader bold, three 16px
tabular figures under 0.12em name kickers, and a terminal ALL FRANCHISES row.
Roughly 120px where the Open Duel treatment ran to roughly 700.

RETIRED TO THE DEAD LIST (line ranges in the PREVIOUS revision of that file,
499 lines; nothing deleted from disk beyond this file's own render blocks, and
the full treatment still lives behind /tourhub?tab=college):
- :60-102 SchoolSquircle — the logo pair's renderer.
- :265-296 the duel row, including :285 the VS mark.
- :416-497 DuelSide — the two captain rows (:464-491 the captain button).
- :298-323 the tug bar and its two earnings ends.
- :326-410 the hairline, AND BEHIND THEM label and ranks 3-5 rows with the
  blurred brand haloes.
Hooks no longer read HERE but untouched on disk and still read by the college
pages: `useFranchiseCaptains`, `getCollegeLogoUrl`, `getCollegeColor`,
`liftedBrandAlpha`, `getPlayerHeadshotCandidates`, `SquircleAvatar`.
Locale keys now unused by this surface but KEPT: vs, tugLabel, captainLabel,
captainSuffix, behindThem, rowMeta, rowMetaWithCaptain, onTour*, supporting*,
headline* (the editorial headline chain still supplies the sentence).

INSTRUMENTATION — this is the part that matters more than the compression.
Ben's ruling was "keep it if it works", which is only answerable if something
counts whether anyone reaches the foot of this page:
- `tour_overview_college_view` — IntersectionObserver at threshold 0.5 on the
  rendered body, once per mount. NOT on mount: LazySection mounts the section
  200px early, so a mount is not a view. Never fires from the loading hold.
- `tour_overview_college_tap` — the terminal row only, with target
  `all_franchises`. Reach, then intent.
Both write through `analyticsEvents.track` (bot-filtered, non-blocking).
FIRST READING IS THE BASELINE: view count vs page-view count answers reach; tap
over view answers whether the compressed section earns its place.

### G. The provenance line
`OverviewPageV3.tsx` foot: hairline, then "Leaderboards and rankings from the
tours. Ratings from clbhouz members." at 10/T40 (rgba(248,250,252,0.40)), on the
20px overview gutter. Six locales, key `overview.page.footerLicence`.

### E2 note — the Wire gutter stays at 16, and this page is now a CONSUMER
See the LeadStory/StoryRow gutter workaround. Inside a card the 16-versus-20
difference was invisible; on the flat overview every section kicker lines up
except the Wire's. The header was deliberately NOT pushed to 20 while its body
carries the 14px LeadStory frame — a misaligned header and body is worse than a
section 4px out from its neighbours. Whoever unwinds LeadStory with an additive
`gutter` prop now has TWO surfaces to verify, and the Tour Hub overview is the
one where the misalignment shows.

THIRD INCONSISTENCY ON THE SAME PAGE (device-check ruling): the Wire's two
story rows beneath the lead sit on a 14px inset, 6px inside the image edge.
That makes THREE on this one page — the kicker at 20, the header at 16, the
story rows at 14 — which is the argument for unwinding LeadStory properly
rather than patching any of them here.

OPEN QUESTION (filed, not answered): the 300px hero photograph is NOT tappable
(OverviewHero binds swipe only; TOURNAMENT › moved to a terminal row beneath
the image). A photograph with a tournament name on it reads as a link to
everyone who sees it — whether the hero SHOULD be tappable is Ben's call,
separate from the CTA relocation.

OPEN QUESTION (filed, not answered): is the foot of the tour overview a sensible
home for a connect-handicap prompt at all? It sits after nine sections of tour
content, so a member who reaches it is not thinking about their own handicap.
The prompt was kept and only reordered (above College Franchise, below Course of
the Week), but the real decision belongs with the open connect-prompt work for
Champions and the course pages — one ruling on where connect doors live across
the app, not three separate judgements about three page feet.
