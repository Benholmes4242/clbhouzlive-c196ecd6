/**
 * fetchPostForEdit — fetches a post + media + courses for the edit wizard
 * Triple ownership guard: menu-level, fetch-level, mutation-level
 */
import { supabase } from '@/integrations/supabase/client';

export interface PostForEdit {
  post: {
    id: string;
    content: string | null;
    categories: string[];
    badges: string[];
    visibility: string;
    course_id: string | null;
    actor_type: string;
    actor_id: string;
    source_review_id: string | null;
    achievement_id: string | null;
  };
  media: Array<{
    id: string;
    media_type: string;
    media_url: string;
    poster_url: string | null;
    display_order: number | null;
    width: number | null;
    height: number | null;
    aspect_ratio: number | null;
    duration_seconds: number | null;
  }>;
  courses: Array<{
    id: string;
    name: string;
    country: string;
    region: string | null;
  }>;
}

export async function fetchPostForEdit(
  postId: string,
  currentUserId: string
): Promise<PostForEdit | null> {
  // Fetch post with ownership check
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, content, categories, badges, visibility, course_id, actor_type, actor_id, source_review_id, achievement_id, user_id')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    console.error('[fetchPostForEdit] Post not found:', postError);
    return null;
  }

  // CRITICAL: Ownership check
  if (post.user_id !== currentUserId) {
    console.error('[fetchPostForEdit] Ownership check failed');
    return null;
  }

  // Fetch media
  const { data: media } = await supabase
    .from('post_media')
    .select('id, media_type, media_url, poster_url, display_order, width, height, aspect_ratio, duration_seconds')
    .eq('post_id', postId)
    .order('display_order', { ascending: true });

  // Fetch course if set
  let courses: PostForEdit['courses'] = [];
  if (post.course_id) {
    const { data: course } = await supabase
      .from('golf_courses')
      .select('id, name, country, region')
      .eq('id', post.course_id)
      .single();
    if (course) {
      courses = [course];
    }
  }

  return {
    post: {
      id: post.id,
      content: post.content,
      categories: post.categories || [],
      badges: post.badges || [],
      visibility: post.visibility,
      course_id: post.course_id,
      actor_type: post.actor_type,
      actor_id: post.actor_id,
      source_review_id: post.source_review_id,
      achievement_id: post.achievement_id,
    },
    media: media || [],
    courses,
  };
}
