/** Writes are author-scoped by server RLS and independently best-effort like
 * mentions. Credit notifications are exclusively server-owned, never inserted here.
 */
import { supabase } from '@/integrations/supabase/client';
import { singleVideo, type VideoDetails } from './videoDetails';
import type { Json } from '@/integrations/supabase/types';
export async function writeVideoDetails(postId: string, media: readonly { type: string }[], details?: VideoDetails) {
  if (!details || !singleVideo(media)) return;
  const write = async (table: string, action: () => PromiseLike<{ error: unknown }>) => {
    try { const { error } = await action(); if (error) console.warn(`[post-v2] ${table} write failed:`, error); }
    catch (error) { console.warn(`[post-v2] ${table} write failed:`, error); }
  };
  const title = details.title.trim() || null;
  await Promise.all([
    write('post_video_details', () => supabase.from('post_video_details').upsert({ post_id: postId, title, title_on_cover: !!title && details.titleOnCover, links: details.links as unknown as Json, gear: details.gear })),
    details.credits.length ? write('post_video_credits', () => supabase.from('post_video_credits').insert(details.credits.map((credit, position) => ({ post_id: postId, profile_id: credit.id, role: credit.role, position })))) : Promise.resolve(),
    details.thanks.length ? write('post_video_thanks', () => supabase.from('post_video_thanks').insert(details.thanks.map((business, position) => ({ post_id: postId, business_id: business.id, position })))) : Promise.resolve(),
  ]);
}