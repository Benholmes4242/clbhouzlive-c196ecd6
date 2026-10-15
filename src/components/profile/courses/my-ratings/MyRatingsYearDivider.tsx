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
  countryCount?: number;
  isFirst: boolean;
}

const MyRatingsYearDivider: React.FC<MyRatingsYearDividerProps> = ({ year, count, countryCount, isFirst }) => (
  <div
    data-year-divider={year ?? 'undated'}
    data-first={isFirst || undefined}
    style={{ margin: '16px 20px 4px', fontFamily: 'inherit' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 7, borderBottom: `1px solid ${A.HAIRLINE}` }}>
      <span
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 0,
          color: A.INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {year ?? 'Undated'}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0,
          textTransform: 'uppercase',
          color: A.DIM,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {count === 1 ? '1 course' : `${count} courses`}
        {countryCount != null && countryCount > 0 ? ` · ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}` : ''}
      </span>
    </div>
  </div>
);

export default MyRatingsYearDivider;
