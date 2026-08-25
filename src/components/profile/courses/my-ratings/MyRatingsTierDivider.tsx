import React from 'react';
import { reviewTierColor } from '@/components/shared/ReviewGhostScore';
import type { RatingTier } from '@/lib/ratingTier';

/**
 * Editorial section header for the stratified My Ratings list.
 * Inset within the page's 16px side padding (not full-bleed).
 *
 * Tier colour comes from the app-wide score bands via `reviewTierColor` — never
 * amber (that is the viewing member's colour) and never a local hex.
 */

const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const INK_TERTIARY = '#94A3B8';
const HAIRLINE = '#E2E8F0';

const TIER_NAMES: readonly string[] = ['EXCEPTIONAL', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];


interface MyRatingsTierDividerProps {
  tierName: string;
  count: number;
  isFirst: boolean;
}

const MyRatingsTierDivider: React.FC<MyRatingsTierDividerProps> = ({
  tierName,
  count,
  isFirst,
}) => {
  return (
    <div
      style={{
        margin: isFirst ? '6px 16px 12px' : '24px 16px 12px',
        fontFamily: FONT_SANS,
      }}
    >
      <div style={{ padding: '0 2px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: TIER_NAMES.includes(tierName)
                  ? reviewTierColor(tierName as RatingTier, 'light')
                  : INK_TERTIARY,

                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {tierName}
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: INK_TERTIARY,
              letterSpacing: '0.12em',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {count}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MyRatingsTierDivider;
