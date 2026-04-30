/**
 * BreathingRoomBottomBar — bottom-left content slot for regular posts.
 *
 * Renders, top → bottom:
 *   1. Course tag pill (⛳ + course name) — if a course is tagged. Reads as
 *      "posted at <course>".
 *   2. Author identity row (avatar + name + HCP, sub-line: home club · time)
 *   3. Caption — direct on the photo, 2-line clamp default, tap-anywhere to
 *      expand when the caption is long.
 *
 * The horizontal action strip and FOLLOW pill have moved to FeedActionRail.
 * The dark gradient scrim has been removed — the photo breathes.
 *
 * Reviews: when isReview is true, this component renders nothing (the
 * InlineReviewCard handles author + course + excerpt instead).
 *
 * The video scrubber is now mounted by FeedOverlayLayer outside this component.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { Z } from '@/config/zIndex';
import PostContentWithTags from '@/components/posts/PostContentWithTags';
import type { FeedPostTag } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FROST, FROST_BLUR } from '@/lib/frostPanel';

interface BreathingRoomBottomBarProps {
  caption: string;
  tags: FeedPostTag[];
  isVisible: boolean;
  /** NEW: stable identifier for the active post — used to reset caption expansion on post change */
  postId?: string;
  /** Base offset from screen bottom in px. Omit for Clubhouse (respects bottom nav); pass 0 for fullscreen overlay (no nav). */
  bottomOffset?: number;
  /** Controlled caption expansion state (lifted to parent for review panel coordination) */
  captionExpanded?: boolean;
  onCaptionExpandedChange?: (expanded: boolean) => void;
  /** Author identity rendered above the caption. Null on editorial cards. */
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string;
    handicapIndex: number | null;
    homeClub: string | null;
    timeAgoLabel: string;
  } | null;
  onAuthorTap?: () => void;
  /** When true, suppress all bottom content (review posts have their own card). */
  isReview?: boolean;
  /** Course tagged on the post. Renders the "posted at" pill above author. */
  golfCourse?: { id: string; name: string } | null;
  onCourseTap?: () => void;
}

export const BreathingRoomBottomBar: React.FC<BreathingRoomBottomBarProps> = ({
  caption,
  tags,
  isVisible,
  postId,
  bottomOffset,
  captionExpanded: captionExpandedProp,
  onCaptionExpandedChange,
  author,
  onAuthorTap,
  isReview = false,
  golfCourse,
  onCourseTap,
}) => {
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
    setCaptionExpandedLocal(false);
    onCaptionExpandedChange?.(false);
  }, [postId, onCaptionExpandedChange]);

  // Nothing renders for reviews — InlineReviewCard owns the bottom slot.
  if (isReview) return null;

  const hasContent = !!golfCourse || !!author || !!caption;
  if (!hasContent) return null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom:
          bottomOffset !== undefined
            ? `${bottomOffset + 20}px`
            : 'calc(var(--bottom-nav-height, 88px) + 20px)',
        left: 12,
        // Reserve space for the right-side action rail (rail width ~52px + gap)
        right: 78,
        zIndex: Z.echo,
        pointerEvents: 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      <div style={{ pointerEvents: isVisible ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Course tag pill — sits ABOVE author, reads as "posted at" */}
        {golfCourse && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCourseTap?.();
            }}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              maxWidth: '100%',
              padding: '5px 11px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.12)',
              border: '0.5px solid rgba(255, 255, 255, 0.30)',
              backdropFilter: 'blur(40px) saturate(160%)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%)',
              boxShadow: 'inset 0 0.5px 0 0 rgba(255,255,255,0.40), 0 4px 12px rgba(0,0,0,0.10)',
              cursor: onCourseTap ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
            aria-label={`View ${golfCourse.name}`}
          >
            <span
              style={{
                fontSize: 13,
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              ⛳
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.20)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {golfCourse.name}
            </span>
          </button>
        )}

        {/* Author identity row */}
        {author && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAuthorTap?.();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: onAuthorTap ? 'pointer' : 'default',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <SquircleAvatar
              size={32}
              src={author.avatarUrl}
              alt={author.displayName}
              fallback={author.displayName?.[0] ?? '?'}
              hairlineRing
              ringColor="rgba(255,255,255,0.95)"
            />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    minWidth: 0,
                  }}
                >
                  {author.displayName}
                </span>
                {author.handicapIndex !== null && Number.isFinite(author.handicapIndex) && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.7)',
                      letterSpacing: '0.04em',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    HCP {author.handicapIndex!.toFixed(1)}
                  </span>
                )}
              </div>
              {(author.homeClub || author.timeAgoLabel) && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.75)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  }}
                >
                  {author.homeClub ? `${author.homeClub} · ${author.timeAgoLabel}` : author.timeAgoLabel}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Caption — tap anywhere to expand */}
        {caption &&
          (() => {
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

            const displayTags = (tags ?? []).filter(
              (t) => (t.end_index ?? 0) <= displayText.length,
            );

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
                  cursor: isLong ? 'pointer' : 'default',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  fontFamily: 'inherit',
                  textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                  wordBreak: 'break-word',
                }}
                aria-expanded={captionExpanded}
                aria-label={isLong ? (showFull ? 'Show less' : 'Show more') : undefined}
              >
                <PostContentWithTags content={displayText} tags={displayTags} />
                {isLong && (
                  <>
                    {showFull ? ' ' : '… '}
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                      {showFull ? 'less' : 'more'}
                    </span>
                  </>
                )}
              </button>
            );
          })()}
      </div>
    </motion.div>
  );
};

export default BreathingRoomBottomBar;
