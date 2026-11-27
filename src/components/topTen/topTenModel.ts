/** Server payloads are the only authority for displayed tens and viewer comparisons.
 * Manage keeps its existing curation hook; neither display surface rebuilds the list. */
export interface TenCourse {
  position: number;
  course_id: string;
  name: string;
  region: string | null;
  sub_country: string | null;
  country: string | null;
  thumbnail_image: string | null;
  is_pinned: boolean;
  member_score: number | null;
  golfers_score: number | null;
  golfers_count: number;
  viewer_score: number | null;
  chart_rank: number | null;
  in_tens: number;
  comment_count: number;
}
export interface TenBlockData {
  owner: { user_id: string; display_name: string; first_name: string; username: string; avatar_url: string | null; is_pro: boolean; pronoun: 'his' | 'her' | 'their' };
  count: number;
  is_owner: boolean;
  played_count: number | null;
  shared_line: string | null;
  on_chart_count: number;
  courses: TenCourse[];
  post_course_id?: string | null;
  post_pronoun?: 'his' | 'her' | 'their' | null;
}
export interface TenPostBlock {
  post_id: string;
  owner_id: string;
  kind: 'published' | 'top_three' | 'new_pick' | 'backfill' | 'new_number_one' | 'new_course';
  headline: string;
  block: TenBlockData;
  /** Brief 38: lifted from block.post_course_id / block.post_pronoun; absent until Ben's SQL runs. */
  courseId?: string | null;
  pronoun?: 'his' | 'her' | 'their' | null;
}
export const tenLocation = (course: TenCourse) => [course.region, course.sub_country || course.country].filter(Boolean).join(' · ');
export function omitUnreadableTens<T extends { id: string; postType?: string }>(posts: T[], map: Map<string, TenPostBlock>, settled: boolean): T[] {
  if (!settled) return posts;
  return posts.filter(post => post.postType !== 'top_ten' || map.has(post.id));
}
/** Owner's first name for score labels, clipped at nine characters (moved here in Brief 45 for TenRail). */
export const ownerScoreLabel = (ownerName: string | null | undefined): string | null => {
  const name = ownerName?.trim() ?? '';
  if (!name) return null;
  return name.length > 9 ? `${name.slice(0, 8)}…` : name;
};
