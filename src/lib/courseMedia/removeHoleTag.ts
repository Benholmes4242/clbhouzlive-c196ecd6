/** BRIEF_HOLE_TAG_OWNER_CONTROLS: deletes ONLY the owner's course_hole_media row
 * (RLS chm_owner_delete). Never touches post_media, course_review_media,
 * storage or Cloudflare Stream.
 */
import { supabase } from '@/integrations/supabase/client';
import { holeMediaKey, type HolePhoto, type OwnMediaSource } from './holePhotoData';

export async function removeHoleTag(row: HolePhoto, memberId: string): Promise<void> {
  const kind = row.media_type === 'video' ? 'video' : 'photo';
  if (row.user_id !== memberId) throw new Error(`This ${kind} cannot be removed.`);
  const { data, error } = await supabase.from('course_hole_media').delete().eq('id', row.id).eq('user_id', memberId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(`This ${kind} could not be removed.`);
}

export function isHoleTagFromPost(row: HolePhoto, sources: readonly OwnMediaSource[]): boolean {
  const key = holeMediaKey({ mediaType: row.media_type as 'image' | 'video', url: row.media_url, streamId: row.stream_id });
  return sources.some(source => source.url === row.media_url || holeMediaKey(source) === key);
}
