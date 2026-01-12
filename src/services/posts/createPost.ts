// Unified post creation service
// Single place for post insertion - keeps UI components clean

import { supabase } from '@/integrations/supabase/client';
import { postEventBus } from '@/events/postEventBus';
import type { ActorType, PostCreatedEvent } from '@/events/postEvents';

export interface CreatePostInput {
  userId: string;
  content: string | null;
  achievementId?: string | null;
  actorType: ActorType;
  actorId: string;
  courseId?: string | null;
  categories?: string[];
  badges?: string[];
  visibility?: 'anyone' | 'followers' | 'private';
  // Scheduling fields
  scheduledAt?: Date | null;
  status?: 'published' | 'scheduled';
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
 * For scheduled posts:
 * - Set scheduledAt to the target publish time
 * - Set status to 'scheduled'
 * - The post:created event is NOT emitted for scheduled posts
 */
export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const isScheduled = input.scheduledAt && input.status === 'scheduled';
  
  console.log('[createPost] Creating post:', {
    userId: input.userId,
    actorType: input.actorType,
    actorId: input.actorId,
    isScheduled,
    status: isScheduled ? 'scheduled' : 'published',
  });
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: input.userId,
      content: input.content,
      achievement_id: input.achievementId ?? null,
      actor_type: input.actorType,
      actor_id: input.actorId,
      course_id: input.courseId ?? null,
      categories: input.categories ?? [],
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
