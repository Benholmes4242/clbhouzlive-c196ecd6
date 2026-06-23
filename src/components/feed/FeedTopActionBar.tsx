/**
 * FeedTopActionBar — horizontal top action bar for the fullscreen feed overlay.
 *
 * Replaces the right-side vertical FeedActionRail in fullscreen mode. Pure
 * presentational re-layout — reuses the exact same handlers/props as
 * FeedActionRail. The creator avatar + follow badge are NOT rendered here;
 * they live in the bottom-left author chip instead.
 *
 * Layout:
 *   left cluster:  [back chevron] [mute toggle (video only)]
 *   right cluster: [like + count] [comment + count] [share] [more]
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Z } from '@/config/zIndex';

interface FeedTopActionBarProps {
  onClose?: () => void;
  isVideo?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  hasLiked: boolean;
  likesCount: number | null;
  commentsCount: number | null;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMore: () => void;
  /** Replaces the default ⋯ button when provided (own posts → PostOwnerMenu). */
  moreSlot?: React.ReactNode;
  isVisible: boolean;
  /** Read-only mode: render only the left cluster (back chevron + mute). */
  readOnly?: boolean;
}

const formatCount = (count: number | null | undefined): string | null => {
  if (count === null || count === undefined || count === 0) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toString();
};

// Bare icon buttons — no chip background, no blur, no border. Drop-shadow on
// the icon itself provides legibility over bright media (Clubhouse-style).
const ICON_SHADOW = 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))';

const chipBase: React.CSSProperties = {
  height: 42,
  minWidth: 42,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: 0,
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  pointerEvents: 'auto',
  fontFamily: 'Geist, system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
  filter: ICON_SHADOW,
};

const chipWithCount: React.CSSProperties = {
  ...chipBase,
  padding: '0 4px',
};

export const FeedTopActionBar: React.FC<FeedTopActionBarProps> = ({
  onClose,
  isVideo = false,
  isMuted = false,
  onToggleMute,
  hasLiked,
  likesCount,
  commentsCount,
  onLike,
  onComment,
  onShare,
  onMore,
  moreSlot,
  isVisible,
  readOnly = false,
}) => {
  const likeStr = formatCount(likesCount);
  const commentStr = formatCount(commentsCount);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: Z.echo + 2,
        pointerEvents: 'none',
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 10px)',
        // Respect landscape notches — never clip back chevron / more button.
        paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(14px, env(safe-area-inset-right, 0px))',
        paddingBottom: 12,
        background:
          'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 100%)',
      }}
    >
      {/* Inner content column — caps readable width on tablets / landscape WebView. */}
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        {/* LEFT cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)' }}>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Back"
              style={chipBase}
            >
              <ChevronLeft size={24} stroke="#fff" strokeWidth={2.5} />
            </button>
          )}

          {isVideo && onToggleMute && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              style={chipBase}
            >
              {isMuted ? (
                <VolumeX size={22} stroke="#fff" strokeWidth={2} />
              ) : (
                <Volume2 size={22} stroke="#fff" strokeWidth={2} />
              )}
            </button>
          )}
        </div>

        {/* RIGHT cluster — hidden in read-only (gallery) mode. */}
        {!readOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px, 2vw, 8px)' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              aria-label={hasLiked ? 'Unlike' : 'Like'}
              style={likeStr ? chipWithCount : chipBase}
            >
              <Heart
                size={24}
                fill={hasLiked ? '#F7931E' : 'transparent'}
                stroke={hasLiked ? '#F7931E' : '#fff'}
                strokeWidth={2}
              />
              {likeStr && (
                <span
                  style={{
                    color: hasLiked ? '#F7931E' : '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {likeStr}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onComment();
              }}
              aria-label="Comments"
              style={commentStr ? chipWithCount : chipBase}
            >
              <MessageCircle size={24} stroke="#fff" strokeWidth={2} />
              {commentStr && (
                <span style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {commentStr}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              aria-label="Share"
              style={chipBase}
            >
              <Send size={24} stroke="#fff" strokeWidth={2} />
            </button>

            {moreSlot ? (
              <div style={{ ...chipBase, cursor: 'auto' }}>
                {moreSlot}
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMore();
                }}
                aria-label="More options"
                style={chipBase}
              >
                <MoreHorizontal size={24} stroke="#fff" strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FeedTopActionBar;
