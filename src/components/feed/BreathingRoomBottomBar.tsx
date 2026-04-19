/**
 * BreathingRoomBottomBar - Bottom-anchored caption + horizontal action strip
 *
 * Replaces the right-side CinematicActionRail and the bottom CreatorCapsule with
 * a quieter inline composition: optional "with @friend" line, caption (with inline
 * tag highlighting via PostContentWithTags), and a horizontal action row separated
 * by a hairline.
 *
 * Anchored above the bottom nav. Fades together with the identity pill via
 * `isVisible` (driven by overlayVisible from the parent).
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Send, MoreHorizontal } from 'lucide-react';
import { Z } from '@/config/zIndex';
import PostContentWithTags from '@/components/posts/PostContentWithTags';
import type { FeedPostTag } from '@/components/media-system/types/media';
import { VideoScrubber } from '@/components/video/VideoScrubber';

interface TaggedFriend {
  id: string;
  username: string;
  displayName: string;
}

interface BreathingRoomBottomBarProps {
  caption: string;
  tags: FeedPostTag[];
  taggedFriends: TaggedFriend[];
  likesCount: number | null;
  commentsCount: number | null;
  hasLiked: boolean;
  isVisible: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMore: () => void;
  /** Reserved for future mute integration on video posts. */
  isVideo: boolean;
  /** FOLLOW button — moved here from the identity pill */
  isFollowing: boolean;
  isOwnPost: boolean;
  onFollow: () => void;
  /** NEW: the active video element, used for the scrubber rendered as action-strip border */
  activeVideoElement?: HTMLVideoElement | null;
  /** NEW: stable identifier for the active post — used to reset caption expansion on post change */
  postId?: string;
  /** When true, suppress the entire interactive action strip (read-only viewers) */
  readOnly?: boolean;
  /** Base offset from screen bottom in px. Omit for Clubhouse (respects bottom nav); pass 0 for fullscreen overlay (no nav). */
  bottomOffset?: number;
  /** Controlled caption expansion state (lifted to parent for review panel coordination) */
  captionExpanded?: boolean;
  onCaptionExpandedChange?: (expanded: boolean) => void;
  /** Author identity rendered above the caption (TikTok-style). Null on editorial cards. */
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string;
    handicapIndex: number | null;
    homeClub: string | null;
    timeAgoLabel: string;
  } | null;
  onAuthorTap?: () => void;
}

const formatCount = (count: number | null | undefined): string | null => {
  if (count === null || count === undefined) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toString();
};

