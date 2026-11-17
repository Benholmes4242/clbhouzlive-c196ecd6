# FIX_LOCALES_OUT_OF_PUBLIC

## Status: STOPPED — 10 unexpected test failures (not path-related), awaiting ruling

## Moved
`git mv public/locales src/locales` — 62 files (6 locales), contents unchanged (rename-only in git).

## App changes
- `src/i18n/index.ts`: i18next-http-backend no longer imported (still in package.json). Inline `bundledBackend` over lazy `import.meta.glob('../locales/*/*.json')`; missing file → callback(msg, false) as a 404 did. `authEn` now `@/locales/en/auth.json`, same partialBundledLanguages setup. Detection, fallback, ENABLED_LOCALES, namespaces unchanged. The `?v=__BUILD_ID__` query is gone (hashed chunks replace it).
- `tourSlotRules.ts`, `upcomingOverviewRules.ts`, `tournamentRules.ts`: `@/locales/en/tourhub.json`.
- `i18next-parser.config.js`: output `src/locales/$LOCALE/$NAMESPACE.json`.

## Grep findings (outside tests)
- `scripts/i18n-pseudo.cjs` read `public/locales` → `src/locales`.
- `.verification/boards.tsx` → `../src/locales/en/tourhub.json`.
- index.html, public/_headers, service worker, supabase/functions, vite.config.ts: no references. Nothing needs a public URL.

## Path-only test changes
Every file below changed only `public/locales` → `src/locales` (or `'public', 'locales'` → `'src', 'locales'` in the last two):
- src/test/yourPickSheet.test.tsx
- src/test/yc2YourCoursesOpen.test.tsx
- src/test/yc1YourCourses.test.tsx
- src/test/ws3WatchBottom.test.tsx
- src/test/ws2WatchMiddle.test.tsx
- src/test/ws1WatchTop.test.tsx
- src/test/worldRankingsRebuild.test.tsx
- src/test/upcomingOverviewPlus.test.tsx
- src/test/upcomingLastYearBoard.test.tsx
- src/test/tournamentV3Sections.test.tsx
- src/test/alsoWeekRebuild.test.tsx
- src/test/tournamentPickInsights.test.tsx
- src/test/authHeroKeyboard.test.tsx
- src/test/authCodeStep.test.tsx
- src/test/alsoWeekSection.test.tsx
- src/test/boardRowFlush.test.tsx
- src/test/boardHeadersNoPosPlayer.test.tsx
- src/test/boardCompetitionChip.test.tsx
- src/test/tourhubColumnKeys.test.ts
- src/test/tourTeeAlert.test.tsx
- src/test/cb77TeamInvites.test.tsx
- src/test/cb76TeamSectionTwo.test.tsx
- src/test/cb75TeamSectionOne.test.tsx
- src/test/cb118BusinessVisiting.test.tsx
- src/test/cb117BusinessMentions.test.tsx
- src/test/cb116NameCoach.test.tsx
- src/test/cb115BusinessFollowers.test.tsx
- src/test/tourScorecardProfileDoor.test.tsx
- src/test/cb61SheetDoors.test.tsx
- src/test/tourScorecardCourseDoor.test.tsx
- src/test/cb58LeadersGroup.test.tsx
- src/test/cb68DoNext.test.tsx
- src/test/tourRetirement.test.tsx
- src/test/tourPlayoffShortenedEvents.test.tsx
- src/test/cb88InsightsEngagement.test.tsx
- src/test/cb65BusinessFixes.test.tsx
- src/test/cb86InsightsFollowers.test.tsx
- src/test/tourOverviewNotStarted.test.tsx
- src/test/cb57HeroBoardRemovals.test.tsx
- src/test/cb78TeamSectionFour.test.tsx
- src/test/competitionBoards.test.tsx
- src/test/cb831InsightsPostCount.test.tsx
- src/test/tourOverviewMagazineCopy.test.ts
- src/test/tourOverviewDesignA.test.ts
- src/test/tourNewsCard.test.tsx
- src/test/courseRatingConsistency.test.ts
- src/test/coursesHeroPlaceScrim.test.tsx
- src/test/comingUpSection.test.tsx
- src/test/tourInterpolationGuard.test.ts
- src/test/featuredRoundCorrections.test.tsx
- src/test/clubGolferRecords.test.ts
- src/test/er1ExploreCommunity.test.tsx
- src/test/featRarityLines.test.ts
- src/test/tourHeroRefinements.test.tsx
- src/test/tourCloseOnlyWhenFinal.test.ts
- src/test/er3LongFormRails.test.tsx
- src/test/er2CreatorsRegion.test.tsx
- src/test/exploreSheetShell.test.tsx
- src/test/t100Race.test.tsx
- src/test/guestTournamentPickLock.test.tsx
- src/test/suggestionReasonLine.test.ts
- src/test/standoutRounds.test.tsx
- src/test/heldFrameCB28.test.tsx
- src/test/signInRedesign.test.tsx
- src/test/heroConnectExample.test.tsx
- src/test/g2dVideoGrids.test.tsx
- src/test/leaderboardsSection.test.tsx
- src/test/linkedHandicapManage.test.tsx
- src/test/integratedPicks.test.tsx
- src/test/linkedHandicapDone.test.tsx
- src/test/leaderboardsScorePairs.test.tsx
- src/test/if1InviteSheet.test.tsx
- src/test/seasonRecap.test.tsx
- src/test/overviewHeroBStrip.test.tsx
- src/test/overviewTightIntro.test.ts
- src/test/overviewRhythm.test.tsx
- src/test/overviewNewsRebuild.test.tsx
- src/test/ourRecordV2.test.tsx
- src/test/scorecardSheetBasis.test.tsx
- src/test/picksSheetCopy.test.ts
- src/test/ourRecordResultsOnly.test.tsx
- src/test/postOrReviewSheet.test.tsx
- src/test/postFlowScreens.test.tsx
- src/test/rsRoundsShelf.test.tsx
- src/test/roundsGateShortScreen.test.tsx
- src/test/roundsGateNav.test.tsx
- src/test/playerRebuildPage.test.tsx
- src/test/roundsGateLookLock.test.tsx
- src/test/pk2WinnerChance.test.tsx
- src/test/roundsGateAnalytics.test.tsx
- src/test/pk1RecordHeading.test.tsx
- src/test/pickTees24Hour.test.tsx
- src/test/pickSheetV2.test.tsx
- src/test/pickRing.test.tsx
- src/test/reviewStepOne.test.tsx
- src/test/roundCommentsStacked.test.tsx
- src/test/reviewReceiptNextCourse.test.tsx
- src/test/reviewReceiptAverageLine.test.tsx
- src/test/reviewSuggestions.test.tsx
- src/test/profileRoundsVoice.test.tsx
- src/test/profileCoverFallback.test.tsx
- src/test/profileCoursesVoice.test.tsx
- src/test/reviewConfirmationRedesign.test.tsx
- src/test/rc3Wording.test.tsx
- src/test/rc2Wording.test.tsx
- src/components/profile/courses/DossierCard.metaLines.test.tsx
- src/components/profile/handicap/whs/sections/__tests__/RoundsThatCountSection.pairing.test.tsx
- src/components/profile/handicap/whs/sections/__tests__/PersonalBestsSection.tap.test.tsx
- src/components/profile/handicap/whs/sections/__tests__/AgeingOutSection.gutter.test.tsx
- src/components/profile/handicap/whs/sections/__tests__/AgeingOutSection.title.test.tsx
- src/features/explore-magazine/__tests__/scoresLeadBoard.test.tsx
- src/features/explore-magazine/__tests__/rareAirKeys.test.ts
- src/features/explore-magazine/__tests__/rareAirBadge.test.tsx
- src/features/explore-magazine/__tests__/gateScopeSwitch.test.tsx
- src/features/tourhub/overview/sections/__tests__/ComingUp.test.tsx
- src/test/exploreRatingCountLocales.test.ts
- src/test/scorecardSubjectCopy.test.ts

