# Roadmap

## HERO_ROUND_EMPTY_CARD
- [x] Keep score-based chips enabled after empty reads; show missing-card note and remove empty-round state.
- [x] Focused16/16; separate shards2007/1868/1994/1906 =7775passed (+1 new case); see HERO_ROUND_EMPTY_CARD_REPORT.md.

## HERO_BOARD_EXPAND
- [x] Top ten, shared Full leaderboard action and lazy round panels; availability ruling recorded.
- [x] Focused59/59; four separate shards2007/1867/1994/1906 =7774 (+15 new cases); assertion ledger in HERO_BOARD_EXPAND_REPORT.md.
- [x] Actual-component fixtures320/390/430: ten rows, button, card/chips/footer, no overflow, chips on one line.
- [ ] Live authenticated board/scorecard/navigation device checks: external_unmanaged prevents authenticated end-to-end verification.

## REMOVE_BOARD_HOLE_MARKS
- [x] Remove leaderboard/hero marks, key, inline expansion and board-only reads; restore padding and direct sheet taps.
- [x] Authorized assertion updates plus10 new cases; focused156/156; sequential shards2007/1855/1998/1899 =7759passed (+10).
- [ ] Device checks: actual leaderboard/hero320/390 row/tap/scorecard. Blocker: external_unmanaged authentication; screen fixture failed React-refresh preamble. See REMOVE_BOARD_HOLE_MARKS_REPORT.md.

## HOLE_TILES_BOARD_BUILD (active)
- [x] Read build brief + both signed-off mocks (board-rows B2/8px; hole-tiles).
- [ ] Step 1: BoardTable/BoardRound/leaderboard.css — remove faces, two-line rows, ▲/▼ marks (▼ #C24A4A), opacity 1 rounds, no tie bracket, HoleTiles line 2 full width, key under board, name ladder re-measure.
- [ ] Step 2: Tour hero MiniBoard — HoleTiles line 2, previous-round fallback, no tie bracket.
- [ ] Step 3: AlsoWeekEvent — remove all faces, WeekBoard HoleTiles, no tie bracket.
- [ ] Step 4: RoundTilePlot — HoleTiles replace data-plot-hole bars, shrink SVG.
- [ ] Step 5: No rings on tour player avatars app-wide (PlayerAvatar/PlayerInitialAvatar source + SquircleAvatar sweep; ActiveRing exception stays).
- [ ] Step 6: CompetitionMark on round cards (ExploreCard/FeaturedRoundCard), explicit-true is_competition, batched hook.
- [ ] Tests: add new, update only pinned old assertions (list old/new), run 4 shards (only fw1FeaturedDeck known), check 320/390/430.

## PF4_COMPOSER_FIX
- [x] Implement media Edit sheet and inline Played with; simplify On the course.
- [x] Save per-shot holes, gate place publication, retain shot tags in existing studio metadata/drafts, hydrate/retag existing shots, and stop post-wide writes.
- [x] Wire per-slide context to Preview/feed/fullscreen and draft summary; focused124/124; preview buildOK.
- [x] Run four separate two-worker shards:1994/1858/1977/1893passed+6failed;7728executed versus7702baseline (+26cases/onefile).
- [ ] STOP: profileFeedInViewGate.test.tsx six cases fail: "No QueryClient set, use QueryClientProvider to set one"; usePostGolfContext.ts:83:20 via LightCardFeed.tsx:162:26. No repair authorized;320px/browser and five device checks remain unverified. See PF4_COMPOSER_FIX_REPORT.md.

## COURSE_HEROES_MATCH
- [x] Match course-list/detail material and opt-in masthead typography; preserve gold/default callers. Preview buildOK.
- [x] Add9cases/1file and ledger one authorised overlay-case rename/rewrite. Focused42passed/2failed at courseHeroesMatch.test.tsx:59:34 (clamp omitted) and81:86 (nonexistent avatar marker); no repairs.
- [x] Detail320px with/without record:340height/no overflow, long record name ellipsis; report COURSE_HEROES_MATCH_REPORT.md.
- [x] Authorised clamp/avatar test-only repairs; course focused44/44 and Tour85/85. Shared shard1:2000passed; shard2:1827passed/1unapproved Needs failure at tourHeroRefinements.test.tsx:98:19; reports updated, no count delta.
- [ ] Shards3–4 blocked by untouched Needs assertion; Courses-page320px mount failed (null fade parent); actual islands/avatar loading/adjacent seam remain unverified.

## OVERVIEW_HERO_B_STRIP
- [x] Merge tour/state kicker, scale leader B, opt in board spacing after movers and replace locked no-pick members door with the strip; Ben ruled brief10+0/white position over mock.
- [x] Add16cases/1file, authorised padding/door selectors only; focused67/67. Fresh shard1:1986passed/1unexpected failure at tourPlayoffShortenedEvents.test.tsx:89:35 expected RESULTS, received FINALButterfield Bermuda Championship. Existing failing assertion untouched.
- [x] Actual mounted-component DOM320×844: no overflow; both kicker ellipses, long strip surname ellipsis,10px movers bottom/0px board top; report OVERVIEW_HERO_B_STRIP_REPORT.md, expected7648/668 reconciled from7632/667. Preview buildOK.
- [x] Authorised RESULTS→FINAL case rename/assertions; Tour focused85/85. Shared shard1:2000passed; shard2:1827passed/1unapproved Needs failure; OVERVIEW_HERO_B_STRIP_REPORT.md updated with all three repairs and counts.
- [ ] Shards3–4 blocked by untouched tourHeroRefinements.test.tsx:98:19 Needs assertion; live face loading/device/account readback unverified. Static DOM screenshots reserve avatar slots but do not prove loaded faces.

## FEED_PHOTO_GRID
- [x] Add pure four-photo eligibility and shared grid rendering/taps/loading; preserve video/small sets/words-first frames.
- [x] Add22cases (14helper/8mounted); fresh focused50/50 after authorised one-line chips fixture repair. Shared shards1:1984passed;2:1824passed/1unexpected failure;3–4 stopped.
- [x] Actual CardFeed/LightCardFeed→FeedCard320×844 fixtures: upright5 height400/wide12 height287.344, width320, gap2, cap539, zero final page errors. Updated FEED_PHOTO_GRID_REPORT.md; live page chrome/data/fullscreen remain unverified.
- [ ] Shared suite blocked by unauthorised tourHeroRefinements.test.tsx:98:19 Needs assertion expected length1 got0; no repair/rerun.

## OVERVIEW_TIGHT_CHIPS
- [x] Tighten picks/movers to 46px two-line chips; remove chip NEEDS and gross/brackets only; shorten English intros and preserve PicksSheet.
- [x] Update authorized obsolete assertions and two direct-mount prop sets; add3cases. Focused115passed/1failed across7files.
- [x] Authorised only line130 flex assertion accepts1 or1 1 0%; chips focused116/116. Actual overview320px: picks/movers all46px, long names ellipsise, confined x20–300. Updated OVERVIEW_TIGHT_CHIPS_REPORT.md.
- [ ] Shared shards3–4 blocked by unexpected tourHeroRefinements.test.tsx:98:19 Needs assertion expected length1 got0; existing test untouched.
