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
 * Every column of the public_profiles projection (generated types), so
 * fillMissingFaces can carry a caller's extra columns. A requested column NOT
 * on this list is left absent on filled rows — e.g. handicap_visibility,
 * eg_visible, home_club_visibility, mobile_crop_* (user_profiles only).
 */
export const PUBLIC_PROFILE_COLUMNS = [
  'actor_type', 'background_image_url', 'bio', 'city', 'college_id', 'country', 'cover_photo_url',
  'created_at', 'display_name', 'eg_handicap_index', 'first_name', 'header_photo_url', 'home_club',
  'home_club_business_id', 'home_club_id', 'id', 'instagram_handle', 'is_business_verified',
  'is_official_club', 'is_public', 'is_verified', 'is_verified_business', 'is_verified_golfer',
  'last_name', 'manual_handicap_index', 'primary_club_id', 'profile_photo_url', 'profile_type',
  'profile_video_thumbnail_url', 'profile_video_url', 'social_links', 'tiktok_handle',
  'twitter_handle', 'user_type', 'username', 'website_url', 'websites', 'youtube_handle',
] as const;
const PUBLIC_SET = new Set<string>(PUBLIC_PROFILE_COLUMNS);

/** The four face columns plus each requested extra the projection carries. */
export function fillColumns(extraColumns: readonly string[] = []): string {
  const extras = extraColumns.filter((c) => PUBLIC_SET.has(c) && !COLUMNS.includes(c));
  return [COLUMNS, ...Array.from(new Set(extras))].join(', ');
}

/**
 * For callers that already read user_profiles with extra columns: keep their
 * visible rows exactly as read, and append public_profiles rows (four face
 * columns plus every extraColumns entry on PUBLIC_PROFILE_COLUMNS; others
 * absent) for ids the visible read did not return. No missing ids → no request.
 */
export async function fillMissingFaces<T extends { id: string }>(
  rows: readonly T[] | null | undefined,
  ids: readonly (string | null | undefined)[],
  extraColumns: readonly string[] = [],
): Promise<T[]> {
  const select = fillColumns(extraColumns);
  const visible = (rows ?? []) as T[];
  const have = new Set(visible.map((r) => String(r.id)));
  const missing = Array.from(new Set(ids.filter((id): id is string => !!id && !have.has(id))));
  if (missing.length === 0) return visible.slice();
  const out = visible.slice();
  for (const chunk of batches(missing, MEMBER_FACES_BATCH)) {
    const { data, error } = await (supabase.from('public_profiles' as never) as any)
      .select(select).in('id', chunk);
    if (error) throw error;
    for (const r of (data ?? []) as Row[]) {
      if (have.has(String(r.id))) continue;
      have.add(String(r.id));
      out.push(r as unknown as T);
    }
  }
  return out;
}
