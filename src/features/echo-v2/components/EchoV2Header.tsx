import React from 'react';
import { History } from 'lucide-react';
import { AnimatedEchoWave } from './AnimatedEchoWave';

const INK = '#1F2428';
const SUB = '#8A9099';
const HAIRLINE = 'rgba(0,0,0,0.07)';

interface Props {
  streaming?: boolean;
  onHistoryClick?: () => void;
}

export const EchoV2Header: React.FC<Props> = ({ streaming, onHistoryClick }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background: '#F8FAFC',
        borderBottom: `0.5px solid ${HAIRLINE}`,
      }}
    >
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
      <button
        type="button"
        aria-label="History"
        onClick={onHistoryClick}
        className="active:opacity-60"
        style={{
          width: 34,
          height: 34,
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
    </div>
  );
};

export default EchoV2Header;
