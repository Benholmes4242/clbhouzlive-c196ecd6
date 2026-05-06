import React from 'react';
import { Swords } from 'lucide-react';

interface Props {
  slotIndex: number;
  label?: string;
  onClick: () => void;
}

const T = {
  bgFrom: '#0F172A',
  bgTo: '#1e293b',
  amber: '#F7931E',
  amberLight: '#F59E0B',
  amberRingOuter: 'rgba(247,147,30,0.15)',
  amberRingInner: 'rgba(247,147,30,0.10)',
  white: '#FFFFFF',
  slate: '#94A3B8',
};

const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

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
        background: `linear-gradient(135deg, ${T.bgFrom} 0%, ${T.bgTo} 100%)`,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        fontFamily: FONT_DISPLAY,
        border: 'none',
        padding: '32px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        boxShadow: '0 8px 24px -10px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06) inset',
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
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.amberLight}, ${T.amber})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(247,147,30,0.35)',
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
          color: T.white,
          letterSpacing: '-0.01em',
          position: 'relative',
        }}
      >
        Build your rival list
      </h3>

      <p
        style={{
          margin: 0,
          marginBottom: 16,
          fontSize: 12,
          color: T.slate,
          lineHeight: 1.45,
          maxWidth: 240,
          position: 'relative',
        }}
      >
        Pick someone to track head-to-head. Stats update with every round you both play.
      </p>

      <div
        style={{
          background: `linear-gradient(135deg, ${T.amberLight}, ${T.amber})`,
          border: 'none',
          borderRadius: 10,
          padding: '9px 18px',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          boxShadow: '0 2px 10px rgba(247,147,30,0.30)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          position: 'relative',
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 800 }}>+</span>
        Pick a rival
      </div>
    </button>
  );
};

export default RivalryAddCard;
