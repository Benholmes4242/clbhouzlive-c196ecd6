# BRIEF_EXPLORE_REVIEW_TILE_A1

## BRIEF_MEDIA_1 — MEDIA_ENGINE_1
- [x] Ben approved exifr 7.1.3 lite; installed exact version, MIT, installed file bytes 1,291,466, lite minified 45,456 / gzip 14,786. Before building on it, Chromium read real JPEG File fixtures (generated known EXIF, not mock parser output): date+GPS, date/no GPS, GPS/no date. Kept repeatable tests/browser/test_hole_photo_exifr_lite.py; also proves actual metadata reader. No silent build switch; HEIC File parsing not exercised.
- [x] Isolated metadata reader and date-only verdict in src/lib/courseMedia, no UI callers or inserts. Real-round ownership/course/date match, proof ID, plain queue reasons, preserved GPS; absent coordinates never affect status. Seven new holePhotoVerdict cases; full suite 1,626/210 -> 1,633 passing/211, no existing tests deleted, renamed, rewritten or assertions changed. One new browser proof (three File cases) passes independently. Preview build OK 2026-10-18T11:59:12Z; AGENTS.md 5,039 bytes. No admin, SQL, migration, RPC, edge function, feed_config, cap or original-review changes.
- [ ] BLOCKED AJC3: generated golf_courses Row (src/integrations/supabase/types.ts:6877-6902) has no course hole-count field; analytics holes and round total_holes do not establish catalogue count. Need Ben's authoritative existing count source; do not assume eighteen. Picker, coverage count and attached Tag flow remain unbuilt.
- [ ] Source ruling needed: current CourseMediaCanonGrid.tsx:247-299 is the canonical packed pile without an Everything else section; signed-off mock replaces that arrangement with square tiles. Review image originals go through reviewUploadController.ts:87-111, not postUploadController; actual stored EXIF retention and CORS remain unverified, never infer capture day. Mock's “holding pictures of at least four” cannot be derived before hole tags exist; need permitted data-backed alternative.
- [ ] Existing client publish/owner-only pending policies unverified (no local policy source, SQL prohibited); no write path or hosted authenticated acceptance claimed. Finish tagging controls/outcomes, ownership/nine-hole/admin guards and end-to-end checks only after source blockers are resolved.

## REVIEWS_STATE_4
- [x] Ben confirmed ADA2: distribution at five excluding. Correct ADE2 cases: six total with viewer shows; five total with viewer hides; five total without viewer shows. No other brief changes.
- [x] Reuse FewReviews for States 3/4 and existing RatingTierDistribution with opt-in sample appearance; excluding counts and generated quiet sentence, five zero-preserving rows and shares of excluding total. Min-to-max category bands and findings use the existing helpers; Condition-only exact months clause. State 3 rendering/test assertions preserved; no composer, social source, SQL/migration/RPC/feed_config/cap/artwork changes or raw hex/rgba additions.
- [x] Full suite 1,616 / 209 files -> 1,626 passing / 210 files. Only added src/test/reviewsState4.test.tsx (10): seven including viewer sums six; six total including viewer shows; five total including viewer hides; five total without viewer shows; all five rows/zero tracks; nine total min-to-max; Condition spreads and permitted explanation; Clubhouse forbids month explanation; State 4 boundaries; shared circle-first rows/own review. No tests deleted, renamed, rewritten or assertions changed. Existing States 1/2/3 pass (6/19/14); State 2 no-middle-band/no-splits source-tree assertion passes unchanged. Log /tmp/reviews-state-4-suite.log.
- [x] Preview build OK 2026-10-18T08:36:25Z. Isolated populated shared-screen browser fixture at 393x1500 and 1280x1800 renders five rows [2,3,1,0,0], six-person sentence, min-to-max bands with Condition 3.0/Design 0.9 explanation and no horizontal overflow; screenshots /tmp/browser/reviews-state-4/state4.png and desktop.png. Fixture's actual overall is 8.55 displayed 8.5, delta 0.4 for viewer 8.9; mock figures are illustrative, never forced. Architecture shared-screen/chart rule recorded in AGENTS.md.
- [ ] Authenticated hosted West Kent/photo/composer acceptance unavailable: external_unmanaged Supabase cannot supply an authenticated session. Local populated rendering is not hosted acceptance; no hosted figure/source-completeness claim.

