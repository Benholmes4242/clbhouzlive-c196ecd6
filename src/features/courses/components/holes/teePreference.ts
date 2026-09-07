/**
 * TEE PREFERENCE - the member's remembered tee for a course.
 *
 * DECISION RECORD (write it down so nobody has to excavate it again):
 *   On 6 Aug 2026 the old "course tee card" (CourseTeeCard.tsx, Holes tab) was
 *   DELIBERATELY replaced by the analytical Course card, CourseCardPanel, which
 *   carries the same tee list and the same pick behaviour. CourseHolesTab
 *   stopped mounting the tee card and its only remaining caller passed
 *   showTeeCard={false}. The replacement was not a regression: tee selection is
 *   alive on the About tab and in Discover.
 *   The tee_card_viewed / tee_card_expanded / tee_card_tee_changed events died
 *   with it and are recorded in src/features/admin/lib/retiredEvents.ts. The
 *   pick is now instrumented as course_card_tee_changed. CourseTeeCard.tsx was
 *   deleted in Sep 2026 and this module took over the two shared helpers.
 *
 * DO NOT EVER CHANGE THE STORAGE KEY STRING.
 *   The literal is `tee-card:${courseId}` - written by the old tee card and
 *   read by CourseCardPanel unchanged, which is exactly why the replacement was
 *   invisible to members. "Tidying" it to course-card:{courseId} to match the
 *   new component's name would silently revert every member to their default
 *   tee: no error, no crash, no typecheck failure, just everyone's remembered
 *   choice quietly gone. The name is historical. Leave it.
 */
import type { TeeSet } from '../../hooks/useCourseTeeSets';

export function storageKey(courseId: string) {
  return `tee-card:${courseId}`;
}

// -----------------------------------------------------------------------------
// Default tee resolution order:
//   1) localStorage 'tee-card:{courseId}' if it matches a returned tee_label
//   2) profile gender 'female': first tee with gender_scope='ladies';
//      if none, the SHORTEST ladies-scoped colour tee, else shortest colour tee
//   3) otherwise: the MOST-SAMPLED colour tee
//   4) no colour tees at all: the MOST-SAMPLED entry
// -----------------------------------------------------------------------------
// Comparator: rounds_sampled desc -> total_yards desc -> tee_label asc.
function mostSampled(list: TeeSet[]): TeeSet | undefined {
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const r = (b.rounds_sampled ?? 0) - (a.rounds_sampled ?? 0);
    if (r !== 0) return r;
    const y = (b.total_yards ?? 0) - (a.total_yards ?? 0);
    if (y !== 0) return y;
    return a.tee_label.localeCompare(b.tee_label);
  })[0];
}

export function resolveDefaultTee(
  tees: TeeSet[],
  courseId: string,
  gender: string | null | undefined,
): string {
  if (tees.length === 0) return '';
  let stored: string | null = null;
  try {
    stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(courseId)) : null;
  } catch {
    stored = null;
  }
  if (stored && tees.some((t) => t.tee_label === stored)) return stored;

  const colours = tees.filter((t) => t.label_kind === 'colour');

  if (gender === 'female') {
    const ladies = tees.find((t) => t.gender_scope === 'ladies');
    if (ladies) return ladies.tee_label;
    if (colours.length > 0) {
      // Keep "shortest colour tee" intent, scoped to ladies tees where any exist.
      const ladiesColours = colours.filter((t) => t.gender_scope === 'ladies');
      const pool = ladiesColours.length > 0 ? ladiesColours : colours;
      return pool[pool.length - 1].tee_label;
    }
  }

  if (colours.length > 0) return (mostSampled(colours) ?? colours[0]).tee_label;
  return (mostSampled(tees) ?? tees[0]).tee_label;
}