export const BreathingRoomBottomBar: React.FC<BreathingRoomBottomBarProps> = ({
  caption,
  tags,
  taggedFriends,
  likesCount,
  commentsCount,
  hasLiked,
  isVisible,
  onLike,
  onComment,
  onShare,
  onMore,
  isFollowing,
  isOwnPost,
  onFollow,
  activeVideoElement,
  postId,
  readOnly = false,
  bottomOffset,
  captionExpanded: captionExpandedProp,
  onCaptionExpandedChange,
  author,
  onAuthorTap,
}) => {
  const [likeAnimKey, setLikeAnimKey] = useState(0);
  const wasLiked = useRef(hasLiked);
  const [captionExpandedLocal, setCaptionExpandedLocal] = useState(false);
  const captionExpanded = captionExpandedProp ?? captionExpandedLocal;
  const setCaptionExpanded = (next: boolean) => {
    if (onCaptionExpandedChange) {
      onCaptionExpandedChange(next);
    } else {
      setCaptionExpandedLocal(next);
    }
  };

  useEffect(() => {
    if (hasLiked && !wasLiked.current) {
      setLikeAnimKey((k) => k + 1);
    }
    wasLiked.current = hasLiked;
  }, [hasLiked]);

  useEffect(() => {
    setCaptionExpandedLocal(false);
    onCaptionExpandedChange?.(false);
  }, [postId, onCaptionExpandedChange]);

  const captionLength = caption?.length ?? 0;
  const captionFontSize = captionLength > 120 ? 13.5 : 14;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: bottomOffset !== undefined ? bottomOffset : 'var(--bottom-nav-height, 88px)',
        left: 0,
        right: 0,
        padding: '90px 16px 20px',
        background:
          'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.92) 55%)',
        zIndex: Z.echo,
        pointerEvents: 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      <div style={{ pointerEvents: isVisible ? 'auto' : 'none' }}>
      {/* "with @friend" line */}
      {taggedFriends.length > 0 && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.65)',
            marginBottom: 6,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
          }}
        >
          with{' '}
          {taggedFriends.map((f, i) => (
            <React.Fragment key={f.id}>
              {i > 0 && ', '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>
                @{f.username || f.displayName.toLowerCase().replace(/\s+/g, '')}
              </strong>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Caption with truncation */}
      {caption && (() => {
        const TRUNCATE_AT = 120;
        const isLong = caption.length > TRUNCATE_AT;
        const showFull = captionExpanded || !isLong;

        let displayText: string;
        if (showFull) {
          displayText = caption;
        } else {
          const hardCut = caption.slice(0, TRUNCATE_AT);
          const lastSpace = hardCut.lastIndexOf(' ');
          displayText = lastSpace > 80 ? hardCut.slice(0, lastSpace) : hardCut;
        }

        const displayTags = (tags ?? []).filter((t) => {
          const end = t.end_index ?? 0;
          return end <= displayText.length;
        });

        return (
          <button
            type="button"
            onClick={(e) => {
              if (!isLong) return;
              e.stopPropagation();
              setCaptionExpanded(!captionExpanded);
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              padding: 0,
              margin: 0,
              marginBottom: 12,
              cursor: isLong ? 'pointer' : 'default',
              color: '#fff',
              fontSize: captionFontSize,
              fontWeight: 500,
              lineHeight: 1.5,
              fontFamily: 'inherit',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              wordBreak: 'break-word',
            }}
            aria-expanded={captionExpanded}
            aria-label={isLong ? (showFull ? 'Show less' : 'Show more') : undefined}
          >
            <PostContentWithTags content={displayText} tags={displayTags} />
            {isLong && (
              <>
                {showFull ? ' ' : '… '}
                <span
                  style={{
                    color: 'rgba(255, 255, 255, 0.55)',
                    fontWeight: 600,
                  }}
                >
                  {showFull ? 'less' : 'more'}
                </span>
              </>
            )}
          </button>
        );
      })()}

      {/* Action strip — scrubber renders as top border on video posts, static hairline on images */}
      {!readOnly && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            paddingTop: 12,
            borderTop: activeVideoElement ? 'none' : '1px solid rgba(255, 255, 255, 0.16)',
          }}
        >
          {/* Scrubber-as-border: only rendered when there's an active video element */}
          {activeVideoElement && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                pointerEvents: 'auto',
                zIndex: 1,
              }}
            >
              <VideoScrubber videoEl={activeVideoElement} height={2} variant="default" />
            </div>
          )}


          <ActionButton
            icon={
              <Heart
                size={22}
                fill={hasLiked ? '#F7931E' : 'transparent'}
                stroke={hasLiked ? '#F7931E' : '#fff'}
                strokeWidth={2}
              />
            }
            count={formatCount(likesCount)}
            accent={hasLiked ? '#F7931E' : '#fff'}
            onClick={onLike}
            ariaLabel={hasLiked ? 'Unlike' : 'Like'}
            animateKey={likeAnimKey}
          />

          <ActionButton
            icon={<MessageSquare size={22} stroke="#fff" strokeWidth={2} />}
            count={formatCount(commentsCount)}
            accent="#fff"
            onClick={onComment}
            ariaLabel="Comments"
          />

          <ActionButton
            icon={<Send size={22} stroke="#fff" strokeWidth={2} />}
            accent="#fff"
            onClick={onShare}
            ariaLabel="Share"
          />

          {/* FOLLOW — text pill, sits between Share and the spacer */}
          {!isOwnPost && (
            <motion.button
              type="button"
              onClick={onFollow}
              whileTap={{ scale: 0.94 }}
              aria-label={isFollowing ? 'Unfollow' : 'Follow'}
              style={{
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'Geist, system-ui, sans-serif',
                background: isFollowing ? 'rgba(255, 255, 255, 0.14)' : '#F7931E',
                color: isFollowing ? 'rgba(255, 255, 255, 0.85)' : '#0F172A',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </motion.button>
          )}

          <div style={{ flex: 1 }} />

          <ActionButton
            icon={<MoreHorizontal size={22} stroke="#fff" strokeWidth={2} />}
            accent="#fff"
            onClick={onMore}
            ariaLabel="More options"
          />
        </div>
      )}
      </div>
    </motion.div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: string | null;
  accent: string;
  onClick: () => void;
  ariaLabel: string;
  animateKey?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  count,
  accent,
  onClick,
  ariaLabel,
  animateKey,
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      aria-label={ariaLabel}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Geist, system-ui, sans-serif',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: accent,
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.12s',
      }}
    >
      <motion.span
        key={animateKey}
        initial={animateKey ? { scale: 0.85 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {icon}
      </motion.span>
      {count !== null && count !== undefined && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: accent,
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default BreathingRoomBottomBar;
