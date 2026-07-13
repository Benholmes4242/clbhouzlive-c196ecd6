import React from 'react';
import { History, ChevronLeft } from 'lucide-react';
import { AnimatedEchoWave } from './AnimatedEchoWave';

const INK = '#1F2428';
const SUB = '#8A9099';
const HAIRLINE = 'rgba(0,0,0,0.07)';
const CANVAS = '#F8FAFC';

interface Props {
  streaming?: boolean;
  onHistoryClick?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const EchoV2Header: React.FC<Props> = ({ streaming, onHistoryClick, showBack, onBack }) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: showBack ? 4 : 10,
        paddingTop: showBack
          ? 'calc(env(safe-area-inset-top, 0px) + 8px)'
          : 'max(env(safe-area-inset-top, 0px), 47px)',
        paddingBottom: 12,
        paddingLeft: showBack ? 6 : 14,
        paddingRight: showBack ? 6 : 14,
        background: CANVAS,
        borderBottom: `0.5px solid ${HAIRLINE}`,
        flexShrink: 0,
      }}
    >
      {showBack ? (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="active:opacity-60"
          style={{
            width: 40,
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: INK,
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={24} />
        </button>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: '#15171F',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AnimatedEchoWave size={20} active={!!streaming} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.15 }}>Echo</span>
          <span style={{ fontSize: 11, color: SUB, lineHeight: 1.2 }}>Golf intelligence</span>
        </div>
      </div>
      <button
        type="button"
        aria-label="History"
        onClick={onHistoryClick}
        className="active:opacity-60"
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: SUB,
          flexShrink: 0,
        }}
      >
        <History size={18} />
      </button>
    </header>
  );
};

export default EchoV2Header;
