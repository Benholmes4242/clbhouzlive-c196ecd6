import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, MapPin, Bookmark, Link2, EyeOff, Flag } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CommentsPage } from '@/components/clubhouse/cinematic/CommentsPage';
import { VideoCardAutoplay } from './VideoCardAutoplay';
import { VideoCardMenu } from './VideoCardMenu';

interface VideoCardProps {
  post: FeedPost;
  isAutoplayEligible?: boolean;
  userId?: string;
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

export const VideoCard = React.memo(function VideoCard({ post, isAutoplayEligible = false, userId }: VideoCardProps) {
  const navigate = useNavigate();
  const firstVideo = post.mediaItems.find(m => m.type === 'video');
  const thumbnailUrl = firstVideo?.thumbnailUrl || '';
  const hlsUrl = firstVideo?.hlsUrl || '';
  const duration = firstVideo?.duration || 0;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const [expanded, setExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);

  const handleTap = () => {
    // Fullscreen player wired later
  };

  const toggleLike = async () => {
    if (!userId) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    navigator?.vibrate?.(10);

    try {
      if (newLiked) {
        const { error } = await supabase.from('post_likes').insert({
          post_id: post.id,
          user_id: userId,
          actor_id: userId,
          actor_type: 'personal',
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').delete().match({
          post_id: post.id,
          user_id: userId,
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[VideoCard] Like toggle failed:', err);
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
      <article className="bg-card overflow-hidden">
        {/* Creator header */}
        <div className="flex items-center gap-3 p-3">
          <button
            onClick={() => navigate(`/profile/${post.userId}`)}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <img
              src={post.avatarUrl || '/placeholder.svg'}
              alt={post.displayName}
              className="h-9 w-9 rounded-full object-cover shrink-0 bg-muted"
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-foreground truncate">
                  {post.displayName}
                </span>
                {post.isVerified && (
                  <svg className="h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </button>
          <VideoCardMenu
            postId={post.id}
            userId={userId}
            onShare={handleShare}
          />
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-3 pb-2">
            <p className={`text-sm text-foreground ${expanded ? '' : 'line-clamp-2'}`}>
              {post.caption}
            </p>
            {!expanded && post.caption.length > 100 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-sm font-semibold text-muted-foreground mt-0.5"
              >
                more
              </button>
            )}
            {expanded && post.caption.length > 100 && (
              <button
                onClick={() => setExpanded(false)}
                className="text-sm font-semibold text-muted-foreground mt-0.5"
              >
                less
              </button>
            )}
          </div>
        )}

        {/* Course tag */}
        {post.review?.courseName && (
          <div className="px-3 pb-2">
            {post.review.courseId ? (
              <button
                onClick={() => navigate(`/course/${post.review!.courseId}`)}
                className="flex items-center gap-1 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{post.review.courseName}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{post.review.courseName}</span>
              </div>
            )}
          </div>
        )}

        {/* Video area */}
        <button
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
          {hlsUrl && isAutoplayEligible && (
            <VideoCardAutoplay
              hlsUrl={hlsUrl}
              posterUrl={thumbnailUrl}
              isEligible={isAutoplayEligible}
            />
          )}
          {duration > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium rounded bg-black/60 text-white backdrop-blur-sm z-10">
              {formatVideoDuration(duration)}
            </span>
          )}
        </button>

        {/* Engagement row */}
        <div className="flex items-center gap-5 px-3 py-2.5">
          <button onClick={toggleLike} className="flex items-center gap-1 text-xs">
            <Heart
              className={`h-4 w-4 transition-colors ${isLiked ? 'fill-current text-red-500' : 'text-muted-foreground'}`}
            />
            <span className={isLiked ? 'text-red-500' : 'text-muted-foreground'}>
              {formatCompact(likeCount)}
            </span>
          </button>
          <button onClick={() => setShowComments(true)} className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {formatCompact(post.commentCount)}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1 text-xs text-muted-foreground">
            <Share2 className="h-4 w-4" />
            {formatCompact(post.shareCount)}
          </button>
        </div>
      </article>

      {/* Comments bottom sheet */}
      <CommentsPage
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
        courseId={post.review?.courseId}
        courseName={post.review?.courseName}
        isReview={post.isReview}
        reviewRating={post.review?.rating}
      />
    </>
  );
});
