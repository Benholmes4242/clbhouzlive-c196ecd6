import React, { useState, useCallback, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-react';
import { useStore } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CommentsPage } from '@/components/clubhouse/cinematic/CommentsPage';
import { toast } from 'sonner';
import type { FeedPost } from '@/components/media-system/types/media';
import type { MediaStore } from '@/components/media-system/store/createMediaStore';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface FullscreenActionRailProps {
  posts: FeedPost[];
  store: MediaStore;
}

export function FullscreenActionRail({ posts, store }: FullscreenActionRailProps) {
  const activeIndex = useStore(store, (s) => s.activeIndex);
  const isMuted = useStore(store, (s) => s.isMuted);
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const activePost = posts[activeIndex];

  const [isLiked, setIsLiked] = useState(activePost?.isLikedByMe ?? false);
  const [likeCount, setLikeCount] = useState(activePost?.likeCount ?? 0);
  const [showComments, setShowComments] = useState(false);

  // Reset like state when activeIndex changes
  useEffect(() => {
    if (activePost) {
      setIsLiked(activePost.isLikedByMe);
      setLikeCount(activePost.likeCount);
    }
  }, [activeIndex, activePost?.id]);

  const toggleLike = useCallback(async () => {
    if (!userId || !activePost) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    navigator?.vibrate?.(10);

    try {
      if (newLiked) {
        const { error } = await supabase.from('post_likes').insert({
          post_id: activePost.id,
          user_id: userId,
          actor_id: userId,
          actor_type: 'personal',
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: activePost.id, user_id: userId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[FullscreenActionRail] Like toggle failed:', err);
      setIsLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? Math.max(0, prev - 1) : prev + 1));
    }
  }, [userId, activePost, isLiked]);

  const handleShare = useCallback(async () => {
    if (!activePost) return;
    const shareUrl = `${window.location.origin}/post/${activePost.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: activePost.caption || 'Check out this post', url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    }
  }, [activePost]);

  const toggleMute = useCallback(() => {
    store.getState().toggleMute();
  }, [store]);

  if (!activePost) return null;

  const thumbnailUrl = activePost.mediaItems[0]?.thumbnailUrl || '';

  return (
    <>
      <div
        className="fixed right-3 flex flex-col items-center gap-5 z-[10000]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        {/* Like */}
        <button onClick={toggleLike} className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
            <Heart
              className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </div>
          <span className="text-[10px] font-medium text-white drop-shadow-md">
            {formatCompact(likeCount)}
          </span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-white drop-shadow-md">
            {formatCompact(activePost.commentCount)}
          </span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-white drop-shadow-md">
            {formatCompact(activePost.shareCount)}
          </span>
        </button>

        {/* Mute */}
        <button onClick={toggleMute} className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </div>
        </button>
      </div>

      {/* Comments bottom sheet */}
      <CommentsPage
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={activePost.id}
        currentUserId={userId}
        creatorName={activePost.displayName}
        creatorAvatar={activePost.avatarUrl}
        creatorUserId={activePost.userId}
        caption={activePost.caption}
        videoThumbnail={thumbnailUrl}
        theme="dark"
        courseId={activePost.review?.courseId}
        courseName={activePost.review?.courseName}
        isReview={activePost.isReview}
        reviewRating={activePost.review?.rating}
      />
    </>
  );
}
