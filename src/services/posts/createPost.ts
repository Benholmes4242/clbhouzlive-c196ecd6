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
}

export interface CreatePostResult {
  id: string;
  user_id: string;
  content: string | null;
  actor_type: string;
  actor_id: string;
  achievement_id: string | null;
  course_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a post and emits the unified post:created event.
 * All post creation should go through this function.
 */
export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: input.userId,
      content: input.content,
      achievement_id: input.achievementId ?? null,
      actor_type: input.actorType,
      actor_id: input.actorId,
      course_id: input.courseId ?? null,
    })
    .select('id, user_id, content, actor_type, actor_id, achievement_id, course_id, created_at, updated_at')
    .single();

  if (error) throw error;

  // Emit the unified event exactly once, only on success
  const evt: PostCreatedEvent = {
    type: 'post:created',
    postId: data.id,
    actorType: data.actor_type as ActorType,
    actorId: data.actor_id,
    userId: data.user_id,
    createdAt: data.created_at,
  };

  postEventBus.emit('post:created', evt);

  return data;
}
