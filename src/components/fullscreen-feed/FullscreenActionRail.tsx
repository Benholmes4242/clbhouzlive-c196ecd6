import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CommentsPage } from '@/components/clubhouse/cinematic/CommentsPage';
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { toast } from 'sonner';
import type { FeedPost } from '@/components/media-system/types/media';
import type { MediaStore } from '@/components/media-system/store/createMediaStore';

interface FullscreenActionRailProps {
  posts: FeedPost[];
  store: MediaStore;
}

/** Bottom offset for fullscreen (no tab bar) — aligns with CreatorCapsule bottomOffset */
const FULLSCREEN_BOTTOM_OFFSET = 'calc(env(safe-area-inset-bottom, 0px) + 24px)';

export function FullscreenActionRail({ posts, store }: FullscreenActionRailProps) {
  const activeIndex = useStore(store, (s) => s.activeIndex);
  const isMuted = useStore(store, (s) => s.isMuted);
  const carouselPositions = useStore(store, (s) => s.carouselPositions);
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const activePost = posts[activeIndex];

  const [isLiked, setIsLiked] = useState(activePost?.isLikedByMe ?? false);
  const [likeCount, setLikeCount] = useState(activePost?.likeCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [chevronY, setChevronY] = useState<number | null>(null);

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
    try {
      if (navigator.share) {
        await navigator.share({ title: activePost.caption || 'Check out this post', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied');
      }
    } catch {
      // User cancelled share or clipboard failed — try clipboard fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied');
      } catch {
        // silent
      }
    }
  }, [activePost]);

  const toggleMute = useCallback(() => {
    store.getState().toggleMute();
  }, [store]);

  if (!activePost) return null;

  const thumbnailUrl = activePost.mediaItems[0]?.thumbnailUrl || '';
  const isActiveVideo = activePost.mediaItems[0]?.type === 'video';
  const activeMediaCount = activePost.mediaItems.length;
  const currentMediaIndex = carouselPositions?.[activeIndex] ?? 0;

  return (
    <>
      {/* CinematicActionRail — identical to Clubhouse */}
      <CinematicActionRail
        postId={activePost.id}
        likesCount={likeCount}
        commentsCount={activePost.commentCount}
        hasLiked={isLiked}
        isMuted={isMuted}
        isVisible={true}
        onLike={toggleLike}
        onComment={() => setShowComments(true)}
        onShare={handleShare}
        onMuteToggle={toggleMute}
        isVideo={isActiveVideo}
        hasNextMedia={currentMediaIndex < activeMediaCount - 1}
        hasPrevMedia={currentMediaIndex > 0}
        onNextMedia={activeMediaCount > 1
          ? () => store.getState().setCarouselPosition(activeIndex, currentMediaIndex + 1)
          : undefined}
        onPrevMedia={activeMediaCount > 1
          ? () => store.getState().setCarouselPosition(activeIndex, currentMediaIndex - 1)
          : undefined}
        onChevronPositionChange={setChevronY}
        bottomOffset={FULLSCREEN_BOTTOM_OFFSET}
      />

      {/* Left chevron — mirrors right chevron Y position (identical to Clubhouse) */}
      {currentMediaIndex > 0 && chevronY !== null && (
        <button
          onClick={() => store.getState().setCarouselPosition(activeIndex, currentMediaIndex - 1)}
          style={{
            position: 'fixed',
            left: 16,
            top: chevronY - 22,
            zIndex: 40,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Previous media"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

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
