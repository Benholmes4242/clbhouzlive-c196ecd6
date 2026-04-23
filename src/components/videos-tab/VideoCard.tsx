import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useNavigate } from 'react-router-dom';
import { getActorRouteByType } from '@/types/actor';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
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

  const handleAuthorTap = useCallback(() => {
    navigate(getActorRouteByType(post.actorType, post.actorId));
  }, [navigate, post.actorType, post.actorId]);

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

        {/* ── Meta: Option B — The Caddie Bag ── */}
        <div style={{ padding: '11px 14px 0' }}>
          {cleanedCaption && (
            <p style={{
              fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))',
              lineHeight: 1.35, margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}>
              <PostContentWithTags
                content={cleanedCaption}
                tags={post.tags || []}
                className="text-[15px] font-bold leading-[1.35] tracking-[-0.01em]"
              />
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate(`/profile/${post.userId}`)} className="shrink-0">
              <SquircleAvatar
                src={post.avatarUrl}
                alt={post.displayName}
                userId={post.userId}
                size="sm"
                hideRing
              />
            </button>
            <button onClick={() => navigate(`/profile/${post.userId}`)} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                {post.displayName}
              </span>
              {post.isVerified && (
                <svg className="h-3 w-3 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>·</span>
            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{timeAgo}</span>

            {courseNameToShow && (
              <>
                <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>·</span>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (courseIdToShow) {
                      navigate(`/courses/${courseIdToShow}`);
                    } else {
                      try {
                        const { data } = await supabase
                          .from('golf_courses')
                          .select('id')
                          .ilike('name', courseNameToShow.trim())
                          .limit(1)
                          .single();
                        if (data?.id) navigate(`/courses/${data.id}`);
                        else navigate(`/courses?search=${encodeURIComponent(courseNameToShow)}`);
                      } catch {
                        navigate(`/courses?search=${encodeURIComponent(courseNameToShow)}`);
                      }
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 11 }}>🏌️</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#006747' }}>{courseNameToShow}</span>
                </button>
              </>
            )}

            <div style={{ flex: 1 }} />
            <VideoCardMenu postId={post.id} userId={userId} onShare={handleShare} />
          </div>

          <div style={{ height: 1, background: 'hsl(var(--border) / 0.5)', margin: '0 -14px' }} />

          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0 11px', gap: 4 }}>
            <button
              onClick={toggleLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
            >
              {isLiked ? (
                <Heart style={{ width: 19, height: 19, color: '#F7931E', fill: '#F7931E' }} strokeWidth={1.8} />
              ) : (
                <Heart className="h-[19px] w-[19px] text-muted-foreground" />
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: isLiked ? '#F7931E' : 'hsl(var(--muted-foreground))' }}>
                {formatCompact(likeCount)}
              </span>
            </button>

            <div style={{ width: 1, height: 18, background: 'hsl(var(--border))', margin: '0 10px' }} />

            <button
              onClick={() => setShowComments(true)}
              aria-label="Comments"
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <MessageCircle className="h-[19px] w-[19px]" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>
                {formatCompact(post.commentCount)}
              </span>
            </button>

            <div style={{ flex: 1 }} />

            <button
              onClick={handleShare}
              aria-label="Share"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                minHeight: 34, padding: '0 14px', borderRadius: 20,
                fontSize: 13, fontWeight: 600,
                background: 'transparent',
                border: '1.5px solid hsl(var(--border))',
                color: 'hsl(var(--muted-foreground))',
                cursor: 'pointer',
              }}
            >
              <Share2 className="h-[14px] w-[14px]" />
              Share
            </button>
          </div>
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
        isReview={post.isReview}
        reviewRating={post.review?.rating}
      />
    </>
  );
});
