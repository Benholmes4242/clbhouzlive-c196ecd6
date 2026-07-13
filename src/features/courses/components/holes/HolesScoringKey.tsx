import React from 'react';
import {
  FONT,
  INK,
  SC_ACCENT,
  SC_FILL_GOLD,
  SC_FILL_BIRDIE,
  SC_FILL_BOGEY,
  SC_FILL_DOUBLE,
  SC_PAR,
} from './_constants';

// World Feed scoring key: swatches mirror the ScoreMark chip shapes exactly.
// Gold disc = ace / albatross / eagle. Red disc = birdie. Small gray dot = par.
// Blue square = bogey. Navy square = double-plus.
type KeyShape = 'circle' | 'square' | 'dot';
interface KeyItem { label: string; color: string; shape: KeyShape; ink?: string; }

const KEY: KeyItem[] = [
  { label: 'Ace',       color: SC_FILL_GOLD,   shape: 'circle', ink: INK },
  { label: 'Albatross', color: SC_FILL_GOLD,   shape: 'circle', ink: INK },
  { label: 'Eagle',     color: SC_FILL_GOLD,   shape: 'circle', ink: INK },
  { label: 'Birdie',    color: SC_FILL_BIRDIE, shape: 'circle' },
  { label: 'Par',       color: SC_PAR,         shape: 'dot' },
  { label: 'Bogey',     color: SC_FILL_BOGEY,  shape: 'square' },
  { label: 'Dbl+',      color: SC_FILL_DOUBLE, shape: 'square' },
];

const Swatch: React.FC<{ item: KeyItem }> = ({ item }) => {
  if (item.shape === 'dot') {
    return (
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: item.color,
          display: 'inline-block',
          flexShrink: 0,
          marginLeft: 3,
          marginRight: 3,
        }}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{
        width: 12,
        height: 12,
        borderRadius: item.shape === 'square' ? 3 : '50%',
        background: item.color,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
};

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
          <Swatch item={it} />
          <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{it.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default HolesScoringKey;
