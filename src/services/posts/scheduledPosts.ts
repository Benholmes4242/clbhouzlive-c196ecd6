// Scheduled posts service
// Handles CRUD for scheduled posts

import { supabase } from '@/integrations/supabase/client';

export interface ScheduledPost {
  id: string;
  userId: string;
  content: string | null;
  scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed';
  createdAt: string;
  actorType: string;
  actorId: string;
  categories: string[];
  badges: string[];
  visibility: string;
  media: Array<{
    id: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    posterUrl?: string | null;
  }>;
}

/**
 * Fetch all scheduled posts for the current user
 */
export async function fetchScheduledPosts(): Promise<ScheduledPost[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, scheduled_at, status, created_at,
      actor_type, actor_id, categories, badges, visibility,
      post_media (id, media_type, media_url, poster_url)
    `)
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('[scheduledPosts] Error fetching:', error);
    return [];
  }

  return (data || []).map(post => ({
    id: post.id,
    userId: post.user_id,
    content: post.content,
    scheduledAt: post.scheduled_at || '',
    status: post.status as 'scheduled' | 'published' | 'failed',
    createdAt: post.created_at,
    actorType: post.actor_type || 'personal',
    actorId: post.actor_id || post.user_id,
    categories: post.categories || [],
    badges: post.badges || [],
    visibility: post.visibility || 'anyone',
    media: (post.post_media || []).map((m: { id: string; media_type: string; media_url: string; poster_url: string | null }) => ({
      id: m.id,
      mediaType: m.media_type as 'image' | 'video',
      mediaUrl: m.media_url,
      posterUrl: m.poster_url,
    })),
  }));
}

/**
 * Update scheduled time for a post
 */
export async function reschedulePost(postId: string, newScheduledAt: Date): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .update({ scheduled_at: newScheduledAt.toISOString() })
    .eq('id', postId)
    .eq('status', 'scheduled');

  if (error) {
    console.error('[scheduledPosts] Error rescheduling:', error);
    return false;
  }
  return true;
}

/**
 * Publish a scheduled post immediately
 */
export async function publishNow(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .update({ 
      status: 'published', 
      scheduled_at: null,
      created_at: new Date().toISOString() 
    })
    .eq('id', postId)
    .eq('status', 'scheduled');

  if (error) {
    console.error('[scheduledPosts] Error publishing now:', error);
    return false;
  }
  return true;
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('status', 'scheduled');

  if (error) {
    console.error('[scheduledPosts] Error deleting:', error);
    return false;
  }
  return true;
}

/**
 * Get count of scheduled posts for the current user
 */
export async function getScheduledPostCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'scheduled');

  if (error) {
    console.error('[scheduledPosts] Error getting count:', error);
    return 0;
  }
  return count || 0;
}
