// useDrafts - post_drafts CRUD scoped to the Stage composer.
//
// IMPORTANT: never writes audio_mode or studio_music - the audio system is CUT.
// PF1 stores golf choices plus media through the existing draft media helpers.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { saveComposerMedia } from '../lib/composerDrafts';
import type { StageMediaItem } from './useStageComposer';
import type { PostShotTag } from '../lib/composerGolfRules';
import type { PostVisibility } from '../lib/golfPostRules';

export interface DraftRow {
  id: string;
  actor_type: 'personal' | 'business';
  actor_id: string;
  content: string | null;
  course_id: string | null;
  course_name: string | null;
  course_country: string | null;
  /** Multi-course tag list stashed via course_data.courses. */
  course_data: { courses?: Array<{ id: string; name: string; country: string | null }> } | null;
  updated_at: string;
  hole_no?: number | null;
  shot_tags?: PostShotTag[];
  attached_score_id?: string | null;
  visibility?: PostVisibility;
}

export function useDrafts(userId: string | null | undefined) {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setDrafts([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('post_drafts')
      .select('id, actor_type, actor_id, content, course_id, course_name, course_country, course_data, updated_at, hole_no, shot_tags, attached_score_id, visibility')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20);
    if (!error && data) setDrafts(data as unknown as DraftRow[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (patch: {
    actorType: 'personal' | 'business';
    actorId: string;
    content: string | null;
    courseId?: string | null;
    courseName?: string | null;
    courseCountry?: string | null;
    /** Full ordered multi-course tag list; persisted via course_data.courses. */
    courses?: Array<{ id: string; name: string; country?: string | null }>;
    media?: StageMediaItem[];
    holeNo?: number | null;
    postShotTags?: PostShotTag[];
    attachedScoreId?: string | null;
    visibility?: PostVisibility;
    addToGuide?: boolean;
  }) => {
    if (!userId) throw new Error('Not signed in');
    const {data,error}=await supabase.from('post_drafts').insert({
      user_id: userId,
      actor_type: patch.actorType,
      actor_id: patch.actorId,
      content: patch.content,
      course_id: patch.courseId ?? null,
      course_name: patch.courseName ?? null,
      course_country: patch.courseCountry ?? null,
      course_data: {courses:patch.courses??[],addToGuide:patch.addToGuide??true} as never,
      hole_no:patch.courseId ? patch.holeNo??null : null,
      shot_tags:patch.postShotTags??[],
      attached_score_id:patch.actorType==='personal'?patch.attachedScoreId??null:null,
      visibility:patch.visibility??'anyone',
    } as never).select('id').single();
    if(error) throw error;
    if(!data?.id) throw new Error('Draft was not saved');
    try {await saveComposerMedia(data.id,patch.media??[]);} catch(error) {await supabase.from('post_drafts').delete().eq('id',data.id).eq('user_id',userId);throw error;}
    await refresh();
    return data.id;
  }, [userId, refresh]);

  const remove = useCallback(async (id: string) => {
    if (!userId) return;
    const {error}=await supabase.from('post_drafts').delete().eq('id', id).eq('user_id', userId);
    if(error) throw error;
    await refresh();
  }, [userId, refresh]);

  return { drafts, loading, refresh, save, remove };
}
