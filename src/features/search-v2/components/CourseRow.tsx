import { MapPin } from 'lucide-react';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import type { CourseHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { YourStatsChip } from '@/components/courses/YourStatsChip';
import { useUserStatsRoundsForCourse } from '@/contexts/UserStatsCoursesContext';

const AMBER = '#F7931E';

interface Props { course: CourseHit; query: string; onSelect: () => void }

export function CourseRow({ course, query, onSelect }: Props) {
  const sub = [course.sub_country, course.country].filter(Boolean).join(', ');
  const yourStatsRounds = useUserStatsRoundsForCourse(course.id);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02] text-left"
    >
      <div
        className="relative w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: 'rgba(15,23,42,0.06)' }}
      >
        <MapPin size={18} color="#475569" strokeWidth={2.25} />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[12px]"
          style={{ border: `1px solid ${LIGHT_HAIRLINE}` }}
        />
      </div>
      <div className="flex-1 min-w-0">
        {/* Allow the badges to wrap under long names rather than crushing the title. */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <p className="text-[14px] font-medium truncate min-w-0" style={{ color: '#0F172A' }}>
            <Highlight text={course.name} query={query} />
          </p>
          {course.avg_rating != null && (
            <span
              className="shrink-0"
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: '#fff',
                background: AMBER,
                padding: '2px 6px',
                borderRadius: 6,
                letterSpacing: '-0.01em',
                fontFeatureSettings: '"kern" 1, "liga" 1',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {course.avg_rating.toFixed(1)}
            </span>
          )}
          {yourStatsRounds != null && (
            <YourStatsChip count={yourStatsRounds} tone="light" />
          )}
        </div>
        {sub && (
          <p className="text-[12px] truncate" style={{ color: '#475569' }}>
            {sub}
          </p>
        )}
      </div>
    </button>
  );
}

