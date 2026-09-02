// usePostSubmit - orchestrates create_post_v2 and hands media uploads to
// the module-level postUploadController, which OUTLIVES the composer.
//
// Text-only:  UNREACHABLE from the wizard since media became mandatory. The
//             has_media:false branch is kept only for legacy/scheduled rows.

// With media: create_post_v2(has_media:true) -> addPending/attachPostId ->
//             startPostUpload(...) fires and returns synchronously so the
//             composer can dismiss instantly. Controller finalizes later.

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { usePendingPostsStore, type PendingPost } from '@/uploads/pendingPostsStore';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useProfileData } from '@/hooks/useProfileData';
import { startPostUpload } from '../lib/postUploadController';
import { extractMentions } from '@/lib/mentions/format';
import type { StageMediaItem, StageCourse } from './useStageComposer';

export interface SubmitInput {
  caption: string;
  media: StageMediaItem[];
  /** Primary course - written to posts.course_id exactly as today. */
  course: StageCourse | null;
  /** Full ordered tag list - written to posts.tagged_course_ids. */
  courses?: StageCourse[];
  scheduledAt: Date | null;

  actorType: 'personal' | 'business';
  actorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorUsername: string | null;
}

export type SubmitResultKind = 'published' | 'scheduled' | 'uploading';

export interface SubmitResult {
  kind: SubmitResultKind;
  postId: string;
  scheduledAt?: string;
  /** Present on the media path; drives live progress in PostSuccessV2. */
  jobId?: string;
  /** True when the client returned early and the controller is still uploading. */
  isUploading?: boolean;
  /** True when the post is scheduled (independent of upload state). */
  isScheduled?: boolean;

  // ---- facts the success screen states. Nothing is derived or invented here:
  // a field is absent when the post does not have it, and the screen omits
  // whatever is absent rather than showing a zero or a dash.
  /** Primary tagged course name, when one was tagged. */
  courseName?: string;
  /** Photo count on this post (0 for text-only). */
  photoCount?: number;
  /** Video count on this post. */
  videoCount?: number;
  /**
   * Round figures for a round post. NOTE: the post-v2 composer cannot attach a
   * round today, so nothing populates this yet - the success strip renders it
   * only when a caller supplies it, and shows media counts otherwise.
   */
  round?: { gross?: number | null; toPar?: number | null; birdies?: number | null };

  // ---- card facts (§2): the material needed to render the post AS IT WILL
  // APPEAR while it uploads. Client-side only — previewUrl blobs stay valid for
  // the life of the composer mount, which is exactly the life of this screen.
  /** The caption the member typed, verbatim (may be empty). */
  caption?: string;
  /** Posting actor's display name. */
  actorName?: string;
  /** Posting actor's avatar. */
  actorAvatarUrl?: string | null;
  /** Posting actor's id — keys the avatar fallback hue. */
  actorId?: string | null;
  /** Ordered local previews for the card's media block. */
  mediaPreviews?: { url: string; type: 'image' | 'video' }[];
}

