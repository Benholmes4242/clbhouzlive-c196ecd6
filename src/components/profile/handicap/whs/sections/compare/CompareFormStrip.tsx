/**
 * CompareFormStrip - the sequence the sheet has always had and never shown.
 *
 * BRIEF_COMPARE_SHEET_DUEL fix 2 / D3: shared_round_results carries
 * gross_outcome ('W' | 'L' | 'T') for every shared round, and the sheet reduced
 * all of it to "leads by 7-0". One segment per round, OLDEST LEFT.
 *
 * GROSS_OUTCOME ONLY. The scoreboard above is the gross record; mixing in
 * stableford_outcome would have the two describe different contests.
 *
 * CAPPED AT THE MOST RECENT 12 and it says so when it truncates - 103 segments
 * is a texture, not a strip.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CHART, CHART_FONT } from '../../charts';
import type { SharedRoundResult } from '@/lib/whs/api';

const CAP = 12;

const WIN = CHART.AMBER;
const LOSS = 'rgba(255,255,255,0.14)';
const TIE = 'rgba(255,255,255,0.30)';

const LABEL: React.CSSProperties = {
  fontFamily: CHART_FONT,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

export const CompareFormStrip: React.FC<{ rounds: SharedRoundResult[] }> = ({
  rounds,
}) => {
  const { t } = useTranslation('common');

  const ordered = React.useMemo(
    () => [...rounds].sort((a, b) => a.play_date.localeCompare(b.play_date)),
    [rounds],
  );
  if (ordered.length === 0) return null;

  const shown = ordered.slice(Math.max(0, ordered.length - CAP));
  const truncated = ordered.length > shown.length;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {shown.map((r, i) => (
          <div
            key={`${r.play_date}-${r.course_id}-${i}`}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              background:
                r.gross_outcome === 'W' ? WIN : r.gross_outcome === 'T' ? TIE : LOSS,
            }}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={LABEL}>{t('handicap.compare.oldest')}</span>
        <span style={{ ...LABEL, color: CHART.MUTE, textAlign: 'right' }}>
          {truncated
            ? t('handicap.compare.formTruncated', {
                shown: shown.length,
                total: ordered.length,
              })
            : t('handicap.compare.formSample', { count: ordered.length })}
        </span>
      </div>
    </div>
  );
};

export default CompareFormStrip;
