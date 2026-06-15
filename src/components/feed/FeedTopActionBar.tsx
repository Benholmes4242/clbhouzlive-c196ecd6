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
  isVisible: boolean;
}

const formatCount = (count: number | null | undefined): string | null => {
  if (count === null || count === undefined || count === 0) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toString();
};

const CHIP_BG = 'rgba(0,0,0,0.42)';
const CHIP_BORDER = '1px solid rgba(255,255,255,0.12)';
const CHIP_BLUR = 'blur(14px)';

// Icon-only chips are a perfect 42×42 square. Chips with inline counts grow
// horizontally via padding — these are the only chips that need extra width.
const chipBase: React.CSSProperties = {
  height: 42,
  minWidth: 42,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: 0,
  borderRadius: 13,
  background: CHIP_BG,
  backdropFilter: CHIP_BLUR,
  WebkitBackdropFilter: CHIP_BLUR,
  border: CHIP_BORDER,
  color: '#fff',
  cursor: 'pointer',
  pointerEvents: 'auto',
  fontFamily: 'Geist, system-ui, sans-serif',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
};

const chipWithCount: React.CSSProperties = {
  ...chipBase,
  padding: '0 11px',
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
  isVisible,
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
                <VolumeX size={20} stroke="#fff" strokeWidth={2} />
              ) : (
                <Volume2 size={20} stroke="#fff" strokeWidth={2} />
              )}
            </button>
          )}
        </div>

        {/* RIGHT cluster — gap tightens on the smallest phones so the row never wraps. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)' }}>
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
              size={20}
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
            style={chipBase}
          >
            <MessageCircle size={20} stroke="#fff" strokeWidth={2} />
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
            <Send size={20} stroke="#fff" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMore();
            }}
            aria-label="More options"
            style={chipBase}
          >
            <MoreHorizontal size={20} stroke="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedTopActionBar;