## REVIEWS_STATE_3
- [x] Ben resolved ACA3/ACC2: count/spread/ending average all exclude viewer. Zero spread starts “Two people agreeing…”; positive spread starts “They sit inside…”; one other person has no sentence. Mock's old line is superseded, everything else stands.
- [x] Implement only two-to-four-total state, shared two-excluding average threshold, State 2 community-half fallback, excluded min-to-max categories, shared person/context rows and known-people-first order; preserve States 1/2 and composer; no State 4/middle-80%/splits. Course circle reuses useMembersWhoPlayedCourse (outgoing follows), scoped to visible blocked-filtered rows. Category meaningful contrast uses one displayed tenth; real values replace illustrative mock figures.
- [x] Full suite 1,602 passing / 208 files -> 1,616 passing / 209 files, +14 reviewsState3 cases; no existing tests deleted, renamed, rewritten or assertions changed. Includes Sundridge excluding 8.1/+0.3 and caution two/zero-spread; positive spread, two/three/four no distribution, other-person fallback, four excluded bands, five excluded, unrated viewer, circle order, unknown months, meaningful/equal category gaps. Six State 1 and nineteen State 2 tests still pass. Log /tmp/reviews-state-3-suite.log. Existing rater-context architecture note relocated verbatim into SingleReview header to respect AGENTS.md budget; new shared-row rule recorded there.
- [x] Preview build OK 2026-10-18T08:25:51Z. Isolated populated browser fixture at 393px confirms 8.1 headline/+0.3, revised caution, circle-first shared rows/context and no horizontal overflow; screenshot /tmp/browser/reviews-state-3/state3.png. Temporary harness import errors corrected without app/test changes. This is local fixture rendering, not hosted acceptance; no photo/composer interaction acceptance claimed.
- [ ] Hosted Sundridge/photo/composer acceptance blocked by external_unmanaged authentication; context counts remain RLS-visible as in State 2, unknown facts omitted. No SQL/migrations/RPC/feed_config/cap changes, raw hex/rgba additions, or artwork changes.

## REVIEWS_STATE_2
- [x] Clarified source gap: unknown review-owned played month means no pill and never an inferred round/review date. Calibration prose may repeat overall score; every-category clause requires four exact tens, mixed/missing categories omit it.
- [x] Build single-total-rating selection, person-led panel and complete visible non-mock rater-history context; unknown/inaccessible facts remain absent, handicap uses canonical resolver. State 1/composer/media entrypoints unchanged; existing six State 1 tests pass. Month supplied only as explicit review-owned input, absent on all current rows. Context counts are RLS-visible, not verified hosted global totals.
- [x] Authorised 2026-10-18: wrapped only reviewsState2's shared single() render and Add yours render in MemoryRouter; no router mocks or assertion changes. useSingleReviewContext has three direct async function tests and no rendered fixture to wrap; unchanged. Full suite: before 1,602 collected / 208 files, 1,592 pass / 10 fail; after 1,602 pass / 208 files, zero failures. No tests added, deleted, renamed or assertions rewritten; only fixture context changed. Existing passing tests, application code and global setup untouched. Full log /tmp/reviews-state-2-router-suite.log.
- [ ] Populated visual/photo/Add yours verification not run after QA2 stop; signed-in hosted verification additionally blocked by external/unmanaged authentication. Preview build OK at 2026-10-18T08:04:38Z; no SQL/migrations/RPC/feed_config/cap changes, no raw hex/rgba additions. Middle-80% and splits components not built. Architecture state contract in local headers; previous community-sample note relocated verbatim into its module header.

## REVIEWS_STATE_1
- [x] Match the signed-off zero-rating invitation only; shared state rule; catalogue figures derived from total/rated.
- [x] Add zero/one-rating and absence/derived-figure coverage; full suite and preview pass in REVIEWS_STATE_1_T; figures confirmed.
- [ ] Hosted visual/first-review acceptance: external/unmanaged authentication prevents signed-in verification; local handler test passes.

## REVIEWS_STATE_1_T
- [x] Wire Ben's confirmed 2026-10-18 snapshot (23,292 total, 115 rated; derive 23,177) and remove pending status.
- [x] Copy the complete canonical i18n mock into reviewsState1; audit Reviews/Champions additions: reviewsState1, reviewsSample1, useCourseReviewSample, championsState1/2/3, championsNetSource, championsElsewhere, championsOrder and coursePlay. No other partial mocks found; State 3 adds Trans while retaining canonical init/t behavior. No other tests changed.
- [x] Full suite: 1,574 passing / 205 files before State 1 collection fix -> 1,580 passing / 206 files, zero failures; existing six reviewsState1 cases now collect, no added/deleted/renamed cases. Only rewritten case: 'stores two catalogue figures and derives without-review from their difference': rated 0 -> 115, pending removed, numeric figures [23292, 0] -> [23292, 115], sentence 23,292 -> 23,177; add concrete derived assertion 23177, authorised by AAA1. All other assertions unchanged. Preview build OK at 2026-10-18T07:53:16Z. No components/setup/i18n/RPC/SQL/migrations/feed_config edits; cap 30. Crop architecture note moved verbatim to its existing browser-test header to fit the cross-area mock rule; no crop code changes.

