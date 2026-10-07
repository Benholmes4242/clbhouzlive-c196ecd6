/**
 * BRIEF_YOU_TAB_REBUILD §3.5 — WITHIN REACH.
 *
 * Works from a single round; there is no threshold. It also renders ONCE — the
 * old tab drew it inside the shots block and again as its own card.
 *
 * A hole counts as taken when the member has made a birdie OR better on it, so
 * an eagle is not a hole still "on the list".
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { A, BAR_RADIUS, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import { ordinal } from './youBits';

interface Props {
  mine: MyHolePerformanceRow[];
}

const WithinReach: React.FC<Props> = ({ mine }) => {
  const { t } = useTranslation('courses');
  if (mine.length === 0) return null;

  const taken = mine.filter(
    (r) => (r.birdie_count ?? 0) > 0 || (r.eagle_or_better_count ?? 0) > 0 || (r.ace_count ?? 0) > 0,
  );
  const total = mine.length;
  const remaining = mine.filter((r) => !taken.includes(r)).sort((a, b) => a.hole_no - b.hole_no);
  const pct = total > 0 ? taken.length / total : 0;

  const line =
    remaining.length === 0
      ? t('courseDetail.youTab.reach.none')
      : remaining.length === 1
        ? t('courseDetail.youTab.reach.oneLeft', { hole: ordinal(remaining[0].hole_no) })
        : taken.length === 0
          ? t('courseDetail.youTab.reach.allLeft')
          : t('courseDetail.youTab.reach.some', {
              count: remaining.length,
              holes: formatNumber(remaining.length),
            });

  return (
    <AboutSection heading={t('courseDetail.youTab.sections.withinReach')}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: A.INK, fontFamily: SANS }}>
          {t('courseDetail.youTab.reach.label')}
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: A.INK, letterSpacing: '-0.02em', ...FIGS }}>
          {t('courseDetail.youTab.reach.value', { done: taken.length, total })}
        </span>
      </div>

      <div
        aria-hidden="true"
        style={{ marginTop: 10, height: 4, borderRadius: BAR_RADIUS, background: A.HAIRLINE, overflow: 'hidden' }}
      >
        <div style={{ width: `${Math.round(pct * 100)}%`, height: '100%', background: A.INK, borderRadius: BAR_RADIUS }} />
      </div>

      <p style={{ margin: '10px 0 0', fontSize: 11, lineHeight: 1.5, fontWeight: 500, color: A.DIM, fontFamily: SANS }}>
        {line}
      </p>
    </AboutSection>
  );
};

export default WithinReach;
