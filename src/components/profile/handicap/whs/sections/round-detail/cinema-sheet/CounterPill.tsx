import React from 'react';

interface Props {
  isCounter: boolean;
  rank: number | null;
}

export const CounterPill: React.FC<Props> = ({ isCounter, rank }) => {
  const base: React.CSSProperties = {
    position: 'absolute',
    top: 86,
    right: 18,
    zIndex: 3,
    padding: '4px 9px',
    borderRadius: 999,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  };

  if (isCounter) {
    return (
      <div
        style={{
          ...base,
          background: 'rgba(247,147,30,0.18)',
          border: '0.5px solid rgba(247,147,30,0.5)',
          color: '#F7931E',
        }}
      >
        {'\u25CF'} COUNTER{rank != null ? ` · #${rank}/20` : ''}
      </div>
    );
  }
  return (
    <div
      style={{
        ...base,
        background: 'rgba(255,255,255,0.08)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        color: 'rgba(255,255,255,0.7)',
      }}
    >
      NON-COUNTER
    </div>
  );
};

export default CounterPill;
