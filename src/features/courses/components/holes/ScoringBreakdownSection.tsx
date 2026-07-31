import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCourseScoringBreakdown,
  type ScoringBreakdownHole,
} from './useCourseScoringBreakdown';
import { A, Panel, LABEL, NUM, SANS, StatRow, FIGS } from './analytical/tokens';
import { BAND_AMBER } from '@/features/courses/_shared/scoreBands';

/**
 * "Where your shots go" in the analytical treatment
 * (BRIEF_COURSE_YOU_TAB_TREATMENT s6-s11).
 *
 *   - four flat panels, no internal dividers, no tinted chips or cards
 *   - the three percentage rings become ONE stacked bar plus three figures
 *   - every damaging-hole bar is OVER; length alone ranks them
 *   - the worst third is inked, unless the spread is below the noise floor
 *   - the coaching sentences are untouched, restyled to CAPTION weight
 */

const OVER = '#C8372B';
const UNDER = '#0F8F4A';

/** The coaching line. Caption weight - it advises, it does not narrate. */
const CAPTION: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.5,
  color: A.MUTE,
  margin: '12px 0 0',
};

const DAMAGE_GRID = '30px 1fr 56px';

/** Noise floor shared with the s3 caption logic - do not change. */
const THIRDS_NOISE_FLOOR = 1.5;

