import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { FONT, SC_ACCENT } from './_constants';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface Props {
  totalRounds: number;
}

export const HolesCredibilityHeader: React.FC<Props> = ({ totalRounds }) => {
  return (
    <div style={{ padding: '16px 16px', fontFamily: FONT }}>
      <SectionHeader
        role="section"
        kicker="OFFICIAL HOLE DATA"
        accent={SC_ACCENT}
      />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 2,
          padding: '7px 12px',
          borderRadius: 999,
          background: 'rgba(247,147,30,0.08)',
          border: '1px solid rgba(247,147,30,0.18)',
          fontSize: 11.5,
          fontWeight: 600,
          color: '#B8720E',
        }}
      >
        <ShieldCheck size={13} strokeWidth={2.2} />
        <span>
          <span style={{ fontWeight: 800 }}>
            {totalRounds.toLocaleString()} round{totalRounds === 1 ? '' : 's'}
          </span>
          {' \u00B7 Official WHS \u00B7 Gross scoring'}
        </span>
      </div>
    </div>
  );
};

export default HolesCredibilityHeader;
