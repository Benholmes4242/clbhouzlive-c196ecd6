import React from 'react';
import { Eyebrow } from './_shared/Eyebrow';
import { FONT, T60 } from './_shared/tokens';

interface Props {
  /** First name of the friend, used in the empty-state message. */
  firstName?: string;
}

export const StandoutRoundsStub: React.FC<Props> = ({ firstName }) => (
  <div style={{ padding: '4px 20px 14px', fontFamily: FONT }}>
    <Eyebrow label="STANDOUT ROUNDS" />
    <p
      style={{
        margin: '10px 0 0',
        fontSize: 13,
        color: T60,
        fontStyle: 'normal',
        lineHeight: 1.4,
      }}
    >
      {firstName
        ? `Standout rounds available once ${firstName} has synced their official handicap.`
        : 'Standout rounds available once this player has synced their official handicap.'}
    </p>
  </div>
);
