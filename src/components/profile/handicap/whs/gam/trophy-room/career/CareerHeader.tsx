/**
 * Career record header. States what the record is drawn from, so every figure
 * below it has a stated sample. No level, no rank, no medal count.
 */
import React from 'react';
import { REC } from './tokens';
import { Kicker, Caption } from './Primitives';
import { yearOf } from './format';
import { useTranslation, Trans } from 'react-i18next';
import type { CareerData } from './types';

interface Props {
  data: CareerData;
}

export const CareerHeader: React.FC<Props> = ({ data }) => {
  const { rounds } = data;
  const courses = new Set(
    rounds.map((r) => r.course_id || `name:${r.course_name ?? ''}`).filter(Boolean),
  ).size;
  const years = rounds.map((r) => yearOf(r.play_date)).filter((y): y is number => y !== null);
  const since = years.length > 0 ? Math.min(...years) : null;

  const { t } = useTranslation('handicap');

  // Figures come from the same computation as before; only the voice changed.
  return (
    <header style={{ padding: '14px 2px 16px', fontFamily: REC.FONT }}>
      <Kicker>CAREER RECORD</Kicker>
      {rounds.length > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, color: REC.INK, ...REC.TABULAR }}>
              {rounds.length}
            </span>
            <span style={{ fontSize: 17, fontWeight: 600, color: REC.INK }}>{t('career.cabinet.rounds')}</span>
          </div>
          {since ? (
            <div style={{ marginTop: 6, fontSize: 14, color: REC.MUTE, ...REC.TABULAR }}>
              <Trans
                t={t}
                i18nKey="career.cabinet.since"
                values={{ courses, year: since }}
                components={{ b: <span style={{ color: REC.INK, fontWeight: 600 }} /> }}
              />
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ marginTop: 8 }}>
          <Caption>No scored rounds on the record yet.</Caption>
        </div>
      )}
    </header>
  );
};

export default CareerHeader;
