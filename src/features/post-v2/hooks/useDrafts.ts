// useDrafts - post_drafts CRUD scoped to the Stage composer.
//
// IMPORTANT: never writes audio_mode or studio_music - the audio system is CUT.
// We use the content / course_* / actor_* columns only. Media is not persisted
// in drafts for P2 (attaching restored files needs P3 work).

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

export function useDrafts(userId: string | null | undefined) {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setDrafts([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('post_drafts')
      .select('id, actor_type, actor_id, content, course_id, course_name, course_country, course_data, updated_at')
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
  }) => {
    if (!userId) return;
    await supabase.from('post_drafts').insert({
      user_id: userId,
      actor_type: patch.actorType,
      actor_id: patch.actorId,
      content: patch.content,
      course_id: patch.courseId ?? null,
      course_name: patch.courseName ?? null,
      course_country: patch.courseCountry ?? null,
      course_data: patch.courses && patch.courses.length > 0
        ? ({ courses: patch.courses } as unknown as never)
        : null,
    } as never);
    await refresh();
  }, [userId, refresh]);

  const remove = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('post_drafts').delete().eq('id', id).eq('user_id', userId);
    await refresh();
  }, [userId, refresh]);

  return { drafts, loading, refresh, save, remove };
}
