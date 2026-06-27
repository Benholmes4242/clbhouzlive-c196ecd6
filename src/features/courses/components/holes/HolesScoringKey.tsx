import React from 'react';
import { FONT, INK, SC_ACCENT } from './_constants';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';

interface KeyItem {
  label: string;
  strokes: number | null;
  par: number;
}

// Each item is rendered as a real ScoreMark so the legend stays in lockstep
// with the renderer everywhere it appears.
const items: KeyItem[] = [
  { label: 'Eagle',  strokes: 2, par: 4 }, // −2 → double-ring circle
  { label: 'Birdie', strokes: 3, par: 4 }, // −1 → single circle
  { label: 'Par',    strokes: 4, par: 4 }, // bare numeral
  { label: 'Bogey',  strokes: 5, par: 4 }, // +1 → single square
  { label: 'Dbl+',   strokes: 6, par: 4 }, // +2 → double-ring square
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
        gap: 18,
        rowGap: 10,
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <ScoreMark strokes={it.strokes} par={it.par} size={26} />
          <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{it.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default HolesScoringKey;
