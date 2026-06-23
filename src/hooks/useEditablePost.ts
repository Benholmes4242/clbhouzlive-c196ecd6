// useEditablePost — fetches a post + its media + tagged courses for the
// composer's edit mode. Gated on canManage: personal posts require the
// caller to be the author; business posts require owner/admin membership.
//
// Brief 2A: read-only shape; mutations live in useUpdatePost.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export type EditablePostVisibility = 'anyone' | 'followers' | 'private';

export interface EditablePostMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl: string | null;
  streamId: string | null;
  width: number | null;
  height: number | null;
  /** When null, recrop must be disabled in the UI ("Original unavailable"). */
  originalMediaUrl: string | null;
  displayOrder: number;
}

export interface EditablePostCourse {
  courseId: string;
  courseName: string;
  country: string | null;
  displayOrder: number;
}

export interface EditablePost {
  id: string;
  caption: string;
  visibility: EditablePostVisibility;
  actorType: 'personal' | 'business';
  actorId: string;
  userId: string;
  /** Posts auto-shared from a review can't be edited via the generic composer. */
  sourceReviewId: string | null;
  media: EditablePostMedia[];
  courses: EditablePostCourse[];
  /** Resolved server-side: post owner OR (business) owner/admin of actor_id. */
  canManage: boolean;
  /** Set when the post exists but the viewer can't manage it. */
  blockedReason: 'not-owner' | 'review-derived' | null;
}

export function useEditablePost(postId: string | null | undefined) {
  const { session } = useSupabaseSession();
  const viewerId = session?.user?.id ?? null;

  return useQuery({
    queryKey: ['editable-post', postId, viewerId],
    enabled: !!postId && !!viewerId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<EditablePost | null> => {
      if (!postId || !viewerId) return null;

      const { data: post, error: postError } = await supabase
        .from('posts')
        .select(
          'id, user_id, content, visibility, actor_type, actor_id, source_review_id',
        )
        .eq('id', postId)
        .maybeSingle();

      if (postError) throw postError;
      if (!post) return null;

      // Ownership / management check.
      let canManage = post.user_id === viewerId;
      if (!canManage && post.actor_type === 'business' && post.actor_id) {
        const { data: membership } = await supabase
          .from('business_members')
          .select('role')
          .eq('business_id', post.actor_id)
          .eq('user_profile_id', viewerId)
          .maybeSingle();
        const role = membership?.role as string | undefined;
        canManage = !!role && ['owner', 'admin'].includes(role);
      }

      // Review-derived posts are managed from the review, not here.
      if (post.source_review_id) {
        return {
          id: post.id,
          caption: post.content ?? '',
          visibility: (post.visibility as EditablePostVisibility) ?? 'anyone',
          actorType: (post.actor_type as 'personal' | 'business') ?? 'personal',
          actorId: post.actor_id ?? post.user_id,
          userId: post.user_id,
          sourceReviewId: post.source_review_id,
          media: [],
          courses: [],
          canManage: false,
          blockedReason: 'review-derived',
        };
      }

      if (!canManage) {
        return {
          id: post.id,
          caption: post.content ?? '',
          visibility: (post.visibility as EditablePostVisibility) ?? 'anyone',
          actorType: (post.actor_type as 'personal' | 'business') ?? 'personal',
          actorId: post.actor_id ?? post.user_id,
          userId: post.user_id,
          sourceReviewId: null,
          media: [],
          courses: [],
          canManage: false,
          blockedReason: 'not-owner',
        };
      }

      const [{ data: mediaRows, error: mediaError }, { data: courseRows, error: courseError }] =
        await Promise.all([
          supabase
            .from('post_media')
            .select(
              'id, media_url, media_type, poster_url, stream_id, media_width, media_height, original_media_url, display_order, created_at',
            )
            .eq('post_id', post.id)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true }),
          supabase
            .from('post_courses')
            .select(
              'course_id, display_order, golf_courses!inner ( id, name, country )',
            )
            .eq('post_id', post.id)
            .order('display_order', { ascending: true }),
        ]);

      if (mediaError) throw mediaError;
      if (courseError) throw courseError;

      const media: EditablePostMedia[] = (mediaRows ?? []).map((row: any, idx: number) => ({
        id: row.id,
        mediaUrl: row.media_url,
        mediaType: (row.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
        posterUrl: row.poster_url ?? null,
        streamId: row.stream_id ?? null,
        width: row.media_width ?? null,
        height: row.media_height ?? null,
        originalMediaUrl: row.original_media_url ?? null,
        displayOrder: typeof row.display_order === 'number' ? row.display_order : idx,
      }));

      const courses: EditablePostCourse[] = (courseRows ?? []).map((row: any, idx: number) => ({
        courseId: row.course_id,
        courseName: row.golf_courses?.name ?? '',
        country: row.golf_courses?.country ?? null,
        displayOrder: typeof row.display_order === 'number' ? row.display_order : idx,
      }));

      return {
        id: post.id,
        caption: post.content ?? '',
        visibility: (post.visibility as EditablePostVisibility) ?? 'anyone',
        actorType: (post.actor_type as 'personal' | 'business') ?? 'personal',
        actorId: post.actor_id ?? post.user_id,
        userId: post.user_id,
        sourceReviewId: null,
        media,
        courses,
        canManage: true,
        blockedReason: null,
      };
    },
  });
}
