import React from 'react';
import { FONT, INK, SC_ACCENT } from './_constants';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface Props {
  totalRounds: number;
}

export const HolesCredibilityHeader: React.FC<Props> = ({ totalRounds }) => {
  return (
    <div style={{ padding: '20px 18px 18px', fontFamily: FONT }}>
      <SectionHeader
        role="section"
        kicker="OFFICIAL HOLE DATA"
        accent={SC_ACCENT}
      />
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: INK,
          fontWeight: 500,
        }}
      >
        Aggregated from{' '}
        <span style={{ fontWeight: 800 }}>
          {totalRounds.toLocaleString()} round{totalRounds === 1 ? '' : 's'}
        </span>{' '}
        played by England Golf members at this course. Gross scoring.
      </div>
    </div>
  );
};

export default HolesCredibilityHeader;
