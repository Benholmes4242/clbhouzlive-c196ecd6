/**
 * ReviewBanner — Top overlay for review posts showing course name + rating badge.
 */
import type { ReviewData } from './types/media';

interface ReviewBannerProps {
  review: ReviewData;
  isVisible: boolean;
}

function getRatingLabel(rating: number): string {
  if (rating >= 9.0) return 'OUTSTANDING';
  if (rating >= 8.0) return 'EXCELLENT';
  if (rating >= 7.0) return 'VERY GOOD';
  if (rating >= 6.0) return 'GOOD';
  if (rating >= 5.0) return 'AVERAGE';
  return 'BELOW AVERAGE';
}

function getRatingColor(rating: number): string {
  if (rating >= 9.0) return '#F59E0B';
  if (rating >= 8.0) return '#D97706';
  if (rating >= 7.0) return '#059669';
  if (rating >= 6.0) return '#0D9488';
  return '#6B7280';
}

export function ReviewBanner({ review, isVisible }: ReviewBannerProps) {
  const color = getRatingColor(review.rating);

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 48px)',
        left: 12,
        right: 12,
        background: 'rgba(0, 0, 0, 0.65)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 300ms ease',
        animation: isVisible ? 'bannerFadeIn 300ms ease-out' : undefined,
      }}
    >
      {/* Course name */}
      <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#FFFFFF',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {review.courseName}
        </p>
      </div>

      {/* Rating badge */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 28, fontWeight: 700, color, margin: 0, lineHeight: 1 }}>
          {review.rating.toFixed(1)}
        </p>
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            color,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {getRatingLabel(review.rating)}
        </p>
      </div>
    </div>
  );
}
