import React from 'react';
import { ShieldCheck } from 'lucide-react';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
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
        gap: 6,
        fontFamily: FONT_GEIST,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={12} color={SEASON_GREEN} strokeWidth={2.5} />
        <span style={{ fontSize: 11, fontWeight: 700, color: INK_55 }}>
          Live WHS handicap data
        </span>
        <span style={{ fontSize: 11, color: INK_40 }}>·</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: INK_55,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Member {membershipNumber}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 400,
          color: INK_40,
        }}
      >
        Synced twice daily
      </div>
    </div>
  );
};

export default WhsConnectionCaption;
