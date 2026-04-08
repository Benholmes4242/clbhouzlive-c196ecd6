// useSaveDraft — Shared save-draft logic for PostStudio
// Used by StudioExitSheet and ComposeScreen header

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDrafts } from '@/hooks/useDrafts';
import type { DraftSaveInput } from '@/services/drafts/types';
import type { PostStudioState } from '../types';
import type { ComposerMediaItem } from '../types';

export function useSaveDraft(state: PostStudioState) {
  const { createDraft, uploadMedia, canCreateDraft } = useDrafts();
  const [isSaving, setIsSaving] = useState(false);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (isSaving) return false;
    if (!canCreateDraft) {
      toast.error('Draft limit reached (10 max)');
      return false;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You need to be logged in');
        return false;
      }

      const input: DraftSaveInput = {
        actorType: state.actorType,
        actorId: state.actorId ?? user.id,
        content: state.caption || null,
        visibility: state.visibility,
        courseId: state.taggedCourses[0]?.courseId ?? null,
        courseName: state.taggedCourses[0]?.courseName ?? null,
        courseCountry: state.taggedCourses[0]?.country ?? null,
      };

      const draft = await createDraft(input);
      if (!draft) throw new Error('Failed to create draft');

      // Upload media files if any
      if (state.mediaItems.length > 0) {
        const composerItems: ComposerMediaItem[] = state.mediaItems.map((item, i) => ({
          id: item.id,
          type: item.mediaType,
          file: item.file,
          previewUrl: item.previewUrl,
          thumbnailUrl: item.thumbnailUrl,
          duration: item.duration ?? undefined,
          width: item.width ?? undefined,
          height: item.height ?? undefined,
        }));

        await uploadMedia(draft.id, composerItems);
      }

      toast.success('Draft saved');
      return true;
    } catch (err) {
      console.error('[useSaveDraft] Failed:', err);
      toast.error('Failed to save draft');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state, isSaving, canCreateDraft, createDraft, uploadMedia]);

  return { saveDraft, isSaving, canCreateDraft };
}
