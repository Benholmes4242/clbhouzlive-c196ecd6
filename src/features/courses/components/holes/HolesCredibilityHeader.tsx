import React from 'react';
import { FONT, INK, SC_ACCENT } from './_constants';

interface Props {
  totalRounds: number;
}

export const HolesCredibilityHeader: React.FC<Props> = ({ totalRounds }) => {
  return (
    <div
      style={{
        padding: '20px 18px 18px',
        boxShadow: `inset 0 -1.5px 0 ${SC_ACCENT}`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: SC_ACCENT,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SC_ACCENT,
          }}
        >
          Official hole data
        </span>
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: INK,
          fontWeight: 500,
        }}
      >
        Aggregated from{' '}
        <span style={{ fontWeight: 800 }}>
          {totalRounds.toLocaleString()} round{totalRounds === 1 ? '' : 's'}
        </span>{' '}
        played by England Golf members at this course. Gross scoring.
      </div>
    </div>
  );
};

export default HolesCredibilityHeader;
