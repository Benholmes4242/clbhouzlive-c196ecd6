# BRIEF_EXPLORE_REVIEW_TILE_A1

## BRIEF_CHAMPIONS_STATE_4 — CHAMPIONS_STATE_4
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
