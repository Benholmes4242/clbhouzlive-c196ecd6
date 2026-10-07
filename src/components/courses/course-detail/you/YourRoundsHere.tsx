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
import { FeatPill, FigureCell, roundFeats } from '@/features/explore-magazine/AchievementCallout';
import { handicapPairDisplay } from '@/features/explore-magazine/circleHandicap';

export interface YouRound {
  whsScoreId: string;
  playDate: string;
  gross: number | null;
  toPar: number | null;
  /** The index held FOR THAT ROUND, never the current index. */
  hcpAtTime: number | null;
  deltaIndex: number | null;
  frontNineToPar: number | null;
  backNineToPar: number | null;
  eagles: number | null;
  albatrosses: number | null;
  holes_in_one: number | null;
  clean_card: boolean | null;
}
/* NET and VS HCP are deliberately absent: net is never derived here. */

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
          const isBest = markBest && round.gross != null && round.gross === bestGross;
          const parNode = (v: number | null) => {
            const p = toParParts(v, 0);
            return p ? <span style={{ ...FIGS, color: p.tone }}>{p.text}</span> : null;
          };
          const grossToPar = parNode(round.toPar);
          const frontText = parNode(round.frontNineToPar) ?? '';
          const backText = parNode(round.backNineToPar) ?? '';
          const hcpPair = handicapPairDisplay({ handicapIndex: round.hcpAtTime, deltaIndex: round.deltaIndex });
          const hcpDelta = hcpPair?.delta
            ? <span style={{ ...FIGS, display: 'inline-flex', alignItems: 'center', gap: 2, color: hcpPair.delta.tone }}>
                <span aria-hidden>{hcpPair.delta.arrow}</span><span>{hcpPair.delta.text}</span>
              </span>
            : null;
          return (
            <button
              key={round.whsScoreId}
              type="button"
              onClick={() => onOpenRound(round)}
              style={{
                display: 'block',
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formatMonthDayYearShort(new Date(round.playDate))}
                </span>
                {/* Never wraps: the date is what gives. Two pills = the two rarest. */}
                <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isBest ? <span style={{ ...ABOUT_KICKER, color: A.AMBER_DEEP }}>{t('courseDetail.youTab.bestKicker')}</span> : null}
                  {roundFeats(round, t).slice(0, 2).map((f) => <FeatPill key={f} label={f} />)}
                </span>
              </span>
              {/* FOUR COLUMNS, ALWAYS: a null is an empty cell. */}
              <span style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 8 }}>
                <FigureCell minHeight={34} label={t('amateur.stream.stat.gross', 'GROSS')}
                  value={round.gross ?? ''} suffix={grossToPar} tone={isBest ? A.AMBER : undefined} />
                <FigureCell minHeight={34} label={t('courseDetail.youTab.stat.front', 'FRONT')} value={frontText} />
                <FigureCell minHeight={34} label={t('courseDetail.youTab.stat.back', 'BACK')} value={backText} />
                <FigureCell minHeight={34} label={t('friendsRail.index', 'HCP')} value={hcpPair?.index ?? ''} suffix={hcpDelta} />
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
