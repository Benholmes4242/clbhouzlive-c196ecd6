// usePostSubmit - orchestrates the create_post_v2 / finalize_post_v2 pair.
//
// Text-only:  one create_post_v2(has_media:false) round trip and we're done.
// With media: create_post_v2(has_media:true) -> orchestrator uploads +
//             finalize_post_v2 -> success.
//
// Optimistic feed card: we push a PendingPost into the store BEFORE
// create_post_v2 returns (jobId scoped), then attachPostId once the RPC
// returns. Selectors dedupe against the real row that lands on finalize.

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { usePendingPostsStore, type PendingPost } from '@/uploads/pendingPostsStore';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useProfileData } from '@/hooks/useProfileData';
import { usePostUploadOrchestrator } from './usePostUploadOrchestrator';
import type { StageMediaItem, StageCourse } from './useStageComposer';

export interface SubmitInput {
  caption: string;
  media: StageMediaItem[];
  course: StageCourse | null;
  scheduledAt: Date | null;
  actorType: 'personal' | 'business';
  actorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorUsername: string | null;
}

export type SubmitResultKind = 'published' | 'scheduled';

export interface SubmitResult {
  kind: SubmitResultKind;
  postId: string;
  scheduledAt?: string;
}

export function usePostSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orchestrator = usePostUploadOrchestrator();
  const { activeActor } = useActiveActor();
  const { profile } = useProfileData();

  const submit = useCallback(async (input: SubmitInput): Promise<SubmitResult> => {
    setSubmitting(true);
    setError(null);
    try {
      const jobId = crypto.randomUUID();
      const hasMedia = input.media.length > 0;
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

      // Text-only or scheduled-text: single-shot. finalize is implicit on the server.
      if (!hasMedia) {
        return {
          kind: input.scheduledAt ? 'scheduled' : 'published',
          postId,
          scheduledAt: bornObj.scheduled_at,
        };
      }

      // Media path: orchestrate uploads then finalize.
      const finalized = (await orchestrator(
        { jobId, postId, userId, actorType: input.actorType, actorId: input.actorId },
        input.media,
      )) as { status?: string; scheduled_at?: string } | null;

      uploadEventBus.emit('upload:complete', {
        type: 'upload:complete',
        jobId,
        uploadType: 'post',
        postId,
        actorType: input.actorType,
        actorId: input.actorId,
        isScheduled: !!input.scheduledAt,
        scheduledAt: input.scheduledAt?.toISOString(),
      });

      return {
        kind: input.scheduledAt ? 'scheduled' : 'published',
        postId,
        scheduledAt: finalized?.scheduled_at,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Submit failed';
      setError(msg);
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [orchestrator, profile?.id, activeActor?.id, activeActor?.type]);

  return { submit, submitting, error };
}
