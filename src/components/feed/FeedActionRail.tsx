/**
 * FeedActionRail — TikTok-style right-side vertical action rail.
 *
 * Renders, top → bottom:
 *   • Creator avatar (48px, white border) with a small amber "+" follow badge
 *     that disappears once followed or on own posts.
 *   • Like (heart, amber-fills when liked) + count
 *   • Comment (bubble) + count
 *   • Share (paper plane)
 *   • More (⋯)
 *
 * Floats over the photo with drop shadows — no container chrome.
 * Anchors above the bottom nav by default; pass bottomOffset={0} for fullscreen
 * overlays where there is no bottom nav.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, MoreHorizontal, Volume2, VolumeX, Plus } from 'lucide-react';
import { Z } from '@/config/zIndex';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface FeedActionRailProps {
  creator: {
    id: string;
    avatarUrl: string;
    displayName: string;
  } | null;
  isFollowing: boolean;
  isOwnPost: boolean;
  onCreatorTap: () => void;
  onFollow: () => void;
  hasLiked: boolean;
  likesCount: number | null;
  commentsCount: number | null;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMore: () => void;
  isVisible: boolean;
  /** Base offset from screen bottom in px. Omit for Clubhouse (respects bottom nav); pass 0 for fullscreen overlay (no nav). */
  bottomOffset?: number;
  /** When true, only the creator avatar is rendered (no follow+, like, comment, share, more). */
  readOnly?: boolean;
  /** Only present on video posts — renders mute toggle at top of rail */
  isVideo?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const formatCount = (count: number | null | undefined): string | null => {
  if (count === null || count === undefined || count === 0) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toString();
};

interface ActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  count?: string | null;
  children: React.ReactNode;
  /** When true, the count text uses the amber accent (e.g. liked state). */
  accentCount?: boolean;
  animateKey?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  ariaLabel,
  count,
  children,
  accentCount,
  animateKey,
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.12s',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      <motion.span
        key={animateKey}
        initial={animateKey ? { scale: 0.8 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </motion.span>
      {count && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: accentCount ? '#F7931E' : '#fff',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export const FeedActionRail: React.FC<FeedActionRailProps> = ({
  creator,
  isFollowing,
  isOwnPost,
  onCreatorTap,
  onFollow,
  hasLiked,
  likesCount,
  commentsCount,
  onLike,
  onComment,
  onShare,
  onMore,
  isVisible,
  bottomOffset,
  readOnly = false,
  isVideo = false,
  isMuted = false,
  onToggleMute,
}) => {
  const showFollowPlus = !readOnly && !isOwnPost && !isFollowing && !!creator;

  const muteButton = isVideo && onToggleMute ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggleMute();
      }}
      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        padding: 0,
        color: '#fff',
        cursor: 'pointer',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
      }}
    >
      {isMuted ? (
        <VolumeX size={28} stroke="#fff" strokeWidth={2} />
      ) : (
        <Volume2 size={28} stroke="#fff" strokeWidth={2} />
      )}
    </button>
  ) : null;

  // Heart pop animation key — bumps when transitioning to liked
  const [likeAnimKey, setLikeAnimKey] = useState(0);
  const wasLiked = useRef(hasLiked);
  useEffect(() => {
    if (hasLiked && !wasLiked.current) setLikeAnimKey((k) => k + 1);
    wasLiked.current = hasLiked;
  }, [hasLiked]);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        right: 12,
        bottom:
          bottomOffset !== undefined
            ? `${bottomOffset + 62}px`
            : 'calc(var(--bottom-nav-height, 88px) + 24px)',
        zIndex: Z.echo,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        pointerEvents: isVisible ? 'auto' : 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      {/* Playback: mute toggle — video posts only, top of rail */}
      {muteButton}

      {/* Creator avatar with follow+ badge */}
      {creator && (
        <div style={{ position: 'relative', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreatorTap();
            }}
            aria-label={`View ${creator.displayName}'s profile`}
            style={{
              width: 48,
              height: 48,
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SquircleAvatar
              size={48}
              src={creator.avatarUrl}
              alt={creator.displayName}
              fallback={creator.displayName?.[0] ?? '?'}
              hairlineRing
              ringColor="rgba(255,255,255,0.95)"
            />
          </button>
          {showFollowPlus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFollow();
              }}
              aria-label="Follow"
              style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#F7931E',
                border: '1.5px solid rgba(255,255,255,0.95)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={14} strokeWidth={2.5} color="rgba(255,255,255,0.95)" />
            </button>
          )}
        </div>
      )}

      {/* Read-only: render only the creator avatar above. Skip all interactive controls. */}
      {!readOnly && (
        <>
          {/* Like */}
          <ActionButton
            onClick={onLike}
            ariaLabel={hasLiked ? 'Unlike' : 'Like'}
            count={formatCount(likesCount)}
            accentCount={hasLiked}
            animateKey={likeAnimKey}
          >
            <Heart
              size={28}
              fill={hasLiked ? '#F7931E' : 'transparent'}
              stroke={hasLiked ? '#F7931E' : '#fff'}
              strokeWidth={2}
            />
          </ActionButton>

          {/* Comment */}
          <ActionButton
            onClick={onComment}
            ariaLabel="Comments"
            count={formatCount(commentsCount)}
          >
            <MessageCircle size={28} stroke="#fff" strokeWidth={2} />
          </ActionButton>

          {/* Share */}
          <ActionButton onClick={onShare} ariaLabel="Share">
            <Send size={28} stroke="#fff" strokeWidth={2} />
          </ActionButton>

          {/* More */}
          <ActionButton onClick={onMore} ariaLabel="More options">
            <MoreHorizontal size={28} stroke="#fff" strokeWidth={2} />
          </ActionButton>
        </>
      )}
    </motion.div>
  );
};

export default FeedActionRail;
