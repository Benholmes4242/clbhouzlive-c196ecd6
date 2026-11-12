# PRO member-name coverage — stopped checkpoint

## Result
Existing small PRO label added to 55 actual name-rendering files, plus safe identity propagation in caller/data adapters. No changes to ProLabel, useProMembers or proMembersCache; no SQL, migrations, feed_config or round_pool_cap changes. Actual RaterReviewRow is in SingleReview.tsx, not reviewFlatBits.tsx; both person-row owners are wired.

## Stop evidence
Command: `bun x vitest run src/test/proLabelMemberRows.test.tsx --maxWorkers=2`
Result: **2 passed, 1 failed**, 1 failed test file.
Failing test: `PRO member-name identity rules > business comment with a verified uploader never receives PRO`.
Tool error: `Error: useNavigate() may be used only in the context of a <Router> component.`
Location: `src/components/mentions/MentionText.tsx:36:20` (`const navigate = useNavigate();`). The new test's business-comment render omits MemoryRouter at `src/test/proLabelMemberRows.test.tsx:30`; it has not been altered after this failure.
Your unexpected-failure stop rule is observed. No pre-existing failure has been found because the full suite was not run.

## Counts and verification
Last reported full-suite baseline: **8,295**.
Added: **3** tests in proLabelMemberRows.test.tsx, named:
- verified pro rater places the small label after the name
- ordinary rater has no pro label
- business comment with a verified uploader never receives PRO
No existing test deleted, renamed or rewritten. Expected inventory is 8,298 if the baseline is unchanged; **this is not a measured full-suite total**.
Shards 1/4, 2/4, 3/4 and 4/4: **not run following the stop**. Baseline reconciliation remains unverified.
Latest preview compilation: `build OK`, 2026-11-12T06:23:43Z. `git diff --check` passed.
No live or 320px screen verification performed. No claim that every surface fits at 320px.

## Remaining work
- Repair the new business-comment test's missing router provider only when authorised.
- Add the requested proLabelCoverage.test.ts guard; delegation/non-member exceptions must be explicit, not dummy unused imports.
- Finish ShotTagCard owner ID propagation, subject/empty-state IDs, additional metadata contracts and remaining prose names (SingleReview lead, HundredYou, review sheet subline, leader You text, PostedChampions).
- Add business-authored review/post and viewer-You regression cases; current business regression covers a comment only.
- Verify review/post business actor withholding throughout the remaining caller boundaries.
- Run four separate shards, report measured totals and verify real member screens at 320px.

## Sweep table
This is a source audit; outstanding entries are not claimed complete. Tour names, own composer/posting-as/success screens, business You cards, nonmember invites and TopTenShareCard remain excluded by the brief.

