/**
 * Canonical helper to resolve golf course data from a post.
 *
 * Legacy post_tags (golf_club entities) was removed alongside the mention
 * system. Course resolution now goes strictly through posts.course_id.
 */

export interface ResolvedGolfCourse {
  id: string;
  name: string;
  country?: string;
  region?: string;
  sub_country?: string;
}

interface PostWithCourseData {
  course_id?: string | null;
  content?: string | null;
}

interface CourseDetails {
  id: string;
  name: string;
  country?: string | null;
  region?: string | null;
  sub_country?: string | null;
}

export function resolveGolfCourse(
  post: PostWithCourseData,
  courseMap?: Map<string, CourseDetails>
): ResolvedGolfCourse | null {
  if (!post.course_id) return null;

  const fullCourse = courseMap?.get(post.course_id);
  if (fullCourse) {
    return {
      id: fullCourse.id,
      name: fullCourse.name,
      country: fullCourse.country || undefined,
      region: fullCourse.region || undefined,
      sub_country: fullCourse.sub_country || undefined,
    };
  }

  return { id: post.course_id, name: '' };
}

export function hasGolfCourseReference(post: PostWithCourseData): boolean {
  return !!post.course_id;
}

export function getRawCourseId(post: PostWithCourseData): string | null {
  return post.course_id ?? null;
}

export function extractCourseId(post: PostWithCourseData): string | null {
  return post.course_id ?? null;
}

export function collectCourseIds(posts: PostWithCourseData[]): string[] {
  const ids = new Set<string>();
  for (const post of posts) {
    if (post.course_id) ids.add(post.course_id);
  }
  return Array.from(ids);
}
