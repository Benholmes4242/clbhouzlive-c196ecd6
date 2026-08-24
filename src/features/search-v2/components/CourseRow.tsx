import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CourseHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { CourseCommunityRating } from '@/components/courses/CourseCommunityRating';
import { BarChartGlyph } from '@/components/courses/YourStatsChip';
import { useUserStatsRoundsForCourse } from '@/contexts/UserStatsCoursesContext';
import { A, KICKER, NUM } from '@/features/courses/components/holes/analytical/tokens';
import { ResultTile } from './ResultTile';
import { ROW_BASE, S } from '../lib/tokens';

interface Props { course: CourseHit; query: string; onSelect: () => void }

export function CourseRow({ course, query, onSelect }: Props) {
  const { t } = useTranslation('courses');
  const sub = [course.sub_country, course.country].filter(Boolean).join(', ');
  const yourStatsRounds = useUserStatsRoundsForCourse(course.id);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={ROW_BASE}
    >
      <ResultTile>
        <MapPin size={18} color={A.MUTE} strokeWidth={2.25} />
      </ResultTile>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Row 1: name + rating (single source of truth: CourseCommunityRating). */}
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[15px] font-medium truncate min-w-0" style={{ color: S.INK }}>
            <Highlight text={course.name} query={query} />
          </p>
          {course.avg_rating != null && (
            <CourseCommunityRating rating={course.avg_rating} size="sm" />
          )}
        </div>

        {yourStatsRounds != null && (
          <div className="flex items-center gap-1.5" style={{ color: KICKER.color }}>
            <BarChartGlyph size={10} />
            <span style={{ ...KICKER, fontSize: 11 }}>{t('search.yourRounds', 'Your rounds')}</span>
            <span style={{ ...KICKER, ...NUM, fontSize: 11, color: KICKER.color }}>
              {yourStatsRounds}
            </span>
          </div>
        )}

        {sub && (
          <p className="text-[13px] truncate" style={{ color: S.QUIET }}>
            {sub}
          </p>
        )}
      </div>
    </button>
  );
}
