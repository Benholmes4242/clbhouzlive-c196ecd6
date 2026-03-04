/**
 * SocialOverlay — action rail (like, comment, share, more) + mute button + auto-hide.
 *
 * Auto-hide: 100% → 70% after 3s → 50% after 5s.
 * During scrubbing: overlay hides completely.
 * Mute button positioned below tab toggle, independent of action rail.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';
import { useMediaStore } from './store/mediaStore';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';
import { supabase } from '@/integrations/supabase/client';
import { MoreOptionsSheet } from './MoreOptionsSheet';
import type { FeedPost } from './types/media';

const TIMINGS = {
  FULL_OPACITY_DURATION: 3000,
  DIM_OPACITY: 0.7,
  FURTHER_DIM_DURATION: 2000,
  FURTHER_DIM_OPACITY: 0.5,
  FADE_DURATION: 300,
};

interface SocialOverlayProps {
  post: FeedPost;
  isActive: boolean;
  isScrubbing: boolean;
  onLike?: () => void;
  isLiked?: boolean;
  likeCount?: number;
  userId?: string;
}

export function SocialOverlay({
  post, isActive, isScrubbing, onLike,
  isLiked = false, likeCount, userId,
}: SocialOverlayProps) {
  const [opacity, setOpacity] = useState(1);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const isMuted = useMediaStore((s) => s.isMuted);
  const toggleMute = useMediaStore((s) => s.toggleMute);
  const dimTimer1 = useRef<ReturnType<typeof setTimeout>>();
  const dimTimer2 = useRef<ReturnType<typeof setTimeout>>();

  const displayLikeCount = likeCount ?? post.likeCount;

  // ── Auto-hide logic ───────────────────────────────────────────
  const resetTimers = useCallback(() => {
    setOpacity(1);
    clearTimeout(dimTimer1.current);
    clearTimeout(dimTimer2.current);

    dimTimer1.current = setTimeout(() => {
      setOpacity(TIMINGS.DIM_OPACITY);
      dimTimer2.current = setTimeout(() => {
        setOpacity(TIMINGS.FURTHER_DIM_OPACITY);
      }, TIMINGS.FURTHER_DIM_DURATION);
    }, TIMINGS.FULL_OPACITY_DURATION);
  }, []);

  useEffect(() => {
    if (isActive) resetTimers();
    return () => {
      clearTimeout(dimTimer1.current);
      clearTimeout(dimTimer2.current);
    };
  }, [isActive, resetTimers]);

  const handleInteraction = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // ── Like handler ──────────────────────────────────────────────
  const handleLike = useCallback(() => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);
    haptic('medium');
    onLike?.();
    handleInteraction();
  }, [onLike, handleInteraction]);

  // ── Share handler ─────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    haptic('medium');
    const url = `https://clbhouz.com/post/${post.id}`;
    const shareData = { title: post.displayName, text: post.caption || 'Check this out', url };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }

      // Record share in Supabase
      if (userId) {
        supabase
          .from('post_shares')
          .insert({ post_id: post.id, user_id: userId })
          .then(({ error }) => {
            if (error && !error.message.includes('duplicate')) {
              console.error('[Share] DB error:', error);
            }
          });
      }
    } catch {
      // User cancelled share sheet
    }
    handleInteraction();
  }, [post.id, post.displayName, post.caption, userId, handleInteraction]);

  // ── Comment handler (placeholder) ─────────────────────────────
  const handleComment = useCallback(() => {
    console.log('[SocialOverlay] Comment tapped for post:', post.id);
    toast('Comments coming soon');
    handleInteraction();
  }, [post.id, handleInteraction]);

  const overlayOpacity = isScrubbing ? 0 : opacity;

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none"
      style={{
        transition: `opacity ${TIMINGS.FADE_DURATION}ms ease`,
        opacity: overlayOpacity,
      }}
    >
      {/* Transparent touch layer to reset auto-hide */}
      <div
        className="absolute inset-0 z-0"
        style={{ pointerEvents: opacity < 1 ? 'auto' : 'none' }}
        onTouchStart={() => handleInteraction()}
      />

      {/* Mute button — below tab toggle, right side */}
      <button
        onClick={(e) => { e.stopPropagation(); haptic('light'); toggleMute(); handleInteraction(); }}
        className="pointer-events-auto absolute z-30 flex items-center justify-center w-11 h-11 rounded-full"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)',
          right: 16,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Right-side action rail */}
      <div
        className="pointer-events-auto absolute flex flex-col items-center"
        style={{
          right: 12,
          bottom: 180,
          gap: 20,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {/* Carousel indicator */}
        {post.mediaItems.length > 1 && (
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.35)',
            }}
          >
            <span className="text-white text-xs font-semibold">
              {post.mediaItems.length}
            </span>
          </div>
        )}

        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center justify-center"
          style={{ width: 44, height: 44 }}
          aria-label="Like"
        >
          <Heart
            className="w-[26px] h-[26px]"
            fill={isLiked ? '#F59E0B' : 'none'}
            color={isLiked ? '#F59E0B' : 'rgba(255,255,255,0.9)'}
            style={{
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
              transform: likeAnimating ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 150ms ease-out',
            }}
          />
          {displayLikeCount > 0 && (
            <span
              className="mt-0.5"
              style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}
            >
              {displayLikeCount}
            </span>
          )}
        </button>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); handleComment(); }}
          className="flex flex-col items-center justify-center"
          style={{ width: 44, height: 44 }}
          aria-label="Comment"
        >
          <MessageCircle
            className="w-[26px] h-[26px] text-white"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
          />
          {post.commentCount > 0 && (
            <span
              className="mt-0.5"
              style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}
            >
              {post.commentCount}
            </span>
          )}
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center justify-center"
          style={{ width: 44, height: 44 }}
          aria-label="Share"
        >
          <Send
            className="w-[26px] h-[26px] text-white"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
          />
          {post.shareCount > 0 && (
            <span
              className="mt-0.5"
              style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}
            >
              {post.shareCount}
            </span>
          )}
        </button>

        {/* More options */}
        <MoreOptionsSheet postId={post.id}>
          <button
            onClick={(e) => { e.stopPropagation(); handleInteraction(); }}
            className="flex items-center justify-center"
            style={{ width: 44, height: 44 }}
            aria-label="More options"
          >
            <MoreHorizontal
              className="w-[26px] h-[26px] text-white"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
            />
          </button>
        </MoreOptionsSheet>
      </div>
    </div>
  );
}