## Checks
- Dev preview boots; /auth shows English ("Continue with email") on first paint; no "App couldn't start", no console errors. Locales load from /src/locales/... as Vite modules.
- en-XA: with `clbhouz.locale=en-XA` the app still requests only `en` namespaces. This is pre-existing: `load: 'languageOnly'` (unchanged) collapses en-XA to en. Not altered.
- Production build: no /locales/ request URLs; `dist/locales` absent; each namespace is its own hashed chunk (e.g. `common-*.js`, `courses-*.js`).
- Typecheck clean.

## Suite (against 9,054)
Shards: 2,271 / 2,224 / 2,251 / 2,308 = 9,054 (count unchanged). First run 29 failures; 19 were the two split-path files above (fixed path-only). 10 remain:

- featuredRoundChamp.test.tsx ×4, roundShapeCarriesPar.test.tsx ×2, scorecardHeadPar.test.tsx ×3, exploreNetChips.test.tsx ×1.

Cause: these render through the app's real i18n instance. Before, the HTTP backend could never fetch in jsdom, so they saw raw keys / defaultValues (e.g. expected `'courseDetail.featured.label'`, `'scorecard.parN'`, `'2 eagles'`). The bundled backend now really loads English in tests, so they receive `'Round of the week'`, `' · Par 72'`, `'Eagle brace'`.
Example: `expected 'DARound of the week…' to contain 'courseDetail.featured.label'` (featuredRoundChamp.test.tsx:61).

Options, need a ruling:
A. Authorise updating these 10 assertions to the real English (or to structure).
B. Keep the backend inert under Vitest (`import.meta.env.MODE === 'test'` → 404 callback), reproducing the old test behaviour without editing tests. This is an app-code branch for tests.
