import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { formatNumber } from '@/i18n/format';
import { ordinal } from '@/lib/text/numbers';
import { courseStatsVisible, type WelcomeCourse } from './welcomeRules';
export function WelcomeCourseCard({ course }: { course: WelcomeCourse }) {
  const { t } = useTranslation('auth'); const stats = useCourseStatsDetail(course.id, true);
  return <div className="welcome-course-card"><div className="welcome-course-image">{course.thumbnail_image ? <img src={course.thumbnail_image} alt="" /> : <Camera size={28} />}</div><div className="welcome-course-content"><b>{course.name}</b><p>{course.region || course.country}</p>{stats.isPending ? <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p> : stats.isError ? <p>{t('welcome.statsUnavailable', { defaultValue: 'Course figures are unavailable right now.' })}</p> : courseStatsVisible(stats.data) ? <div className="welcome-stats"><div><b>{stats.data?.avg_over_par != null ? `${stats.data.avg_over_par >= 0 ? '+' : ''}${stats.data.avg_over_par.toFixed(1)}` : '—'}</b><span>{t('welcome.howPlays', { defaultValue: 'How it plays' })}</span></div><div><b>{stats.data?.hardest_hole_no != null ? ordinal(stats.data.hardest_hole_no) : '—'}</b><span>{t('welcome.hardest', { defaultValue: 'Hardest hole' })}</span></div><div><b>{formatNumber(stats.data?.rounds_tracked ?? 0)}</b><span>{t('welcome.rounds', { defaultValue: 'Rounds' })}</span></div></div> : <p className="welcome-course-empty">{t('welcome.noRounds', { defaultValue: 'No rounds tracked here yet.' })}</p>}</div></div>;
}