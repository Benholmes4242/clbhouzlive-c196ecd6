import React from 'react';
import {
  AMBER,
  AMBER_DEEP,
  FONT_SANS,
  HAIRLINE,
  INK_TERTIARY,
} from './myRatingsTokens';
import {
  getSectionHeaderName,
  type MyRatingsCardTier,
} from './myRatingsCardTiers';

interface MyRatingsTierDividerProps {
  tier: MyRatingsCardTier;
  count: number;
  /** First divider sits closer to the page header. */
  isFirst?: boolean;
}

/**
 * Editorial section header used between tier groups.
 * Amber 3×13px vertical bar marker · tier name (amber-deep, letter-spaced) ·
 * count on the right. Hairline below.
 */
const MyRatingsTierDivider: React.FC<MyRatingsTierDividerProps> = ({
  tier,
  count,
  isFirst = false,
}) => {
  return (
    <div
      style={{
        marginTop: isFirst ? 16 : 28,
        marginBottom: 4,
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 3,
            height: 13,
            background: AMBER,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: AMBER_DEEP,
            letterSpacing: '0.18em',
            flex: 1,
          }}
        >
          {getSectionHeaderName(tier)}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: INK_TERTIARY,
            letterSpacing: '0.12em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </span>
      </div>
      <div
        style={{
          height: '0.5px',
          background: HAIRLINE,
          marginTop: 10,
        }}
      />
    </div>
  );
};

export default MyRatingsTierDivider;
