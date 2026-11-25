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
}
export interface TenPostBlock {
  post_id: string;
  owner_id: string;
  kind: 'published' | 'top_three' | 'new_pick' | 'backfill';
  headline: string;
  block: TenBlockData;
}
export const tenLocation = (course: TenCourse) => [course.region, course.sub_country || course.country].filter(Boolean).join(' · ');
export const tenRowEnd = (position: number) => position === 1 ? 1 : Math.min(10, 1 + Math.ceil((position - 1) / 3) * 3);
export function omitUnreadableTens<T extends { id: string; postType?: string }>(posts: T[], map: Map<string, TenPostBlock>, settled: boolean): T[] {
  if (!settled) return posts;
  return posts.filter(post => post.postType !== 'top_ten' || map.has(post.id));
}