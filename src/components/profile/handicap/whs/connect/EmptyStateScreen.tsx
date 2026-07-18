import React from 'react';
import { ChevronRight, Search, Flag } from 'lucide-react';

const INK = '#0F172A';
const INK_45 = '#64748B';
const INK_30 = '#94A3B8';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
const GREEN = '#059669';
const GREEN_BG = 'rgba(5,150,105,0.08)';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${HAIR}`,
        borderRadius: 16,
        padding: '32px 22px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 28,
          background: GREEN_BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 22,
        }}
      >
        <Flag size={42} color={GREEN} strokeWidth={2} />
      </div>

      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          margin: '0 0 10px',
          maxWidth: 280,
        }}
      >
        Connect your official WHS handicap
      </h2>

      <p
        style={{
          fontSize: 14.5,
          color: INK_45,
          lineHeight: 1.5,
          margin: '0 0 24px',
          maxWidth: 300,
        }}
      >
        Track every round, see your index move in real time, and play against friends, wherever you golf.
      </p>

      <button
        type="button"
        onClick={onPickCountry}
        style={{
          width: '100%',
          maxWidth: 360,
          background: FIELD_FILL,
          border: `1px solid ${HAIR}`,
          borderRadius: 14,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          fontFamily: FONT,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#fff',
            border: `1px solid ${HAIR}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Search size={20} color={INK} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: INK_45,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Start here
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: INK,
              letterSpacing: '-0.01em',
            }}
          >
            Select your country
          </div>
        </div>
        <ChevronRight size={20} color={INK_30} strokeWidth={2} />
      </button>
    </div>
  );
};

export default EmptyStateScreen;
