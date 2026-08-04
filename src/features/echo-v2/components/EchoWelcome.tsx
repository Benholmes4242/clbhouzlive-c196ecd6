import React from 'react';
import { AnimatedEchoWave } from './AnimatedEchoWave';
import { useEchoSuggestions } from '../hooks/useEchoSuggestions';

const INK = '#1F2428';
const SUB = '#8A9099';
const HAIRLINE = 'rgba(0,0,0,0.07)';


interface Props {
  onPick: (prompt: string) => void;
  disabled?: boolean;
}

export const EchoWelcome: React.FC<Props> = ({ onPick, disabled }) => {
  const { suggestions, isLoading } = useEchoSuggestions();
  return (

    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: '#15171F',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatedEchoWave size={40} active />
      </div>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: INK, letterSpacing: -0.1 }}>
          Ask Echo anything golf
        </span>
        <span style={{ fontSize: 12.5, color: SUB }}>
          Course intel, player form, your game
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360, marginTop: 4 }}>
        {(isLoading ? ['', '', ''] : suggestions).map((s, i) => (
          <button
            key={s || `ghost-${i}`}
            disabled={disabled || isLoading || !s}
            type="button"
            onClick={() => { if (!disabled && s) onPick(s); }}
            className="active:opacity-70"
            style={{
              background: '#FFFFFF',
              border: `0.5px solid ${HAIRLINE}`,
              borderRadius: 14,
              padding: '12px 14px',
              fontSize: 12.5,
              color: INK,
              textAlign: 'left',
              minHeight: 43,
              cursor: disabled || isLoading ? 'default' : 'pointer',
              boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
            }}
          >
            {s}

          </button>
        ))}
      </div>
    </div>
  );
};

export default EchoWelcome;
