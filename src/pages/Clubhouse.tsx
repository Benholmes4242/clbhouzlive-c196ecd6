import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { cn } from '@/lib/utils';
import { Compass, ChevronLeft, Flag, EyeOff, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { ClubhouseSkeleton } from '@/components/skeletons/ClubhouseSkeleton';
import { ClubhouseTabProvider, useClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { clubhouseDebug } from '@/debug/clubhouseDebug';
import MobileVideoDebugPanel from '@/components/debug/MobileVideoDebugPanel';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

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
  
  useEffect(() => {
    logRouteClubhouse();
    clubhouseDebug.pageMount();
    return () => { clubhouseDebug.pageUnmount(); };
  }, []);
  
  useHeaderVariant('glass-dark');
  useMedianStatusBar("dark", "transparent", true, false);
  
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
  
  const posts = activeFeed.posts;
  const isLoading = activeFeed.isLoading;
  const hasNextPage = activeFeed.hasNextPage ?? true;
  
  // Skeleton timing
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady 
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
  const isTournamentCardActive = activePost?.postType === 'tournament_result';

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

  // Navigation handlers
  const { handleTabClick } = useNavigationHandlers();
  
  // Composer state management
  const {
    isComposerOpen,
    mediaItems,
    setMediaItems,
    selectedFile,
    caption,
    setCaption,
    isSubmitting,
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openComposer,
    openComposerWithFiles,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  interface PostTag {
    id: string;
    name: string;
  }
  const [localSelectedTags, setLocalSelectedTags] = useState<PostTag[]>([]);

  // Season Recap Modal
  const { data: seasonRecap } = useSeasonRecap(user?.id);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [chevronY, setChevronY] = useState<number | null>(null);

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
  
  if (isRehydrating) {
    return <ClubhouseSkeleton />;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  return (
    <PageRoot 
      ref={clubhouseRootRef} 
      className="clubhouse-root" 
      fixedHeight
      hasBottomNav={false}
      style={{ 
        "--bg-page": "#000000", 
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
          onTabChange={setActiveTab}
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

      {/* ═══ MAIN FEED AREA ═══ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-white/30 animate-pulse" />
          </div>
          <p className="text-sm text-white/50">Loading feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
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
      ) : (
        <MediaErrorBoundary onReset={() => {
          useMediaStore.getState().setActiveIndex(0);
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
      )}

      {/* ═══ TOURNAMENT RESULT OVERLAY (comments/more options only — card renders inline in feed) ═══ */}
      {activePost && posts.length > 0 && activePost.postType === 'tournament_result' && (
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
            onCommentPosted={() => handleCommentPosted(activePost)}
            onCommentDeleted={() => activePost && handleCommentDeleted(activePost.id, activePost.commentCount)}
          />
          {/* More options sheet for tournament posts */}
          <Drawer open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
            <DrawerContent className="bg-black/95 border-white/10">
              <div className="p-4 space-y-2">
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5" onClick={() => handleReport(activePost)}>
                  <Flag className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white">Report this post</span>
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5" onClick={() => handleNotInterested(activePost)}>
                  <EyeOff className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white">Not interested</span>
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
                  toast.success('Link copied');
                  setMoreOptionsOpen(false);
                }}>
                  <LinkIcon className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white">Copy link</span>
                </button>
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}

      {/* ═══ OVERLAY LAYER (non-tournament posts only) ═══ */}
      {activePost && posts.length > 0 && activePost.postType !== 'tournament_result' && (
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
              onJump={(idx) => useMediaStore.getState().setCarouselPosition(activeIndex, idx)}
            />
          )}

          {/* CinematicActionRail — z-40, right side */}
          <CinematicActionRail
            postId={activePost.id}
            likesCount={activeLikeState.count}
            commentsCount={activeCommentCount}
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
              ? () => useMediaStore.getState().setCarouselPosition(activeIndex, currentMediaIndex + 1) 
              : undefined}
            onPrevMedia={activeMediaCount > 1 
              ? () => useMediaStore.getState().setCarouselPosition(activeIndex, currentMediaIndex - 1) 
              : undefined}
            onChevronPositionChange={setChevronY}
          />

          {/* Left chevron — mirrors right chevron Y position for multi-media non-review posts */}
          {currentMediaIndex > 0 && chevronY !== null && (
            <button
              onClick={() => useMediaStore.getState().setCarouselPosition(activeIndex, currentMediaIndex - 1)}
              style={{
                position: 'fixed',
                left: 16,
                top: chevronY - 22,
                zIndex: 40,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Previous media"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

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

          {/* More options sheet */}
          <Drawer open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
            <DrawerContent className="bg-black/95 border-white/10">
              <div className="p-4 space-y-2">
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5" onClick={() => handleReport(activePost)}>
                  <Flag className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white">Report this post</span>
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5" onClick={() => handleNotInterested(activePost)}>
                  <EyeOff className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white">Not interested</span>
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
                  toast.success('Link copied');
                  setMoreOptionsOpen(false);
                }}>
                  <LinkIcon className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white">Copy link</span>
                </button>
              </div>
            </DrawerContent>
          </Drawer>

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
            onCommentPosted={() => handleCommentPosted(activePost)}
            onCommentDeleted={() => activePost && handleCommentDeleted(activePost.id, activePost.commentCount)}
          />
        </>
      )}

      {/* ═══ PAGE-LEVEL SCRUBBER (non-tournament only) ═══ */}
      {activePost?.postType !== 'tournament_result' && isActiveVideo && activeVideoRef && (
        <Scrubber
          videoRef={activeVideoRef}
          videoElement={activeVideoElement}
          isActive={!!activeVideoElement}
          duration={activeVideoElement?.duration ?? null}
          position="fixed"
          bottomNavSelector=".global-bottom-nav"
        />
      )}

      {/* Post Submission Handler */}
      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={handleCloseComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={() => {}}
        onMediaChange={setMediaItems}
      />

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />

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

      {/* Mobile Video Debug Panel */}
      <MobileVideoDebugPanel />
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
