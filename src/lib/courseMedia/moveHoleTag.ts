/** BRIEF_HOLE_TAG_OWNER_CONTROLS: an owner moves their own live (approved) tag.
 * Reuses the retag_hole_photo RPC, which already accepts approved rows; the
 * rejected-tag flow stays in retagHolePhoto.ts.
 */
import { supabase } from '@/integrations/supabase/client';
import type { HolePhoto } from './holePhotoData';

export async function moveHoleTag(row: HolePhoto, hole: number, courseId: string, memberId: string, knownHoles: readonly number[]): Promise<void> {
  const kind = row.media_type === 'video' ? 'video' : 'photo';
  if (row.user_id !== memberId || row.course_id !== courseId || row.status !== 'approved' || hole === row.hole_no || !knownHoles.includes(hole)) {
    throw new Error(`This ${kind} cannot be moved.`);
  }
  const { error } = await supabase.rpc('retag_hole_photo', { p_id: row.id, p_hole_no: hole });
  if (error) throw error;
}
