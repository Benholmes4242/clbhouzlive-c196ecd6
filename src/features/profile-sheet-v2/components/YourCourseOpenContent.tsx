/** YC2 owns only opened-card content. YC1 owns the always-visible header/bar.
 * No reads here: all facts use the existing course row and returned round points. */
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import type { CourseRoundPoint } from '@/hooks/gam/useMyRoundsByCourse';
import { RAMP_DIST } from '@/features/courses/components/holes/analytical/tokens';
import { fmtBucketPct, fmtSigned, openCourseHistory, ordinal, roundDate } from './yourCoursesOpenRules';

export default function YourCourseOpenContent({ course, points, onOpen }: {
  course: UserAnalyticsCourse; points: CourseRoundPoint[]; onOpen: () => void;
}) {
  const { t } = useTranslation('courses');
  const h = openCourseHistory(points);
  const buckets = [
    { key: 'eagles', label: 'legendEagles', color: RAMP_DIST.eagles, pct: course.eagles_plus_pct, exact: course.eagles_plus_pct_exact, count: course.eagles_plus_count },
    { key: 'birdie', label: 'legendBirdie', color: RAMP_DIST.birdie, pct: course.birdies_pct, exact: course.birdies_pct_exact, count: course.birdies_count },
    { key: 'par', label: 'legendPar', color: RAMP_DIST.par, pct: course.pars_pct, exact: course.pars_pct_exact, count: course.pars_count },
    { key: 'bogey', label: 'legendBogey', color: RAMP_DIST.bogey, pct: course.bogeys_plus_pct, exact: course.bogeys_plus_pct_exact, count: course.bogeys_plus_count },
  ];
  return <div className="yc2-open">
    {h.trend && h.last10 != null && h.difference != null && <p className="yc2-trend">
      {t('yourCourses.openTrendStart', { avg: fmtSigned(h.last10, 1) })}
      {h.trend === 'inline' ? t('yourCourses.openTrendInline', { count: h.count }) : <>
        <span className={h.trend === 'better' ? 'yc2-improved' : undefined}>
          {t(`yourCourses.openTrend${h.trend === 'better' ? 'Better' : 'Worse'}`, { diff: Math.abs(h.difference).toFixed(1) })}
        </span>{t('yourCourses.openTrendEnd', { count: h.count })}
      </>}
    </p>}
    {h.plot.length >= 3 && h.average != null && h.averageY != null && <>
      <div className="yc2-chart">
        <svg viewBox="0 0 326 120" preserveAspectRatio="none" role="img" aria-label={t('yourCourses.openChartLabel')}>
          <line className="yc2-average" x1="0" x2="326" y1={h.averageY} y2={h.averageY} strokeDasharray="3 4" />
          <text className="yc2-average-label" x="0" y={Math.max(11, Math.min(114, h.averageY - 5))}>
            {t('yourCourses.openAverage', { avg: fmtSigned(h.average, 1) })}
          </text>
          <path className="yc2-line" d={h.plot.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')} fill="none" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          {h.bestShown && <circle className="yc2-best" cx={h.bestShown.x} cy={h.bestShown.y} r="3.5" />}
        </svg>
      </div>
      <div className="yc2-captions"><span>{t('yourCourses.openChartCaption')}</span><span>{t('yourCourses.openLastRounds', { count: h.shown.length })}</span></div>
    </>}
    <div className="yc2-mix">
      {buckets.map(b => <div key={b.key}>
        <b>{fmtBucketPct(b.pct ?? 0, b.exact ?? 0, b.count ?? 0)}</b>
        <span><i style={{ background: b.color }} />{t(`yourCourses.${b.label}`)}</span>
      </div>)}
    </div>
    <div className="yc2-facts">
      {h.best && <div><span>{t('yourCourses.openBestRound')}</span><b>{fmtSigned(h.best.toPar, 0)} · {roundDate(h.best.date)}</b></div>}
      {course.hardest_hole_no != null && course.hardest_hole_avg != null && <div>
        <span>{t('yourCourses.openCostliestHole')}</span>
        <b>{t('yourCourses.openHoleValue', { hole: ordinal(course.hardest_hole_no), avg: fmtSigned(course.hardest_hole_avg, 1) })}</b>
      </div>}
    </div>
    <Button variant="ghost" className="yc2-link" onClick={onOpen}>
      {t('yourCourses.openAnalytics')}<ChevronRight size={16} />
    </Button>
  </div>;
}