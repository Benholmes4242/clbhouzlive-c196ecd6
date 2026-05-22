import React from 'react';
import { Eyebrow } from './_shared/Eyebrow';
import { FONT, T40 } from './_shared/tokens';

export const StandoutRoundsStub: React.FC = () => (
  <div style={{ padding: '4px 20px 14px', fontFamily: FONT }}>
    <Eyebrow label="STANDOUT ROUNDS" />
    <p
      style={{
        margin: '10px 0 0',
        fontSize: 13,
        color: T40,
        fontStyle: 'italic',
      }}
    >
      Course bests coming soon
    </p>
  </div>
);
