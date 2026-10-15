import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

/**
 * Year spine for the recency sort, to the signed-off mock: 14 above, 7 below,
 * one hairline beneath.
 */
interface MyRatingsYearDividerProps {
  /** Calendar year of the rows beneath; null groups undated rows. */
  year: number | null;
  count: number;
  isFirst: boolean;
}

const MyRatingsYearDivider: React.FC<MyRatingsYearDividerProps> = ({ year, count, isFirst }) => (
  <div
    data-year-divider={year ?? 'undated'}
    data-first={isFirst || undefined}
    style={{ margin: '14px 20px 0', fontFamily: SANS }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 7, borderBottom: `1px solid ${A.HAIRLINE}` }}>
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: A.INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {year ?? 'Undated'}
      </span>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: A.DIM,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {count === 1 ? '1 course' : `${count} courses`}
      </span>
    </div>
  </div>
);

export default MyRatingsYearDivider;
