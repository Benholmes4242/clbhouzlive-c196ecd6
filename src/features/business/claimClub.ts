/**
 * BRIEF_CLAIMED_CLUB_NAMED_AFTER_ITS_CLUB
 *
 * A claimed club is named after its CLUB, read from public.golf_clubs by id.
 * The name never travels in a URL beside the id, and is never reconstructed by
 * trimming a course name ("Sundridge Park Golf Club (East Course)" was exactly
 * that fault: the course's name became the business's name).
 */
import { supabase } from '@/integrations/supabase/client';
import type { SelectedClub } from '@/components/business/ClubSearchDropdown';

export type GolfClubRow = {
  id: string;
  name: string;
  club_key: string | null;
  country: string | null;
  sub_country: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

export async function fetchGolfClub(clubId: string): Promise<GolfClubRow | null> {
  const { data, error } = await supabase.from('golf_clubs').select('*').eq('id', clubId).maybeSingle();
  if (error) throw error;
  return (data as GolfClubRow | null) ?? null;
}

/** The real club row, geography included — never hardcoded nulls. */
export function clubRowToSelected(row: GolfClubRow): SelectedClub {
  return {
    id: row.id,
    name: row.name,
    club_key: row.club_key ?? null,
    country: row.country ?? null,
    sub_country: row.sub_country ?? null,
    region: row.region ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  };
}

/** Fields a golf-club business takes from its club on insert. club_id/club_key
 *  are NOT here: ownership is granted only on claim approval. */
export function clubInsertFields(club: SelectedClub) {
  return {
    name: club.name,
    club_name: club.name,
    lat: club.latitude ?? null,
    lng: club.longitude ?? null,
    country: club.country ?? null,
  };
}

/** Collapsed-card subline: role alone at 0/1 courses; "role · n courses" above. */
export function courseCountSuffix(n: number): string | null {
  return n > 1 ? `${n} courses` : null;
}