## BRIEF_REVIEWS_1 — REVIEWS_SAMPLE_1
- [x] Correct overall/four category means and distribution via shared fieldExcludingViewer and complete paginated non-mock rating sample; preserve You-tab implementation/signature and review screen structure. Viewer-only sample has no invented community zero or delta.
- [x] Centralise fixed 2/5/10 rules and split eligibility; future state screens consume these helpers, not implemented here under the no-screen-change instruction. No ranges or split screens exist today; excluded communityRows is their future input.
- [x] Baseline 1,557 -> 1,574 passed (203 -> 205 files): reviewsSample1.test.tsx +15; useCourseReviewSample.test.ts +2. No tests deleted, renamed or rewritten; existing You-tab tests unchanged and passing. Preview build OK. External/unmanaged Supabase prevents authenticated live Sundridge verification; referenced HTML was not provided in this upload or available in the project, so no mock conformity claimed. No SQL/migrations/RPC/feed_config changes; cap 30; no raw hex/rgba additions.

## BRIEF_COURSES_HIGHEST_RATED_TEN
- [x] Set Highest rated to ten; require per-rail loading counts; preserve Regulars and card geometry.
- [x] Update the authorised limit assertion and add four focused cases.
- [x] Full suite 1,548 -> 1,552 passing (202 files); four new coursesHighestRatedTen cases, authorised limit test 3 -> 10 only. Preview build OK. Public phone check: ten 300 x 230 cards, 2px gap, scroll reaches the tenth, its tap opens the course, Regulars five, no runtime errors. Signed-in checks unavailable on external/unmanaged Supabase.

## BRIEF_CHAMPIONS_ELSEWHERE — CHAMPIONS_ELSEWHERE_1
- [x] VA3: useTitlesInReach staleTime 0 -> 60_000 (hook had no callers; no reason to be live).
- [x] CHAMPIONS_ELSEWHERE_R: built narrower (You {v} · {leader} to beat), link omitted, hook caller comment. Suite 1,542 -> 1,546.
- [ ] PARKED (Ben): widen get_player_titles_in_reach (field size, leader name); link destination.

## BRIEF_CHAMPIONS_STATE_4 — CHAMPIONS_STATE_4
- [x] CHAMPIONS_STATE_4_COPY_R: rulings applied; State 4 done, all four states in.
- [x] CHAMPIONS_STATE_4_V: comments corrected (nine is normal; eight is source-unavailable fallback). State 4 copy quoted for Ben's mock diff.
- [ ] LATER (do not act; Ben decides): get_viewer_standing has two definitions in the database — real fork or harmless overload?
- [x] CHAMPIONS_NET_SOURCE_1: unavailable sources are dropped from the cabinet and every count, decided by query outcome; console warning names the category. State 4 screen (PostedChampions) wired for members with tracked rounds here: posted values come from their own board rows, Yours tiles, pinned real row, Your defence / What it takes. Suite 1,532 → 1,538 (+6 in championsNetSource.test.tsx), none changed.
- [ ] CHAMPIONS_STATE_4_C: QA2 source-contract stop. The interrupted projectedTile type error is corrected and every legend aggregate now follows the evaluator's 18-hole eligibility; divider counts only supplied golfers whose ranks are strictly between the last leader and viewer. Preview build OK; full suite 198 files/1,532 passing → 198 files/1,532 passing, no assertion/test additions, deletions, renames or rewrites. State 4 remains unwired: no gam_round_net view definition/privacy policy or current get_course_net_board definition exists in repository; historical net SQL explicitly says superseded. Posted-net/privacy parity cannot be established without Ben supplying the current definitions/contract. Hook remains unused and its unsupported visibility-enforcing comment was corrected. No SQL/migrations/RPC/feed_config/cap changes; authenticated verification unavailable on external/unmanaged Supabase.
- [x] Confirm clbhouz, signed-off mock; baseline full suite 1,532 passing. Found posted gam_round_stats fields and existing gam_round_net view; leaderboard/window absence remains unknown, not zero.
- [ ] Extend shared cabinet, explicit reach basis, real pinned row and selected-board defence; preserve States 1–3.
- [ ] Add rule coverage, run full suite against 1,532 baseline; stop/report any new failure.
- [ ] Verify preview and report source/auth limits, test inventory and deviations.
- [x] Previous intermediate typecheck stop resolved by CHAMPIONS_STATE_4_C; surviving compiler errors: none. Source-contract stop above is the current blocker, not the old type error.

