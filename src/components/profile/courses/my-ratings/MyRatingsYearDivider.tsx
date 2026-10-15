import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

/**
 * Year spine for the recency sort. Spacing is MyRatingsTierDivider's, reused
 * rather than reinvented: 6/16/12 for the first divider, 24/16/12 after.
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
    style={{ margin: isFirst ? '6px 16px 12px' : '24px 16px 12px', fontFamily: SANS }}
  >
    <div style={{ padding: '0 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
