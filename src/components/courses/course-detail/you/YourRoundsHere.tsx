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
import { formatNumber } from '@/i18n/format';
import { formatMonthDayYearShort } from '@/i18n/format';
import { A, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection, { ABOUT_KICKER, AboutHairline } from '../about/AboutSection';
import { YouLinkRow } from './youBits';

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
      meta={t('courseDetail.youTab.roundsMeta', { count: total, rounds: formatNumber(total) })}
    >
      <div style={{ display: 'grid' }}>
        {shown.map((round, i) => {
          const parts = toParParts(round.toPar, 0);
          const isBest = markBest && round.gross != null && round.gross === bestGross;
          return (
            <React.Fragment key={round.whsScoreId}>
              {i > 0 ? <AboutHairline /> : null}
              <button
                type="button"
                onClick={() => onOpenRound(round)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 0,
                  padding: '12px 0',
                  cursor: 'pointer',
                  fontFamily: SANS,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
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
                    <span style={{ ...ABOUT_KICKER, display: 'block', marginTop: 4, color: A.AMBER_DEEP }}>
                      {t('courseDetail.youTab.bestKicker')}
                    </span>
                  ) : null}
                </span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: A.INK, letterSpacing: '-0.02em', ...FIGS }}>
                    {round.gross ?? '\u2014'}
                  </span>
                  {parts ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: parts.tone, ...FIGS }}>{parts.text}</span>
                  ) : null}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {total > MAX_ROWS ? (
        <YouLinkRow
          label={t('courseDetail.youTab.allRounds', { count: total, rounds: formatNumber(total) })}
          onPress={onSeeAll}
        />
      ) : null}
    </AboutSection>
  );
};

export default YourRoundsHere;
