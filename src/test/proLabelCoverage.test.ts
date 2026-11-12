import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

export const WIRED = [
  "src/components/explore-tab-new/courseled/StandoutRounds.tsx",
  "src/components/explore-tab-new/courseled/FriendsPlayedRail.tsx",
  "src/components/explore-tab-new/courseled/CreatorCard.tsx",
  "src/components/explore-tab-new/courseled/CompetitionBoards.tsx",
  "src/components/explore-tab-new/courseled/BoardRows.tsx",
  "src/components/explore-tab-new/FriendRoundRow.tsx",
  "src/components/courses/top100/HundredRaceParts.tsx",
  "src/components/courses/top100/Top100Leaderboard.tsx",
  "src/pages/BusinessReviewsPage.tsx",
  "src/components/business/ClubWhatGolfersSay.tsx",
  "src/components/top100/sheets/Top100ListProgressSheet.tsx",
  "src/components/posts/ReviewBottomSheet.tsx",
  "src/components/courses/course-detail/reviews/reviewFlatBits.tsx",
  "src/components/courses/course-detail/reviews/SingleReview.tsx",
  "src/components/loop-tab/LoopCard.tsx",
  "src/components/feed/ReviewPostCard.tsx",
  "src/components/feed/BreathingRoomBottomBar.tsx",
  "src/components/profile/handicap/whs/sections/recently-played/FriendRoundRow.tsx",
  "src/features/explore-magazine/FeaturedRoundCard.tsx",
  "src/features/explore-magazine/ExploreCard.tsx",
  "src/features/explore-magazine/ScoresLeaderboardsPage.tsx",
  "src/features/explore-magazine/watch/WatchFeed.tsx",
  "src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx",
  "src/features/onboarding/WelcomeGolfers.tsx",
  "src/features/social-suggestions/SuggestedGolfersRail.tsx",
  "src/features/coach/BusinessCoachCards.tsx",
  "src/pages/HandicapPage.tsx",
  "src/pages/WatchGridPage.tsx",
  "src/features/watch-v2/components/HubVideoRow.tsx",
  "src/features/watch-v2/components/HubClipsRow.tsx",
  "src/features/explore-magazine/watch/CreatorsRow.tsx",
  "src/features/explore-magazine/watch/WatchLead.tsx",
  "src/features/explore-magazine/watch/CreatorSpotlight.tsx",
  "src/components/explore-tab-new/courseled/MediaRailTile.tsx",
  "src/features/amateur/AmateurMediaBlock.tsx",
  "src/features/amateur/AmateurHero.tsx",
  "src/components/clubhouse/FriendsEmptyState.tsx",
  "src/components/feed/InlineReviewCard.tsx",
  "src/pages/BusinessInvitePage.tsx",
  "src/pages/manage/BlockedPage.tsx",
  "src/features/admin/AdminDrawer.tsx",
  "src/features/admin/pages/SettingsPage.tsx",
  "src/features/admin/pages/UsersPage.tsx",
  "src/features/admin/components/ChartPanels.tsx",
  "src/features/explore-magazine/watch/RoundTileParts.tsx",
  "src/features/courses/_shared/scorecard/scorecardParts.tsx",
  "src/components/courses/course-detail/reviews/FewReviews.tsx",
  "src/components/courses/network/UnseenReviewsBanner.tsx",
  "src/components/profile/courses/CourseLegacyCard.tsx",
  "src/pages/PostDeepLinkPage.tsx",
  "src/features/activity-v2/components/ActivityFoldedRoundsRow.tsx",
  "src/components/profile/handicap/whs/sections/course-legends/flat/championsFlatBits.tsx",
  "src/components/feed/FeedCommentPreview.tsx",
  "src/components/fullscreen-feed/MemberShotCredit.tsx",
  "src/components/course-media-tab/ShotTagCard.tsx",
  "src/features/comments-v2/CommentsSheetV2.tsx",
  "src/components/sheets/SubjectContextLine.tsx",
  "src/components/videos/MiniPlayer.tsx",
  "src/components/shared/overlay/OverlayCorners.tsx",
  "src/components/shared/overlay/ReviewOverlayCore.tsx",
  "src/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions.tsx"
] as const;
export const DELEGATES: Record<string, string> = {
  "src/components/courses/course-detail/CourseReviewsTab.tsx": "src/components/courses/course-detail/reviews/reviewFlatBits.tsx",
  "src/components/courses/top100/Top100RaceSection.tsx": "src/components/courses/top100/HundredRaceParts.tsx",
  "src/features/explore-magazine/watch/RoundsThisWeekShelf.tsx": "src/features/explore-magazine/watch/RoundTileParts.tsx",
  "src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx": "src/features/courses/_shared/scorecard/scorecardParts.tsx",
  "src/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown.tsx": "src/components/profile/handicap/whs/sections/course-legends/flat/championsFlatBits.tsx",
  "src/components/shared/overlay/ReviewTileOverlay.tsx": "src/components/shared/overlay/ReviewOverlayCore.tsx"
};
export const EXCLUDED: Record<string, string> = {
  "src/components/feed/FeedActionRail.tsx": "No visible member name; avatar and accessibility text only.",
  "src/components/achievements/EliteGameCard.tsx": "displayName identifies an achievement tier, not a member.",
  "src/components/learn/LearnVideoCard.tsx": "no member id in source",
  "src/components/profile/hero/topTenShare/TopTenShareCard.tsx": "Share artwork excluded by brief.",
  "src/components/header/PostingAsMenu.tsx": "Own posting-as controls excluded by brief.",
  "src/features/comments-v2/components/CommentComposer.tsx": "Own composer excluded by brief."
};

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
const labelImport = /import\s*\{[^}]*\b(?:InlineProMemberName|ProMemberName|ProLabel)\b[^}]*\}\s*from\s*['"][^'"]+['"]/;
describe('PRO member-name coverage', () => {
  for (const file of WIRED) it(`wired: ${file}`, () => { expect(source(file)).toMatch(labelImport); });
  for (const [file, target] of Object.entries(DELEGATES)) it(`delegates: ${file}`, () => { expect(source(file).length).toBeGreaterThan(0); expect(WIRED).toContain(target); expect(source(target)).toMatch(labelImport); });
  for (const [file, reason] of Object.entries(EXCLUDED)) it(`excluded: ${file}`, () => { expect(source(file).length).toBeGreaterThan(0); expect(reason.trim().length).toBeGreaterThan(0); expect(WIRED).not.toContain(file); });
});
