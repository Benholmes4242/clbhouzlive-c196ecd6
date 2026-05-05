import React from 'react';
import { Plus } from 'lucide-react';

interface Props {
  slotIndex: number;
  label?: string;
  onClick: () => void;
}

const T = {
  bgFrom: '#0a1628',
  bgTo: '#060c16',
  amber: '#F7931E',
  whiteMute: 'rgba(255,255,255,0.55)',
  hairline: 'rgba(255,255,255,0.10)',
};

export const RivalryAddCard: React.FC<Props> = ({ slotIndex: _slotIndex, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 'calc(88vw - 16px)',
        maxWidth: 320,
        minHeight: 220,
        scrollSnapAlign: 'start',
        background: `linear-gradient(160deg, ${T.bgFrom}, ${T.bgTo})`,
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        fontFamily: 'SF Pro Display, system-ui, sans-serif',
        border: `1px dashed ${T.hairline}`,
        padding: 0,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${T.amber} 0%, rgba(247,147,30,0.4) 100%)`,
        }}
      />
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '34%',
          background: 'rgba(247,147,30,0.10)',
          border: `1px solid rgba(247,147,30,0.30)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: T.amber,
        }}
      >
        <Plus size={22} strokeWidth={2} />
      </div>
      <div>
        <p style={{
          margin: '4px 0 0',
          fontSize: 14,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.01em',
        }}>
          {label ?? 'Add a rival'}
        </p>
        <p style={{
          margin: '4px 12px 0',
          fontSize: 11,
          color: T.whiteMute,
          lineHeight: 1.4,
        }}>
          Up to 10 total
        </p>
      </div>
    </button>
  );
};

export default RivalryAddCard;
