// Unified post creation service
// Single place for post insertion - keeps UI components clean
// Now supports multi-course tagging via post_courses junction table

import { supabase } from '@/integrations/supabase/client';
import { detectPostCategories } from '@/utils/detectPostCategories';
import { postEventBus } from '@/events/postEventBus';
import type { ActorType, PostCreatedEvent } from '@/events/postEvents';

export interface CreatePostInput {
  userId: string;
  content: string | null;
  achievementId?: string | null;
  actorType: ActorType;
  actorId: string;
  courseId?: string | null;
  courseIds?: string[]; // Multi-course support
  categories?: string[];
  badges?: string[];
  visibility?: 'anyone' | 'followers' | 'private';
  // Scheduling fields
  scheduledAt?: Date | null;
  // 'uploading' = post created, media still uploading (hidden from feeds)
  // 'published' = fully ready and visible in feeds
  // 'scheduled' = will be published at scheduledAt time
  status?: 'published' | 'scheduled' | 'uploading';
}

export interface CreatePostResult {
  id: string;
  user_id: string;
  content: string | null;
  actor_type: string;
  actor_id: string;
  achievement_id: string | null;
  course_id: string | null;
  categories: string[];
  badges: string[];
  visibility: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a post and emits the unified post:created event.
 * All post creation should go through this function.
 * 
 * For multi-course tagging:
 * - Pass courseIds array with all course IDs
 * - courseId is kept for backwards compatibility (first course)
 * - Junction table post_courses is populated automatically
 * 
 * For scheduled posts:
 * - Set scheduledAt to the target publish time
 * - Set status to 'scheduled'
 * - The post:created event is NOT emitted for scheduled posts
 */
export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const isScheduled = input.scheduledAt && input.status === 'scheduled';
  
  // Get current user for validation
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  // Validate actor_id for personal posts - must match authenticated user
  if (input.actorType === 'personal' && input.actorId !== user.id) {
    console.error('[createPost] actor_id mismatch for personal post', {
      actorId: input.actorId,
      userId: user.id
    });
    throw new Error('Invalid actor for personal post');
  }
  
  // For business posts, verify membership before attempting insert
  // This provides a better error message than RLS rejection
  if (input.actorType === 'business') {
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', input.actorId)
      .eq('user_profile_id', user.id)
      .in('role', ['owner', 'admin', 'editor'])
      .single();
    
    if (!membership) {
      console.error('[createPost] User lacks permission to post for business', {
        businessId: input.actorId,
        userId: user.id
      });
      throw new Error('You do not have permission to post for this business');
    }
  }
  
  // Determine the primary course_id for backwards compatibility
  // Use courseId if provided, otherwise first course from courseIds array
  const primaryCourseId = input.courseId ?? (input.courseIds?.[0] ?? null);
  
  console.log('[createPost] Creating post:', {
    userId: input.userId,
    actorType: input.actorType,
    actorId: input.actorId,
    isScheduled,
    status: isScheduled ? 'scheduled' : 'published',
    courseCount: input.courseIds?.length || (input.courseId ? 1 : 0),
  });
  
  // Auto-detect categories from caption if none explicitly provided
  const autoCategories = input.content
    ? detectPostCategories(input.content)
    : [];

  // Merge explicit categories (if any) with auto-detected ones, deduplicated
  const finalCategories = Array.from(
    new Set([...(input.categories ?? []), ...autoCategories])
  );

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: input.userId,
      content: input.content,
      achievement_id: input.achievementId ?? null,
      actor_type: input.actorType,
      actor_id: input.actorId,
      course_id: primaryCourseId, // Backwards compatibility
      categories: finalCategories,
      post_categories: finalCategories,
      badges: input.badges ?? [],
      visibility: input.visibility ?? 'anyone',
      status: isScheduled ? 'scheduled' : 'published',
      scheduled_at: input.scheduledAt?.toISOString() ?? null,
    })
    .select('id, user_id, content, actor_type, actor_id, achievement_id, course_id, categories, badges, visibility, status, scheduled_at, created_at, updated_at')
    .single();

  if (error) {
    console.error('[createPost] Database error:', error.message, error.code, error.details);
    throw error;
  }
  
  console.log('[createPost] Post created:', data.id);

  // Insert into post_courses junction table for multi-course support
  const allCourseIds = input.courseIds ?? (input.courseId ? [input.courseId] : []);
  
  if (allCourseIds.length > 0) {
    const postCoursesData = allCourseIds.map((courseId, index) => ({
      post_id: data.id,
      course_id: courseId,
      display_order: index,
    }));
    
    const { error: junctionError } = await supabase
      .from('post_courses')
      .insert(postCoursesData);
    
    if (junctionError) {
      console.error('[createPost] Failed to insert post_courses:', junctionError);
      // Don't fail the entire post creation - junction table is supplementary
      // The primary course_id is still set on the post for backwards compatibility
    } else {
      console.log('[createPost] Inserted post_courses:', allCourseIds.length);
    }
  }

  // Only emit event for immediately published posts (not scheduled)
  if (!isScheduled) {
    const evt: PostCreatedEvent = {
      type: 'post:created',
      postId: data.id,
      actorType: data.actor_type as ActorType,
      actorId: data.actor_id,
      userId: data.user_id,
      createdAt: data.created_at,
    };

    postEventBus.emit('post:created', evt);
  }

  return data;
}
