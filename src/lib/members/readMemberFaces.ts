/**
 * readMemberFaces — THE one lookup for other members' names and photos.
 *
 * user_profiles RLS returns only rows the viewer may see (self, connections),
 * so reading it alone shows initials for unconnected public members.
 * public_profiles (migration 20260625082640) projects public, confirmed,
 * non-deleted, non-suspended profiles, so reading it alone hides a private
 * friend's photo. Hence two steps:
 *   1. user_profiles (deleted_at IS NULL) — the rows RLS lets the viewer see;
 *   2. public_profiles for ids still missing.
 * A user_profiles row wins. Null fields stay null; nothing is invented.
 * Ids are de-duplicated and read 100 per call; empty input makes no request.
 * A failed read throws, so callers keep their own error handling.
 */
import { supabase } from '@/integrations/supabase/client';
import { batches } from '@/lib/batches';

export interface MemberFace {
  id: string;
  displayName: string | null;
  username: string | null;
  photoUrl: string | null;
}

export const MEMBER_FACES_BATCH = 100;
const COLUMNS = 'id, display_name, username, profile_photo_url';
type Row = { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null };

const toFace = (r: Row): MemberFace => ({
  id: String(r.id),
  displayName: r.display_name ?? null,
  username: r.username ?? null,
  photoUrl: r.profile_photo_url ?? null,
});

export async function readMemberFaces(ids: readonly (string | null | undefined)[]): Promise<Map<string, MemberFace>> {
  const unique = Array.from(new Set(ids.filter((id): id is string => !!id)));
  const out = new Map<string, MemberFace>();
  if (unique.length === 0) return out;

  for (const chunk of batches(unique, MEMBER_FACES_BATCH)) {
    const { data, error } = await (supabase.from('user_profiles' as never) as any)
      .select(COLUMNS).in('id', chunk).is('deleted_at', null);
    if (error) throw error;
    for (const r of (data ?? []) as Row[]) out.set(String(r.id), toFace(r));
  }

  const missing = unique.filter((id) => !out.has(id));
  for (const chunk of batches(missing, MEMBER_FACES_BATCH)) {
    const { data, error } = await (supabase.from('public_profiles' as never) as any)
      .select(COLUMNS).in('id', chunk);
    if (error) throw error;
    for (const r of (data ?? []) as Row[]) if (!out.has(String(r.id))) out.set(String(r.id), toFace(r));
  }
  return out;
}

/** The face map as user_profiles-shaped rows, for callers built around them. */
export function faceRows(map: ReadonlyMap<string, MemberFace>): Row[] {
  return Array.from(map.values(), (f) => ({
    id: f.id, display_name: f.displayName, username: f.username, profile_photo_url: f.photoUrl,
  }));
}

/**
 * For callers that already read user_profiles with extra columns: keep their
 * visible rows exactly as read, and append public_profiles face rows (id,
 * display_name, username, profile_photo_url; extra columns absent) for ids
 * the visible read did not return. No missing ids → no request.
 */
export async function fillMissingFaces<T extends { id: string }>(
  rows: readonly T[] | null | undefined,
  ids: readonly (string | null | undefined)[],
): Promise<T[]> {
  const visible = (rows ?? []) as T[];
  const have = new Set(visible.map((r) => String(r.id)));
  const missing = Array.from(new Set(ids.filter((id): id is string => !!id && !have.has(id))));
  if (missing.length === 0) return visible.slice();
  const out = visible.slice();
  for (const chunk of batches(missing, MEMBER_FACES_BATCH)) {
    const { data, error } = await (supabase.from('public_profiles' as never) as any)
      .select(COLUMNS).in('id', chunk);
    if (error) throw error;
    for (const r of (data ?? []) as Row[]) {
      if (have.has(String(r.id))) continue;
      have.add(String(r.id));
      out.push(r as unknown as T);
    }
  }
  return out;
}
