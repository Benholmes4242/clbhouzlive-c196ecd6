/**
 * BRIEF_YOU_TAB_REBUILD §3.2 — YOUR ROUNDS HERE.
 *
 * The addition the old tab never had: the member's actual rounds. Everything
 * else on this tab needs a sample; this needs one round, and it works
 * identically at one round and at 111. NO THRESHOLD, EVER.
 *
 * Four rows maximum, most recent first, hairline between. Tapping a row opens
 * that round in the canonical scorecard sheet (RoundDetailSheet, untouched).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber, formatMonthDayYearShort } from '@/i18n/format';
import { A, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection, { ABOUT_KICKER } from '../about/AboutSection';
import { YouAction } from './youBits';

export interface YouRound {
  whsScoreId: string;
  playDate: string;
  gross: number | null;
  toPar: number | null;
}

interface Props {
  rounds: YouRound[];
  /** Every round here, which can exceed the rows drawn. */
  total: number;
  /** The single best gross, so the row can carry its kicker. */
  bestGross: number | null;
  onOpenRound: (round: YouRound) => void;
  onSeeAll: () => void;
}

const MAX_ROWS = 4;

const YourRoundsHere: React.FC<Props> = ({ rounds, total, bestGross, onOpenRound, onSeeAll }) => {
  const { t } = useTranslation('courses');
  if (rounds.length === 0) return null;

  const shown = rounds.slice(0, MAX_ROWS);
  /* The BEST kicker only earns its place when there is something to be best OF. */
  const markBest = total > 1 && bestGross != null;

  return (
    <AboutSection
      heading={t('courseDetail.youTab.sections.yourRounds')}
      meta={formatNumber(total)}
    >
      <div style={{ display: 'grid' }}>
        {shown.map((round) => {
          const parts = toParParts(round.toPar, 0);
          const isBest = markBest && round.gross != null && round.gross === bestGross;
          return (
            <button
              key={round.whsScoreId}
              type="button"
              onClick={() => onOpenRound(round)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                borderBottom: `1px solid ${A.HAIRLINE}`,
                padding: '11px 0',
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: A.INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatMonthDayYearShort(new Date(round.playDate))}
              </span>
              {isBest ? (
                <span style={{ ...ABOUT_KICKER, color: A.AMBER_DEEP, flexShrink: 0 }}>
                  {t('courseDetail.youTab.bestKicker')}
                </span>
              ) : null}
              <span
                style={{ fontSize: 16, fontWeight: 700, color: A.INK, width: 34, textAlign: 'right', ...FIGS }}
              >
                {round.gross ?? '\u2014'}
              </span>
              <span
                style={{ fontSize: 13, fontWeight: 700, width: 30, textAlign: 'right', color: parts?.tone ?? A.MUTE, ...FIGS }}
              >
                {parts?.text ?? '\u2014'}
              </span>
            </button>
          );
        })}
      </div>

      {total > MAX_ROWS ? (
        <YouAction
          label={t('courseDetail.youTab.allRounds', { count: total, rounds: formatNumber(total) })}
          onPress={onSeeAll}
          space={14}
        />
      ) : null}
    </AboutSection>
  );
};


export default YourRoundsHere;
