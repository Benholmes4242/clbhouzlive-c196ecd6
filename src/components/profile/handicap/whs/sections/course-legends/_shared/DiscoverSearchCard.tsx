import React from 'react';
import { Search, Crown, Sparkles } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const DiscoverSearchCard: React.FC<Props> = ({ value, onChange }) => (
  <div style={{ padding: '4px 16px', marginTop: 32 }}>
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 14,
        borderRadius: 14,
        background:
          'linear-gradient(135deg, rgba(247,147,30,0.08) 0%, rgba(247,147,30,0.02) 100%)',
        border: '1px solid rgba(247,147,30,0.22)',
        fontFamily: FONT,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -10,
          top: -10,
          opacity: 0.08,
          color: GOLD,
          transform: 'rotate(15deg)',
          pointerEvents: 'none',
        }}
      >
        <Crown size={80} strokeWidth={1.4} />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 800,
          color: GOLD,
          letterSpacing: '0.16em',
          marginBottom: 8,
        }}
      >
        <Sparkles size={11} strokeWidth={2.4} />
        EVERY COURSE HAS A LEGEND
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.25,
          color: 'var(--hcp-t-100)',
          marginBottom: 10,
          maxWidth: '86%',
        }}
      >
        Search any course — see who's holding the records you could chase.
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(0,0,0,0.30)',
          border: '1px solid rgba(247,147,30,0.35)',
          borderRadius: 10,
          padding: '10px 14px',
        }}
      >
        <Search size={16} color={GOLD} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Try "Augusta" or "Royal Birkdale"…'
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: FONT,
            fontSize: 13,
            color: 'var(--hcp-t-100)',
          }}
        />
      </div>
    </div>
  </div>
);

export default DiscoverSearchCard;
