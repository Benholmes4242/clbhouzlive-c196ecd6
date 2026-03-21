import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
// SnapToast removed — PostStudio handles its own toasts

// useSnapModal removed — PostStudio is now the sole creation flow
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { cn } from '@/lib/utils';
import { Compass, Flag, EyeOff, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
// ClubhouseSkeleton import removed — rehydration now uses ClubhouseSkeletonShimmer
import { ClubhouseTabProvider, useClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { clubhouseDebug } from '@/debug/clubhouseDebug';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useFullscreenFeed } from '@/components/fullscreen-feed/hooks/useFullscreenFeed';

// ── New Media System imports ──
import { VideoPoolProvider } from '@/components/media-system/VideoPoolProvider';
import { FeedContainer } from '@/components/media-system/FeedContainer';
import { usePreloader } from '@/components/media-system/hooks/usePreloader';
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/components/media-system/hooks/useFriendsFeed';
import { useMediaStore } from '@/components/media-system/store/mediaStore';
import { MediaErrorBoundary } from '@/components/media-system/MediaErrorBoundary';
import { useVideoAnalytics } from '@/components/media-system/hooks/useVideoAnalytics';
import type { FeedPost, TournamentResultFeedPost } from '@/components/media-system/types/media';
import { TournamentResultCard } from '@/components/clubhouse/cinematic/TournamentResultCard';
import { useTournamentLiveFeed } from '@/components/media-system/hooks/useTournamentLiveFeed';
import { injectLiveTournamentCards } from '@/components/media-system/utils/feedAlgorithm';

// ── Clubhouse UI overlays ──
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { useActiveActor } from '@/context/ActiveActorContext';
import { getProfilePathById } from '@/lib/profileRoutes';
import { Scrubber } from '@/components/media-system/Scrubber';

// ── Decomposed hooks ──
import { useClubhouseLifecycle } from '@/components/clubhouse/hooks/useClubhouseLifecycle';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useClubhouseFeedNav } from '@/components/clubhouse/hooks/useClubhouseFeedNav';

/** Shared More Options Drawer */
interface MoreOptionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: () => void;
  onNotInterested: () => void;
  onCopyLink: () => void;
}

