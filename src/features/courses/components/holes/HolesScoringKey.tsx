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

// Holes histogram is a COLOUR-bar distribution (proportion of field per
// score-type per hole), so its key is a colour swatch legend — one swatch
// per bucket, matching the bar colours exactly. This is intentionally
// distinct from the scorecard key (shape marks), because a personal
// scorecard shows one score per hole while the histogram shows a spectrum.
const KEY: Array<{ label: string; color: string }> = [
  { label: 'Ace',       color: SC_ACE },
  { label: 'Albatross', color: SC_ALBATROSS },
  { label: 'Eagle',     color: SC_EAGLE },
  { label: 'Birdie',    color: SC_BIRDIE },
  { label: 'Par',       color: SC_PAR },
  { label: 'Bogey',     color: SC_BOGEY },
  { label: 'Dbl+',      color: SC_DOUBLE },
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
        marginBottom: 12,
      }}
    >
      Scoring key
    </div>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        rowGap: 10,
      }}
    >
      {KEY.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: it.color,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{it.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default HolesScoringKey;
