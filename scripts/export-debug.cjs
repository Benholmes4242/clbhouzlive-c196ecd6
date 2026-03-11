/**
 * Run with: node scripts/export-debug.cjs
 * Outputs: src/debug-export.json
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  'src/pages/Clubhouse.tsx',
  'src/pages/ClubhouseWrapped.tsx',
  'src/components/clubhouse/cinematic/CinematicActionRail.tsx',
  'src/components/clubhouse/cinematic/CreatorCapsule.tsx',
  'src/components/clubhouse/cinematic/TournamentResultCard.tsx',
  'src/components/clubhouse/cinematic/index.ts',
  'src/components/clubhouse/hooks/useActivePostDerived.ts',
  'src/components/clubhouse/hooks/useClubhouseComments.ts',
  'src/components/clubhouse/hooks/useClubhouseFeedNav.ts',
  'src/components/clubhouse/hooks/useClubhouseFollows.ts',
  'src/components/clubhouse/hooks/useClubhouseLifecycle.ts',
  'src/components/clubhouse/hooks/useClubhouseLikes.ts',
  'src/components/clubhouse/hooks/useClubhouseShare.ts',
  'src/components/clubhouse/social-dock/SocialDock.tsx',
  'src/components/clubhouse/social-dock/TopBar.tsx',
  'src/components/clubhouse/social-dock/VideoReactionTray.tsx',
  'src/components/clubhouse/ClubhouseTopBar.tsx',
  'src/components/clubhouse/ClubhouseTabToggle.tsx',
  'src/components/clubhouse/ClubhouseSkeletonShimmer.tsx',
  'src/components/media-system/FeedContainer.tsx',
  'src/components/media-system/FeedItem.tsx',
  'src/components/media-system/VideoPlayer.tsx',
  'src/components/media-system/VideoPoolProvider.tsx',
  'src/components/media-system/Scrubber.tsx',
  'src/components/media-system/ImageViewer.tsx',
  'src/components/media-system/MediaCarousel.tsx',
  'src/components/media-system/MediaErrorBoundary.tsx',
  'src/components/media-system/LoadingSkeleton.tsx',
  'src/components/media-system/ErrorState.tsx',
  'src/components/media-system/PullToRefresh.tsx',
  'src/components/media-system/CarouselIndicator.tsx',
  'src/components/media-system/EndOfFeed.tsx',
  'src/components/media-system/styles/mediaPlayer.css',
  'src/components/media-system/types/media.ts',
  'src/components/media-system/store/mediaStore.ts',
  'src/components/media-system/store/createMediaStore.ts',
  'src/components/media-system/store/MediaStoreContext.tsx',
  'src/components/media-system/store/useMediaStoreCompat.ts',
  'src/components/media-system/hooks/useVideoPool.ts',
  'src/components/media-system/hooks/usePreloader.ts',
  'src/components/media-system/hooks/useSuggestedFeed.ts',
  'src/components/media-system/hooks/useFriendsFeed.ts',
  'src/components/media-system/hooks/useGaplessLoop.ts',
  'src/components/media-system/hooks/useLikeMutation.ts',
  'src/components/media-system/hooks/useFollowMutation.ts',
  'src/components/media-system/hooks/useVideoAnalytics.ts',
  'src/components/media-system/hooks/useSessionCache.ts',
  'src/components/media-system/utils/audioFade.ts',
  'src/components/media-system/utils/feedAlgorithm.ts',
  'src/components/media-system/utils/feedMapper.ts',
  'src/components/media-system/utils/hlsManager.ts',
  'src/components/media-system/utils/manifestParser.ts',
  'src/components/media-system/utils/segmentCache.ts',
  'src/components/media-system/utils/spring.ts',
  'src/components/media-system/utils/cachedHlsLoader.ts',
  'src/components/GlobalBottomNavigation.tsx',
];

const root = path.resolve(__dirname, '..');
const result = {};

for (const file of FILES) {
  const fullPath = path.join(root, file);
  try {
    result[file] = fs.readFileSync(fullPath, 'utf-8');
  } catch (e) {
    result[file] = `// ERROR: Could not read file: ${e.message}`;
  }
}

const outPath = path.join(root, 'src', 'debug-export.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Wrote ${Object.keys(result).length} files to ${outPath}`);