function listGrammar(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

interface Props {
  golfCourseId: string | undefined;
}

export const ScoringBreakdownSection: React.FC<Props> = ({ golfCourseId }) => {
  const { t } = useTranslation(['courses']);
  const { data, isLoading } = useCourseScoringBreakdown(golfCourseId);

  const parsed = useMemo(() => {
    if (!data || !Array.isArray(data.holes)) return null;
    if ((data.rounds ?? 0) < 1) return null;
    const holes = data.holes.filter((h) => (h.rounds_played ?? 0) > 0);
    if (holes.length === 0) return null;
    return { rounds: data.rounds, total: Number(data.total_over_par) || 0, holes };
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS }}>
        <Panel><Skeleton className="h-[64px] w-full" /></Panel>
        <Panel><Skeleton className="h-[190px] w-full" /></Panel>
        <Panel><Skeleton className="h-[150px] w-full" /></Panel>
      </div>
    );
  }

  if (!parsed) return null;

  const { rounds, total, holes } = parsed;
  const hasInterpretation = rounds >= 5;

  // Stratum 1: top 5 by shots_over_par desc
  const damaging = [...holes]
    .sort((a, b) => b.shots_over_par - a.shots_over_par)
    .slice(0, 5);
  const top1 = damaging[0]?.shots_over_par || 1;

  // Stratum 2: totals across all played holes
  const sumPar = holes.reduce((s, h) => s + (h.par_or_better || 0), 0);
  const sumBog = holes.reduce((s, h) => s + (h.bogeys || 0), 0);
  const sumDbl = holes.reduce((s, h) => s + (h.doubles_plus || 0), 0);
  const stratum2Total = sumPar + sumBog + sumDbl || 1;
  const pctPar = Math.round((sumPar / stratum2Total) * 100);
  const pctBog = Math.round((sumBog / stratum2Total) * 100);
  const pctDbl = Math.max(0, 100 - pctPar - pctBog);

  const topDoubles = [...holes]
    .filter((h) => (h.doubles_plus || 0) > 0)
    .sort((a, b) => b.doubles_plus - a.doubles_plus)
    .slice(0, 4);

  // Stratum 3: thirds
  const thirdOf = (h: ScoringBreakdownHole): 0 | 1 | 2 =>
    h.hole_no <= 6 ? 0 : h.hole_no <= 12 ? 1 : 2;
  const thirdSums = [0, 0, 0];
  const thirdHas = [false, false, false];
  holes.forEach((h) => {
    const i = thirdOf(h);
    thirdSums[i] += h.shots_over_par || 0;
    thirdHas[i] = true;
  });
  const thirdLabels = [
    t('courses:holes.scoringBreakdown.third1'),
    t('courses:holes.scoringBreakdown.third2'),
    t('courses:holes.scoringBreakdown.third3'),
  ];
  const maxThird = Math.max(...thirdSums, 0.0001);
  let worstIdx = 0;
  let bestIdx = 0;
  thirdSums.forEach((v, i) => {
    if (!thirdHas[i]) return;
    if (v > thirdSums[worstIdx]) worstIdx = i;
    if (v < thirdSums[bestIdx] || !thirdHas[bestIdx]) bestIdx = i;
  });
  const spread = +(thirdSums[worstIdx] - thirdSums[bestIdx]).toFixed(1);
  /** Same threshold the caption uses: below it, ink nothing. */
  const thirdsEven = spread < THIRDS_NOISE_FLOOR || worstIdx === bestIdx;

  // Sentences
  const s1Holes = damaging.slice(0, 3);
  const s1Sum = +s1Holes.reduce((s, h) => s + h.shots_over_par, 0).toFixed(1);
  const s1Share = total > 0 ? Math.round((s1Sum / total) * 100) : 0;
  const s1HoleLabels = s1Holes.map((h) => String(h.hole_no));
  const s1Sentence = t('courses:holes.scoringBreakdown.s1Sentence', {
    holes:
      s1HoleLabels.length === 1
        ? t('courses:holes.scoringBreakdown.holeOne', { n: s1HoleLabels[0] })
        : t('courses:holes.scoringBreakdown.holeMany', { list: listGrammar(s1HoleLabels) }),
    sum: s1Sum,
    share: s1Share,
  });

  const doublesPerRound = rounds > 0 ? sumDbl / rounds : 0;
  const s2Sentence =
    doublesPerRound >= 1
      ? t('courses:holes.scoringBreakdown.s2SentenceHigh', {
          total: sumDbl,
          perRound: +doublesPerRound.toFixed(1),
        })
      : t('courses:holes.scoringBreakdown.s2SentenceLow');

  let s3Sentence: string;
  if (thirdsEven) {
    s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceEven');
  } else {
    const bestLabel = thirdLabels[bestIdx].toLowerCase();
    const worstLabel = thirdLabels[worstIdx].toLowerCase();
    if (worstIdx === 2) {
      s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceLate', {
        worst: worstLabel,
        best: bestLabel,
        spread,
      });
    } else if (worstIdx === 0) {
      s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceEarly', {
        best: bestLabel,
        worst: worstLabel,
        spread,
      });
    } else {
      s3Sentence = t('courses:holes.scoringBreakdown.s3SentenceMiddle', {
        best: bestLabel,
        spread,
      });
    }
  }

  const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={CAPTION}>{children}</p>
  );

  // Headline: round before branching so -0.04 never renders "-0.0".
  const roundedTotal = Math.round(total * 10) / 10;
  const headlineTone = roundedTotal > 0 ? OVER : roundedTotal < 0 ? UNDER : A.INK;
  const headlineText =
    roundedTotal > 0
      ? `+${roundedTotal.toFixed(1)}`
      : roundedTotal < 0
        ? `\u2212${Math.abs(roundedTotal).toFixed(1)}`
        : 'E';
  const headlineLabel =
    roundedTotal > 0
      ? t('courses:courseDetail.you.shotsOverPar')
      : roundedTotal < 0
        ? t('courses:courseDetail.you.shotsUnderPar')
        : t('courses:courseDetail.you.levelPar');

  const split = [
    { key: 'par', label: t('courses:courseDetail.you.parOrBetterFlat', { defaultValue: 'Par or better' }), pct: pctPar, holes: sumPar, tone: UNDER },
    { key: 'bog', label: t('courses:holes.scoringBreakdown.bogey'), pct: pctBog, holes: sumBog, tone: BAND_AMBER },
    { key: 'dbl', label: t('courses:courseDetail.you.doubleOrWorseFlat', { defaultValue: 'Double or worse' }), pct: pctDbl, holes: sumDbl, tone: OVER },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS, ...FIGS }}>
      {/* An average round here */}
      <Panel
        title={t('courses:courseDetail.you.avgRound')}
        aside={t('courses:courseDetail.you.roundsCount', { count: rounds })}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...NUM, fontSize: 44, lineHeight: 1, color: headlineTone }}>{headlineText}</div>
          <div style={{ ...LABEL, marginTop: 8 }}>{headlineLabel}</div>
        </div>
      </Panel>

      {/* Your most damaging holes */}
      <Panel
        title={t('courses:courseDetail.you.damagingHoles')}
        aside={t('courses:courseDetail.you.byShotsLost')}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: DAMAGE_GRID,
            gap: 11,
            alignItems: 'baseline',
          }}
        >
          <span style={{ ...LABEL, textAlign: 'center' }}>{t('courses:courseDetail.you.colHole')}</span>
          <span style={LABEL}>{t('courses:holes.scoringBreakdown.s1Sub')}</span>
          <span style={{ ...LABEL, textAlign: 'right' }}>{t('courses:courseDetail.you.colCost')}</span>
        </div>
        {damaging.map((h) => {
          const barW = Math.max(4, Math.min(100, (h.shots_over_par / top1) * 100));
          return (
            <div
              key={h.hole_no}
              style={{
                display: 'grid',
                gridTemplateColumns: DAMAGE_GRID,
                gap: 11,
                alignItems: 'center',
                padding: '9px 0',
              }}
            >
              <span style={{ ...NUM, fontSize: 15, color: A.INK, textAlign: 'center' }}>{h.hole_no}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ ...LABEL, display: 'block' }}>
                  {t('courses:holes.scoringBreakdown.parYouAvg', {
                    par: h.par,
                    avg: h.avg_score.toFixed(2),
                  })}
                </span>
                <span
                  style={{
                    display: 'block',
                    height: 5,
                    borderRadius: 3,
                    background: A.TRACK,
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: 5,
                      borderRadius: 3,
                      width: `${barW}%`,
                      background: OVER,
                    }}
                  />
                </span>
              </span>
              <span style={{ textAlign: 'right' }}>
                <span style={{ ...NUM, fontSize: 14, color: OVER, display: 'block' }}>
                  +{h.shots_over_par.toFixed(1)}
                </span>
                <span style={{ ...LABEL, fontSize: 8, display: 'block', marginTop: 2 }}>
                  {t('courses:courseDetail.you.aRound')}
                </span>
              </span>
            </div>
          );
        })}
        {hasInterpretation ? (
          <Caption>{s1Sentence}</Caption>
        ) : (
          <Caption>{t('courses:holes.scoringBreakdown.moreRoundsHint')}</Caption>
        )}
      </Panel>

      {/* What's costing you the shots - one distribution, one bar */}
      <Panel
        title={t('courses:courseDetail.you.costingShots')}
        aside={t('courses:courseDetail.you.everyHole')}
      >
        <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
          {split
            .filter((s) => s.pct > 0)
            .map((s) => (
              <span
                key={s.key}
                style={{ height: 6, flex: s.pct, background: s.tone, borderRadius: 3 }}
              />
            ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {split.map((s) => (
            <div key={s.key} style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={LABEL}>{s.label}</div>
              <div style={{ ...NUM, fontSize: 20, color: s.tone, marginTop: 3 }}>
                {s.pct}
                <span style={{ fontSize: 12, fontWeight: 700 }}>%</span>
              </div>
              <div style={{ ...LABEL, fontSize: 8, marginTop: 2 }}>
                {t('courses:holes.scoringBreakdown.nHoles', { count: s.holes })}
              </div>
            </div>
          ))}
        </div>

        {topDoubles.length > 0 && (
          <>
            <div style={{ ...LABEL, marginTop: 20, marginBottom: 10 }}>
              {t('courses:courseDetail.you.doublesFrom')}
            </div>
            <StatRow
              size={18}
              items={topDoubles.map((h) => ({
                label: t('courses:holes.scoringBreakdown.holeN', { n: h.hole_no }),
                value: String(h.doubles_plus),
                tone: OVER,
              }))}
            />
          </>
        )}

        {hasInterpretation && <Caption>{s2Sentence}</Caption>}
      </Panel>

      {/* How your round unfolds - the worst third is inked */}
      {hasInterpretation && (
        <Panel
          title={t('courses:courseDetail.you.roundUnfolds')}
          aside={t('courses:courseDetail.you.byThird')}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            {thirdSums.map((v, i) => {
              const isWorst = !thirdsEven && i === worstIdx;
              return (
                <div key={i} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div
                    style={{ ...NUM, fontSize: 17, color: isWorst ? A.INK : A.MUTE, marginBottom: 6 }}
                  >
                    +{v.toFixed(1)}
                  </div>
                  <div
                    style={{
                      height: Math.max(10, (v / maxThird) * 62),
                      borderRadius: 4,
                      background: isWorst ? A.INK : A.TRACK,
                    }}
                  />
                  <div style={{ ...LABEL, marginTop: 7 }}>{thirdLabels[i]}</div>
                </div>
              );
            })}
          </div>
          <Caption>{s3Sentence}</Caption>
        </Panel>
      )}
    </div>
  );
};

export default ScoringBreakdownSection;
