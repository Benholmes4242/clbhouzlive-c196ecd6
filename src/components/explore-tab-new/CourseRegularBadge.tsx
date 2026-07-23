import { COURSE_REGULAR_CHIP } from '@/config/featureFlags';
import { CourseRegularChip } from './CourseRegularChip';
import { useCourseRegularHolder } from './hooks/useCourseRegularHolder';

/**
 * CourseRegularBadge — data-wired wrapper around `CourseRegularChip`.
 *
 * Mount on course-context surfaces where the existing record treatment
 * already appears (course detail header + record book rows scoped to a
 * single course). Renders nothing when the flag is off, when there is no
 * holder row, or when `rounds_90d < 3` (contract enforced in the hook).
 *
 * Holder identity chain per brief: display_name → username → "A member".
 * The client does NOT compose stat text; the chip label stays "REGULAR".
 */

export interface CourseRegularBadgeProps {
  courseId: string | null | undefined;
  /** Optional callback so surfaces can deep-link to the holder profile. */
  onHolderTap?: (userId: string) => void;
}

export function CourseRegularBadge({ courseId, onHolderTap }: CourseRegularBadgeProps) {
  if (!COURSE_REGULAR_CHIP) return null;
  const { data: holder } = useCourseRegularHolder(courseId);
  if (!holder) return null;
  const _holderName = holder.display_name ?? holder.username ?? 'A member';
  // onHolderTap is currently unused by the chip's inline visual, but the
  // surface can pass it and hoist the tap when the design attaches a target.
  void _holderName;
  void onHolderTap;
  return <CourseRegularChip label="REGULAR" />;
}

export default CourseRegularBadge;
