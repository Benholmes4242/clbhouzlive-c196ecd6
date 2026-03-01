// Scheduled posts service
// Handles CRUD for scheduled posts

import { supabase } from '@/integrations/supabase/client';

export interface ScheduledPostMedia {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  posterUrl?: string | null;
  width?: number | null;
  height?: number | null;
  aspectRatio?: number | null;
  durationSeconds?: number | null;
  displayOrder?: number | null;
  filterId?: string | null;
  studioEdits?: any | null;
  streamId?: string | null;
  trimStart?: number | null;
  trimEnd?: number | null;
  posterTimestamp?: number | null;
}

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
  courseId: string | null;
  studioMusic: any | null;
  audioMode: string | null;
  media: ScheduledPostMedia[];
}

export interface ScheduledPostForEdit extends ScheduledPost {
  course?: {
    id: string;
    name: string;
    country: string;
    region?: string;
  } | null;
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
      actor_type, actor_id, categories, badges, visibility, course_id,
      studio_music, audio_mode,
      post_media (id, media_type, media_url, poster_url, width, height, aspect_ratio, duration_seconds, display_order, filter_id, studio_edits, stream_id, trim_start, trim_end, poster_timestamp)
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
    courseId: post.course_id,
    studioMusic: post.studio_music,
    audioMode: post.audio_mode,
    media: (post.post_media || []).map((m: any) => ({
      id: m.id,
      mediaType: m.media_type as 'image' | 'video',
      mediaUrl: m.media_url,
      posterUrl: m.poster_url,
      width: m.width,
      height: m.height,
      aspectRatio: m.aspect_ratio,
      durationSeconds: m.duration_seconds,
      displayOrder: m.display_order,
      filterId: m.filter_id,
      studioEdits: m.studio_edits,
      streamId: m.stream_id,
      trimStart: m.trim_start,
      trimEnd: m.trim_end,
      posterTimestamp: m.poster_timestamp,
    })).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
  }));
}

/**
 * Fetch a single scheduled post with full details for editing
 */
export async function fetchScheduledPostForEdit(postId: string): Promise<ScheduledPostForEdit | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, scheduled_at, status, created_at,
      actor_type, actor_id, categories, badges, visibility, course_id,
      studio_music, audio_mode,
      post_media (id, media_type, media_url, poster_url, width, height, aspect_ratio, duration_seconds, display_order, filter_id, studio_edits, stream_id, trim_start, trim_end, poster_timestamp),
      golf_courses!posts_course_id_fkey (id, name, country, region)
    `)
    .eq('id', postId)
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .single();

  if (error || !data) {
    console.error('[scheduledPosts] Error fetching for edit:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    scheduledAt: data.scheduled_at || '',
    status: data.status as 'scheduled' | 'published' | 'failed',
    createdAt: data.created_at,
    actorType: data.actor_type || 'personal',
    actorId: data.actor_id || data.user_id,
    categories: data.categories || [],
    badges: data.badges || [],
    visibility: data.visibility || 'anyone',
    courseId: data.course_id,
    studioMusic: data.studio_music,
    audioMode: data.audio_mode,
    media: (data.post_media || []).map((m: any) => ({
      id: m.id,
      mediaType: m.media_type as 'image' | 'video',
      mediaUrl: m.media_url,
      posterUrl: m.poster_url,
      width: m.width,
      height: m.height,
      aspectRatio: m.aspect_ratio,
      durationSeconds: m.duration_seconds,
      displayOrder: m.display_order,
      filterId: m.filter_id,
      studioEdits: m.studio_edits,
      streamId: m.stream_id,
      trimStart: m.trim_start,
      trimEnd: m.trim_end,
      posterTimestamp: m.poster_timestamp,
    })).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    course: data.golf_courses ? {
      id: data.golf_courses.id,
      name: data.golf_courses.name,
      country: data.golf_courses.country,
      region: data.golf_courses.region,
    } : null,
  };
}

/**
 * Update a scheduled post (content, schedule, etc.)
 */
export interface UpdateScheduledPostData {
  content?: string | null;
  scheduledAt?: Date;
  categories?: string[];
  badges?: string[];
  visibility?: string;
  courseId?: string | null;
}

export async function updateScheduledPost(
  postId: string, 
  data: UpdateScheduledPostData
): Promise<boolean> {
  const updatePayload: Record<string, any> = {};
  
  if (data.content !== undefined) updatePayload.content = data.content;
  if (data.scheduledAt) updatePayload.scheduled_at = data.scheduledAt.toISOString();
  if (data.categories) updatePayload.categories = data.categories;
  if (data.badges) updatePayload.badges = data.badges;
  if (data.visibility) updatePayload.visibility = data.visibility;
  if (data.courseId !== undefined) updatePayload.course_id = data.courseId;

  const { error } = await supabase
    .from('posts')
    .update(updatePayload)
    .eq('id', postId)
    .eq('status', 'scheduled');

  if (error) {
    console.error('[scheduledPosts] Error updating:', error);
    return false;
  }
  return true;
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
