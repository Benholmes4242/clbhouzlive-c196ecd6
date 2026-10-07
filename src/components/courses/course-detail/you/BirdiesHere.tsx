/**
 * BRIEF — BIRDIES HERE (formerly "Within reach").
 *
 * Works from a single round; there is no threshold. The progress bar is
 * divided into one segment per hole (row count, never a hard-coded 18), so the
 * section shows WHICH holes are still open, not just how many.
 *
 * A hole counts as taken on a birdie OR better, so an eagle hole is not open.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatList, formatNumber } from '@/i18n/format';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { A, BAR_RADIUS, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import { ordinal } from './youBits';

interface Props {
  mine: MyHolePerformanceRow[];
}

/** At or below this many open holes we name them; above it we count them. */
const NAME_THRESHOLD = 6;

const isTaken = (r: MyHolePerformanceRow) =>
  (r.birdie_count ?? 0) > 0 || (r.eagle_or_better_count ?? 0) > 0 || (r.ace_count ?? 0) > 0;

const BirdiesHere: React.FC<Props> = ({ mine }) => {
  const { t } = useTranslation('courses');
  const byHole = React.useMemo(() => [...mine].sort((a, b) => a.hole_no - b.hole_no), [mine]);
  const takenSet = React.useMemo(
    () => new Set(byHole.filter(isTaken).map((r) => r.hole_no)),
    [byHole],
  );
  if (byHole.length === 0) return null;

  const total = byHole.length;
  const open = byHole.filter((r) => !takenSet.has(r.hole_no));

  const line =
    open.length === 0
      ? t('courseDetail.youTab.birdies.none')
      : open.length === total
        ? t('courseDetail.youTab.birdies.allOpen')
        : open.length <= NAME_THRESHOLD
          ? t('courseDetail.youTab.birdies.named', {
              count: open.length,
              holes: formatList(open.map((r) => ordinal(r.hole_no))),
            })
          : t('courseDetail.youTab.birdies.counted', { count: formatNumber(open.length) });

  return (
    <AboutSection heading={t('courseDetail.youTab.sections.birdiesHere')}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: A.INK, fontFamily: SANS }}>
          {t('courseDetail.youTab.birdies.label')}
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: A.INK, letterSpacing: '-0.02em', ...FIGS }}>
          {t('courseDetail.youTab.birdies.value', { done: takenSet.size, total })}
        </span>
      </div>

      <div
        aria-hidden="true"
        style={{
          marginTop: 10,
          display: 'grid',
          gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
          gap: 2,
        }}
      >
        {byHole.map((r) => (
          <div
            key={r.hole_no}
            style={{
              height: 8,
              borderRadius: BAR_RADIUS,
              background: takenSet.has(r.hole_no) ? A.INK : A.HAIRLINE,
            }}
          />
        ))}
      </div>

      <p style={{ margin: '10px 0 0', fontSize: 11, lineHeight: 1.5, fontWeight: 500, color: A.DIM, fontFamily: SANS }}>
        {line}
      </p>
    </AboutSection>
  );
};

export default BirdiesHere;
