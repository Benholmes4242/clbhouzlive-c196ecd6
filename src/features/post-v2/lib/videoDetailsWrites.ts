/** Writes are author-scoped by server RLS and independently best-effort like
 * mentions. Credit notifications are exclusively server-owned, never inserted here.
 */
import { supabase } from '@/integrations/supabase/client';
import { singleVideo, holeChapters, videoDuration, type VideoDetails } from './videoDetails';
import { isLongFormVideo } from '@/constants/videoRules';
import type { Json } from '@/integrations/supabase/types';
export async function writeVideoDetails(postId: string, media: readonly { type: string; duration?: number; trimStart?: number | null; trimEnd?: number | null }[], details?: VideoDetails, round?: { scoreId: string | null; holes: number | null }) {
  if (!details || !singleVideo(media)) return;
  const write = async (table: string, action: () => PromiseLike<{ error: unknown }>) => {
    try { const { error } = await action(); if (error) console.warn(`[post-v2] ${table} write failed:`, error); }
    catch (error) { console.warn(`[post-v2] ${table} write failed:`, error); }
  };
  const title = details.title.trim() || null;
  await Promise.all([
    write('post_video_details', () => supabase.from('post_video_details').upsert({ post_id: postId, title, title_on_cover: !!title && details.titleOnCover, links: details.links as unknown as Json, gear: details.gear, score_follows: details.scoreFollows !== false } as never)),
    details.credits.length ? write('post_video_credits', () => supabase.from('post_video_credits').insert(details.credits.map((credit, position) => ({ post_id: postId, profile_id: credit.id, role: credit.role, position })))) : Promise.resolve(),
    details.thanks.length ? write('post_video_thanks', () => supabase.from('post_video_thanks').insert(details.thanks.map((business, position) => ({ post_id: postId, business_id: business.id, position })))) : Promise.resolve(),
  ]);
  const duration = videoDuration(media[0]);
  if (!round?.scoreId || details.marksRoundId !== round.scoreId || !isLongFormVideo(duration) || duration == null) return;
  const chapters = holeChapters(details.holeMarks ?? {}, round.holes ?? 0, duration);
  if (chapters.length >= 3) await write('post_video_chapters', () => supabase.from('post_video_chapters').insert(chapters.filter(c => c.holeNo != null).map(c => ({ post_id: postId, hole_no: c.holeNo, start_seconds: c.seconds })) as never));
}