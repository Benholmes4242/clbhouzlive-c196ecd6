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

        {/* 1. MEDIA — leads the card, full width, variable aspect ratio */}
        <button
          type="button"
          data-media-wrapper
          aria-label={`Open post by ${post.displayName}`}
          className={`relative w-full ${aspectClass} bg-muted block`}
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

          {/* Duration badge — bottom right, videos only */}
          {isVideo && duration > 0 && (
            <span
              className="absolute bottom-2 right-2 z-10 text-[12px] font-semibold text-white"
              style={{
                background: 'rgba(0,0,0,0.72)',
                borderRadius: 5,
                padding: '3px 7px',
              }}
            >
              {formatVideoDuration(duration)}
            </span>
          )}

          {/* Review rating badge — top right */}
          {post.isReview && post.review?.rating && (
            <div
              className="absolute top-2 right-2 z-10 flex items-center gap-0.5"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                borderRadius: 6,
                padding: '3px 7px',
                border: '0.5px solid rgba(255,255,255,0.15)',
              }}
            >
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-[12px] font-semibold text-white">
                {post.review.rating.toFixed(1)}
              </span>
            </div>
          )}
        </button>

        {/* 2. CREATOR ROW — compact, sits directly below media */}
        <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-0">
          <button
            onClick={() => navigate(`/profile/${post.userId}`)}
            className="shrink-0"
            aria-label={`View ${post.displayName}'s profile`}
          >
            <SquircleAvatar
              src={post.avatarUrl || '/placeholder.svg'}
              size="sm"
              hideRing
            />
          </button>
          <button
            onClick={() => navigate(`/profile/${post.userId}`)}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[13px] font-semibold text-foreground truncate">
                {post.displayName}
              </span>
              {post.isVerified && (
                <svg className="h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-[12px] text-muted-foreground shrink-0">· {timeAgo}</span>
            </div>
            {/* Amber course attribution — inline below name row */}
            {courseName && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (courseId) {
                    navigate(`/courses/${courseId}`);
                  } else if (courseName) {
                    try {
                      const { data } = await supabase
                        .from('golf_courses')
                        .select('id')
                        .ilike('name', courseName.trim())
                        .limit(1)
                        .single();
                      if (data?.id) {
                        navigate(`/courses/${data.id}`);
                      } else {
                        navigate(`/courses?search=${encodeURIComponent(courseName)}`);
                      }
                    } catch {
                      navigate(`/courses?search=${encodeURIComponent(courseName)}`);
                    }
                  }
                }}
                className="flex items-center gap-0.5 mt-0.5"
              >
                <MapPin className="h-3 w-3 shrink-0" style={{ color: '#F7931E' }} />
                <span
                  className="text-[11px] font-medium truncate"
                  style={{ color: '#F7931E' }}
                >
                  at {courseName}
                </span>
              </button>
            )}
          </button>
          {/* 3-dot menu */}
          <FriendsCardMenu
            postId={post.id}
            userId={userId}
            onShare={handleShare}
          />
        </div>

        {/* 3. CAPTION — two lines max, truncated */}
        {cleanCaption && (
          <div className="px-3 pt-1.5 pb-0">
            <PostContentWithTags
              content={cleanCaption}
              tags={post.tags || []}
              className="text-[13px] text-foreground line-clamp-2"
            />
          </div>
        )}

        {/* 4. ENGAGEMENT ROW */}
        <div className="flex items-center gap-5 px-3 pt-2 pb-2.5">
          <button
            onClick={toggleLike}
            aria-label={`${isLiked ? 'Unlike' : 'Like'} post`}
            className="flex items-center gap-1.5 min-h-[40px]"
          >
            <Heart
              className={`h-[17px] w-[17px] transition-colors ${isLiked ? 'fill-like text-like' : 'text-muted-foreground'}`}
            />
            <span className={`text-[13px] ${isLiked ? 'text-like' : 'text-muted-foreground'}`}>
              {formatCompact(likeCount)}
            </span>
          </button>
          <button
            onClick={() => setShowComments(true)}
            aria-label="Open comments"
            className="flex items-center gap-1.5 text-muted-foreground min-h-[40px]"
          >
            <MessageCircle className="h-[17px] w-[17px]" />
            <span className="text-[13px]">{formatCompact(post.commentCount)}</span>
          </button>
          <button
            onClick={handleShare}
            aria-label="Share post"
            className="flex items-center gap-1.5 text-muted-foreground min-h-[40px]"
          >
            <Share2 className="h-[17px] w-[17px]" />
            <span className="text-[13px]">{formatCompact(post.shareCount)}</span>
          </button>

          {/* "I've played here" button — pushed right, shows when course is known */}
          {courseName && courseId && (
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="ml-auto flex items-center gap-1.5 active:scale-[0.97] transition-transform"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#006747',
                background: 'rgba(0,103,71,0.09)',
                border: '1px solid rgba(0,103,71,0.25)',
                borderRadius: 20,
                padding: '5px 12px',
                letterSpacing: '0.01em',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              I've played here
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