export function usePostSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeActor } = useActiveActor();
  const { profile } = useProfileData();

  const submit = useCallback(async (input: SubmitInput): Promise<SubmitResult> => {
    setSubmitting(true);
    setError(null);
    const jobId = crypto.randomUUID();
    const hasMedia = input.media.length > 0;
    try {
      const userId = profile?.id;
      if (!userId) throw new Error('Not signed in');

      // Push optimistic pending card only when we have media - text-only
      // posts land as real rows in a single round-trip and don't need one.
      if (hasMedia) {
        const pending: PendingPost = {
          jobId,
          postId: null,
          actorType: input.actorType,
          actorId: input.actorId,
          userId,
          viewerActorType: (activeActor?.type ?? 'personal') as 'personal' | 'business',
          viewerActorId: activeActor?.id ?? userId,
          authorName: input.authorName,
          authorAvatarUrl: input.authorAvatarUrl,
          authorUsername: input.authorUsername,
          caption: input.caption,
          media: input.media.map(m => ({ id: m.id, kind: m.type, previewUrl: m.previewUrl })),
          courseId: input.course?.id,
          courseName: input.course?.name,
          totalFiles: input.media.length,
          fileProgress: {},
          status: 'queued',
          files: input.media.map(m => m.file),
          createdAt: new Date().toISOString(),
        };
        usePendingPostsStore.getState().addPending(pending);
        uploadEventBus.emit('upload:enqueued', {
          type: 'upload:enqueued',
          jobId,
          uploadType: 'post',
          actorType: input.actorType,
          actorId: input.actorId,
          fileCount: input.media.length,
        });
      }

      // Birth the post via RPC (SECURITY INVOKER; RLS enforces actor rights).
      // Visibility selector was deliberately removed in the v2 composer -
      // all posts are public ('anyone'). Owner decision 2026-07-19.
      const { data: born, error: bornErr } = await supabase.rpc('create_post_v2', {
        p_actor_id: input.actorId,
        p_actor_type: input.actorType,
        p_content: input.caption,
        p_course_id: input.course?.id ?? undefined,
        p_has_media: hasMedia,
        p_scheduled_at: input.scheduledAt ? input.scheduledAt.toISOString() : undefined,
        p_visibility: 'anyone',
      });
      if (bornErr) throw bornErr;
      const bornObj = (born ?? {}) as { post_id?: string; status?: string; scheduled_at?: string };
      const postId = bornObj.post_id;
      if (!postId) throw new Error('create_post_v2 returned no post_id');

      // Multi-course tag: write the full ordered list to posts.tagged_course_ids.
      // The primary tag (course_id) is already set by create_post_v2 above.
      const taggedIds = (input.courses && input.courses.length > 0)
        ? input.courses.map((c) => c.id)
        : (input.course ? [input.course.id] : []);
      const postPatch: Record<string, unknown> = {};
      if (taggedIds.length > 0) postPatch.tagged_course_ids = taggedIds;
      if (Object.keys(postPatch).length > 0) {
        const { error: tagErr } = await supabase
          .from('posts')
          .update(postPatch as never)
          .eq('id', postId);
        if (tagErr) console.warn('[post-v2] tag write failed:', tagErr);
      }





      // Mention notifications: insert into the canonical public.mentions
      // pipeline (source_type='post'). The trg_create_mention_notification
      // trigger fans out notifications with self-mention and block guards.
      // Non-blocking: a mention-write failure must never fail the post.
      const mentions = extractMentions(input.caption);
      if (mentions.length > 0) {
        const rows = mentions.map((m) => ({
          source_type: 'post' as const,
          source_id: postId,
          mentioned_type: m.entityType,
          mentioned_id: m.entityId,
          mentioner_id: userId,
        }));
        const { error: mErr } = await supabase
          .from('mentions')
          .insert(rows as never);
        if (mErr) console.warn('[post-v2] mentions write failed:', mErr);
      }



      // Text-only or scheduled-text: single-shot. finalize is implicit on the server.
      if (!hasMedia) {
        return {
          kind: input.scheduledAt ? 'scheduled' : 'published',
          postId,
          scheduledAt: bornObj.scheduled_at,
          isScheduled: !!input.scheduledAt,
          courseName: input.course?.name,
          caption: input.caption,
          actorName: input.authorName,
          actorAvatarUrl: input.authorAvatarUrl,
          actorId: input.actorId,
        };
      }

      // Media path: hand off to the module-level controller and return
      // immediately. The controller finalizes on completion.
      startPostUpload(
        {
          jobId,
          postId,
          userId,
          actorType: input.actorType,
          actorId: input.actorId,
          isScheduled: !!input.scheduledAt,
          scheduledAt: input.scheduledAt?.toISOString(),
        },
        input.media,
      );

      return {
        kind: 'uploading',
        postId,
        jobId,
        scheduledAt: input.scheduledAt?.toISOString(),
        isUploading: true,
        isScheduled: !!input.scheduledAt,
        courseName: input.course?.name,
        photoCount: input.media.filter((m) => m.type !== 'video').length,
        videoCount: input.media.filter((m) => m.type === 'video').length,
        caption: input.caption,
        actorName: input.authorName,
        actorAvatarUrl: input.authorAvatarUrl,
        actorId: input.actorId,
        mediaPreviews: input.media.map((m) => ({ url: m.previewUrl, type: m.type })),
      };
    } catch (e) {
      // Roll back the optimistic pending card - the post was never born.
      if (hasMedia) {
        try { usePendingPostsStore.getState().removeJob(jobId); } catch { /* store rollback best-effort */ }
      }
      const msg = e instanceof Error ? e.message : 'Submit failed';
      setError(msg);
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [profile?.id, activeActor?.id, activeActor?.type]);

  return { submit, submitting, error };
}
