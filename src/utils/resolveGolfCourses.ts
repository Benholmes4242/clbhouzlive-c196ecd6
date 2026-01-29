/**
 * Multi-course resolution utility for posts.
 * 
 * Fetches courses from the post_courses junction table with fallback
 * to legacy posts.course_id for backwards compatibility.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ResolvedGolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
}

/**
 * Fetches all courses tagged on a post from the junction table.
 * Falls back to posts.course_id for backwards compatibility.
 */
export async function resolvePostCourses(postId: string): Promise<ResolvedGolfCourse[]> {
  // First try junction table
  const { data: junctionData, error: junctionError } = await supabase
    .from('post_courses')
    .select(`
      display_order,
      golf_courses (
        id,
        name,
        country,
        region,
        sub_country
      )
    `)
    .eq('post_id', postId)
    .order('display_order', { ascending: true });

  if (!junctionError && junctionData && junctionData.length > 0) {
    return junctionData
      .map(pc => pc.golf_courses as unknown as ResolvedGolfCourse)
      .filter(Boolean);
  }

  // Fallback: check posts.course_id for backwards compatibility
  const { data: postData } = await supabase
    .from('posts')
    .select(`
      golf_courses (
        id,
        name,
        country,
        region,
        sub_country
      )
    `)
    .eq('id', postId)
    .single();

  if (postData?.golf_courses) {
    return [postData.golf_courses as unknown as ResolvedGolfCourse];
  }

  return [];
}

/**
 * Batch fetch courses for multiple posts (more efficient for feeds)
 */
export async function resolvePostCoursesBatch(postIds: string[]): Promise<Map<string, ResolvedGolfCourse[]>> {
  const result = new Map<string, ResolvedGolfCourse[]>();
  
  if (postIds.length === 0) return result;

  const { data, error } = await supabase
    .from('post_courses')
    .select(`
      post_id,
      display_order,
      golf_courses (
        id,
        name,
        country,
        region,
        sub_country
      )
    `)
    .in('post_id', postIds)
    .order('display_order', { ascending: true });

  if (error || !data) return result;

  // Group by post_id
  for (const row of data) {
    const courses = result.get(row.post_id) || [];
    if (row.golf_courses) {
      courses.push(row.golf_courses as unknown as ResolvedGolfCourse);
    }
    result.set(row.post_id, courses);
  }

  return result;
}

/**
 * Extract course IDs from a post for submission
 * Used when creating/editing posts
 */
export function extractCourseIds(courses: ResolvedGolfCourse[]): string[] {
  return courses.map(c => c.id);
}
