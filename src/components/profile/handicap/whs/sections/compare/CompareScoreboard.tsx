/**
 * CompareScoreboard - the fixture result.
 *
 * BRIEF_COMPARE_SHEET_DUEL fix 1: replaces standingLine()'s sentence. Two 44px
 * squircles with the GROSS record between them, the member's figure amber and
 * the opponent's ink. Under each head a label: "You" in amber, their first name
 * in dim, so every amber element on the sheet is the member.
 *
 * TIES ARE NEVER DROPPED (a V2 rule): a 3-2-2 record renders as 3-2 with the
 * ties stated beneath.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CHART, CHART_FONT } from '../../charts';

interface Props {
  meAvatar: React.ReactNode;
  themAvatar: React.ReactNode;
  themFirstName: string;
  wins: number;
  losses: number;
  ties: number;
}

const LABEL: React.CSSProperties = {
  fontFamily: CHART_FONT,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

export const CompareScoreboard: React.FC<Props> = ({
  meAvatar,
  themAvatar,
  themFirstName,
  wins,
  losses,
  ties,
}) => {
  const { t } = useTranslation('common');
  const figure = (amber: boolean): React.CSSProperties => ({
    fontFamily: CHART_FONT,
    fontSize: 40,
    fontWeight: 700,
    letterSpacing: '-0.05em',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums lining-nums',
    color: amber ? CHART.AMBER : CHART.INK,
  });

  return (
    <div style={{ padding: '18px 16px 14px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          {meAvatar}
          <span style={{ ...LABEL, color: CHART.AMBER }}>{t('handicap.compare.you')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={figure(true)}>{wins}</span>
          <span
            style={{
              fontFamily: CHART_FONT,
              fontSize: 22,
              fontWeight: 700,
              color: CHART.DIM,
              lineHeight: 1,
            }}
          >
            -
          </span>
          <span style={figure(false)}>{losses}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          {themAvatar}
          <span style={{ ...LABEL, color: CHART.DIM }}>{themFirstName}</span>
        </div>
      </div>
      {ties > 0 && (
        <div
          style={{
            marginTop: 10,
            textAlign: 'center',
            ...LABEL,
            color: CHART.MUTE,
          }}
        >
          {t('handicap.compare.tiedCount', { count: ties })}
        </div>
      )}
    </div>
  );
};

export default CompareScoreboard;
