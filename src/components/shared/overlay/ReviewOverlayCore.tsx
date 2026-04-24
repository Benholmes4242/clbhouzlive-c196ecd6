/**
 * ReviewOverlayCore — Frost Panel review overlay (PR 2 visual redesign).
 *
 * Variants:
 * - 'fullscreen': scaled-up Frost Panel for fullscreen review media viewers.
 *   Renders tier pill + title row (course name + subtitle, score on right) + author row.
 *   OMITS breakdown (sheet is one tap away).
 * - 'tile': compact Frost chip for grid thumbnails (~195px cells).
 *   Renders tier pill + title + score in top-right corner.
 *   OMITS author row, OMITS breakdown.
 *
 * Tap → existing onCourseTap callback or default navigation.
 */

import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  FROST,
  FROST_BLUR,
  FROST_SCORE_GRADIENT,
  formatFrostRating,
  splitCourseName,
} from '@/lib/frostPanel';

export type ReviewOverlayVariant = 'fullscreen' | 'tile';

export interface ReviewOverlayCoreProps {
  courseName: string;
  courseLocation?: string;
  rating: number;
  /** 'fullscreen' for Clubhouse/Preview, 'tile' for grid thumbnails */
  variant: ReviewOverlayVariant;
  /** Show "Preview" badge (fullscreen only) */
  showPreviewBadge?: boolean;
  /** User info for bottom panel (tile / fullscreen variant) */
  user?: {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  /** Course ID for navigation - enables tappable tile */
  courseId?: string;
  /** Custom handler for course tap (overrides default navigation) */
  onCourseTap?: () => void;
  /** Optional course subtitle (e.g. "The King's Course"). Falls back to splitting courseName. */
  courseSubtitle?: string | null;
  /** Optional reviewer stats — when present, shows "N rated" next to author name. */
  reviewerStats?: {
    coursesRated?: number | null;
  } | null;
  className?: string;
}

// Tier pill removed (PR 5) — the score speaks for itself.

const ReviewOverlayCoreInner: React.FC<ReviewOverlayCoreProps> = ({
  courseName,
  courseLocation,
  rating,
  variant,
  showPreviewBadge = false,
  user,
  courseId,
  onCourseTap,
  courseSubtitle,
  reviewerStats,
  className,
}) => {
  const navigate = useNavigate();
  const isFullscreen = variant === 'fullscreen';
  const isTappable = !!(courseId || onCourseTap);

  const initials = useMemo(
    () =>
      (user?.name || 'G')
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase(),
    [user?.name],
  );

  const handleCourseTap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onCourseTap) {
        onCourseTap();
      } else if (courseId) {
        navigate(`/courses/${courseId}`);
      }
    },
    [courseId, navigate, onCourseTap],
  );

  const handleUserTap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const profileId = user?.username || user?.id;
      if (profileId) {
        navigate(`/profile/${profileId}`);
      }
    },
    [navigate, user?.id, user?.username],
  );

  const formattedRating = useMemo(() => formatFrostRating(rating), [rating]);

  const { name: titleName, subtitle: derivedSubtitle } = useMemo(
    () => (courseSubtitle ? { name: courseName, subtitle: courseSubtitle } : splitCourseName(courseName)),
    [courseName, courseSubtitle],
  );

  const coursesRated = reviewerStats?.coursesRated ?? null;

  // Wrapper for tappable course area — renders as div (avoids nested <button>)
  const TappableWrapper = useMemo(() => {
    const Wrapper: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
      children,
      className: wrapperClassName,
      style,
    }) => {
      if (!isTappable) {
        return (
          <div className={cn(wrapperClassName, 'pointer-events-auto')} style={style}>
            {children}
          </div>
        );
      }
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={handleCourseTap}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCourseTap(e as unknown as React.MouseEvent);
            }
          }}
          className={cn(
            wrapperClassName,
            'w-full text-left cursor-pointer pointer-events-auto',
            'transition-transform active:scale-[0.98]',
          )}
          aria-label={`View ${titleName} details`}
          style={style}
        >
          {children}
        </div>
      );
    };
    return Wrapper;
  }, [isTappable, handleCourseTap, titleName]);

  return (
    <div className={cn('absolute inset-0 pointer-events-none z-10', className)}>
      {/* TILE VARIANT — compact Frost chip for grid thumbnails */}
      {variant === 'tile' && (
        <>
          {/* Subtle gradients for legibility against varied photo backdrops */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 via-black/15 to-transparent" />

          <TappableWrapper
            className="absolute top-2 left-2 right-2 z-10"
            style={{
              borderRadius: 12,
              padding: '8px 10px',
              background: FROST.glass,
              backdropFilter: FROST_BLUR.tile,
              WebkitBackdropFilter: FROST_BLUR.tile,
              border: `1px solid ${FROST.border}`,
              color: FROST.ink,
              fontFamily: 'Geist, system-ui, sans-serif',
              boxShadow: FROST.innerHighlight,
              transform: 'translateZ(0)',
              willChange: 'backdrop-filter',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Tier pill removed (PR 5) */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '-0.2px',
                    lineHeight: 1.1,
                    color: FROST.ink,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                  }}
                >
                  {titleName}
                </div>
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '-0.4px',
                  lineHeight: 1,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                  ...FROST_SCORE_GRADIENT,
                }}
              >
                {formattedRating}
              </span>
            </div>
          </TappableWrapper>
        </>
      )}

      {/* FULLSCREEN VARIANT — scaled-up Frost Panel */}
      {isFullscreen && (
        <TappableWrapper
          className="absolute left-4 right-4 z-20 top-[76px]"
          style={{
            position: 'relative',
            padding: '18px 18px 16px',
            borderRadius: 24,
            background: FROST.glass,
            backdropFilter: FROST_BLUR.panel,
            WebkitBackdropFilter: FROST_BLUR.panel,
            border: `1px solid ${FROST.border}`,
            boxShadow: `${FROST.dropShadow}, ${FROST.innerHighlight}`,
            color: FROST.ink,
            fontFamily: 'Geist, system-ui, sans-serif',
            overflow: 'hidden',
            transform: 'translateZ(0)',
            willChange: 'backdrop-filter',
          }}
        >
          {/* Decorative amber glow orb */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -40,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: FROST.amberGlow,
              filter: 'blur(10px)',
              pointerEvents: 'none',
            }}
          />

          {/* Tier pill + optional preview badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10, position: 'relative' }}>
            <TierPill tier={tierLabel} />
            {showPreviewBadge && (
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 99,
                  background: 'rgba(255,255,255,0.10)',
                  color: FROST.inkMute,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                }}
              >
                Preview
              </span>
            )}
          </div>

          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
              position: 'relative',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.4px',
                  lineHeight: 1.05,
                  color: FROST.ink,
                  wordBreak: 'break-word',
                }}
              >
                {titleName}
              </div>
              {derivedSubtitle && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 13,
                    fontWeight: 500,
                    color: FROST.inkMute,
                    lineHeight: 1.2,
                  }}
                >
                  {derivedSubtitle}
                </div>
              )}
              {courseLocation && !derivedSubtitle && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: FROST.inkMuter,
                    lineHeight: 1.2,
                  }}
                >
                  {courseLocation}
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 2,
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  letterSpacing: '-2.2px',
                  lineHeight: 0.85,
                  ...FROST_SCORE_GRADIENT,
                }}
              >
                {formattedRating}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: FROST.inkFaint }}>/10</span>
            </div>
          </div>

          {/* Author row (only when user is provided) */}
          {user?.name && (
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={handleUserTap}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  minWidth: 0,
                }}
                aria-label={`View ${user.name}'s profile`}
              >
                <SquircleAvatar size={20} src={user.avatar} alt={user.name} fallback={initials} hideRing />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: FROST.ink,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name}
                </span>
              </button>
              {coursesRated != null && (
                <>
                  <span style={{ color: FROST.inkFaint, fontSize: 12 }}>·</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: FROST.inkMuter,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {coursesRated} rated
                  </span>
                </>
              )}
            </div>
          )}
        </TappableWrapper>
      )}
    </div>
  );
};

export const ReviewOverlayCore = memo(ReviewOverlayCoreInner);

export default ReviewOverlayCore;
