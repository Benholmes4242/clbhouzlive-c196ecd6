import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { ChevronDown, Film } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreOptionsDrawer } from '@/components/clubhouse/MoreOptionsDrawer';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useProfilePosts } from './hooks/useProfilePosts';
import { PostsFeedSkeleton } from './PostsFeedSkeleton';
import { A } from '@/features/courses/components/holes/analytical/tokens';

import type { FeedPost } from '@/components/media-system/types/media';
import { LightCardFeed } from './LightCardFeed';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useFullscreenFeedStore, useIsViewerOwnedBy } from '@/store/fullscreenFeedStore';

import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';

import { getActorRouteByType } from '@/types/actor';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import { usePendingPostsForActor } from '@/uploads/usePendingPostsForActor';
import { PendingPostCard } from './PendingPostCard';
import { usePostCourseContext, resolvePostCourseId } from '@/hooks/feed/usePostCourseContext';
import { usePostScoreIds, usePostRounds } from '@/hooks/feed/usePostRounds';
import { useRoundChainGate } from '@/hooks/feed/useRoundChainGate';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

type PostsFilter = 'all' | 'videos' | 'shorts' | 'images' | 'reviews';

const LONGFORM_THRESHOLD = 180;

const FILTER_OPTIONS: { value: PostsFilter; label: string }[] = [
  { value: 'all', label: 'All Posts' },
  { value: 'videos', label: 'Videos' },
  { value: 'shorts', label: 'Clips' },
  { value: 'images', label: 'Images' },
  { value: 'reviews', label: 'Reviews' },
];

interface PostsTabContentProps {
  actorType: 'personal' | 'business';
  actorId: string;
  isOwnProfile?: boolean;
  businessName?: string;
}