| File | Decision |
|---|---|
| `src/components/explore-tab-new/courseled/StandoutRounds.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/explore-tab-new/courseled/FriendsPlayedRail.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/explore-tab-new/courseled/CreatorCard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/explore-tab-new/courseled/CompetitionBoards.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/explore-tab-new/courseled/BoardRows.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/explore-tab-new/FriendRoundRow.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/courses/top100/HundredRaceParts.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/courses/top100/Top100Leaderboard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/pages/BusinessReviewsPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/business/ClubWhatGolfersSay.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/top100/sheets/Top100ListProgressSheet.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/posts/ReviewBottomSheet.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/courses/course-detail/reviews/reviewFlatBits.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/courses/course-detail/reviews/SingleReview.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/loop-tab/LoopCard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/feed/ReviewPostCard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/feed/BreathingRoomBottomBar.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/profile/handicap/whs/sections/recently-played/FriendRoundRow.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/FeaturedRoundCard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/ExploreCard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/ScoresLeaderboardsPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/watch/WatchFeed.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/onboarding/WelcomeGolfers.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/social-suggestions/SuggestedGolfersRail.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/coach/BusinessCoachCards.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/pages/HandicapPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/pages/WatchGridPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/watch-v2/components/HubVideoRow.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/watch-v2/components/HubClipsRow.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/watch/CreatorsRow.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/watch/WatchLead.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/watch/CreatorSpotlight.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/explore-tab-new/courseled/MediaRailTile.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/amateur/AmateurMediaBlock.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/amateur/AmateurHero.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/clubhouse/FriendsEmptyState.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/feed/InlineReviewCard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/pages/BusinessInvitePage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/pages/manage/BlockedPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/admin/AdminDrawer.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/admin/pages/SettingsPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/admin/pages/UsersPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/admin/components/ChartPanels.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/explore-magazine/watch/RoundTileParts.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/courses/course-detail/reviews/FewReviews.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/courses/network/UnseenReviewsBanner.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/profile/courses/CourseLegacyCard.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/pages/PostDeepLinkPage.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/features/activity-v2/components/ActivityFoldedRoundsRow.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsFlatBits.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/feed/FeedCommentPreview.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/fullscreen-feed/MemberShotCredit.tsx` | Wired at member-name JSX; business/system/Tour guards where applicable. |
| `src/components/courses/course-detail/CourseReviewsTab.tsx` | Delegates names to FlatReviewRow and SingleReview; both wired. No direct JSX member name. |
| `src/components/courses/top100/Top100RaceSection.tsx` | Delegates row names to HundredRaceRow, wired; HundredYou narrative names still outstanding. |
| `src/features/explore-magazine/watch/RoundsThisWeekShelf.tsx` | Delegates identity to RoundTileWho, wired. |
| `src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx` | Delegates identity through CardScorecardSheet to RoundSummaryHead, wired; Tour IDs withheld. |
| `src/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown.tsx` | Delegates main rows to championsFlatBits, wired; PostedChampions narrative names remain outstanding. |
| `src/components/feed/FeedActionRail.tsx` | No visible member name; avatar and accessibility text only; explicitly conditional in brief. |
| `src/components/achievements/EliteGameCard.tsx` | displayName is an achievement tier/club name, not a member. |
| `src/features/comments-v2/CommentsSheetV2.tsx` | CommentCard/ReplyRow already wired; subject and empty-state names still lack passed canonical author ID. |
| `src/components/course-media-tab/ShotTagCard.tsx` | Credit string and OwnMediaSource lack canonical owner ID; unresolved, no guessed ID supplied. |
| `src/components/sheets/SubjectContextLine.tsx` | Member name confirmed; author user ID/type not propagated. Existing useCommentsContext has source ID; propagation unfinished. |
| `src/components/videos/MiniPlayer.tsx` | Creator name confirmed; resolved actor ID/type discarded by local metadata. Propagation unfinished. |
| `src/components/shared/overlay/OverlayCorners.tsx` | Name-only contract; caller classification and identity propagation unfinished. |
| `src/components/shared/overlay/ReviewOverlayCore.tsx` | Optional user ID but no actor discriminator; caller classification unfinished. |
| `src/components/learn/LearnVideoCard.tsx` | LearnVideo supplies video ID and creator name only; canonical member ID absent. |

Additional exclusions found: CollegeStamp (college), AchievementCard (achievement), MapExpandedView (location), Tourhub MomentsSection (Tour player), PostingAsMenu/AccountGlance (own account), CommentComposer (excluded composer), invite-to-clbhouz/InviteCard (nonmember), TopTenShareCard (excluded share artwork).

