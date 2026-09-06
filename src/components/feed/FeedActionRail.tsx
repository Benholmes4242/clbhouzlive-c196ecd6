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
import { Heart, MessageCircle, Send, MoreHorizontal, Plus, Check } from 'lucide-react';
import { MuteButton } from '@/audio/MuteButton';
import { Z } from '@/config/zIndex';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatCountKilo } from '@/i18n/format';

// Shared lift + stroke for every floating glyph in the immersive feed chrome.
const FLOAT_SHADOW = 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))';
const FLOAT_STROKE = 2;
const COUNT_TEXT_SHADOW = '0 1px 3px rgba(0,0,0,0.6)';

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
  /** Opens the likers sheet from the count beneath the heart. */
  onOpenLikes?: () => void;
  onComment: () => void;
  onShare: () => void;
  onMore: () => void;
  /**
   * Optional override for the "More" affordance. When provided, replaces the
   * default ⋯ button (used by FeedOverlayLayer to drop in PostOwnerMenu for
   * own posts). `onMore` is ignored when this is set.
   */
  moreSlot?: React.ReactNode;
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
  return formatCountKilo(count);
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
        filter: FLOAT_SHADOW,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        pointerEvents: 'auto',
        touchAction: 'pan-y',
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
            fontSize: 13,
            fontWeight: 700,
            color: accentCount ? '#F7931E' : '#fff',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            textShadow: COUNT_TEXT_SHADOW,
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
  onOpenLikes,
  onComment,
  onShare,
  onMore,
  moreSlot,
  isVisible,
  bottomOffset,
  readOnly = false,
  isVideo = false,
  isMuted = false,
  onToggleMute,
}) => {
  const [justFollowed, setJustFollowed] = useState(false);
  const prevFollowingRef = useRef(isFollowing);
  const prevCreatorIdRef = useRef(creator?.id);

  useEffect(() => {
    // Reset when the creator changes (different post in the feed).
    if (creator?.id !== prevCreatorIdRef.current) {
      prevCreatorIdRef.current = creator?.id;
      prevFollowingRef.current = isFollowing;
      setJustFollowed(false);
      return;
    }
    // Detect a false → true transition on isFollowing.
    if (!prevFollowingRef.current && isFollowing) {
      setJustFollowed(true);
      const t = setTimeout(() => setJustFollowed(false), 1500);
      prevFollowingRef.current = isFollowing;
      return () => clearTimeout(t);
    }
    prevFollowingRef.current = isFollowing;
  }, [creator?.id, isFollowing]);

  const showFollowPlus = !readOnly && !isOwnPost && !isFollowing && !!creator;
  const showJustFollowed = !readOnly && !isOwnPost && justFollowed && !!creator;

  const muteButton = isVideo ? (
    <MuteButton size="md" />
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
            : 'calc(var(--bottom-nav-height, 96px) + 24px)',
        zIndex: Z.echo,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        pointerEvents: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Playback: mute toggle — video posts only, top of rail */}
      {muteButton}

      {/* Creator avatar with follow+ badge */}
      {creator && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            filter: FLOAT_SHADOW,
          }}
        >
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
              pointerEvents: 'auto',
              touchAction: 'pan-y',
            }}
          >
            <SquircleAvatar
              size={48}
              src={creator.avatarUrl}
              alt={creator.displayName}
              userId={creator.id}
              fallback={creator.displayName?.[0] ?? '?'}
              hairlineRing
            />
          </button>

          {/* Follow region — single 44px tap target spanning the badge + caption.
              Renders for not-following and just-followed states; hidden once
              following has settled. */}
          {(showFollowPlus || showJustFollowed) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (showFollowPlus) onFollow();
              }}
              aria-label={showJustFollowed ? 'Following' : 'Follow'}
              aria-pressed={showJustFollowed}
              style={{
                marginTop: -14,
                minWidth: 44,
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: showFollowPlus ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'auto',
                touchAction: 'pan-y',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#F7931E',
                  border: '0.5px solid rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 200ms ease',
                }}
              >
                {showJustFollowed ? (
                  <Check size={13} strokeWidth={3} color="rgba(255,255,255,0.95)" />
                ) : (
                  <Plus size={14} strokeWidth={2.5} color="rgba(255,255,255,0.95)" />
                )}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: showJustFollowed ? '#F7931E' : '#fff',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  transition: 'color 200ms ease',
                }}
              >
                {showJustFollowed ? 'Following' : 'Follow'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Read-only: render only the creator avatar above. Skip all interactive controls. */}
      {!readOnly && (
        <>
          {/* Like. SHOW WHO LIKED A POST — over media there is no room for an
              avatar row, so the COUNT BENEATH THE HEART is the tap target that
              opens the likers sheet. The heart itself keeps toggling the like:
              the two targets are deliberately NOT merged. */}
          {onOpenLikes && (likesCount ?? 0) > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                pointerEvents: 'auto',
              }}
            >
              <ActionButton
                onClick={onLike}
                ariaLabel={hasLiked ? 'Unlike' : 'Like'}
                animateKey={likeAnimKey}
              >
                <Heart
                  size={28}
                  fill={hasLiked ? '#F7931E' : 'transparent'}
                  stroke={hasLiked ? '#F7931E' : '#fff'}
                  strokeWidth={FLOAT_STROKE}
                />
              </ActionButton>
              <button
                type="button"
                aria-label="See who liked this"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLikes();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: hasLiked ? '#F7931E' : '#fff',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  textShadow: COUNT_TEXT_SHADOW,
                  filter: FLOAT_SHADOW,
                  pointerEvents: 'auto',
                  touchAction: 'pan-y',
                }}
              >
                {formatCount(likesCount)}
              </button>
            </div>
          ) : (
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
                strokeWidth={FLOAT_STROKE}
              />
            </ActionButton>
          )}

          {/* Comment */}
          <ActionButton
            onClick={onComment}
            ariaLabel="Comments"
            count={formatCount(commentsCount)}
          >
            <MessageCircle size={28} stroke="#fff" strokeWidth={FLOAT_STROKE} />
          </ActionButton>

          {/* Share */}
          <ActionButton onClick={onShare} ariaLabel="Share">
            <Send size={28} stroke="#fff" strokeWidth={FLOAT_STROKE} />
          </ActionButton>

          {/* More — owner menu (PostOwnerMenu) for own posts; default ⋯ otherwise */}
          {moreSlot ? (
            <div style={{ filter: FLOAT_SHADOW, pointerEvents: 'auto' }}>
              {moreSlot}
            </div>
          ) : (
            <ActionButton onClick={onMore} ariaLabel="More options">
              <MoreHorizontal size={28} stroke="#fff" strokeWidth={FLOAT_STROKE} />
            </ActionButton>
          )}
        </>
      )}
    </motion.div>
  );
};

export default FeedActionRail;
