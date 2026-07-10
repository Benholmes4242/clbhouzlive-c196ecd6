import React, { useEffect, useState } from 'react';
import { AnimatedEchoWave } from './AnimatedEchoWave';

const INK = '#1F2428';
const CARD_BG = '#FFFFFF';
const HAIRLINE = 'rgba(0,0,0,0.07)';

const COPY = [
  { at: 0, text: 'Thinking it through' },
  { at: 6000, text: 'Cross-checking live data' },
  { at: 16000, text: 'Weighing the consensus' },
];

export const EchoThinking: React.FC = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setIdx(1), COPY[1].at);
    const t2 = setTimeout(() => setIdx(2), COPY[2].at);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div style={{ display: 'flex', padding: '4px 12px' }}>
      <div
        style={{
          background: CARD_BG,
          border: `0.5px solid ${HAIRLINE}`,
          padding: '10px 14px',
          borderRadius: '5px 16px 16px 16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
        }}
      >
        <AnimatedEchoWave size={16} active />
        <span style={{ fontSize: 13, color: INK, opacity: 0.8 }}>{COPY[idx].text}</span>
      </div>
    </div>
  );
};

export default EchoThinking;
