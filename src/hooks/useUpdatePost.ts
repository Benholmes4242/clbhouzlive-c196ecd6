// useUpdatePost — reconcile an existing post.
// 2A covered: caption, visibility, courses (replace junction), remove media,
// reorder media (display_order).
// 2B adds: recrop existing image media (bake → re-upload R2 → swap media_url
// → fire-and-forget cleanup of the prior derivative). original_media_url
// stays intact across recrops — it is the immutable source.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type UpdatePostVisibility = 'anyone' | 'followers' | 'private';

export interface UpdatePostMediaOrder {
  /** Existing post_media.id to keep. */
  id: string;
  /** New ordinal in the post (0-based). */
  displayOrder: number;
}

export interface UpdatePostRecrop {
  /** post_media.id whose derivative is being replaced. */
  id: string;
  /** Newly baked image File ready for R2 upload. */
  bakedFile: File;
  /** The prior post_media.media_url — queued for R2 cleanup after swap. */
  previousMediaUrl: string;
}

export interface UpdatePostInput {
  postId: string;
  caption: string;
  visibility: UpdatePostVisibility;
  /** Ordered list of course ids — first becomes the primary `posts.course_id`. */
  courseIds: string[];
  /** Media ids that survived the edit, in their new order. */
  keptMedia: UpdatePostMediaOrder[];
  /** Media ids the user removed. */
  removedMediaIds: string[];
  /** Recropped image media to re-upload and swap in place. */
  recropMedia?: UpdatePostRecrop[];
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePost = async (
    input: UpdatePostInput,
  ): Promise<{ success: boolean }> => {
    setIsUpdating(true);
    try {
      const {
        postId,
        caption,
        visibility,
        courseIds,
        keptMedia,
        removedMediaIds,
        recropMedia = [],
      } = input;

      // Dedupe + preserve order on courses.
      const orderedCourseIds: string[] = [];
      const seen = new Set<string>();
      for (const id of courseIds) {
        if (id && !seen.has(id)) {
          seen.add(id);
          orderedCourseIds.push(id);
        }
      }
      const primaryCourseId = orderedCourseIds[0] ?? null;

      // 1. Snapshot removed media so we can fire-and-forget R2 / Stream cleanup.
      let removedMediaSnapshot: Array<{
        id: string;
        media_url: string;
        media_type: 'image' | 'video';
        stream_id: string | null;
      }> = [];
      if (removedMediaIds.length > 0) {
        const { data: rows, error: snapErr } = await supabase
          .from('post_media')
          .select('id, media_url, media_type, stream_id')
          .in('id', removedMediaIds);
        if (snapErr) {
          console.warn('[useUpdatePost] removed media snapshot failed:', snapErr);
        } else {
          removedMediaSnapshot = (rows ?? []).map((r: any) => ({
            id: r.id,
            media_url: r.media_url,
            media_type: (r.media_type === 'video' ? 'video' : 'image') as
              | 'image'
              | 'video',
            stream_id: r.stream_id ?? null,
          }));
        }
      }

      // 2. Patch the post row.
      const { error: postError } = await supabase
        .from('posts')
        .update({
          content: caption?.length ? caption : null,
          visibility,
          course_id: primaryCourseId,
        })
        .eq('id', postId);
      if (postError) throw postError;

      // 3. Replace post_courses junction.
      const { error: delPcErr } = await supabase
        .from('post_courses')
        .delete()
        .eq('post_id', postId);
      if (delPcErr) throw delPcErr;
      if (orderedCourseIds.length > 0) {
        const rows = orderedCourseIds.map((course_id, i) => ({
          post_id: postId,
          course_id,
          display_order: i,
        }));
        const { error: insPcErr } = await supabase
          .from('post_courses')
          .insert(rows);
        if (insPcErr) throw insPcErr;
      }

      // 4. Delete removed media rows.
      if (removedMediaIds.length > 0) {
        const { error: delMediaErr } = await supabase
          .from('post_media')
          .delete()
          .in('id', removedMediaIds);
        if (delMediaErr) throw delMediaErr;
      }

      // 5. Recrop: upload each new derivative, then swap media_url. The prior
      //    derivative URLs are queued for cleanup alongside removed media so
      //    the storage teardown happens in a single edge-function invocation.
      const recropCleanup: Array<{
        id: string;
        media_url: string;
        media_type: 'image' | 'video';
        stream_id: string | null;
      }> = [];
      if (recropMedia.length > 0) {
        const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
        for (const item of recropMedia) {
          const ext = item.bakedFile.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-recrop-${item.id}-${Math.random()
            .toString(36)
            .slice(2, 10)}.${ext}`;
          const up = await uploadToCloudflareR2(
            item.bakedFile,
            'clbhouz-post-images',
            fileName,
          );
          if (!up.success || !up.publicUrl) {
            throw new Error(up.error || 'Recrop upload failed');
          }
          const { error: swapErr } = await supabase
            .from('post_media')
            .update({ media_url: up.publicUrl })
            .eq('id', item.id);
          if (swapErr) throw swapErr;
          // Queue prior derivative for R2 cleanup. id is informational only —
          // the cleanup function deletes by media_url / stream_id.
          recropCleanup.push({
            id: `recrop_${item.id}`,
            media_url: item.previousMediaUrl,
            media_type: 'image',
            stream_id: null,
          });
        }
      }

      // 6. Reorder kept media — one UPDATE per row. Lists are <=10.
      for (const item of keptMedia) {
        const { error: orderErr } = await supabase
          .from('post_media')
          .update({ display_order: item.displayOrder })
          .eq('id', item.id);
        if (orderErr) throw orderErr;
      }

      // 7. Fire-and-forget external cleanup for removed + recropped derivatives.
      const cleanupItems = [...removedMediaSnapshot, ...recropCleanup];
      if (cleanupItems.length > 0) {
        supabase.functions
          .invoke('cleanup-review-media', {
            body: { mediaItems: cleanupItems },
          })
          .catch((err) => {
            console.warn('[useUpdatePost] media cleanup failed:', err);
          });
      }

      // 8. Cache + listeners.
      queryClient.invalidateQueries({ queryKey: ['editable-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      window.dispatchEvent(
        new CustomEvent('postUpdated', { detail: { postId } }),
      );

      return { success: true };
    } catch (err) {
      console.error('[useUpdatePost] failed:', err);
      toast.error("Couldn't update post", {
        description:
          err instanceof Error ? err.message : 'Please try again in a moment.',
      });
      return { success: false };
    } finally {
      setIsUpdating(false);
    }
  };

  return { updatePost, isUpdating };
}
