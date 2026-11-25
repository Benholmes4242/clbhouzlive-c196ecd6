# Brief 27 — brief18EyebrowInk identifies eyebrows by content

Commit: `2820d71a7f` (test, fixture and data-eyebrow attributes).

## Count
112 before, 112 after (`expect(sites).toHaveLength(112)` unchanged). Split: 25 CSS selector, 37 translation key, 41 data-eyebrow, 9 style-constant declaration.

## Old vs new identification
- Old: `{ file, line, selector }`; a TSX site was the `color:` property whose start line equalled `line`.
- New: `{ file, selector | key | eyebrow | declaration }`, no line:
  - selector — CSS rule in the file (unchanged).
  - key — innermost JSX element whose own attributes declare `color` and whose subtree calls `t('<key>')`.
  - eyebrow — JSX element with `data-eyebrow="<name>"`.
  - declaration — the style constant the colour lives in (`<Function>.<name>` where the file declares the name twice). These nine are style objects with no element of their own, so the constant's name is their content anchor.
- Guard: every TSX site must resolve to exactly one element/constant and one `color` declaration (`… is found exactly once`), so a removed or duplicated eyebrow fails. Checked: renaming one fixture entry fails; adding two lines at the top of CompareSheet.tsx passes.
- Assertions unchanged: each colour computes to `rgb(248, 250, 252)`; TileSection render and card/rounds opt-in checks untouched. No source line was moved.

## data-eyebrow attributes added (41; attribute only, no visual change)
- src/components/business/ClubFromTheClub.tsx club-from-the-club-1
- src/components/business/ClubHowItPlays.tsx club-how-it-plays-1
- src/components/business/ClubWhatGolfersSay.tsx club-what-golfers-say-1
- src/components/business/ClubWhatGolfersSay.tsx club-what-golfers-say-2
- src/components/business/insights/InsightsFunnel.tsx insights-funnel-1
- src/components/courses/course-detail/about/AllHolesSheet.tsx all-holes-sheet-1
- src/components/courses/course-detail/you/YourHolesSheet.tsx your-holes-sheet-1
- src/components/courses/course-detail/you/YourRoundsSheet.tsx your-rounds-sheet-1
- src/components/posts/ReviewBottomSheet.tsx review-bottom-sheet-1
- src/features/business/clubAnalytics/sections.tsx sections-1
- src/features/business/clubAnalytics/sections.tsx sections-2
- src/features/business/clubAnalytics/sections.tsx sections-3
- src/features/explore-magazine/Section.tsx section-1
- src/features/review-v2/components/ReviewHoleTags.tsx review-hole-tags-1
- src/features/tourhub/tournament-v2/sections/CourseSection.tsx course-section-1
- src/features/courses/_shared/scorecard/scorecardParts.tsx scorecard-parts-1
- src/features/tourhub/overview/sections/WorldRankings.tsx world-rankings-1
- src/features/tourhub/players-v2/picks/LinePicksCard.tsx line-picks-card-1
- src/features/tourhub/players-v2/front/FrontPage.tsx front-page-1
- src/components/courses/course-detail/about/RecordBook.tsx record-book-1
- src/components/courses/course-detail/you/YourRoundsSheet.tsx your-rounds-sheet-2
- src/components/courses/top100/TheArgumentSection.tsx the-argument-section-1
- src/components/courses/Top100CoursesHubPanel.tsx top100-courses-hub-panel-1
- src/features/courses/_shared/scorecard/CardScorecardSheet.tsx card-scorecard-sheet-1
- src/components/likes/LikesSheet.tsx likes-sheet-1
- src/features/composer-flow/ReviewCourseSearchSheet.tsx review-course-search-sheet-1
- src/components/feed/PostGolfTags.tsx post-golf-tags-1
- src/components/profile/courses/AddCourseModal.tsx add-course-modal-1
- src/components/profile/courses/BreakdownsPickerSheet.tsx breakdowns-picker-sheet-1
- src/components/profile/handicap/gam/streaks/StreaksSheet.tsx streaks-sheet-1
- src/components/profile/handicap/whs/connect/CountryScreen.tsx country-screen-1
- src/components/profile/handicap/whs/connect/CountryScreen.tsx country-screen-2
- src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx compare-sheet-1
- src/components/profile/handicap/whs/sections/HcpSection.tsx hcp-section-1
- src/features/activity-v2/ActivityPageV2.tsx activity-page-v2-1
- src/features/activity-v2/components/ActivityActionsSheet.tsx activity-actions-sheet-1
- src/features/activity-v2/components/FeaturedMomentCard.tsx featured-moment-card-1
- src/features/activity-v2/components/FriendRequestsRail.tsx friend-requests-rail-1
- src/features/chrome-v2/IndexGlance.tsx index-glance-1
- src/features/pro-verification/ProfileTourTab.tsx profile-tour-tab-1
- src/features/social-lists-v2/SocialListPage.tsx social-list-page-1

## Declaration anchors (9)
BusinessEmptyState `kicker`; BusinessWeekCard `kickerStyle`; clubAnalytics/sections `HoleBySection.kicker`, `S7_KICKER`, `WhoPlaysSection.kicker`; ListScopeHeader `CAPTION`; MyRatingsTierDivider `GROUP_DEFAULT`; CountryScreen `GROUP_LABEL`; HeadToHeadDetail `GROUP_KICK`.

## Other tests checked for line pinning
`brandCase.test.ts` and `tourInterpolationGuard.test.ts` compute line numbers only for failure messages and expect empty lists; no other test fixture pins source lines.

## Shards (sequential, no retries)
1/4 2,533/232 · 2/4 2,544/232 · 3/4 2,742/232 · 4/4 2,817/231 = 10,636 / 927, against the Brief 26 baseline 10,636 / 927: delta 0 / 0.

No SQL run, no migration written. Logs: /root/shards27/.