## BRIEF_CHAMPIONS_STATE_3 / R / T
- [x] CHAMPIONS_STATE_3_G4: deterministic props-keyed avatar mock/capture only; exact fallback-tree comparisons and ghost assertions preserved. Full suite 1,532 → 1,532, all passing (198 files); resolves the historical State 3 G/G2/G3 stops below. No tests added/deleted/renamed; holder assertion uses Map values with unchanged expected URL. No application or outside-State-3 test changes; preview build OK; authenticated checks unavailable on external/unmanaged Supabase.
- [x] CHAMPIONS_STATE_3_G3: user approved mocking actual CourseLegendsAvatar instead of unused SquircleAvatar; failing test now has exactly three input-contract assertions; second initials test and 1,532 count preserved. No application changes.
- [ ] CHAMPIONS_STATE_3_G3 STOP: full suite collected 1,532; 1,530 passed, two State 3 fallback-equality cases failed: 'GE3: seven finite differentials delegates to the exact State 2 subtree' and 'missing tee inputs delegates to State 2 even if a stale projection exists', both assert container.innerHTML === fallback. The scoped mock's incrementing data-avatar-call marker changes across rerenders. All ghost assertions and tests outside State 3 pass. No post-failure fix; build OK; awaiting authorisation to stabilise mock output without editing fallback assertions.
- [x] CHAMPIONS_STATE_3_G2: replaced only the authorised ghost no-image check with querySelector('img') === null; distinct-photo fixtures and viewer-initials case unchanged; no application changes.
- [ ] CHAMPIONS_STATE_3_G2 STOP: full suite 1,532 collected, 1,531 passed, one newly exposed failure in the same no-image test: the real-holder outerHTML.includes('holder.jpg') check expected true but received false. The authorised img assertion and viewer-initials case pass; all tests outside State 3 pass. No further assertion or rendering edits; awaiting authorisation.
- [x] CHAMPIONS_STATE_3_G: ghost variant now renders viewer initials on transparent ground regardless of photo; real-row defaults unchanged. Authorised never-passed photo test replaced by two cases (inventory 1,531 → 1,532).
- [ ] CHAMPIONS_STATE_3_G STOP: full suite collected 1,532; 1,531 passed, one new no-image case failed because its broad /url\(/ assertion also matches the existing inline SVG squircle mask. Viewer-initials case passed; all tests outside State 3 passed. No assertion adjusted after failure. Build OK; authenticated visual checks unavailable (external_unmanaged). Await follow-up authorisation.
- [x] Confirm clbhouz; read all three standing briefs and amended HTML.
- [x] Extend coursePlay net/differential ranges and shared sentence selector; preserve You wording.
- [x] Use A.FAINT and extend FlatBoardRow with the authorised ghost variant; remove duplicate ghost rendering.
- [x] Add 18 State 3 tests and three coursePlay tests; no existing assertions deleted, renamed or rewritten.
- [ ] STOP: focused run collected 32, passed 31, failed one: ghost profile-photo style did not contain 'viewer.jpg'. No test adjusted. Full suite not run under the stop rule; baseline remains 1,510 and candidate inventory is 1,531 (+18 State 3, +3 coursePlay).
- [x] Latest preview build OK (2026-10-17 12:04:38 UTC); authenticated/visual acceptance unavailable on external/unmanaged Supabase. State 3 remains unfinished pending authorisation to diagnose the new failure.

## BRIEF_CHAMPIONS_STATE_2 — CHAMPIONS_STATE_2
- [x] Confirm clbhouz and record Ben's snapshot verification dated 2026-10-17; values unchanged.
- [x] Extended the existing cabinet with held tiles and course-side counts; scoped to unconnected populated courses, state-1 never-claimed styling preserved.
- [x] Existing BoardSection rows retained with state-2 self treatment suppressed; selected tile, two windows, field comparison and invitation wired from existing GolfClubView stats; no Elsewhere or new read.
- [x] CHAMPIONS_STATE_2_T authorised per-file mock fix: all 1,503 existing plus seven State 2 cases pass, 1,510 total. No assertions or existing tests changed; global setup/components untouched. State 1 has no translation mock because its rendered components currently do not call useTranslation. No browser/authenticated acceptance claimed.
- [ ] Reported deviations: no record-history source, so no invented history; open-feat copy says no visible holder (privacy-safe) rather than claiming no feat occurred; MEDAL_GOLD used only for the expressly specified record scale despite blanket no-gold prose. Connected-member screens keep existing behavior; window controls now use shared Button without changing their appearance.

## BRIEF_CHAMPIONS_STATE_1 — CHAMPIONS_STATE_1
- [x] Confirm clbhouz; investigate CC2 without querying data. Exact catalogue count exists in admin Inbox; Health has admin-only played_courses/played_on_map fields, not a verified member-accessible catalogue-matched tracked-course total.
- [x] CHAMPIONS_STATE_1_R unblocks CA/CB/CD/CE and reverses CC2: use Ben's last verified catalogue snapshot, pending replacement.
- [x] Implement zero-row cabinet/count/connect screen and derived catalogue sentence; Elsewhere excluded, populated courses and You tab untouched. Catalogue snapshot pending Ben's fresh pair.
- [x] CE1–CE4 plus snapshot rule: 1,498 → 1,503 passing, five new tests in championsState1.test.tsx; no existing tests changed; preview build OK.
- [ ] STOP: local browser check timed out before the headline appeared; no visual or authenticated acceptance claimed. External/unmanaged authentication remains unavailable. Do not investigate further without a follow-up.
- [ ] Architecture entry deferred: AGENTS.md addition rejected at its size budget; local component/snapshot headers document ownership, but cross-area note needs approved relocation before adding.

## BRIEF_PROFILE_TABS_VOICE
- [x] Confirm clbhouz; change only specified Courses/Rounds ownership copy and props, with name-free third-person fallbacks and the archive possessive fix.
- [x] Add English keys only; preserve all queries, hooks, derivations, figures and Handicap sections. Excluded archive empty state still says "They hasn't" without a name; reported, not changed.
- [x] One third-person render test per tab checks named/fallback forms; 16 focused and all 1,399 tests pass (1,397 + two), zero failures, preview build OK. Public profile redirects to /auth with zero runtime errors; signed-in visual/live verification unavailable on external/unmanaged Supabase. No SQL/migrations; feed_config untouched, round_pool_cap 30; exact safety block intact.

## BRIEF_HANDICAP_TAB_REBUILD_8A
- [x] Confirm clbhouz; record row buttons open the canonical RoundDetailSheet by existing id and pass the profile owner; existing flex/gap/padding/hairlines retained with button reset and no-id fallback.
- [x] Capitalise five English Stood strings only; record calculations, stoodFor/join and other copy untouched; no lowercase assertions found.
- [x] Five new interaction tests pass; full suite 1,397 passing, zero failures (1,392 prior + five). Preview build OK; public profile redirects to /auth with zero runtime errors. Normal records all have WhsScore.id; malformed no-id rows remain noninteractive. Live authenticated taps and visual geometry remain unverified on external/unmanaged Supabase. No SQL/migrations; feed_config untouched, round_pool_cap 30.

## BRIEF_HANDICAP_TAB_REBUILD_6B
- [x] Confirm clbhouz; remove FloorSection, its derivations and 19 dedicated tests, and English handicap.floor keys; supersedes 6A.
- [x] Preserve pickCourse and PersonalBestsSection exactly, with the requested remaining section order.
- [x] Verify full suite: 1,411 baseline to 1,392 passing, exactly 19 Floor tests removed, preview build and untouched-file checks; authenticated live-profile checks unavailable on external/unmanaged Supabase. No SQL/migrations/data edits.

## BRIEF_HANDICAP_TAB_REBUILD_7A
- [x] Confirm project identity is clbhouz; remove Trophy Room entry and dashboard launch mount while preserving Records to break.
- [x] Delete Trophy Room and verified orphan files/assets/tests; remove unused aggregates hook. User approved keeping fetchTrophyAggregates/TrophyAggregates for Compare (useCompareStats calls it twice).
- [x] Verify full suite: 1,411 passing, no failures, exactly ten dedicated Trophy Room tests removed from 1,421 baseline; preview build OK. External/unmanaged profile browser check redirects to /auth with no runtime errors; authenticated live-profile check unavailable. No SQL/data changes or career-counter placeholder.
- [x] Retain LaunchSheetMount and its launch folder: it introduces streaks and rivalries/shared rounds as well as achievements, not Trophy Room-only; only dashboard mount removed.
- [x] Retain shared achievement/course hooks, course-legends drilldown and GAM tokens; move surviving standings/Top 100 functions to lib/gam and level lookup to achievements. Invite presentation extracted locally without restyling; remove dead Trophy Room CTAs and mounts from both pages, AchievementsPane and LevelUpSheet. Legacy trophy links consume their parameters without a replacement; streak links preserved.

### 7A removal inventory
- Entire `src/components/profile/handicap/whs/gam/trophy-room/` removed (30 original files; surviving functions relocated from standings.ts, shareModel.ts and levels.ts):
  - `_shared/`: showpieces.ts, normalizeTrophyItem.ts, levels.ts.
  - `parts/`: MatchRequestSheet.tsx, Top100CourseRow.tsx.
  - `career/`: CareerHeader.tsx, CareerRecordSheet.tsx, Primitives.tsx, TabBar.tsx, criteria.ts, types.ts, tokens.ts, standings.ts, shareModel.ts, medalTone.ts, format.ts, milestones.ts.
  - `career/details/`: Top100Detail.tsx, MilestoneDetail.tsx, CrownDetail.tsx, CountingStatDetail.tsx.
  - `career/panels/`: CabinetPanel.tsx, Top100Panel.tsx, StreaksPanel.tsx, StandingsPanel.tsx, SeasonCutPanel.tsx, CrownsPanel.tsx, MilestonesPanel.tsx, CountingStatsPanel.tsx, CourseRecordsPanel.tsx.
- `src/components/profile/handicap/whs/gam/GamMount.tsx`.
- `src/hooks/gam/`: useMarkBadgeSeen.ts, useUserTopLegends.ts, useUserStreaks.ts, useBadgePopulationShare.ts, useCareerRounds.ts, useCourseFieldSizes.ts, useCourseFieldPlayers.ts, useMemberRecordSplit.ts (including recordsWonFrom).
- `src/assets/`: continental-swinger-trophy.png, links-legend-trophy.png, stars-stripes-trophy.png (zero source consumers).
- `src/test/trophyRoomStandings.test.tsx` (ten tests); only the retired-door assertion removed from profileAchievementsPane.test.tsx; remaining assertions untouched.
- Inline TrophyRoomRow/useCrownsHeldCount, useTrophyAggregates and trophy event exports removed. Records to break body/calculations and its tests unchanged.

## BRIEF_HANDICAP_TAB_REBUILD_6A
- [x] Replace the Floor ladder with six category milestones and English names; preserve section calculations and appearance.
- [x] Verify 19 focused tests and full suite (1,421 passing, no failures); preview build OK. Live authenticated checks unavailable on external Supabase.

## BRIEF_HANDICAP_TAB_REBUILD_5C
- [x] Mute all par-row figures/fills with A.MUTE and use BAR_RADIUS; retain 4px tracks and proportions.
- [x] Remove observation and its unused calculations/read; preserve distribution, title, meta and thresholds.
- [x] Verify full suite; hosted live-profile checks unavailable on external Supabase.

## BRIEF_HANDICAP_TAB_REBUILD_4A
- [x] Remove mechanism boundary label/backing and next-in-line row; retain amber rule, counting chips, round detail interaction, and ageing-out calculations.
- [x] Update only English mechanism caption.
- [x] Verify suite; authenticated live-profile checks unavailable on external Supabase.

## Profile Courses exact mock — 15 October
- [x] Match the Still to rate, Archive controls, year header and flat course rows to the uploaded mock; preserve real photos/counts and existing row expansion.
- [x] Verify populated local rendering and controls at 320/472/628px; full suite passes. Hosted authenticated checks remain unavailable on external Supabase.

## Avatar crop cap F.3
- [x] Cap both future crop outputs at 1440px without upscaling or changing JPEG quality.
- [x] Measure both real modal outputs and prove under-cap JPEG bytes unchanged (both modals, 571×600).
- [x] Confirm the full suite remains at 1,138 passing and fifteen known failures; preview build OK, no lint errors. Hosted authenticated upload checks unavailable on external Supabase; no R2 writes made.

## BRIEF_TOUR_FOLLOW_AND_TEE_ALERT
- [x] Player follows withdrawn; hero-board rows open the scorecard instead.
- [ ] Add tee-alert toggle and notification-delivery warning.
- [ ] Dispatch confirmed leader-group alerts through tournament-live-sync.
- [ ] Reuse Overview token owners and verify tests without opening preview.

## Review tile height correction
- [x] Restore the original standard photo-overlay review layout; full-width frame 210 → 252px, rounds unchanged.
- [x] Match review loading placeholders; 27 focused tests passed and preview build OK. Authenticated visual checks unavailable on external Supabase.

## Profile handicap chart parity — done
- [x] Reuse the profile bottom sheet's handicap trend chart in the profile Handicap tab.
- [x] Preserve the tab's history windows, headline, scrub behavior, and no-history state.
- [x] Verify focused tests, TypeScript, and preview build.

## Explore clap weight and scroll-to-top
- [x] Match the shared clap icon's optical weight to the message icon.
- [x] Reuse the Courses scroll-to-top control across every Explore view.
- [x] Verify the scrolled phone view, interaction, focused checks, and clean preview build.

- [x] Refactor lead review copy into identity, two-line quote, and optional breakdown rail
- [x] Move review photo count into the top-right glass chip
- [x] Remove only the five verified orphan locale keys across six locales
- [x] Add focused review-tile accessibility, truncation, scope, chip, and regression tests
- [x] Verify six-locale label widths at 390px, Explore tests, typecheck, and screenshot

## Explore news alignment
- [x] Match photo-led news hierarchy to Tour Overview and remove member attribution.
- [x] Verify focused Explore tests and typecheck.

## Personal Bests restore
- [x] Accept Ben's authenticated proof: 24 rows, 13 members, six feat kinds.
- [x] Build and mount `PersonalBestsShelf` in Explore Magazine using the existing hook and `StandoutTile`.
- [x] Preserve server copy and server-side dedup/widening; add no cross-section member budget or empty state.
- [x] Verify 320/390/430, screenshot, focused tests, and typecheck.

## Record margins
- [x] Read gross-record ranks 1 and 2 together and carry the rank-2 margin to record cards.
- [x] Reuse the existing board-movement delta for the callout subline.
- [x] Verify margin/no-margin cards at 390, focused tests, typecheck, and unchanged net record.

## course_par completeness (BRIEF_COURSE_PAR_COMPLETENESS)
- [x] gam-evaluator: par summed only when every hole of whs_scores.total_holes is present, played and has a par; otherwise NULL (both the computeRoundStats path and the no-holes fallback)
- [ ] Ben runs the requeue after deploy

## Round par completeness (client) — 2026-09-22
- Done: `roundCoursePar` in `src/lib/whs/api.ts` (strict `played === true`, must equal `total_holes`, else NULL); RoundDetailSheet now uses it for `coursePar` and `toParVal`.
- Reported, not fixed (Ben to sequence): CardScorecardSheet `totals.toPar` + `totalPar`/`shownPar`, RoundPagePreview `shownPar`, scorecardParts `nineSummary.parPlayed`, ExploreMagazine seed par, roundGross `roundScore`, RoundCardHoleStrip nine deltas, CourseYouTab field par.

## BRIEF_SCORECARD_HEAD_PAR — done
- Round par in the scorecard head now comes only from `roundCoursePar`.
- `CardScorecardSheet` takes `totalHoles` + per-hole `played`; local sum deleted.
- `RoundPagePreview` uses the same rule; `RoundDetailSeed` gained optional `totalHoles`/`played`.
- NULL declared length -> no par. Seed/preview paths have no declared length today (see report).
- Out of scope, untouched: per-nine OUT/IN, totals.toPar, ExploreMagazine:1086, roundGross.ts, RoundCardHoleStrip.

## BRIEF_ROUND_SHAPE_CARRIES_PAR — done
- `useRoundHoleShapes` now reads `gam_round_stats(whs_score_id, course_par)` in the SAME batch as the hole rows (source (a)); `HoleShape.coursePar` carries it. Curve untouched: played filter, MIN_PLAYED_HOLES 9, actual_gross, beads, birdies, fallback all unchanged.
- `RoundDetailSeed.par` added and supplied by ExploreMagazine `seedFor`; the local "sum the seeded pars" derivation is gone, so a ten-hole card no longer prints a to-par against par 40.
- `RoundPagePreview`: `seed.par ?? roundCoursePar(holes, totalHoles)` — never inferred from row count.
- Out of scope, untouched: roundGross.ts (its `coursePar` comes from `usePostRounds` reading `gam_round_stats.course_par`), RoundCardHoleStrip, CardScorecardSheet totals.toPar, per-nine OUT/IN, edge functions, SQL.

## BRIEF_MEDIA_PAGE_THREE_WALLS
- [x] Remove duplicate section wrappers and header count; compact the title/chip/content stack.
- [x] Replace the clips rail with a paged, full-bleed three-column 9:16 wall using the shared tile additively.
- [x] Add the dedicated 16:9 long-form page card while leaving Amateur `VideoRow` untouched.
- [x] Keep the community mosaic, count sources, URL contract, analytics, and viewer origins unchanged.
- [x] Verify 320/390/430 geometry, Amateur rail parity, autoplay behavior, focused tests, and typecheck.

## BRIEF_PARTIAL_CARD_COPY
- [x] Add the shared head’s `· thru N` suffix only when round par is null and played holes exist.
- [x] Remove the empty to-par stat from gross-only rounds when its value is null.
- [x] Verify partial eighteen, complete eighteen, complete nine, gross-only, focused tests, and typecheck.
- [x] Report every other nullable-par round to-par renderer without changing it.

## BRIEF_HOLE_STRIP_NINE_COMPLETENESS
- [x] Require exactly nine strictly played holes with non-null par before rendering a nine's delta.
- [x] Keep hole marks, gross totals, and complete-nine rendering unchanged.
- [x] Verify partial eighteen, complete eighteen, complete nine, focused tests, full suite, and typecheck.
- [x] Report the par source for the seven named unchanged to-par sites.

## BRIEF_FEED_PARTIAL_ROUND_THRU
- [x] Carry `whs_scores.total_holes` through the existing batched feed-round read.
- [x] Preserve hole arithmetic while exposing `thru` only for provably partial scored cards.
- [x] Render lowercase `· thru N` beside partial feed scores; leave complete and WHS fallback output unchanged.
- [x] Prove partial eighteen, complete eighteen, complete nine, and picked-up fallback behavior.
- [x] Report every other `roundScore` consumer without changing it; run the full suite and typecheck.

## BRIEF_LEGEND_JOINT_RANKS — done
- `legendRanks.ts`: `assignCompetitionRanks` (1224, equality on `Number(value).toFixed(6)`, never `===`) + `crownSetDelta` (rank-1 set diff). Sort order untouched.
- `recomputeLegend`: one `ranked` array feeds the write-skip signature AND the insert; crown path is set-based — enter = legend_earned, leave = legend_lost, in both = nothing; `recomputeLegendTitles` runs for every entering or leaving user.
- Historic silence: `isTriggerFreshForCrownNotice` (LEGEND_NOTIFY_MAX_AGE_DAYS = 2 on play_date) + all-time-only gate. No new suppression added.
- [ ] Ben runs the backfill requeue after deploy (read-only survey: 174 boards, 325 rows change rank, 99 become joint first).

## BRIEF_CONTESTED_TITLES — done (server only)
- `legendTitles.ts`: `boardKey` / `contestedBoardKeys` (> 1 claimant, no larger floor) / `countContestedTitles`. Joint firsts count.
- `recomputeLegendTitles`: `computeContestedTitleCount` is the one number; the milestone upsert and `legendTitleTier(count)` read the same binding. count 0 still deletes the badge row.
- New action `recompute_legend_titles` (dry run unless apply), whole pass under REBUILD_SUPPRESS -> enqueueNotification no-ops; tier drops were already silent.
- [ ] Ben runs the counter_tiers [1,15,60] SQL and then the backfill (dry run first).

## BRIEF_TROPHY_ROOM_STANDINGS — done
- `useMemberStandings` (one rpc call, keyed on user id, mirrors useRoundAwards), `career/standings.ts` (rules: tiedWith, discState 4 states, formatValue, standingLine, groupStandings, courseSubline), `career/panels/StandingsPanel.tsx`, mounted in `CareerRecordSheet` after Course Records. `REC.FAINT` added for the placed disc border.
- The UI derives nothing but `tied_with` and |value − column|. Tenure boards render with no disc.
- Out of scope, untouched: the course You tab, `get_member_standings`/any SQL, legends/ranks/titles/badges/notifications, the room's other sections.

## BRIEF_MEMBERS_RADAR
- [x] Stage 1 tracking; follow-ups: Explore ?view=, Inbox ?type=, video_watch per-interval confirmed.
- [x] Stage 2 (2.1–2.5).
- [x] Stage 3 hooks + rules 4–6 + follow-ups.
- [x] Stage 4 Member screen implementation — identity/index trend, loop, golf, eight-week sessions, counters and actions; limited admins request no restricted data. TOP 100 is the brief-sanctioned em dash: no qualifying per-member board read, no query added. Old Member360 display sections removed; existing More actions/app roles/confirms retained.
- [x] Stage 5 Behaviour/Sessions implementation — time/hourly, returned areas/order, top-six event labels, Never opened, merged last-session and expanded session detail, 30-row pagination with Load more, London times/formatAgo, permission and specified empty states.
- Message uses normal personal-account 1:1 messaging with blocks respected, composer focus, no automatic send and Back to the same Member screen; no separate composer or database changes.
- [x] Full suite: 150 files, 144 passing/6 failing; 1,216 tests, 1,201 passing/15 failing. Same failure list: courseRatingConsistency ×3, exploreHeroCard ×3, exploreNetChips ×2, exploreReviewTileC5 ×4, roundNotificationOverlay ×1, trophyRoomStandings ×2. Six new rule tests pass; latest automated build reports build OK. No SQL, migrations or edge-function changes; feed_config untouched, round_pool_cap unchanged.
- [ ] Exact live visual/interaction acceptance — blocked by external/unmanaged authentication: preview shows Access denied. No authenticated Member, Behaviour, message/Back, block enforcement or live RPC measurements claimed. Populated panel geometry follows the HTML; brief-mandated tabs, server action labels and omitted sample action sublabels differ intentionally from sample markup. Skeletons preserve fixed chart/cell/row geometry but variable server row counts/text wrapping mean exact settled total panel heights cannot be guaranteed before data arrives; no invented data or fixed clipping used.

## BRIEF_ROUNDS_YEAR_META — done
- Rounds log year divider now shows the year only: the inline meta ("{{n}} rounds · avg {{avg}} over {{scoring}} full" and its count-only fallback) was removed from ProfileRoundsTab, along with the Item.meta field, DIVIDER_META and the space-between divider layout; padding/hairline untouched.
- The meta string was inline English in the component, not a common.json key — no key existed to remove; other locales untouched.
- The local `yearStats` read in ProfileRoundsTab had no remaining consumer after the meta went, so the local was removed; the derivation itself stays and SeasonSection still computes its own yearStats for the hero figure. `fmt1` import dropped from ProfileRoundsTab only.
- No test pinned the meta string; year-divider year assertion unaffected. Full suite 1,399 passed (181 files), tsgo clean.

## AGENTS_BUDGET_R2
- [x] Confirm clbhouz and corrected token/handicap destinations; copy exactly four named rules into owning headers, with two root pointers only, and replace Briefs verbatim. No medals/src-AGENTS/SQL/migrations/RPC/feed_config/cap changes.
- [x] Root 7,866 -> 4,909 bytes (211 under 5,120); exact four rule texts including handicap audit/caveat and unchanged source bodies verified; root changes limited to four moves, two pointers and exact Briefs replacement. Full suite 1,626 passing / 210 files before and after; no tests added, deleted, renamed, rewritten or assertions changed. Log /tmp/agents-budget-r2/suite.log. Preview build OK at 2026-10-18T09:09:04Z; no app behavior changed.
