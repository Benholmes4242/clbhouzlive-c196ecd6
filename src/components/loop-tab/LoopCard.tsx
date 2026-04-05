import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, MapPin, Star } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { supabase } from '@/integrations/supabase/client';
import { removeGolfCourseFromContent, extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { toast } from 'sonner';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FriendsCardMenu } from '@/components/friends-tab/FriendsCardMenu';
import PostContentWithTags from '@/components/posts/PostContentWithTags';

interface LoopCardProps {
  post: FeedPost;
  userId?: string;
  cardIndex?: number;
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatVideoDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

function getMediaAspectClass(post: FeedPost): string {
  const first = post.mediaItems[0];
  if (!first || !first.width || !first.height) return 'aspect-video';
  if (first.width > first.height) return 'aspect-video';
  if (first.height > first.width) return 'aspect-[4/5]';
  return 'aspect-video';
}

export const LoopCard = React.memo(function LoopCard({
  post,
  userId,
  cardIndex = 0,
  allPosts,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: LoopCardProps) {
  const navigate = useNavigate();
  const firstMedia = post.mediaItems[0];
  const isVideo = firstMedia?.type === 'video';
  const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.imageUrl || '';
  const duration = firstMedia?.duration || 0;
  const hlsUrl = firstMedia?.hlsUrl;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const aspectClass = getMediaAspectClass(post);
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO Brief 3: onViewPreload
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl]);

  const [expanded, setExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);

  const cleanCaption = useMemo(() => removeGolfCourseFromContent(post.caption), [post.caption]);
  const extractedCourse = useMemo(() => extractGolfCourseFromContent(post.caption), [post.caption]);

  const courseName = post.review?.courseName || post.courseName || extractedCourse?.name;
  const courseId = post.review?.courseId;

  const toggleLike = async () => {
    if (!userId) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    navigator?.vibrate?.(10);

    try {
      if (newLiked) {
        const { error } = await supabase
          .from('post_likes')
          .upsert(
            { post_id: post.id, user_id: userId, actor_id: userId, actor_type: 'personal' },
            { onConflict: 'post_id,actor_type,actor_id', ignoreDuplicates: true }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('actor_id', userId)
          .eq('actor_type', 'personal');
        if (error) throw error;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[LoopCard] Like toggle failed:', err);
      setIsLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption || 'Check out this post', url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    }
  };

  return (
    <>
      <article ref={tileRef} className="bg-card overflow-hidden border-b border-border/50">
        {/* Creator header */}
        <div className="flex items-center gap-3 px-3 pt-3 pb-2">
          <button
            onClick={() => navigate(`/profile/${post.userId}`)}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <SquircleAvatar src={post.avatarUrl || '/placeholder.svg'} size="sm" hideRing />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-foreground truncate">
                  {post.displayName}
                </span>
                {post.isVerified && (
                  <svg
                    className="h-3.5 w-3.5 text-primary shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              {/* Addition 1: "at Course Name" attribution */}
              {courseName && (
                <div
                  className="flex items-center gap-1 mt-0.5"
                  style={{ fontSize: 12, color: '#F7931E', fontWeight: 500 }}
                >
                  <MapPin className="w-3 h-3" style={{ color: '#F7931E' }} />
                  <span className="truncate">at {courseName}</span>
                </div>
              )}
            </div>
          </button>
          <FriendsCardMenu postId={post.id} userId={userId} onShare={handleShare} />
        </div>

        {/* Caption */}
        {cleanCaption && (
          <div className="px-3 pb-2">
            <PostContentWithTags
              content={cleanCaption}
              tags={post.tags || []}
              className={`text-sm text-foreground ${expanded ? '' : 'line-clamp-2'}`}
            />
            {!expanded && cleanCaption.length > 100 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs font-semibold text-muted-foreground mt-0.5"
              >
                See more
              </button>
            )}
            {expanded && cleanCaption.length > 100 && (
              <button
                onClick={() => setExpanded(false)}
                className="text-xs font-semibold text-muted-foreground mt-0.5"
              >
                less
              </button>
            )}
          </div>
        )}

        {/* Media area — dynamic aspect ratio */}
        <button
          type="button"
          data-media-wrapper
          aria-label={`Play post by ${post.displayName}`}
          className={`relative w-full ${aspectClass} bg-muted`}
          onClick={() => {
            if (allPosts && cardIndex != null) {
              useFullscreenFeedStore.getState().open(allPosts, cardIndex);
            }
          }}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {isVideo && duration > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium rounded bg-black/60 text-white backdrop-blur-sm z-10">
              {formatVideoDuration(duration)}
            </span>
          )}
          {post.isReview && post.review?.rating && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm z-10">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-white">
                {post.review.rating.toFixed(1)}
              </span>
            </div>
          )}
        </button>

        {/* Engagement row */}
        <div className="flex items-center" style={{ gap: 14, padding: '8px 14px 12px' }}>
          <button
            onClick={toggleLike}
            aria-label={`${isLiked ? 'Unlike' : 'Like'} post`}
            className="flex items-center gap-1 text-xs min-h-[44px]"
          >
            <Heart
              className={`h-[18px] w-[18px] transition-colors ${isLiked ? 'fill-like text-like' : 'text-muted-foreground'}`}
            />
            <span className={isLiked ? 'text-like' : 'text-muted-foreground'}>
              {formatCompact(likeCount)}
            </span>
          </button>
          <button
            onClick={() => setShowComments(true)}
            aria-label="Open comments"
            className="flex items-center gap-1 text-xs text-muted-foreground min-h-[44px]"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {formatCompact(post.commentCount)}
          </button>
          <button
            onClick={handleShare}
            aria-label="Share post"
            className="flex items-center gap-1 text-xs text-muted-foreground min-h-[44px]"
          >
            <Share2 className="h-[18px] w-[18px]" />
            {formatCompact(post.shareCount)}
          </button>

          {/* Addition 2: "I've played there" button */}
          {courseName && courseId && (
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="ml-auto flex items-center gap-1 active:scale-[0.97] transition-transform"
              style={{
                fontSize: 12,
                color: '#006747',
                fontWeight: 500,
                background: 'rgba(0,103,71,0.08)',
                border: '0.5px solid rgba(0,103,71,0.3)',
                borderRadius: 20,
                padding: '4px 10px',
              }}
              aria-label={`I've played ${courseName}`}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="#006747">
                <path d="M5.5 1a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm0 6.5C3.2 7.5 1 8.5 1 9.5h9c0-1-2.2-2-4.5-2z" />
              </svg>
              I've played there
            </button>
          )}
        </div>
      </article>

      {/* Comments bottom sheet */}
      <CommentsSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        currentUserId={userId}
        creatorName={post.displayName}
        creatorAvatar={post.avatarUrl}
        creatorUserId={post.userId}
        caption={post.caption}
        videoThumbnail={thumbnailUrl}
        theme="light"
        likesCount={likeCount}
        courseId={post.review?.courseId}
        courseName={post.review?.courseName}
        isReview={post.isReview}
        reviewRating={post.review?.rating}
      />
    </>
  );
});
