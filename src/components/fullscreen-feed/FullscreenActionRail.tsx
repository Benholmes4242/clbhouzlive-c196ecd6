import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from 'zustand';
import { Flag, EyeOff, Link2 } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost } from '@/components/media-system/types/media';
import type { MediaStore } from '@/components/media-system/store/createMediaStore';
import { useLikeMutation } from '@/components/media-system/hooks/useLikeMutation';
import { useActiveActor } from '@/context/ActiveActorContext';

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
  const { activeActor } = useActiveActor();
  const activePost = posts[activeIndex];

  const likeMutation = useLikeMutation();

  const [isLiked, setIsLiked] = useState(activePost?.isLikedByMe ?? false);
  const [likeCount, setLikeCount] = useState(activePost?.likeCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCountOverride, setCommentCountOverride] = useState<number | null>(null);
  const [chevronY, setChevronY] = useState<number | null>(null);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  // Reset like state and comment count override when activeIndex changes
  useEffect(() => {
    if (activePost) {
      setIsLiked(activePost.isLikedByMe);
      setLikeCount(activePost.likeCount);
    }
    setCommentCountOverride(null);
  }, [activeIndex, activePost?.id]);

  // Add/remove body class for comments z-index boost
  useEffect(() => {
    if (showComments) {
      document.body.classList.add('fullscreen-comments-open');
    } else {
      document.body.classList.remove('fullscreen-comments-open');
    }
    return () => {
      document.body.classList.remove('fullscreen-comments-open');
    };
  }, [showComments]);

  const displayedCommentCount = commentCountOverride ?? activePost?.commentCount ?? 0;

  const toggleLike = useCallback(() => {
    if (!userId || !activePost || !activeActor) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;
    const newLiked = !prevLiked;

    setIsLiked(newLiked);
    setLikeCount(newLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
    navigator?.vibrate?.(10);

    likeMutation.mutate(
      {
        postId: activePost.id,
        userId,
        actorId: activeActor.id ?? userId,
        actorType: activeActor.type === 'business' ? 'business' : 'personal',
        isLiked: prevLiked,
      },
      {
        onError: () => {
          setIsLiked(prevLiked);
          setLikeCount(prevCount);
        },
      },
    );
  }, [userId, activeActor, activePost, isLiked, likeCount, likeMutation]);

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

  const handleReport = useCallback(async () => {
    if (!userId || !activePost) return;
    const { error } = await (supabase as any)
      .from('post_reports')
      .insert({ post_id: activePost.id, reporter_id: userId });
    if (!error) {
      toast.success('Report submitted');
    }
    setMoreOptionsOpen(false);
  }, [userId, activePost]);

  const handleNotInterested = useCallback(async () => {
    if (!userId || !activePost) return;
    const { error } = await (supabase as any)
      .from('post_dismissals')
      .insert({ post_id: activePost.id, user_id: userId });
    if (!error) {
      toast('Noted — we will show fewer like this');
    }
    setMoreOptionsOpen(false);
  }, [userId, activePost]);

  const handleCopyLink = useCallback(async () => {
    if (!activePost) return;
    const shareUrl = `${window.location.origin}/post/${activePost.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    } catch {
      // silent
    }
    setMoreOptionsOpen(false);
  }, [activePost]);

  const handleCommentPosted = useCallback(() => {
    setCommentCountOverride((prev) => (prev ?? activePost?.commentCount ?? 0) + 1);
  }, [activePost?.commentCount]);

  const handleCommentDeleted = useCallback(() => {
    setCommentCountOverride((prev) => Math.max(0, (prev ?? activePost?.commentCount ?? 0) - 1));
  }, [activePost?.commentCount]);

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
        commentsCount={displayedCommentCount}
        hasLiked={isLiked}
        isMuted={isMuted}
        isVisible={true}
        onLike={toggleLike}
        onComment={() => setShowComments(true)}
        onShare={handleShare}
        onMuteToggle={toggleMute}
        onMore={() => setMoreOptionsOpen(true)}
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

      {/* More Options drawer */}
      {moreOptionsOpen && (
        <div
          className="fixed inset-0 z-[10004]"
          onClick={() => setMoreOptionsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-2" />
            <div className="flex flex-col">
              <button
                onClick={handleReport}
                className="flex items-center gap-3 px-5 py-3.5 text-left active:bg-white/5"
              >
                <Flag className="w-5 h-5 text-white/70" />
                <span className="text-[15px] text-white">Report this post</span>
              </button>
              <button
                onClick={handleNotInterested}
                className="flex items-center gap-3 px-5 py-3.5 text-left active:bg-white/5"
              >
                <EyeOff className="w-5 h-5 text-white/70" />
                <span className="text-[15px] text-white">Not interested</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 px-5 py-3.5 text-left active:bg-white/5"
              >
                <Link2 className="w-5 h-5 text-white/70" />
                <span className="text-[15px] text-white">Copy link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments bottom sheet — z-index boosted via .fullscreen-comments-open class on body */}
      {showComments && (
        <CommentsSheet
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
          onCommentPosted={handleCommentPosted}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </>
  );
}
