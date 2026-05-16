import React from 'react';
import { Swords } from 'lucide-react';

interface Props {
  slotIndex: number;
  label?: string;
  onClick: () => void;
}

const T = {
  amber: '#F7931E',
  amberLight: '#FBBF24',
  amberRingOuter: 'rgba(247,147,30,0.18)',
  amberRingInner: 'rgba(247,147,30,0.12)',
  amberBorder: 'rgba(247,147,30,0.55)',
  /** Card uses amber radial wash from top over dark canvas */
  cardBg:
    'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(247,147,30,0.16), transparent 70%), var(--hcp-bg-1)',
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
};

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const RivalryAddCard: React.FC<Props> = ({ slotIndex: _slotIndex, label: _label, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Add a rival"
      style={{
        flex: '0 0 auto',
        width: 'calc(88vw - 16px)',
        maxWidth: 320,
        minHeight: 240,
        scrollSnapAlign: 'start',
        background: T.cardBg,
        border: `1px solid ${T.amberBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        fontFamily: FONT_GEIST,
        padding: '32px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: `1px solid ${T.amberRingOuter}`,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `1px solid ${T.amberRingInner}`,
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: `linear-gradient(135deg, ${T.amberLight}, ${T.amber})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(247,147,30,0.45)',
          marginBottom: 14,
          position: 'relative',
        }}
      >
        <Swords size={24} strokeWidth={2.2} color="#fff" />
      </div>

      <h3
        style={{
          margin: 0,
          marginBottom: 6,
          fontSize: 16,
          fontWeight: 800,
          color: T.ink,
          letterSpacing: '-0.01em',
          position: 'relative',
        }}
      >
        Build your rival list
      </h3>

      <p
        style={{
          margin: 0,
          marginBottom: 18,
          fontSize: 12.5,
          color: T.inkMute,
          lineHeight: 1.45,
          maxWidth: 280,
          position: 'relative',
        }}
      >
        Pick someone to track head-to-head. Stats update with every round you both play.
      </p>

      <div
        style={{
          background: `linear-gradient(135deg, ${T.amberLight} 0%, ${T.amber} 100%)`,
          border: 'none',
          borderRadius: 999,
          padding: '12px 22px',
          color: '#fff',
          fontSize: 12.5,
          fontWeight: 800,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          position: 'relative',
          boxShadow:
            '0 4px 14px rgba(247,147,30,0.40), inset 0 1px 0 rgba(255,255,255,0.20)',
        }}
      >
        Pick a rival
      </div>
    </button>
  );
};

export default RivalryAddCard;
