/**
 * BRIEF_COURSE_TAB_1A P1.1 — the hero's single reference line:
 * "Par 71 · 6,476 yds · 72.8 / 134 · 900 rounds".
 *
 * Par, yards, rating and slope come from the SAME tee the tees section shows
 * (useCourseTeeSets + resolveDefaultTee, the remembered `tee-card:` choice),
 * so the hero and the tee control never disagree. CourseFactsAndTees fires
 * TEE_CHANGED_EVENT on a pick so this line follows it. Rounds is
 * get_course_stats_detail.rounds_tracked (D1).
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { useProfileData } from '@/hooks/useProfileData';
import { useCourseTeeSets } from '@/features/courses/hooks/useCourseTeeSets';
import { resolveDefaultTee } from '@/features/courses/components/holes/teePreference';

export const TEE_CHANGED_EVENT = 'clb:course-tee-changed';

export function useHeroReferenceLine(courseId: string | null, roundsTracked: number | null | undefined): string | null {
  const { t } = useTranslation('courses');
  const { profile } = useProfileData();
  const { data } = useCourseTeeSets(courseId ?? undefined);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const on = () => setBump((n) => n + 1);
    window.addEventListener(TEE_CHANGED_EVENT, on);
    return () => window.removeEventListener(TEE_CHANGED_EVENT, on);
  }, []);

  return useMemo(() => {
    const tees = data ?? [];
    const label = courseId && tees.length ? resolveDefaultTee(tees, courseId, profile?.gender ?? null) : '';
    const tee = tees.find((x) => x.tee_label === label) ?? tees[0] ?? null;
    const parts: string[] = [];
    if (tee?.par_total && tee.par_total > 0) parts.push(t('courseDetail.heroLine.par', { par: tee.par_total }));
    if (tee?.total_yards != null && Number.isFinite(tee.total_yards) && tee.total_yards > 0)
      parts.push(t('courseDetail.heroLine.yards', { yards: formatNumber(Math.round(tee.total_yards)) }));
    const cr = tee?.course_rating && tee.course_rating > 0 ? tee.course_rating.toFixed(1) : null;
    const sl = tee?.slope_rating && tee.slope_rating > 0 ? String(Math.round(tee.slope_rating)) : null;
    if (cr && sl) parts.push(`${cr} / ${sl}`);
    else if (cr) parts.push(cr);
    else if (sl) parts.push(sl);
    const r = Number(roundsTracked ?? 0);
    if (r > 0) parts.push(t('courseDetail.heroLine.rounds', { count: r, rounds: formatNumber(r) }));
    return parts.length ? parts.join(' \u00B7 ') : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, courseId, profile?.gender, roundsTracked, t, bump]);
}
