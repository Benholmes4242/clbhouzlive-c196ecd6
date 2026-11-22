/** Mention entities — ONE batched read per feed page (run inside
 * fetchPostGolfTags) for every @mentioned
 * user and business in the page's captions and review texts: members through
 * readMemberFaces (the canonical public-face read), businesses through one
 * business_accounts read. Cached with the page's golf tags in React Query.
 * Cards never fetch. */
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost } from '@/components/media-system/types/media';
import { readMemberFaces } from '@/lib/members/readMemberFaces';
import { mentionEntityKey, type MentionEntity } from '@/lib/mentions/taggedEntities';

export const postTagText = (p: FeedPost): string => (p.isReview ? p.review?.reviewText || p.caption : p.caption) || '';

export async function fetchMentionEntities(keys: { users: string[]; businesses: string[] }): Promise<Map<string, MentionEntity>> {
  const out = new Map<string, MentionEntity>();
  const [faces, biz] = await Promise.all([
    keys.users.length ? readMemberFaces(keys.users).catch(() => new Map()) : Promise.resolve(new Map()),
    keys.businesses.length
      ? supabase.from('business_accounts').select('id, name, logo_url').in('id', keys.businesses).then((r) => r.data ?? [], () => [])
      : Promise.resolve([] as Array<{ id: string; name: string | null; logo_url: string | null }>),
  ]);
  for (const f of faces.values()) out.set(mentionEntityKey('user', f.id), { name: f.displayName || f.username || '', username: f.username, avatarUrl: f.photoUrl });
  for (const b of biz as Array<{ id: string; name: string | null; logo_url: string | null }>) out.set(mentionEntityKey('business', b.id), { name: b.name || '', avatarUrl: b.logo_url });
  return out;
}
