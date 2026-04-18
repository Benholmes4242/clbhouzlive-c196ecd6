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
}) => {
  const [likeAnimKey, setLikeAnimKey] = useState(0);
  const wasLiked = useRef(hasLiked);

  useEffect(() => {
    if (hasLiked && !wasLiked.current) {
      setLikeAnimKey((k) => k + 1);
    }
    wasLiked.current = hasLiked;
  }, [hasLiked]);

  const captionLength = caption?.length ?? 0;
  const captionFontSize = captionLength > 120 ? 13.5 : 14;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: 'var(--bottom-nav-height, 88px)',
        left: 0,
        right: 0,
        padding: '90px 16px 20px',
        background:
          'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.92) 55%)',
        zIndex: Z.echo,
        pointerEvents: isVisible ? 'auto' : 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
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

      {/* Caption */}
      {caption && (
        <div
          style={{
            color: '#fff',
            fontSize: captionFontSize,
            fontWeight: 500,
            lineHeight: 1.5,
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            marginBottom: 12,
            wordBreak: 'break-word',
          }}
        >
          <PostContentWithTags content={caption} tags={tags ?? []} />
        </div>
      )}

      {/* Action strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.16)',
        }}
      >
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
              borderRadius: 14,
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
