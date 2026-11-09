/**
 * Club naming helpers (ADD_COURSE_CLUB_1). These MUST stay identical to the
 * database rules: clubBaseName mirrors SQL club_base_name; clubKey mirrors the
 * golf_clubs.club_key rule (non-alphanumerics, including accented letters, drop out).
 */
export function clubBaseName(name: string): string {
  return name.replace(/\s+[-–]\s+.*$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function clubKey(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
}
