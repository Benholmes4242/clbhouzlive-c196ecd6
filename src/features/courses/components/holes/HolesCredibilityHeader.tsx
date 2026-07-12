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
          background: 'rgba(47,107,79,0.07)',
          border: '1px solid rgba(47,107,79,0.18)',
          fontSize: 11.5,
          fontWeight: 600,
          color: SC_ACCENT,
        }}
      >
        <ShieldCheck size={13} strokeWidth={2.2} />
        <span>
          <span style={{ fontWeight: 800 }}>
            {totalRounds.toLocaleString()} round{totalRounds === 1 ? '' : 's'}
          </span>
          {' · Official WHS · Gross scoring'}
        </span>
      </div>
    </div>
  );
};

export default HolesCredibilityHeader;
