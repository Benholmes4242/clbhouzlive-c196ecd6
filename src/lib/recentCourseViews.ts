/** Recent course views (BRIEF_REVIEW_COURSE_SEARCH §5). CourseDetailPage is the
 * only writer; the Review a course sheet reads it. Every storage access is
 * guarded: a failure means an empty list, never an error. */
export const RECENT_COURSE_VIEWS_KEY = 'clbhouz:recent-course-views';
export const RECENT_COURSE_VIEWS_CAP = 10;
export interface RecentCourseView { courseId: string; at: number }

export function readRecentCourseViews(): RecentCourseView[] {
  try {
    const raw = window.localStorage.getItem(RECENT_COURSE_VIEWS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: RecentCourseView[] = [];
    for (const v of parsed) {
      const id = (v as RecentCourseView)?.courseId;
      if (typeof id !== 'string' || !id || seen.has(id)) continue;
      seen.add(id);
      out.push({ courseId: id, at: Number((v as RecentCourseView).at) || 0 });
    }
    return out.slice(0, RECENT_COURSE_VIEWS_CAP);
  } catch { return []; }
}

export function recordRecentCourseView(courseId: string, at = Date.now()) {
  if (!courseId) return;
  try {
    const next = [{ courseId, at }, ...readRecentCourseViews().filter(v => v.courseId !== courseId)].slice(0, RECENT_COURSE_VIEWS_CAP);
    window.localStorage.setItem(RECENT_COURSE_VIEWS_KEY, JSON.stringify(next));
  } catch { /* storage unavailable: nothing recorded */ }
}
