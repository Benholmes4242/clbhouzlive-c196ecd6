/**
 * Preview Step — Dark editorial design after review submission
 * Two paths: with media (hero from user media) and without (course thumbnail or gradient)
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { formatCourseLocation } from '@/utils/courseLocation';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReviewWizardCourse, ReviewBreakdowns, ReviewMediaItem } from '../types';
import type { ReviewVisibility } from '../ReviewPostingOptionsSheet';

interface PreviewStepProps {
  course: ReviewWizardCourse | null;
  reviewId: string;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  creator: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  visibility?: ReviewVisibility;
  onSkip: () => void;
  onShare: () => void;
  onClose: () => void;
  isSharing: boolean;
}

export function PreviewStep({
  course,
  rating,
  review,
  media,
  creator,
  onSkip,
  onShare,
  isSharing,
}: PreviewStepProps) {
  const displayableMedia = useMemo(() => {
    if (!media || media.length === 0) return [];
    return media
      .filter(m => m.previewUrl || m.uploadedUrl)
      .map((m, index) => ({
        id: m.id || `media-${index}`,
        type: m.type,
        url: m.previewUrl || m.uploadedUrl || '',
      }))
      .filter(m => m.url);
  }, [media]);

  const hasMedia = displayableMedia.length > 0;
  const [heroLoaded, setHeroLoaded] = useState(false);

  const courseLocation = course
    ? formatCourseLocation({ country: course.country || null, sub_country: course.sub_country || null, region: course.region || null })
    : '';

  // Hero image source
  const heroSrc = hasMedia
    ? displayableMedia[0].url
    : course?.thumbnail_image || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-[100dvh] bg-black"
    >
      {/* Hero — 45dvh */}
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ height: '50dvh', minHeight: 200, maxHeight: 360 }}
      >
        {/* Shimmer while loading */}
        {!heroLoaded && (
          <Skeleton className="clb-shimmer-dark absolute inset-0" style={{ borderRadius: 0 }} />
        )}

        {/* Hero image */}
        {heroSrc ? (
          <img
            src={heroSrc}
            alt={course?.name || 'Review'}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setHeroLoaded(true)}
            draggable={false}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #0f0a00, #1a1000)' }}
            ref={() => setHeroLoaded(true)}
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)',
        }} />

        {/* Top-left: Review saved badge */}
        <div
          className="absolute flex items-center gap-1.5"
          style={{
            top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
            left: 16,
            background: '#22c55e',
            borderRadius: 99,
            padding: '5px 12px',
          }}
        >
          <span style={{ fontSize: 10, color: '#fff' }}>✓</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Review saved</span>
        </div>

        {/* Top-right: Page counter (only with media) */}
        {hasMedia && displayableMedia.length > 1 && (
          <div
            className="absolute"
            style={{
              top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
              right: 16,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(10px)',
              borderRadius: 99,
              padding: '4px 10px',
              color: 'rgba(255,255,255,0.75)',
              fontSize: 11,
            }}
          >
            1/{displayableMedia.length}
          </div>
        )}

        {/* Bottom-left: Headline */}
        <div className="absolute bottom-0 left-0 right-0" style={{ padding: '0 20px 18px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#F7931E',
            letterSpacing: '0.18em', textTransform: 'uppercase' as const,
            marginBottom: 6,
          }}>
            Want others to see this?
          </div>
          <div style={{
            fontSize: 'clamp(20px, 6vw, 28px)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            Post it to<br />your feed
          </div>
        </div>
      </div>

      {/* Scrollable content below hero */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column' as const,
        }}
      >
        {/* SECTION 2 — Amber explanation strip */}
        {isSharing ? (
          <div style={{ margin: '16px 16px 0', overflow: 'hidden' }}>
            <Skeleton className="clb-shimmer-dark" style={{ height: 72, borderRadius: 12 }} />
          </div>
        ) : (
          <div style={{
            margin: '16px 16px 0',
            background: 'rgba(247,147,30,0.08)',
            border: '1px solid rgba(247,147,30,0.18)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>📣</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                Share with the Clbhouz community
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Your review will appear in the Clubhouse feed for other golfers to discover. Visible to everyone.
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3 — Review capsule */}
        {!course ? (
          <div style={{ margin: '14px 16px 0', overflow: 'hidden' }}>
            <Skeleton className="clb-shimmer-dark" style={{ height: 140, borderRadius: 16 }} />
          </div>
        ) : (
          <div style={{ margin: '14px 16px 0' }}>
            <div
              className="w-full overflow-hidden"
              style={{
                background: 'rgba(20, 13, 4, 0.95)',
                border: '1px solid rgba(245, 158, 11, 0.22)',
                borderRadius: 16,
                position: 'relative',
              }}
            >
              {/* Watermark score */}
              <div style={{
                position: 'absolute',
                top: -14,
                right: -6,
                fontSize: 120,
                fontWeight: 900,
                color: 'rgba(245,158,11,0.055)',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                userSelect: 'none',
                pointerEvents: 'none',
                fontFamily: 'Georgia, serif',
              }}>
                {rating?.toFixed(1) || '0.0'}
              </div>

              {/* Amber accent bar */}
              <div style={{ height: 2.5, background: 'linear-gradient(90deg, rgba(245,158,11,0.8), transparent)' }} />

              <div style={{ padding: '10px 14px 13px', position: 'relative' }}>
                {/* Row 1: Badge + score */}
                <div className="flex items-center justify-between mb-2">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(245,158,11,0.12)',
                    border: '0.5px solid rgba(245,158,11,0.35)',
                    borderRadius: 6,
                    padding: '3px 8px',
                  }}>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: '#f59e0b',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase' as const,
                    }}>
                      ★ Course Review
                    </span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: '#f59e0b',
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      fontFamily: 'Georgia, serif',
                    }}>
                      {rating?.toFixed(1) || '0.0'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(245,158,11,0.45)' }}>/10</span>
                  </div>
                </div>

                {/* Row 2: Course name */}
                <div style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  fontFamily: 'Georgia, serif',
                  marginBottom: 4,
                }}>
                  {course.name}
                </div>

                {/* Row 3: Location */}
                {courseLocation && (
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span style={{ fontSize: 11 }}>📍</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>{courseLocation}</span>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 0.5, background: 'linear-gradient(90deg, rgba(245,158,11,0.3) 0%, transparent 80%)', marginBottom: 10 }} />

                {/* Row 4: Reviewer */}
                <div className="flex items-center gap-2 mb-2">
                  {creator.avatar ? (
                    <img src={creator.avatar} alt={creator.name} className="w-7 h-7 rounded-lg object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
                      {creator.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    {creator.name || 'Golfer'}
                  </span>
                </div>

                {/* Row 5: Review text */}
                {review && (
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.42)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                    fontStyle: 'italic',
                  }}>
                    "{review}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4 — Actions */}
        <div style={{
          padding: '16px 16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 'auto',
        }}>
          {/* Primary CTA */}
          <button
            onClick={onShare}
            disabled={isSharing}
            className="active:scale-[0.97] transition-transform"
            style={{
              width: '100%',
              height: 54,
              minHeight: 44,
              borderRadius: 16,
              border: 'none',
              background: isSharing
                ? 'rgba(247,147,30,0.5)'
                : 'linear-gradient(135deg, #F7931E, #e8820a)',
              color: '#000',
              fontSize: 15,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isSharing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(247,147,30,0.3)',
            }}
          >
            {isSharing ? (
              <span style={{ color: '#000' }}>Posting...</span>
            ) : (
              <>
                <span>📤</span>
                <span>Post to Clubhouse Feed</span>
              </>
            )}
          </button>

          {/* Visibility note */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ fontSize: 12 }}>🌐</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Visible to everyone</span>
          </div>

          {/* Skip */}
          <button
            onClick={onSkip}
            disabled={isSharing}
            className="active:scale-[0.97] transition-transform"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13,
              cursor: 'pointer',
              padding: '4px 0',
              minHeight: 44,
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
