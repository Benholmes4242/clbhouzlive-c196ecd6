import React from 'react';
import { useTranslation } from 'react-i18next';
import { FONT, INK, SANS } from './_constants';
import { INK_MUTE } from '@/features/courses/_shared/tokens';

const AMBER = '#F7931E';
const AMBER_TINT = 'rgba(247,147,30,0.06)';
const AMBER_BORDER = 'rgba(247,147,30,0.22)';

interface PairHole {
  hole_no: number;
  par: number;
  avg_to_par: number;
  community_avg_to_par: number;
}

interface Props {
  nemesis: PairHole;
  scoring: PairHole;
}

function fmtPlaysTo(par: number, avg: number): string {
  return (par + avg).toFixed(1);
}

const Card: React.FC<{ eyebrow: string; hole: PairHole }> = ({ eyebrow, hole }) => {
  const { t } = useTranslation(['courses']);
  return (
    <div
      style={{
        flex: 1,
        background: AMBER_TINT,
        border: `1px solid ${AMBER_BORDER}`,
        borderRadius: 14,
        padding: '12px 12px',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: AMBER,
          whiteSpace: 'nowrap',
        }}
      >
        {eyebrow}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 200,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontFamily: SANS,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {hole.hole_no}
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: INK_MUTE,
            fontFamily: SANS,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {t('courses:holes.youPlayItTo', { playsTo: fmtPlaysTo(hole.par, hole.avg_to_par) })}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: INK_MUTE,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontFamily: SANS,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          marginTop: 'auto',
        }}
      >
        {t('courses:holes.fieldPlaysTo', { playsTo: fmtPlaysTo(hole.par, hole.community_avg_to_par) })}
      </div>
    </div>
  );
};

export const PersonalHoleFeatureCards: React.FC<Props> = ({ nemesis, scoring }) => {
  const { t } = useTranslation(['courses']);
  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', gap: 12, alignItems: 'stretch' }}>
      <Card eyebrow={t('courses:holes.yourNemesisTitle')} hole={nemesis} />
      <Card eyebrow={t('courses:holes.yourScoringHoleTitle')} hole={scoring} />
    </div>
  );
};

export default PersonalHoleFeatureCards;