const PostsTabContent: React.FC<PostsTabContentProps> = ({
  actorType,
  actorId,
  isOwnProfile = false,
  businessName,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const [activeFilter, setActiveFilter] = useState<PostsFilter>('all');

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useProfilePosts({
    userId: user?.id,
    actorType,
    actorId,
  });

  const realPostIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const pendingEntries = usePendingPostsForActor({
    authorActorType: actorType,
    authorActorId: actorId,
    viewerActorType: (activeActor?.type === 'business' ? 'business' : 'personal'),
    viewerActorId: activeActor?.id ?? user?.id ?? '',
    realPostIds,
  });

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    return posts.filter(post => {
      const firstMedia = post.mediaItems?.[0];
      switch (activeFilter) {
        case 'reviews':
          return post.isReview && !!post.review;
        case 'videos':
          return firstMedia?.type === 'video' && (firstMedia?.duration ?? 0) > LONGFORM_THRESHOLD;
        case 'shorts':
          return firstMedia?.type === 'video' && (firstMedia?.duration ?? 0) > 0 && (firstMedia?.duration ?? 0) <= LONGFORM_THRESHOLD;
        case 'images':
          return firstMedia?.type === 'image';
        default:
          return true;
      }
    });
  }, [posts, activeFilter]);

  // ── Batched enrichment (parity with Clubhouse.tsx) ──
  // ONE course-context call and TWO round calls for the whole visible page.
  // Never per card: the cards read from these maps.
  /**
   * Batch-idiom scope (src/lib/queryKeys.ts): whose posts these are and which
   * filter is on. Never the loaded post ids.
   */
  const feedScope = `profile:${actorType}:${actorId}:${activeFilter}`;

  const feedCourseIds = useMemo(
    () => filteredPosts.map((p) => resolvePostCourseId(p)).filter((id): id is string => !!id),
    [filteredPosts],
  );
  const courseContextMap = usePostCourseContext(feedCourseIds, feedScope);

  const feedPostIds = useMemo(() => filteredPosts.map((p) => p.id), [filteredPosts]);
  const postScoreIdMap = usePostScoreIds(feedPostIds, feedScope);
  const feedScoreIds = useMemo(() => Array.from(postScoreIdMap.values()), [postScoreIdMap]);
  const postRoundMap = usePostRounds(feedScoreIds, feedScope);
  const roundChainSettled = postScoreIdMap.settled && postRoundMap.settled;
  const roundChainFetching = postScoreIdMap.fetching || postRoundMap.fetching;
  const roundsReady = useRoundChainGate(roundChainSettled, !isLoading && posts.length > 0);

  const [roundSheet, setRoundSheet] = useState<{ scoreId: string; userId: string } | null>(null);

  // ── Active post derivation (shared store, same as Clubhouse) ──
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const { activePost } = useActivePostDerived(filteredPosts, activeIndex);

  // ── Shared feed-action hooks (single source of truth with Clubhouse) ──
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId: user?.id, activeActor });
  const { handleFollow, getFollowState } = useClubhouseFollows({ userId: user?.id });
  const {
    commentsOpen,
    openComments,
    closeComments,
    getCommentCount,
  } = useClubhouseComments(activeActor);

  // Profile hosts don't drive activeIndex from a scroll-snap feed reliably, so
  // remember the exact post the user tapped for the CommentsSheet. Without this
  // the sheet would gate on `activePost` which can flip to null mid-open (the
  // sheet appeared to "start opening then dismiss" on personal + business profiles).
  const [selectedCommentPost, setSelectedCommentPost] = useState<FeedPost | null>(null);
  // Match the Clubhouse feed's delayed sheet mount. Profile footer buttons fire
  // from Pressable's pointer-up handler; mounting the portal/backdrop in that
  // same event lets the browser's follow-up click land on the new backdrop and
  // immediately close the sheet. Deferring the mount until the open state has
  // committed prevents that click-through while keeping the exit animation.
  const [commentsMounted, setCommentsMounted] = useState(false);
  const openCommentsForPost = useCallback((post: FeedPost) => {
    setSelectedCommentPost(post);
    openComments(post);
  }, [openComments]);
  useEffect(() => {
    if (commentsOpen) {
      setCommentsMounted(true);
      return;
    }

    const t = setTimeout(() => {
      setCommentsMounted(false);
      setSelectedCommentPost(null);
    }, 500);
    return () => clearTimeout(t);
  }, [commentsOpen]);
  const { moreOptionsOpen, setMoreOptionsOpen, handleShare, handleReport, handleNotInterested } =
    useClubhouseShare(user?.id);

  const activeLikeState = getActiveLikeState(activePost);

  // ── Review sheet ──
  const openReviewSheet = useReviewSheetStore((s) => s.open);
  const { data: reviewerStats } = useReviewerStats(activePost?.userId);

  const handleReviewTap = useCallback((post: FeedPost) => {
    const review = post.review;
    if (!review) return;
    const isActiveTapped = activePost?.id === post.id;
    openReviewSheet({
      user: {
        id: post.userId ?? '',
        name: post.displayName ?? '',
        username: post.username,
        avatar: post.avatarUrl,
      },
      courseId: review.courseId ?? '',
      courseName: review.courseName ?? '',
      rating: review.rating ?? 0,
      reviewId: review.reviewId,
      courseCountry: review.courseCountry,
      courseRegion: review.courseRegion,
      courseSubCountry: review.courseSubCountry,
      reviewText: review.reviewText,
      breakdown: review.breakdown ?? null,
      reviewerStats: isActiveTapped ? (reviewerStats ?? null) : null,
    });
  }, [activePost, openReviewSheet, reviewerStats]);

  // Infinite-load
  const handleNearEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Mirror pagination state into the fullscreen store while the viewer is
  // open, so swipes past the initially-loaded set can trigger more loads.
  const isViewerOwnedHere = useIsViewerOwnedBy('posts-tab');
  const setPaginationState = useFullscreenFeedStore(s => s.setPaginationState);
  useEffect(() => {
    if (!isViewerOwnedHere) return;
    setPaginationState({
      hasNextPage: hasNextPage ?? false,
      isFetchingNextPage: isFetchingNextPage ?? false,
    });
  }, [isViewerOwnedHere, hasNextPage, isFetchingNextPage, setPaginationState]);

  // Append newly-loaded posts (already grouped at the hook) into the open
  // viewer as growth occurs. Store dedupes by post id.
  useEffect(() => {
    if (!isViewerOwnedHere) return;
    useFullscreenFeedStore.getState().appendPosts(filteredPosts);
  }, [isViewerOwnedHere, filteredPosts]);



  const currentFilterLabel = FILTER_OPTIONS.find(o => o.value === activeFilter)?.label || 'All Posts';

  // ── Loading / error / empty states ──
  // Same fault, same fix as Clubhouse: hold the skeleton while the chained
  // round queries are outstanding, capped, and not at all when no post on the
  // page carries a round.
  if (posts.length === 0 ? isLoading : !roundsReady) {
    return <PostsFeedSkeleton />;
  }

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load posts</p>
        <p className="text-xs text-muted-foreground">Please check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="h-11 px-5 rounded-full text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 active:scale-[0.97] transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  const isBusiness = actorType === 'business';
  const emptyCopy = (() => {
    if (activeFilter !== 'all') return null;
    if (isBusiness) {
      return isOwnProfile
        ? 'Share news, offers, and course updates with your followers.'
        : `${businessName || 'This business'} hasn't posted yet. Follow to see their updates first.`;
    }
    return isOwnProfile ? 'Share your first moment on the course' : null;
  })();

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Film className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {activeFilter === 'all' ? 'No posts yet' : 'No posts match this filter'}
      </p>
      {emptyCopy && (
        <p className="text-xs text-muted-foreground max-w-[280px]">{emptyCopy}</p>
      )}
    </div>
  );

  return (
    <div>
      {/* Filter dropdown */}
      {posts.length > 0 && (
        <div className="flex justify-end px-4 pt-1 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium min-h-[36px] whitespace-nowrap shrink-0"
                style={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, color: A.INK }}
              >
                {currentFilterLabel}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {FILTER_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={cn(
                    'text-sm',
                    activeFilter === opt.value && 'font-semibold'
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Optimistic pending posts (author + viewer matched) */}
      {isOwnProfile && pendingEntries.length > 0 && (
        <div>
          {pendingEntries.map((p) => (
            <PendingPostCard key={p.jobId} entry={p} />
          ))}
        </div>
      )}

      {filteredPosts.length === 0 && pendingEntries.length === 0 ? (
        emptyState
      ) : filteredPosts.length === 0 ? null : (
        <LightCardFeed
          posts={filteredPosts}
          
          topPadding={0}
          bottomPadding={32}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onNearEnd={handleNearEnd}
          onLike={(post) => handleLike(post)}
          onComment={openCommentsForPost}
          onShare={(post) => handleShare(post)}
          onProfile={(post) => navigate(getActorRouteByType(post.actorType, post.actorId), { state: post.actorType === 'business' ? { source: 'content' } : undefined })}
          onCourse={(post) => post.courseId && navigate(`/courses/${post.courseId}`)}
          onReviewTap={(post) => handleReviewTap(post)}
          getLikeState={(post) => {
            const s = getActiveLikeState(post);
            if (!s) return null;
            return { liked: s.isLiked, count: s.count ?? post.likeCount ?? 0 };
          }}
          getCommentCount={(post) => getCommentCount(post)}
          onFollow={handleFollow}
          currentUserId={user?.id}
          courseContextMap={courseContextMap}
          resolveCourseId={resolvePostCourseId}
          postScoreIdMap={postScoreIdMap}
          postRoundMap={postRoundMap}
          postRoundsSettled={roundChainSettled && !roundChainFetching}
          onRoundTap={(post, round) =>
            setRoundSheet({ scoreId: round.whsScoreId, userId: post.userId })
          }
        />
      )}

      {isFetchingNextPage && (
        <div
          className="overflow-hidden"
          style={{ background: A.PANEL, borderTop: `0.5px solid ${A.BORDER}`, borderBottom: `0.5px solid ${A.BORDER}` }}
        >
          <Skeleton variant="dark" className="w-full rounded-none" style={{ aspectRatio: '4 / 5' }} />
        </div>
      )}

      {/* Attached-round drill-in (parity with Clubhouse) */}
      {roundSheet && (
        <RoundDetailSheet
          open
          onClose={() => setRoundSheet(null)}
          scoreId={roundSheet.scoreId}
          profileUserId={roundSheet.userId}
        />
      )}

      {/* ═══ COMMENTS + MORE OPTIONS overlays ═══ */}
      {selectedCommentPost && commentsMounted && (
        <CommentsSheetV2
          isOpen={commentsOpen}
          onClose={closeComments}
          targetType="post"
          targetId={selectedCommentPost.id}
        />
      )}

      {activePost && filteredPosts.length > 0 && (
        <MoreOptionsDrawer
          open={moreOptionsOpen}
          onOpenChange={setMoreOptionsOpen}
          post={activePost}
          currentUserId={user?.id}
          onReport={() => handleReport(activePost)}
          onNotInterested={() => handleNotInterested(activePost)}
          onCopyLink={() => {
            navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
            toast.success('Link copied');
            setMoreOptionsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default PostsTabContent;
