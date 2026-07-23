import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCourseScoringBreakdown,
  type ScoringBreakdownHole,
} from './useCourseScoringBreakdown';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0E1013';
const INK_60 = 'rgba(15,23,42,0.60)';
const INK_45 = 'rgba(15,23,42,0.45)';
const HAIR = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const GREEN = '#12A150';
const WARN = '#E8890C';
const RED = '#E5484D';
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

const CARD: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 18,
  border: `1px solid ${HAIR}`,
  boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
};

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
    if ((data.rounds ?? 0) < 5) return null;
    const holes = data.holes.filter((h) => (h.rounds_played ?? 0) > 0);
    if (holes.length === 0) return null;
    return { rounds: data.rounds, total: Number(data.total_over_par) || 0, holes };
  }, [data]);

  if (isLoading) {
    return (
      <section style={{ padding: '0 16px', fontFamily: FONT }}>
        <div style={{ ...CARD, padding: 16 }}>
          <Skeleton className="h-12 w-40 mb-4" />
          <Skeleton className="h-[210px] w-full mb-3" />
          <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 12 }}>
            <Skeleton className="h-[190px] w-full mb-3" />
          </div>
          <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 12 }}>
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (!parsed) return null;

  const { rounds, total, holes } = parsed;

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
  if (spread < 1.5 || worstIdx === bestIdx) {
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

  // Projection card values
  const avgGross = data?.avg_gross != null ? Number(data.avg_gross) : null;
  const doublesPR1 = +doublesPerRound.toFixed(1);
  const convertible = +(doublesPerRound / 2).toFixed(1);
  const projected = avgGross != null ? +(avgGross - convertible).toFixed(1) : null;
  const showProjection = avgGross != null && doublesPR1 >= 1 && projected != null;


  // Renderers
  const Sentence: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p
      style={{
        margin: 0,
        marginTop: 13,
        fontSize: 13.5,
        fontWeight: 500,
        color: INK_60,
        lineHeight: 1.45,
      }}
    >
      {children}
    </p>
  );

  const stratumHeader = (title: string, sub: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: '-0.005em' }}>
        {title}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: INK_45, marginTop: 2 }}>{sub}</div>
    </div>
  );

  return (
    <section style={{ padding: '0 16px', fontFamily: FONT }}>
      {/* Section heading OUTSIDE card */}
      <div style={{ padding: '0 2px', marginBottom: 10 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {t('courses:holes.scoringBreakdown.eyebrow')}
        </div>
        <h2
          style={{
            margin: '4px 0 0',
            fontSize: 19,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.3px',
          }}
        >
          {t('courses:holes.scoringBreakdown.title')}
        </h2>
      </div>

      <div style={CARD}>
        {/* 3a. Headline */}
        <div style={{ padding: '18px 16px', borderBottom: `1px solid ${HAIR}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: '-2.2px',
                color: INK,
                lineHeight: 1,
                ...NUM,
              }}
            >
              +{total.toFixed(1)}
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: INK_60,
                lineHeight: 1.25,
              }}
            >
              {t('courses:holes.scoringBreakdown.headlineUnit')
                .split(',')
                .map((line, i) => (
                  <div key={i}>{i === 0 ? `${line.trim()},` : line.trim()}</div>
                ))}
            </div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: INK_45, marginTop: 10 }}>
            {t('courses:holes.scoringBreakdown.builtFrom', { count: rounds })}
          </div>
        </div>

        {/* 3b. Stratum 1 */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${HAIR}` }}>
          {stratumHeader(
            t('courses:holes.scoringBreakdown.s1Title'),
            t('courses:holes.scoringBreakdown.s1Sub'),
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {damaging.map((h, i) => {
              const isTop = i < 3;
              const chipBg = isTop ? 'rgba(229,72,77,0.10)' : 'rgba(15,23,42,0.05)';
              const chipInk = isTop ? RED : INK_45;
              const barW = Math.max(4, Math.min(100, (h.shots_over_par / top1) * 100));
              return (
                <div key={h.hole_no} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 32,
                      borderRadius: 8,
                      background: chipBg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 7,
                        fontWeight: 800,
                        color: chipInk,
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                      }}
                    >
                      HOLE
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: chipInk, lineHeight: 1.1, ...NUM }}>
                      {h.hole_no}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: INK, marginBottom: 4 }}>
                      {t('courses:holes.scoringBreakdown.parYouAvg', {
                        par: h.par,
                        avg: h.avg_score.toFixed(2),
                      })}
                    </div>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(15,23,42,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${barW}%`,
                          height: '100%',
                          background: isTop ? RED : 'rgba(15,23,42,0.25)',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, ...NUM }}>
                      +{h.shots_over_par.toFixed(1)}
                    </div>
                    <div
                      style={{
                        fontSize: 8.5,
                        fontWeight: 700,
                        color: INK_45,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('courses:holes.scoringBreakdown.aRound')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Sentence>{s1Sentence}</Sentence>
        </div>

        {/* 3c. Stratum 2 */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${HAIR}` }}>
          {stratumHeader(
            t('courses:holes.scoringBreakdown.s2Title'),
            t('courses:holes.scoringBreakdown.s2Sub'),
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { pct: pctPar, count: sumPar, label: t('courses:holes.scoringBreakdown.parOrBetter'), color: GREEN, tint: 'rgba(18,161,80,0.10)' },
              { pct: pctBog, count: sumBog, label: t('courses:holes.scoringBreakdown.bogey'), color: WARN, tint: 'rgba(232,137,12,0.10)' },
              { pct: pctDbl, count: sumDbl, label: t('courses:holes.scoringBreakdown.doubleOrWorse'), color: RED, tint: 'rgba(229,72,77,0.10)' },
            ].map((b) => (
              <div
                key={b.label}
                style={{
                  flex: Math.max(1, b.count),
                  minWidth: 40,
                  height: 44,
                  borderRadius: 10,
                  background: b.tint,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: b.color, ...NUM }}>{b.pct}%</div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: INK_45,
                    letterSpacing: '0.06em',
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.label}
                </div>
              </div>
            ))}
          </div>
          {topDoubles.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: INK_45,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  marginTop: 14,
                  marginBottom: 8,
                }}
              >
                {t('courses:holes.scoringBreakdown.doublesFrom')}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {topDoubles.map((h) => (
                  <div
                    key={h.hole_no}
                    style={{
                      flex: 1,
                      background: 'rgba(229,72,77,0.06)',
                      borderRadius: 12,
                      padding: '8px 6px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, ...NUM }}>
                      {t('courses:holes.scoringBreakdown.holeN', { n: h.hole_no })}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: RED, marginTop: 2, ...NUM }}>
                      {t('courses:holes.scoringBreakdown.nDoubles', { count: h.doubles_plus })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <Sentence>{s2Sentence}</Sentence>
        </div>

        {/* 3d. Stratum 3 */}
        <div style={{ padding: '16px' }}>
          {stratumHeader(
            t('courses:holes.scoringBreakdown.s3Title'),
            t('courses:holes.scoringBreakdown.s3Sub'),
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 130 }}>
            {thirdSums.map((v, i) => {
              const h = Math.max(6, (v / maxThird) * 100);
              const color =
                i === worstIdx && spread >= 0.01 ? RED : i === bestIdx ? 'rgba(15,23,42,0.20)' : 'rgba(232,137,12,0.55)';
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, ...NUM }}>
                    +{v.toFixed(1)}
                  </div>
                  <div style={{ width: '100%', height: `${h}%`, background: color, borderRadius: '9px 9px 5px 5px' }} />
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: INK_60 }}>{thirdLabels[i]}</div>
                </div>
              );
            })}
          </div>
          <Sentence>{s3Sentence}</Sentence>
        </div>
      </div>
    </section>
  );
};

export default ScoringBreakdownSection;
