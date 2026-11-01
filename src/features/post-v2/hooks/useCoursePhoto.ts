/** Photo hydration for all StageCourse sources, including older drafts/edit
 * payloads. Per-id session cache includes no-photo, never guesses a cover. */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { StageCourse } from './useStageComposer';
const photos = new Map<string, Promise<string | null>>();
export function readCoursePhoto(id: string): Promise<string | null> {
  const old = photos.get(id); if (old) return old;
  const read = (async () => { try { const { data,error } = await supabase.from('golf_courses').select('thumbnail_image').eq('id',id).maybeSingle(); return error ? null : data?.thumbnail_image ?? null; } catch { return null; } })();
  photos.set(id,read); return read;
}
export function useCoursePhoto(course: StageCourse | null): string | null {
  const [resolved,setResolved] = useState<{id:string;photo:string|null} | null>(null);
  useEffect(() => { if (!course || course.thumbnail) return; let live = true; void readCoursePhoto(course.id).then(photo => { if(live) setResolved({id:course.id,photo}); }); return () => {live=false;}; },[course?.id,course?.thumbnail]);
  return course?.thumbnail || (resolved?.id === course?.id ? resolved?.photo ?? null : null);
}