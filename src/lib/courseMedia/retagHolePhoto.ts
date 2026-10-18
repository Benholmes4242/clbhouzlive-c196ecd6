/** MEDIA_TRUST_1_R: member writes use Ben's revised RPC exclusively. Server owns
 * ownership checks, approved status and review-field clearing; read back rows
 * through the existing owner query, never simulate approval or update a table.
 */
import { supabase } from '@/integrations/supabase/client';
import type { HolePhoto } from './holePhotoData';

export async function retagHolePhoto(row: HolePhoto, hole: number, courseId: string, memberId: string, knownHoles: readonly number[]): Promise<void> {
  if (row.reject_reason === 'not_your_photo') throw new Error('This photograph cannot be retagged because it is not yours.');
  if (row.user_id !== memberId || row.course_id !== courseId || row.status !== 'rejected' || hole === row.hole_no || !knownHoles.includes(hole)) {
    throw new Error('This photograph cannot be retagged.');
  }
  const { error } = await supabase.rpc('retag_hole_photo', { p_id: row.id, p_hole_no: hole });
  if (error) throw error;
}