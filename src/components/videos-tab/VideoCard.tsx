import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VideoCardMenu } from './VideoCardMenu';
import { removeGolfCourseFromContent, extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import PostContentWithTags from '@/components/posts/PostContentWithTags';

interface VideoCardProps {
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

export const VideoCard = React.memo(function VideoCard({ post, userId, cardIndex = 0, allPosts, fetchNextPage, hasNextPage, isFetchingNextPage }: VideoCardProps) {
  const navigate = useNavigate();
  const firstVideo = post.mediaItems.find(m => m.type === 'video');
  const thumbnailUrl = firstVideo?.thumbnailUrl || '';
  const hlsUrl = firstVideo?.hlsUrl || '';
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
  const duration = firstVideo?.duration || 0;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);

  const cleanedCaption = useMemo(() => removeGolfCourseFromContent(post.caption), [post.caption]);
  const extractedCourse = useMemo(() => extractGolfCourseFromContent(post.caption), [post.caption]);
  const courseNameToShow = post.review?.courseName || post.courseName || extractedCourse?.name || null;
  const courseIdToShow = post.review?.courseId || post.courseId || null;

  const { open } = useFullscreenFeedStore();

  const handleTap = () => {
    open(allPosts ?? [post], cardIndex);
  };

  const toggleLike = async () => {
    if (!userId) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    navigator?.vibrate?.(10);

    try {
      if (newLiked) {
        const { error } = await supabase.from('post_likes').upsert(
          { post_id: post.id, user_id: userId, actor_id: userId, actor_type: 'personal' },
          { onConflict: 'post_id,actor_type,actor_id', ignoreDuplicates: true }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').delete()
          .eq('post_id', post.id)
          .eq('actor_id', userId)
          .eq('actor_type', 'personal');
        if (error) throw error;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[VideoCard] Like toggle failed:', err);
      setIsLiked(!newLiked);
      setLikeCount(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/video/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption || 'Check out this video', url: shareUrl });
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
        {/* 1. Thumbnail — full width, leads the card */}
        <button
          data-media-wrapper
          className="relative w-full aspect-video bg-muted cursor-pointer"
          onClick={handleTap}
          aria-label={`Play video by ${post.displayName}`}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {duration > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-medium rounded bg-black/70 text-white backdrop-blur-sm z-10">
              {formatVideoDuration(duration)}
            </span>
          )}
        </button>

        {/* 2. Creator row — compact, beneath thumbnail */}
        <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
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
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-foreground truncate">
                {post.displayName}
              </span>
              {post.isVerified && (
                <svg className="h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-muted-foreground">· {timeAgo}</span>
            </div>
          </button>
          <VideoCardMenu
            postId={post.id}
            userId={userId}
            onShare={handleShare}
          />
        </div>

        {/* 3. Caption — single line, truncated */}
        {cleanedCaption && (
          <div className="px-3 pb-1.5">
            <PostContentWithTags
              content={cleanedCaption}
              tags={post.tags || []}
              className="text-[13px] text-foreground line-clamp-1"
            />
          </div>
        )}

        {/* 4. Course tag */}
        {courseNameToShow && (
          <div className="px-3 pb-1.5">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (courseIdToShow) {
                  navigate(`/courses/${courseIdToShow}`);
                } else if (courseNameToShow) {
                  try {
                    const { data } = await supabase
                      .from('golf_courses')
                      .select('id')
                      .ilike('name', courseNameToShow.trim())
                      .limit(1)
                      .single();
                    if (data?.id) {
                      navigate(`/courses/${data.id}`);
                    } else {
                      navigate(`/courses?search=${encodeURIComponent(courseNameToShow)}`);
                    }
                  } catch {
                    navigate(`/courses?search=${encodeURIComponent(courseNameToShow)}`);
                  }
                }
              }}
              className="flex items-center gap-1 hover:underline"
            >
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{courseNameToShow}</span>
            </button>
          </div>
        )}

        {/* 5. Engagement row */}
        <div className="flex items-center gap-6 px-3 py-2">
          <button
            onClick={toggleLike}
            aria-label={`${isLiked ? 'Unlike' : 'Like'} video`}
            className="flex items-center gap-1.5 text-xs min-h-[40px]"
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
            className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[40px]"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {formatCompact(post.commentCount)}
          </button>
          <button
            onClick={handleShare}
            aria-label="Share video"
            className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[40px]"
          >
            <Share2 className="h-[18px] w-[18px]" />
            {formatCompact(post.shareCount)}
          </button>
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
