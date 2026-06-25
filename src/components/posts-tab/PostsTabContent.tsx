import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronDown, Film, Flag, EyeOff, Link as LinkIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useProfilePosts } from './hooks/useProfilePosts';
import { PostsFeedSkeleton } from './PostsFeedSkeleton';

import type { FeedPost } from '@/components/media-system/types/media';
import { LightCardFeed } from './LightCardFeed';
import { useClubhouseStore } from '@/store/clubhouseStore';

import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import CommentsSheet from '@/components/comments/CommentsSheet';

import { getActorRouteByType } from '@/types/actor';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';

type PostsFilter = 'all' | 'videos' | 'shorts' | 'images' | 'reviews';

const LONGFORM_THRESHOLD = 180;

const FILTER_OPTIONS: { value: PostsFilter; label: string }[] = [
  { value: 'all', label: 'All Posts' },
  { value: 'videos', label: 'Videos' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'images', label: 'Images' },
  { value: 'reviews', label: 'Reviews' },
];

interface PostsTabContentProps {
  actorType: 'personal' | 'business';
  actorId: string;
  isOwnProfile?: boolean;
}

const PostsTabContent: React.FC<PostsTabContentProps> = ({
  actorType,
  actorId,
  isOwnProfile = false,
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
    handleCommentPosted,
    handleCommentDeleted,
    getCommentCount,
  } = useClubhouseComments();
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

  const currentFilterLabel = FILTER_OPTIONS.find(o => o.value === activeFilter)?.label || 'All Posts';

  // ── Loading / error / empty states ──
  if (isLoading && posts.length === 0) {
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

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Film className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {activeFilter === 'all' ? 'No posts yet' : 'No posts match this filter'}
      </p>
      {isOwnProfile && activeFilter === 'all' && (
        <p className="text-xs text-muted-foreground">Share your first moment on the course</p>
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
                style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
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

      {filteredPosts.length === 0 ? (
        emptyState
      ) : (
        <CardFeed
          posts={filteredPosts}
          useWindowScroll
          topPadding={0}
          bottomPadding={32}
          hasNextPage={hasNextPage}
          onNearEnd={handleNearEnd}
          onLike={(post) => handleLike(post)}
          onComment={openComments}
          onShare={(post) => handleShare(post)}
          onProfile={(post) => navigate(getActorRouteByType(post.actorType, post.actorId))}
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
        />
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ═══ COMMENTS + MORE OPTIONS overlays ═══ */}
      {activePost && filteredPosts.length > 0 && (
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
            theme="light"
            likesCount={activeLikeState?.count ?? null}
            likeSource="post"
            onCommentPosted={() => handleCommentPosted(activePost)}
            onCommentDeleted={() => handleCommentDeleted(activePost.id, activePost.commentCount)}
          />
          <Drawer open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
            <DrawerContent
              className="rounded-t-[20px]"
              style={{ background: '#F8FAFC', border: 'none' }}
            >
              <div style={{ padding: '4px 0 0' }}>
                <button
                  onClick={() => handleReport(activePost)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Flag className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                  <span style={{ fontSize: 15, color: '#0F172A', fontWeight: 500 }}>Report this post</span>
                </button>
                <button
                  onClick={() => handleNotInterested(activePost)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <EyeOff className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                  <span style={{ fontSize: 15, color: '#0F172A', fontWeight: 500 }}>Not interested</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
                    toast.success('Link copied');
                    setMoreOptionsOpen(false);
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <LinkIcon className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                  <span style={{ fontSize: 15, color: '#0F172A', fontWeight: 500 }}>Copy link</span>
                </button>
              </div>
              <div className="h-[env(safe-area-inset-bottom,0px)]" style={{ minHeight: 16 }} />
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  );
};

export default PostsTabContent;
