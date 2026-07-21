import { COURSE_REGULAR_CHIP } from '@/config/featureFlags';

/**
 * CourseRegularChip — G1 shell.
 *
 * Small laurel-style chip that sits alongside the existing StatRow record
 * treatment on course-context rows. Tone: amber-tint. Label: "REGULAR".
 * Presentational only; renders behind the `COURSE_REGULAR_CHIP` flag
 * (default OFF). No live data.
 *
 * Matches the StatRow `Chip` visual DNA so it composes cleanly in the
 * right-hand column of a course-context row.
 */

const AMBER_WASH = 'rgba(247,147,30,0.12)';
const BRONZE = '#B45309';

export interface CourseRegularChipProps {
  label?: string;
}

export function CourseRegularChip({ label = 'REGULAR' }: CourseRegularChipProps) {
  if (!COURSE_REGULAR_CHIP) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 999,
        background: AMBER_WASH,
        color: BRONZE,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

export default CourseRegularChip;
