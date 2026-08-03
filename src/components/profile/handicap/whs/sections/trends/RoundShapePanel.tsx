/**
 * RoundShapePanel - how the rounds unfold, split out of GameEverywhereCard.
 *
 * Was Stratum 2 of that card; it answers a different question (WHEN shots go)
 * from the par-type rings (WHERE shots go), so it is its own panel.
 *
 * The bar chart is the shared ThirdsChart primitive - no local SVG. Renders
 * NOTHING unless all three thirds exist.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useScoringBreakdownAllCourses } from '@/lib/whs/hooks';
import { CHART, CHART_FONT, LABEL_STYLE, ThirdsChart, type Third } from '../../charts';

const MIN_ROUNDS = 10;

interface Props {
  readOnly?: boolean;
}

export const RoundShapePanel: React.FC<Props> = ({ readOnly = false }) => {
  const { t } = useTranslation('courses');
  const { data } = useScoringBreakdownAllCourses(!readOnly);

  if (!data || data.rounds < MIN_ROUNDS) return null;

  const raw = [...(data.thirds ?? [])].sort((a, b) => a.third - b.third);
  if (raw.length !== 3) return null;

  const thirdLabel = (i: number): string =>
    i === 0
      ? t('holes.gameEverywhere.third1')
      : i === 1
      ? t('holes.gameEverywhere.third2')
      : t('holes.gameEverywhere.third3');

  const thirds: Third[] = raw.map((r, i) => ({ l: thirdLabel(i), v: r.avg_over_six }));

  const vals = thirds.map((x) => x.v);
  const maxV = Math.max(...vals);
  const minV = Math.min(...vals);
  const spread = maxV - minV;
  const worstIdx = vals.indexOf(maxV);
  const bestIdx = vals.indexOf(minV);
  const evenSpread = spread < 1.5;

  const sentence = evenSpread
    ? t('holes.gameEverywhere.s2SentenceEven')
    : worstIdx === 0
    ? t('holes.gameEverywhere.s2SentenceEarly', {
        best: thirdLabel(bestIdx),
        spread: spread.toFixed(1),
      })
    : worstIdx === 1
    ? t('holes.gameEverywhere.s2SentenceMiddle', {
        best: thirdLabel(bestIdx),
        spread: spread.toFixed(1),
      })
    : t('holes.gameEverywhere.s2SentenceLate', {
        best: thirdLabel(bestIdx),
        spread: spread.toFixed(1),
      });

  return (
    <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
      <div
        style={{
          margin: '0 16px',
          background: CHART.PANEL,
          border: `1px solid ${CHART.BORDER}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ ...LABEL_STYLE, color: CHART.MUTE }}>
            {t('holes.gameEverywhere.s2Title')}
          </span>
          <span style={{ ...LABEL_STYLE, whiteSpace: 'nowrap' }}>
            {t('holes.gameEverywhere.nRoundsSample', {
              defaultValue: '{{count}} ROUNDS',
              count: data.rounds,
            })}
          </span>
        </div>

        <div style={{ marginTop: 14 }}>
          <ThirdsChart thirds={thirds} />
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 500,
            color: CHART.MUTE,
            lineHeight: 1.5,
          }}
        >
          {sentence}
        </div>
      </div>
    </section>
  );
};

export default RoundShapePanel;
