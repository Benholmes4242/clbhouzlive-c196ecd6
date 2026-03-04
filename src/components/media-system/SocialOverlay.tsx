/**
 * SocialOverlay — like, comment, share, mute + user info bar + auto-hide.
 *
 * Auto-hide: 100% → 70% after 3s → 50% after 5s.
 * During scrubbing: overlay hides completely (scrubber stays).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react';
import { useMediaStore } from './store/mediaStore';
import { toast } from 'sonner';
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
}

export function SocialOverlay({ post, isActive, isScrubbing, onLike, isLiked = false }: SocialOverlayProps) {
  const [opacity, setOpacity] = useState(1);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const isMuted = useMediaStore((s) => s.isMuted);
  const toggleMute = useMediaStore((s) => s.toggleMute);
  const dimTimer1 = useRef<ReturnType<typeof setTimeout>>();
  const dimTimer2 = useRef<ReturnType<typeof setTimeout>>();

  // Reset avatar error when post changes
  useEffect(() => {
    setAvatarError(false);
  }, [post.avatarUrl]);

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

  // Start timers when active
  useEffect(() => {
    if (isActive) resetTimers();
    return () => {
      clearTimeout(dimTimer1.current);
      clearTimeout(dimTimer2.current);
    };
  }, [isActive, resetTimers]);

  // Any touch resets opacity
  const handleInteraction = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // ── Like handler ──────────────────────────────────────────────
  const handleLike = useCallback(() => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);
    onLike?.();
    handleInteraction();
  }, [onLike, handleInteraction]);

  // ── Share handler ─────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const url = `https://clbhouz.com/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption || 'Check this out', url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
    handleInteraction();
  }, [post.id, post.caption, handleInteraction]);

  // ── Comment handler (placeholder) ─────────────────────────────
  const handleComment = useCallback(() => {
    console.log('[SocialOverlay] Comment tapped for post:', post.id);
    toast('Comments coming soon');
    handleInteraction();
  }, [post.id, handleInteraction]);

  // During scrubbing, hide overlay
  const overlayOpacity = isScrubbing ? 0 : opacity;

  const displayName = post.username || 'Clbhouz User';

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none"
      style={{
        transition: `opacity ${TIMINGS.FADE_DURATION}ms ease`,
        opacity: overlayOpacity,
      }}
    >
      {/* Transparent touch layer to reset auto-hide when overlay is dimmed */}
      <div
        className="absolute inset-0 z-0"
        style={{ pointerEvents: opacity < 1 ? 'auto' : 'none' }}
        onTouchStart={() => {
          handleInteraction();
          // Don't stopPropagation — let touch pass through to video for play/pause
        }}
      />
      {/* Mute button — top right */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleMute(); handleInteraction(); }}
        className="pointer-events-auto absolute z-30 flex items-center justify-center w-11 h-11 rounded-full"
        style={{
          top: 'calc(env(safe-area-inset-top, 16px) + 16px)',
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

      {/* Right-side action buttons */}
      <div
        className="pointer-events-auto absolute flex flex-col items-center gap-5"
        style={{
          right: 12,
          bottom: 180,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center w-11 h-11 justify-center"
          aria-label="Like"
        >
          <Heart
            className="w-7 h-7"
            fill={isLiked ? '#ef4444' : 'none'}
            color={isLiked ? '#ef4444' : 'white'}
            style={{
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
              transform: likeAnimating ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 150ms ease-out',
            }}
          />
          <span className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {post.likeCount || ''}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); handleComment(); }}
          className="flex flex-col items-center w-11 h-11 justify-center"
          aria-label="Comment"
        >
          <MessageCircle
            className="w-7 h-7 text-white"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
          />
          <span className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {post.commentCount || ''}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center w-11 h-11 justify-center"
          aria-label="Share"
        >
          <Send
            className="w-6 h-6 text-white"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
          />
        </button>
      </div>

      {/* User info bar — bottom */}
      <div
        className="pointer-events-auto absolute z-20"
        style={{
          bottom: 80,
          left: 12,
          right: 80,
        }}
      >
        {/* Gradient backdrop */}
        <div
          className="absolute inset-0 -m-3 rounded-lg"
          style={{
            background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
            pointerEvents: 'none',
          }}
        />

        <div className="relative flex items-center gap-2 mb-1">
          {/* Avatar */}
          {post.avatarUrl && !avatarError ? (
            <img
              src={post.avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: '2px solid rgba(255,255,255,0.3)' }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
          )}

          {/* Username — truncated */}
          <span
            className="text-sm font-bold text-white truncate"
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              maxWidth: '200px',
            }}
          >
            {displayName}
          </span>
        </div>

        {/* Caption */}
        {post.caption && (
          <div>
            <p
              className="text-[13px] text-white/90 leading-snug"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                display: '-webkit-box',
                WebkitLineClamp: captionExpanded ? 6 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {post.caption}
            </p>
            {post.caption.length > 80 && (
              <button
                onClick={(e) => { e.stopPropagation(); setCaptionExpanded(!captionExpanded); }}
                className="text-xs mt-0.5"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {captionExpanded ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