const MoreOptionsDrawer: React.FC<MoreOptionsDrawerProps> = ({
  open, onOpenChange, onReport, onNotInterested, onCopyLink
}) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent
      className="border-white/[0.08] rounded-t-[20px]"
      style={{
        background: 'rgba(13, 13, 13, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >

      {/* Actions */}
      <div className="p-4 space-y-1">
        <button
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/10 transition-colors"
          onClick={onReport}
        >
          <Flag className="w-5 h-5 text-white/50" />
          <span className="text-[15px] text-white/80">Report this post</span>
        </button>
        <button
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/10 transition-colors"
          onClick={onNotInterested}
        >
          <EyeOff className="w-5 h-5 text-white/50" />
          <span className="text-[15px] text-white/80">Not interested</span>
        </button>
        <button
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/10 transition-colors"
          onClick={onCopyLink}
        >
          <LinkIcon className="w-5 h-5 text-white/50" />
          <span className="text-[15px] text-white/80">Copy link</span>
        </button>
      </div>

      {/* Safe area spacer */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </DrawerContent>
  </Drawer>
);

/** Feed + preloader wrapper — preloader must be inside VideoPoolProvider */
function FeedWithPreloader({
  posts,
  onNearEnd,
  onRefresh,
  isRefreshing,
  hasNextPage,
  followOverrides,
  onFollowChange,
  onFirstFrameReady,
  onLike,
  onComment,
  onShare,
  getLikeState,
  getCommentCount,
}: {
  posts: FeedPost[];
  onNearEnd: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  hasNextPage: boolean;
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
  onLike?: (post: FeedPost) => void;
  onComment?: () => void;
  onShare?: (post: FeedPost) => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
}) {
  usePreloader(posts);
  return (
    <FeedContainer
      posts={posts}
      onNearEnd={onNearEnd}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      hasNextPage={hasNextPage}
      followOverrides={followOverrides}
      onFollowChange={onFollowChange}
      onFirstFrameReady={onFirstFrameReady}
      onLike={onLike}
      onComment={onComment}
      onShare={onShare}
      getLikeState={getLikeState}
      getCommentCount={getCommentCount}
    />
  );
}


const ClubhouseContent = () => {
  // ============================================================================
  // ALL HOOKS MUST BE DECLARED FIRST - before any early returns
  // ============================================================================
  
  const { isRehydrating } = useRehydrationSafe();
  const { pathname } = useLocation();
  
  useEffect(() => {
    logRouteClubhouse();
    clubhouseDebug.pageMount();
    return () => { clubhouseDebug.pageUnmount(); };
  }, []);

  // Close fullscreen feed overlay when Clubhouse mounts — prevents duplicate action rail
  useEffect(() => {
    useFullscreenFeed.getState().close();
  }, []);
  
  useHeaderVariant('glass-dark');
  // Pass pathname as reapplyKey — since Clubhouse is keep-alive it never remounts,
  // so the effect only fires once without this. With pathname as the key, it
  // re-fires every time the user navigates back to /, re-applying the transparent
  // status bar over whatever the previous page left behind.
  useMedianStatusBar("dark", "transparent", true, false, true, pathname);
  
  useLayoutEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => { document.body.classList.remove('route-clubhouse'); };
  }, []);
  
  const navigate = useNavigate();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  
  // Tab state from context
  const tabContext = useClubhouseTab();
  const activeTab = tabContext?.activeTab ?? 'foryou';
  const setActiveTab = tabContext?.setActiveTab ?? (() => {});
  const isBusinessActor = tabContext?.isBusinessActor ?? false;
  
  // Auth + actor context
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  
  // ── Network status ──
  const { isOnline } = useNetworkStatus();
  
  // ── Feed hooks (both tabs stay mounted for instant switching) ──
  const suggestedFeed = useSuggestedFeed(user?.id);
  const friendsFeed = useFriendsFeed(user?.id);
  const activeFeed = activeTab === 'foryou' ? suggestedFeed : friendsFeed;
  
  // ── Live tournament injection ──
  const { livePosts, liveTourSlugs } = useTournamentLiveFeed(user?.id);
  
  // Stable fingerprints to prevent unnecessary rebuilds of the posts array
  const livePostIds = useMemo(() => livePosts.map(p => p.id).join(','), [livePosts]);
  const liveTourSlugsKey = liveTourSlugs.join(',');
  
  const posts = useMemo(
    () => injectLiveTournamentCards(activeFeed.posts, livePosts, liveTourSlugs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFeed.posts, livePostIds, liveTourSlugsKey]
  );
  const isLoading = activeFeed.isLoading;
  const hasNextPage = activeFeed.hasNextPage ?? true;
  
  // Skeleton timing
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady,
    resetSkeleton,
  } = useClubhouseSkeletonTiming(!isLoading && posts.length > 0);
  
  // ── Media store state ──
  const activeIndex = useMediaStore((s) => s.activeIndex);
  const setActiveIndex = useMediaStore((s) => s.setActiveIndex);
  const setCarouselPosition = useMediaStore((s) => s.setCarouselPosition);
  const isMuted = useMediaStore((s) => s.isMuted);
  const toggleMute = useMediaStore((s) => s.toggleMute);
  
  // ── Lifecycle (visibility, network reconnect, wake lock) ──
  useClubhouseLifecycle();
  
  // ── Active post derivation ──
  const { activePost, golfCourse, activeReview, isActiveReview, isActiveVideo } = useActivePostDerived(posts, activeIndex);
  const isTournamentCardActive =
    activePost?.postType === 'tournament_result' ||
    activePost?.postType === 'tournament_live';

  // Hide bottom nav when tournament card is active
  const { setVisible: setBottomNavVisible } = useBottomNavigation();
  useEffect(() => {
    setBottomNavVisible(!isTournamentCardActive);
    return () => setBottomNavVisible(true);
  }, [isTournamentCardActive, setBottomNavVisible]);
  
  // ── Optimistic like state ──
  const { handleLike, getActiveLikeState, resetLikes } = useClubhouseLikes({ userId: user?.id, activeActor });
  const activeLikeState = getActiveLikeState(activePost);
  
  // ── Optimistic follow state ──
  const { followOverrides, handleFollow, handleFollowChange, getFollowState, resetFollows } = useClubhouseFollows({ userId: user?.id });
  const isActivePostFollowed = getFollowState(activePost);
  
  // ── Comments state ──
  const { commentsOpen, overlayVisible, openComments, closeComments, handleCommentPosted, handleCommentDeleted, getCommentCount, resetComments } = useClubhouseComments();
  const activeCommentCount = getCommentCount(activePost);
  
  // ── Share / Report / Not Interested ──
  const { moreOptionsOpen, setMoreOptionsOpen, handleShare, handleReport, handleNotInterested } = useClubhouseShare(user?.id);
  
  // ── Feed navigation (tab switch, infinite scroll, pull-to-refresh) ──
  const { handleNearEnd, handleRefresh } = useClubhouseFeedNav({
    activeTab,
    activeFeed,
    onTabSwitch: () => { resetLikes(); resetFollows(); resetComments(); },
  });
  
  // ── Carousel media index for multi-media posts ──
  const carouselPositions = useMediaStore((s) => s.carouselPositions);
  const currentMediaIndex = carouselPositions.get(activeIndex) ?? 0;
  const activeMediaCount = activePost?.mediaItems?.length ?? 0;
  
  // ── Navigation to profile ──
  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    navigate(getProfilePathById(activePost.userId));
  }, [activePost, navigate]);


  
  // Legacy composer state removed — PostStudio is now the sole creation flow

  // Season Recap Modal
  const { data: seasonRecap } = useSeasonRecap(user?.id);
  const [showRecapModal, setShowRecapModal] = useState(false);
  

  useEffect(() => {
    if (seasonRecap) {
      setShowRecapModal(true);
    }
  }, [seasonRecap]);

  // ── Active video element from store (for page-level scrubber) ──
  const activeVideoElement = useMediaStore((s) => s.activeVideoElement);
  const activeVideoRef = useMediaStore((s) => s.activeVideoRef);
  
  // ── Is active post own? ──
  const isOwnPost = user?.id === activePost?.userId;
  
  // ── Video analytics ──
  useVideoAnalytics(activePost, !!activePost, activeVideoElement);

  // ── Review tap handler ──
  const handleReviewTap = useCallback(() => {
    if (!activeReview) return;
    navigate(`/courses/${activeReview.courseId}?tab=reviews&review=${activeReview.reviewId}`);
  }, [activeReview, navigate]);

  // ============================================================================
  // EARLY RETURNS
  // ============================================================================
  
  // Rehydration is now handled via AnimatePresence below (G4 fix)
  const showRehydrationSkeleton = isRehydrating;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  return (
    <PageRoot 
      ref={clubhouseRootRef} 
      className="clubhouse-root" 
      fixedHeight
      hasBottomNav={false}
      style={{ 
        "--bg-page": "var(--color-black, #000000)", 
        position: 'relative', 
        isolation: 'isolate', 
        zIndex: 0
      } as React.CSSProperties}
    >
      {/* Skeleton Shimmer - Overlays content until first frame is ready */}
      <ClubhouseSkeletonShimmer 
        isVisible={skeletonVisible} 
        isStatic={skeletonMode === 'static'} 
      />

      {/* Floating top bar: Tab Toggle + Search + Profile Pill — z-40 */}
      <div style={{
        opacity: isTournamentCardActive ? 0 : 1,
        pointerEvents: isTournamentCardActive ? 'none' : 'auto',
        transition: 'opacity 0.18s ease',
      }}>
        <ClubhouseTopBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // Re-show skeleton if switching to an unloaded feed
            const targetFeed = tab === 'friends' ? friendsFeed : suggestedFeed;
            if (targetFeed.isLoading) {
              resetSkeleton();
            }
          }}
          isBusinessActor={isBusinessActor}
          user={user}
        />
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
          left: 16,
          right: 16,
          zIndex: 200,
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '10px 16px',
          textAlign: 'center',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
        }}>
          No internet connection
        </div>
      )}

      {/* Rehydration skeleton */}
      <ClubhouseSkeletonShimmer isVisible={showRehydrationSkeleton} isStatic={false} />

      {/* ═══ MAIN FEED AREA ═══ */}
      {!isLoading && posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
          style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 64px)' }}
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-lg font-semibold text-white">
            {activeTab === 'friends' ? 'No posts from friends yet' : 'No posts to show'}
          </p>
          <p className="text-sm text-white/50 mt-2">
            {activeTab === 'friends' 
              ? 'Follow golfers to see their posts here' 
              : 'Check back soon for new content'}
          </p>
        </div>
      ) : posts.length > 0 ? (
        <MediaErrorBoundary onReset={() => {
          setActiveIndex(0);
          activeFeed.refetch();
        }}>
          <VideoPoolProvider>
            <FeedWithPreloader
              posts={posts}
              onNearEnd={handleNearEnd}
              onRefresh={handleRefresh}
              isRefreshing={activeFeed.isRefetching}
              hasNextPage={hasNextPage}
              followOverrides={followOverrides}
              onFollowChange={handleFollowChange}
              onFirstFrameReady={signalFirstFrameReady}
              onLike={(post) => handleLike(post)}
              onComment={openComments}
              onShare={(post) => handleShare(post)}
              getLikeState={(post) => getActiveLikeState(post)}
              getCommentCount={(post) => getCommentCount(post)}
            />
          </VideoPoolProvider>
        </MediaErrorBoundary>
      ) : null}

      {/* ═══ TOURNAMENT RESULT OVERLAY (comments/more options only — card renders inline in feed) ═══ */}
      {activePost && posts.length > 0 &&
        (activePost.postType === 'tournament_result' || activePost.postType === 'tournament_live') && (
        <>
          {/* Comments sheet for tournament posts */}
          <CommentsSheet
            isOpen={commentsOpen}
            onClose={closeComments}
            postId={activePost.id}
            currentUserId={user?.id}
            creatorUserId={activePost.userId}
            creatorName={activePost.displayName}
            creatorAvatar={activePost.avatarUrl}
            caption={activePost.caption}
            theme="dark"
            likesCount={activePost?.likeCount ?? null}
            onCommentPosted={() => handleCommentPosted(activePost)}
            onCommentDeleted={() => activePost && handleCommentDeleted(activePost.id, activePost.commentCount)}
          />
          <MoreOptionsDrawer
            open={moreOptionsOpen}
            onOpenChange={setMoreOptionsOpen}
            onReport={() => handleReport(activePost)}
            onNotInterested={() => handleNotInterested(activePost)}
            onCopyLink={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
              toast.success('Link copied');
              setMoreOptionsOpen(false);
            }}
          />
        </>
      )}

      {/* ═══ OVERLAY LAYER (non-tournament posts only) ═══ */}
      {activePost && posts.length > 0 && activePost.postType !== 'tournament_result' && activePost.postType !== 'tournament_live' && (
        <>
          {/* Review overlay — z-10 */}
          <AnimatePresence>
            {isActiveReview && activeReview && (
              <motion.div
                key="review-overlay"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}
              >
                <FullscreenReviewPost
                  mode="live"
                  hideUserCapsule
                  courseId={activeReview.courseId}
                  courseName={activeReview.courseName}
                  heroSubtitle={
                    activeReview.courseSubCountry || activeReview.courseRegion
                      ? [activeReview.courseSubCountry, activeReview.courseRegion, activeReview.courseCountry]
                          .filter(Boolean)
                          .join(', ')
                      : activeReview.courseCountry || undefined
                  }
                  rating={activeReview.rating}
                  reviewText={activeReview?.reviewText ?? null}
                  reviewId={activeReview.reviewId}
                  media={activePost?.mediaItems?.map((m, i) => ({
                    id: m.id ?? `media-${i}`,
                    media_type: m.type === 'video' ? 'video' as const : 'image' as const,
                    media_url: m.imageUrl ?? m.mp4Url ?? '',
                    stream_id: m.hlsUrl?.split('/').pop()?.replace('/manifest/video.m3u8', '') ?? undefined,
                    poster_url: m.thumbnailUrl ?? undefined,
                    display_order: i,
                  })) ?? []}
                  user={{
                    name: activePost.displayName,
                    username: activePost.username,
                    avatar: activePost.avatarUrl,
                  }}
                  renderMedia={false}
                  hideCarouselArrows
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media navigation dots for multi-media posts */}
          {activeMediaCount > 1 && (
            <MediaNavigationDots
              mediaCount={activeMediaCount}
              currentIndex={currentMediaIndex}
              onJump={(idx) => setCarouselPosition(activeIndex, idx)}
            />
          )}

          {/* CinematicActionRail — z-40, right side */}
           <CinematicActionRail
            postId={activePost.id}
            likesCount={activeLikeState ? activeLikeState.count : null}
            commentsCount={activePost ? activeCommentCount : null}
            hasLiked={activeLikeState.isLiked}
            isMuted={isMuted}
            isVisible={overlayVisible}
            onLike={() => handleLike(activePost)}
            onComment={openComments}
            onShare={() => handleShare(activePost)}
            onMore={() => setMoreOptionsOpen(true)}
            onMuteToggle={toggleMute}
            isVideo={isActiveVideo}
            hasNextMedia={currentMediaIndex < activeMediaCount - 1}
            hasPrevMedia={currentMediaIndex > 0}
            onNextMedia={activeMediaCount > 1 
              ? () => setCarouselPosition(activeIndex, currentMediaIndex + 1) 
              : undefined}
            onPrevMedia={activeMediaCount > 1 
              ? () => setCarouselPosition(activeIndex, currentMediaIndex - 1) 
              : undefined}
          />

          {/* CreatorCapsule — z-50, bottom-left */}
           <CreatorCapsule
            postId={activePost.id}
            user={{
              id: activePost.userId,
              name: activePost.displayName,
              username: activePost.username,
              avatar: activePost.avatarUrl,
            }}
            caption={activePost.caption}
            tags={activePost.tags || []}
            golfCourse={golfCourse}
            isFollowing={isActivePostFollowed}
            isOwnPost={isOwnPost}
            isVisible={overlayVisible}
            onFollow={() => handleFollow(activePost)}
            onViewProfile={handleViewProfile}
            isReview={isActiveReview}
            reviewData={isActiveReview && activeReview ? {
              rating: activeReview.rating,
              courseName: activeReview.courseName,
              courseId: activeReview.courseId,
              tierLabel: activeReview.rating >= 9 ? 'Outstanding' : activeReview.rating >= 7 ? 'Excellent' : 'Good',
              sourceReviewId: activeReview.reviewId,
            } : undefined}
            onReviewTap={handleReviewTap}
          />

          <MoreOptionsDrawer
            open={moreOptionsOpen}
            onOpenChange={setMoreOptionsOpen}
            onReport={() => handleReport(activePost)}
            onNotInterested={() => handleNotInterested(activePost)}
            onCopyLink={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
              toast.success('Link copied');
              setMoreOptionsOpen(false);
            }}
          />

          {/* Comments sheet — z-100+ */}
          <CommentsSheet
            isOpen={commentsOpen}
            onClose={closeComments}
            postId={activePost.id}
            currentUserId={user?.id}
            creatorUserId={activePost.userId}
            creatorName={activePost.displayName}
            creatorAvatar={activePost.avatarUrl}
            caption={activePost.caption}
            theme="dark"
            likesCount={activePost?.likeCount ?? null}
            onCommentPosted={() => handleCommentPosted(activePost)}
            onCommentDeleted={() => activePost && handleCommentDeleted(activePost.id, activePost.commentCount)}
          />
        </>
      )}

      {/* ═══ PAGE-LEVEL SCRUBBER (non-tournament only) ═══ */}
      {activePost?.postType !== 'tournament_result' && activePost?.postType !== 'tournament_live' && isActiveVideo && activeVideoRef && (
        <Scrubber
          videoRef={activeVideoRef}
          videoElement={activeVideoElement}
          isActive={!!activeVideoElement}
          duration={activeVideoElement?.duration ?? null}
          position="fixed"
          bottomNavSelector=".global-bottom-nav"
        />
      )}

      {/* Post Creation — now handled globally by GlobalPostStudio in App.tsx */}

      {/* Season Recap Modal */}
      {seasonRecap && user && (
        <SeasonRecapModal
          isOpen={showRecapModal}
          onClose={() => setShowRecapModal(false)}
          seasonName={seasonRecap.seasonName}
          finalRank={seasonRecap.finalRank}
          finalXP={seasonRecap.finalXP}
          rewardTier={seasonRecap.rewardTier}
          seasonId={seasonRecap.seasonId}
          userId={user.id}
        />
      )}
    </PageRoot>
  );
};

// Wrap with tab provider
const Clubhouse = () => (
  <ClubhouseTabProvider>
    <ClubhouseContent />
  </ClubhouseTabProvider>
);

export default Clubhouse;
