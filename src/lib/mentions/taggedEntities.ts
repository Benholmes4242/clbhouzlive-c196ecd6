/** EVERYONE TAGGED — the feed's tagged pill and panel list the played-with
 * people PLUS every @mentioned user and business in the post caption or review
 * text. Played-with first, then mentions in text order; de-duplicated by id;
 * the author excluded. Mentions are parsed only through extractMentions (the
 * one regex lives in format.ts). Faces and names come from the page's ONE
 * batched entity read; an unread entity keeps its markup display name and an
 * initials face. */
import { extractMentions } from './format';
import type { PlayedWithPerson } from '@/components/feed/PostGolfTags';

export interface MentionEntity { name: string; avatarUrl: string | null; username?: string | null }
/** Keyed `${'user' | 'business'}:${lowercase id}`. */
export type MentionEntityMap = ReadonlyMap<string, MentionEntity>;

export const mentionEntityKey = (kind: 'user' | 'business', id: string) => `${kind}:${id.toLowerCase()}`;

export function mergeTagged(
  playedWith: ReadonlyArray<PlayedWithPerson> | null | undefined,
  text: string | null | undefined,
  authorIds: ReadonlyArray<string | null | undefined>,
  entities?: MentionEntityMap | null,
): PlayedWithPerson[] {
  const authors = new Set(authorIds.filter((v): v is string => !!v).map((v) => v.toLowerCase()));
  const seen = new Set<string>();
  const out: PlayedWithPerson[] = [];
  const push = (p: PlayedWithPerson) => {
    const key = mentionEntityKey(p.kind ?? 'user', p.userId);
    if (seen.has(key) || authors.has(p.userId.toLowerCase())) return;
    seen.add(key);
    out.push(p);
  };
  for (const p of playedWith ?? []) push({ ...p, kind: 'user' });
  for (const m of extractMentions(text ?? '')) {
    const e = entities?.get(mentionEntityKey(m.entityType, m.entityId));
    push({ userId: m.entityId, kind: m.entityType, name: e?.name || m.display, username: e?.username ?? null, avatarUrl: e?.avatarUrl ?? null });
  }
  return out;
}

/** Every mention key across a page of texts, deduplicated. */
export function pageMentionKeys(texts: ReadonlyArray<string | null | undefined>): { users: string[]; businesses: string[] } {
  const users = new Set<string>(); const businesses = new Set<string>();
  for (const t of texts) for (const m of extractMentions(t ?? '')) (m.entityType === 'user' ? users : businesses).add(m.entityId);
  return { users: [...users].sort(), businesses: [...businesses].sort() };
}
