import React from 'react';
import { ShieldCheck } from 'lucide-react';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const SEASON_GREEN = '#006747';

interface Props {
  membershipNumber: string;
}

export const WhsConnectionCaption: React.FC<Props> = ({ membershipNumber }) => {
  return (
    <div
      style={{
        padding: '24px 20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: FONT_GEIST,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={12} color={SEASON_GREEN} strokeWidth={2.5} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--hcp-t-60)' }}>
          Live WHS handicap data
        </span>
        <span style={{ fontSize: 11, color: 'var(--hcp-t-40)' }}>·</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--hcp-t-60)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Member {membershipNumber}
        </span>
      </div>
    </div>
  );
};

export default WhsConnectionCaption;
