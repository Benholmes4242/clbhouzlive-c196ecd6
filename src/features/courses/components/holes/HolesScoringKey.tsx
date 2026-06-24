import React from 'react';
import {
  FONT,
  INK,
  SC_ACCENT,
  SC_ACE,
  SC_ALBATROSS,
  SC_EAGLE,
  SC_BIRDIE,
  SC_PAR,
  SC_BOGEY,
  SC_DOUBLE,
} from './_constants';

const items: Array<{ c: string; label: string }> = [
  { c: SC_ACE,       label: 'Ace' },
  { c: SC_ALBATROSS, label: 'Albatross −3' },
  { c: SC_EAGLE,     label: 'Eagle −2' },
  { c: SC_BIRDIE,    label: 'Birdie −1' },
  { c: SC_PAR,       label: 'Par' },
  { c: SC_BOGEY,     label: 'Bogey +1' },
  { c: SC_DOUBLE,    label: 'Double or worse' },
];

export const HolesScoringKey: React.FC = () => (
  <div
    style={{
      padding: '22px 18px 28px',
      borderTop: '1px solid rgba(15,23,42,0.06)',
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: SC_ACCENT,
        marginBottom: 10,
      }}
    >
      Scoring key · gross
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        rowGap: 8,
        columnGap: 12,
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: it.c,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{it.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default HolesScoringKey;
