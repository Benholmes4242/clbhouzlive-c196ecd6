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
import { ClubhouseTabProvider, useClubhouseTab } from '@/contexts/ClubhouseTabContext';
// TODO Brief 3: re-wire clubhouseDebug
// TODO Brief 3: re-wire useFullscreenFeed

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

// ── Data hooks (kept from media-system) ──
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/components/media-system/hooks/useFriendsFeed';
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
// TODO Brief 3: re-wire Scrubber

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


const ClubhouseContent = () => {
  // ============================================================================
  // ALL HOOKS MUST BE DECLARED FIRST - before any early returns
  // ============================================================================
  
  const { isRehydrating } = useRehydrationSafe();
  const { pathname } = useLocation();
  
  useEffect(() => {
    logRouteClubhouse();
    // TODO Brief 3: clubhouseDebug.pageMount();
    return () => { /* TODO Brief 3: clubhouseDebug.pageUnmount(); */ };
  }, []);

  // TODO Brief 3: Close fullscreen feed overlay when Clubhouse mounts
  
  useHeaderVariant('glass-dark');
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
    () => activeTab === 'foryou'
      ? injectLiveTournamentCards(activeFeed.posts, livePosts, liveTourSlugs)
      : activeFeed.posts,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFeed.posts, activeTab, livePostIds, liveTourSlugsKey]
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
  
  // ── Media store state (stubbed — will be re-wired in Brief 3) ──
  const activeIndex = 0; // TODO Brief 3: useMediaStore((s) => s.activeIndex);
  const setActiveIndex = (_idx: number) => {}; // TODO Brief 3
  const setCarouselPosition = (_idx: number, _pos: number) => {}; // TODO Brief 3
  const isMuted = true; // TODO Brief 3
  const toggleMute = () => {}; // TODO Brief 3
  
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
  const currentMediaIndex = 0; // TODO Brief 3: from media store
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

  // TODO Brief 3: re-wire activeVideoElement and activeVideoRef from new feed
  
  // ── Is active post own? ──
  const isOwnPost = user?.id === activePost?.userId;
  
  // TODO Brief 3: re-wire useVideoAnalytics

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
  // RENDER — Shell only (Brief 1 nuke). Feed container + video pool removed.
  // Will be rebuilt in Brief 3 with CSS scroll-snap + IntersectionObserver.
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

      {/* ═══ MAIN FEED AREA — PLACEHOLDER (Brief 3 will rebuild) ═══ */}
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
        /* TODO Brief 3: New scroll-snap feed container goes here */
        <div
          className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
          style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 64px)' }}
        >
          <p className="text-lg font-semibold text-white">Feed rebuilding…</p>
          <p className="text-sm text-white/50 mt-2">
            {posts.length} posts loaded — new scroll-snap feed coming in Brief 3
          </p>
        </div>
      ) : null}

      {/* ═══ TOURNAMENT RESULT OVERLAY ═══ */}
      {activePost && posts.length > 0 &&
        (activePost.postType === 'tournament_result' || activePost.postType === 'tournament_live') && (
        <>
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

      {/* ═══ OVERLAY LAYER (non-tournament posts only) — will be re-wired in Brief 3 ═══ */}

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