## Diff stat
Tracked diff at stop, before this report/roadmap update and excluding the new untracked test:
```text
 roadmap.md                                            |  5 +++++
 src/components/business/ClubWhatGolfersSay.tsx        |  3 ++-
 src/components/clubhouse/FriendsEmptyState.tsx        |  3 ++-
 .../courses/course-detail/reviews/FewReviews.tsx      |  8 +++++---
 .../courses/course-detail/reviews/SingleReview.tsx    |  3 ++-
 .../courses/course-detail/reviews/reviewFlatBits.tsx  |  3 ++-
 .../courses/network/UnseenReviewsBanner.tsx           |  3 ++-
 src/components/courses/top100/HundredRaceParts.tsx    |  3 ++-
 src/components/courses/top100/Top100Leaderboard.tsx   | 19 ++++++++++---------
 src/components/explore-tab-new/FriendRoundRow.tsx     |  3 ++-
 .../explore-tab-new/courseled/BoardRows.tsx           |  3 ++-
 .../explore-tab-new/courseled/CompetitionBoards.tsx   |  5 +++--
 .../explore-tab-new/courseled/CreatorCard.tsx         |  3 ++-
 .../explore-tab-new/courseled/FriendsPlayedRail.tsx   |  3 ++-
 .../explore-tab-new/courseled/MediaRailTile.tsx       |  3 ++-
 .../explore-tab-new/courseled/StandoutRounds.tsx      |  3 ++-
 src/components/feed/BreathingRoomBottomBar.tsx        |  4 +++-
 src/components/feed/FeedCommentPreview.tsx            |  5 ++++-
 src/components/feed/FeedOverlayLayer.tsx              |  1 +
 src/components/feed/InlineReviewCard.tsx              |  3 ++-
 src/components/feed/ReviewOverlaySlot.tsx             |  2 +-
 src/components/feed/ReviewPostCard.tsx                |  5 +++--
 src/components/fullscreen-feed/MemberShotCredit.tsx   |  3 ++-
 src/components/loop-tab/LoopCard.tsx                  |  3 ++-
 src/components/media-system/types/media.ts            |  1 +
 src/components/posts/ReviewBottomSheet.tsx            |  3 ++-
 src/components/profile/ProfileCoursesTab.tsx          |  1 +
 src/components/profile/courses/CourseLegacyCard.tsx   |  6 ++++--
 .../course-legends/flat/championsFlatBits.tsx         |  5 +++--
 .../friends-leaderboard-v2/LeaderboardRow.tsx         |  3 ++-
 .../whs/sections/recently-played/FriendRoundRow.tsx   |  3 ++-
 .../top100/sheets/Top100ListProgressSheet.tsx         |  3 ++-
 .../components/ActivityFoldedRoundsRow.tsx            |  7 +++++--
 src/features/admin/AdminDrawer.tsx                    |  3 ++-
 src/features/admin/components/ChartPanels.tsx         |  3 ++-
 src/features/admin/pages/SettingsPage.tsx             |  5 +++--
 src/features/admin/pages/UsersPage.tsx                |  5 +++--
 src/features/amateur/AmateurHero.tsx                  |  3 ++-
 src/features/amateur/AmateurMediaBlock.tsx            |  3 ++-
 src/features/coach/BusinessCoachCards.tsx             |  3 ++-
 .../courses/_shared/scorecard/scorecardParts.tsx      |  5 +++--
 src/features/explore-magazine/ExploreCard.tsx         |  9 +++++----
 src/features/explore-magazine/FeaturedRoundCard.tsx   |  3 ++-
 .../explore-magazine/ScoresLeaderboardsPage.tsx       |  3 ++-
 .../explore-magazine/watch/CreatorSpotlight.tsx       |  3 ++-
 src/features/explore-magazine/watch/CreatorsRow.tsx   |  5 +++--
 .../explore-magazine/watch/RoundTileParts.tsx         |  3 ++-
 src/features/explore-magazine/watch/WatchFeed.tsx     | 10 ++++++----
 src/features/explore-magazine/watch/WatchLead.tsx     |  5 +++--
 src/features/onboarding/WelcomeGolfers.tsx            |  3 ++-
 .../social-suggestions/SuggestedGolfersRail.tsx       |  3 ++-
 src/features/watch-v2/components/HubClipsRow.tsx      |  3 ++-
 src/features/watch-v2/components/HubVideoRow.tsx      |  3 ++-
 src/hooks/feed/useFeedCommentPreview.ts               |  4 ++++
 src/lib/courseMedia/memberShotPosts.ts                |  2 ++
 src/pages/BusinessInvitePage.tsx                      |  3 ++-
 src/pages/BusinessReviewsPage.tsx                     |  5 +++--
 src/pages/HandicapPage.tsx                            |  3 ++-
 src/pages/PostDeepLinkPage.tsx                        |  3 ++-
 src/pages/WatchGridPage.tsx                           |  3 ++-
 src/pages/manage/BlockedPage.tsx                      |  3 ++-
 61 files changed, 158 insertions(+), 82 deletions(-)
```
