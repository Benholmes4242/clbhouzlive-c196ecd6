import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { FONT, INK, SC_ACCENT } from './_constants';
import { A } from './analytical/tokens';

// Scoring key: swatches are rendered BY ScoreMark itself, never hand-drawn,
// so the key can never drift from the card.
// Birdie · Eagle · Ace · Bogey · Double+
interface KeyItem { id: string; labelKey: string; strokes: number; par: number; }

const KEY: KeyItem[] = [
  { id: 'birdie',     labelKey: 'courses:holes.scoringKey.birdie',     strokes: 3, par: 4 },
  { id: 'eagle',      labelKey: 'courses:holes.scoringKey.eagle',      strokes: 2, par: 4 },
  { id: 'ace',        labelKey: 'courses:holes.scoringKey.ace',        strokes: 1, par: 4 },
  { id: 'bogey',      labelKey: 'courses:holes.scoringKey.bogey',      strokes: 5, par: 4 },
  { id: 'doublePlus', labelKey: 'courses:holes.scoringKey.doublePlus', strokes: 6, par: 4 },
];

export const HolesScoringKey: React.FC = () => {
  const { t } = useTranslation(['courses']);
  return (
    <div
      style={{
        padding: '22px 18px 28px',
        borderTop: `1px solid ${A.BORDER}`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: SC_ACCENT,
          marginBottom: 12,
        }}
      >
        {t('courses:holes.scoringKey.title')}
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
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 7, lineHeight: 1 }}>
            <ScoreMark strokes={it.strokes} par={it.par} size={22} surface="dark" />
            <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{t(it.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolesScoringKey;
