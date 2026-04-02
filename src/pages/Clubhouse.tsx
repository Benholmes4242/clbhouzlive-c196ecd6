import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { ProfileCompleteNudge } from '@/components/clubhouse/ProfileCompleteNudge';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { Compass, Flag, EyeOff, Link as LinkIcon, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { ClubhouseTabProvider, useClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';



// ── New feed components ──
import { SnapFeed } from '@/components/feed/SnapFeed';
import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import { useClubhouseStore } from '@/store/clubhouseStore';

// ── Data hooks ──
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/components/media-system/hooks/useFriendsFeed';
import { usePGACard } from '@/components/media-system/hooks/usePGACard';
import { useEditorialCards } from '@/components/media-system/hooks/useEditorialCards';
import { injectPGACard, injectHistoryCard, injectCourseOfWeekCard, injectDebateCard, injectReviewOfWeekCard } from '@/components/media-system/utils/feedAlgorithm';
import type { FeedPost, PGACardFeedPost, HistoryCardFeedPost, CourseOfWeekCardFeedPost, DebateCardFeedPost, ReviewOfWeekCardFeedPost } from '@/components/media-system/types/media';
// buildSuggestedFeed/buildFriendsFeed are called inside the feed hooks — not here

// ── Clubhouse UI overlays ──
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { SuggestedCreatorsShelf } from '@/components/shared/SuggestedCreatorsShelf';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';

import { useActiveActor } from '@/context/ActiveActorContext';
import { getProfilePathById } from '@/lib/profileRoutes';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

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
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </DrawerContent>
  </Drawer>
);


const ClubhouseContent = () => {
  const { isRehydrating } = useRehydrationSafe();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'] });
  }, [queryClient]);
  const { pathname } = useLocation();
  
  useEffect(() => {
    logRouteClubhouse();
  }, []);

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
  
  // ── Store wiring ──
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const carouselPositions = useClubhouseStore(s => s.carouselPositions);
  const currentMediaIndex = carouselPositions.get(activeIndex) ?? 0;
  const isTournamentCardActive = useClubhouseStore(s => s.isTournamentCardActive);





  // ── Hide chrome when PGA card is active ──
  const { setVisible: setBottomNavVisible } = useBottomNavigation();
  useEffect(() => {
    setBottomNavVisible(!isTournamentCardActive);
    return () => { setBottomNavVisible(true); };
  }, [isTournamentCardActive, setBottomNavVisible]);

  // ── Feed hooks ──
  const suggestedFeed = useSuggestedFeed(user?.id);
  const friendsFeed = useFriendsFeed(user?.id);
  const { pgaCard } = usePGACard(user?.id);
  const { historyCard, courseOfWeekCard, debateCard, reviewOfWeekCard } = useEditorialCards(user?.id);
  const activeFeed = activeTab === 'foryou' ? suggestedFeed : friendsFeed;
  
  const posts = useMemo(() => {
    if (activeTab === 'foryou') {
      let feed = injectHistoryCard(activeFeed.posts, historyCard as unknown as FeedPost);   // slot 11
      feed = injectPGACard(feed, pgaCard as unknown as FeedPost);                           // slot 7
      feed = injectCourseOfWeekCard(feed, courseOfWeekCard as unknown as FeedPost);         // slot 3
      feed = injectReviewOfWeekCard(feed, reviewOfWeekCard as unknown as FeedPost);         // slot 14
      // feed = injectDebateCard(feed, debateCard as unknown as FeedPost); // temporarily disabled
      return feed;
    }
    return activeFeed.posts;
  }, [activeFeed.posts, activeTab, pgaCard, historyCard, courseOfWeekCard, debateCard, reviewOfWeekCard]);

  const isLoading = activeFeed.isLoading;
  const hasNextPage = activeFeed.hasNextPage ?? false;
  
  // Skeleton timing
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady,
    resetSkeleton,
  } = useClubhouseSkeletonTiming(!isLoading && posts.length > 0);
  
  // ── Lifecycle ──
  useClubhouseLifecycle();
  
  // ── Active post derivation ──
  const { activePost, golfCourse, activeReview, isActiveReview, isActiveVideo } = useActivePostDerived(posts, activeIndex);
  
  // ── Optimistic like state ──
  const { handleLike, getActiveLikeState, resetLikes } = useClubhouseLikes({ userId: user?.id, activeActor });
  const activeLikeState = getActiveLikeState(activePost);

  // ── Editorial card like count for CommentsSheet ──
  const editorialCardId = ['course_of_week_card', 'history_card', 'debate_card', 'review_of_week_card'].includes(activePost?.postType ?? '')
    ? (activePost?.postType === 'review_of_week_card'
        ? (activePost as any)?.cardData?.editorialCardId
        : (activePost as any)?.cardData?.cardId)
    : null;

  const { data: editorialLikeCount } = useQuery({
    queryKey: ['editorial-card-likes-count', editorialCardId],
    queryFn: async () => {
      if (!editorialCardId) return 0;
      const { count } = await supabase
        .from('editorial_card_likes')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', editorialCardId);
      return count ?? 0;
    },
    enabled: !!editorialCardId,
    staleTime: 0,
  });
  
  // ── Optimistic follow state ──
  const { followOverrides, handleFollow, handleFollowChange, getFollowState, resetFollows } = useClubhouseFollows({ userId: user?.id });
  const isActivePostFollowed = getFollowState(activePost);
  
  // ── Comments state ──
  const { commentsOpen, overlayVisible, openComments, closeComments, handleCommentPosted, handleCommentDeleted, getCommentCount, resetComments } = useClubhouseComments();
  const activeCommentCount = getCommentCount(activePost);
  
  // ── Share / Report / Not Interested ──
  const { moreOptionsOpen, setMoreOptionsOpen, handleShare, handleReport, handleNotInterested } = useClubhouseShare(user?.id);
  
  // ── Feed navigation ──
  const { handleNearEnd, handleRefresh } = useClubhouseFeedNav({
    activeTab,
    activeFeed,
    onTabSwitch: () => { resetFollows(); resetComments(); },
  });
  
  // ── Carousel media index ──
  const activeMediaCount = activePost?.mediaItems?.length ?? 0;
  
  // ── Navigation to profile ──
  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    navigate(getProfilePathById(activePost.userId));
  }, [activePost, navigate]);

  // Season Recap Modal
  const { data: seasonRecap } = useSeasonRecap(user?.id);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);

  useEffect(() => {
    if (seasonRecap) {
      setShowRecapModal(true);
    }
  }, [seasonRecap]);
  
  const isOwnPost = user?.id === activePost?.userId;

  // ── Review tap handler ──
  const handleReviewTap = useCallback(() => {
    if (!activeReview) return;
    setReviewSheetOpen(true);
  }, [activeReview]);

  const showRehydrationSkeleton = isRehydrating;

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
      {/* Skeleton Shimmer */}
      <ClubhouseSkeletonShimmer 
        isVisible={skeletonVisible} 
        isStatic={skeletonMode === 'static'} 
      />

      {/* Floating top bar — hidden when PGA card active */}
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
        carouselCount={posts[activeIndex]?.mediaItems?.length ?? 0}
        carouselIndex={currentMediaIndex}
        hidden={isTournamentCardActive}
      />

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

      {/* Profile completeness nudge — new users only, first 7 days */}
      <ProfileCompleteNudge />

      {/* Rehydration skeleton */}
      <ClubhouseSkeletonShimmer isVisible={showRehydrationSkeleton} isStatic={false} />

      {/* ═══ MAIN FEED AREA ═══ */}
      {!isLoading && posts.length === 0 ? (
        activeTab === 'friends' ? (
          <div
            className="flex flex-col w-full"
            style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 72px)' }}
          >
            <div className="flex flex-col items-center px-8 text-center pb-6">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white/30" />
              </div>
              <p className="text-[17px] font-semibold text-white mb-1">
                No posts from friends yet
              </p>
              <p className="text-[13px] text-white/50 leading-relaxed">
                Follow golfers below to start building your feed
              </p>
            </div>
            <SuggestedCreatorsShelf
              userId={user?.id}
              variant="dark"
              title="Golfers to follow"
              showViewAll={true}
              onViewAll={() => navigate('/golfers')}
            />
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
            style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 64px)' }}
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Compass className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-lg font-semibold text-white">No posts to show</p>
            <p className="text-sm text-white/50 mt-2">Check back soon for new content</p>
          </div>
        )
      ) : posts.length > 0 ? (
        <>
          <SnapFeed
            posts={posts}
            activeTab={activeTab}
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

          {/* Overlay layer — action rail, creator capsule, scrubber, dots */}
          <FeedOverlayLayer
            posts={posts}
            onLike={handleLike}
            onComment={openComments}
            onShare={handleShare}
            onMore={() => setMoreOptionsOpen(true)}
            getLikeState={getActiveLikeState}
            getCommentCount={getCommentCount}
            getFollowState={getFollowState}
            onFollow={handleFollow}
            onViewProfile={handleViewProfile}
            onReviewTap={handleReviewTap}
            overlayVisible={overlayVisible}
            isOwnPost={isOwnPost}
            golfCourse={golfCourse}
            activeReview={activeReview}
            isActiveReview={isActiveReview}
          />
        </>
      ) : null}

      {/* ═══ COMMENTS + MORE OPTIONS ═══ */}
      {activePost && posts.length > 0 && (
        <>
          <CommentsSheet
            isOpen={commentsOpen}
            onClose={closeComments}
            postId={
              activePost.postType === 'pga_card'
                ? (activePost as unknown as PGACardFeedPost).cardData.postId
                : activePost.postType === 'history_card'
                ? (activePost as any).cardData.cardId
                : activePost.postType === 'course_of_week_card'
                ? (activePost as any).cardData.cardId
                : activePost.postType === 'debate_card'
                ? (activePost as any).cardData.cardId
                : activePost.postType === 'review_of_week_card'
                ? (activePost as any).cardData.editorialCardId
                : activePost.id
            }
            currentUserId={user?.id}
            creatorUserId={activePost.userId}
            creatorName={
              ['pga_card', 'history_card', 'course_of_week_card', 'debate_card', 'review_of_week_card'].includes(activePost.postType ?? '')
                ? 'Clbhouz'
                : activePost.displayName
            }
            creatorAvatar={activePost.avatarUrl}
            caption={activePost.caption}
            theme="dark"
            likesCount={
              ['course_of_week_card', 'history_card', 'debate_card', 'review_of_week_card'].includes(activePost.postType ?? '')
                ? (editorialLikeCount ?? 0)
                : activeLikeState?.count ?? null
            }
            likeSource={
              ['course_of_week_card', 'history_card', 'debate_card', 'review_of_week_card'].includes(activePost.postType ?? '')
                ? 'editorial'
                : 'post'
            }
            editorialCardId={
              activePost.postType === 'review_of_week_card'
                ? (activePost as any).cardData.editorialCardId
                : ['course_of_week_card', 'history_card', 'debate_card'].includes(activePost.postType ?? '')
                ? (activePost as any).cardData.cardId
                : undefined
            }
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

      {/* Review Bottom Sheet */}
      <ReviewBottomSheet
        isOpen={reviewSheetOpen}
        onClose={() => setReviewSheetOpen(false)}
        user={{
          id: activePost?.userId ?? '',
          name: activePost?.displayName ?? '',
          username: activePost?.username,
          avatar: activePost?.avatarUrl,
        }}
        courseId={activeReview?.courseId ?? ''}
        courseName={activeReview?.courseName ?? ''}
        rating={activeReview?.rating ?? 0}
        reviewId={activeReview?.reviewId}
        courseCountry={activeReview?.courseCountry}
        courseRegion={activeReview?.courseRegion}
        courseSubCountry={activeReview?.courseSubCountry}
        reviewText={activeReview?.reviewText}
      />
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
