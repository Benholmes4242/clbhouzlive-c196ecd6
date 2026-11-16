/**
 * WHAT'S BEEN PLAYED — pure rules (BRIEF_PLAYED_RINGS_AND_AREA_TABS).
 * Area tabs run narrowest first and appear only with at least one course;
 * rings are busiest first, ties to the most recent round. New/seen is per
 * device: localStorage holds the newest whs_score_id seen per course, and any
 * storage failure reads every course as new.
 *
 * Geography: golf_courses.country is a REGION GROUPING ("Britain & Ireland",
 * "Continental Europe", "Rest of World"), not a country (see
 * lib/whs/countryVocabulary.ts), so UK & Ireland matches that grouping value
 * and per-country tabs key on sub_country (the nation).
 */
export const NEAR_KM = 40;
export const UKI_GROUPING = 'Britain & Ireland';
/** Short tab labels for long nation names; anything unlisted shows as stored. */
export const COUNTRY_SHORT: Record<string, string> = {
  'United States': 'USA',
  'United States of America': 'USA',
  'United Arab Emirates': 'UAE',
  'South Korea': 'Korea',
  'Republic of Korea': 'Korea',
  'Dominican Republic': 'Dominican Rep.',
};
export const shortCountry = (name: string) => COUNTRY_SHORT[name] ?? name;

export interface PlacedCourse {
  id: string;
  region: string | null;
  subCountry: string | null;
  country: string | null;
  continent: string | null;
  lat: number | null;
  lng: number | null;
}
export interface HomePlace { lat: number | null; lng: number | null; region: string | null; subCountry: string | null; country: string | null; continent: string | null }
export interface AreaTab { id: string; label: string; courseIds: string[] }

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat), dLng = r(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Guests have no home: UK & Ireland, Europe, then other countries outside Europe. */
export function buildAreaTabs(courses: PlacedCourse[], home: HomePlace | null): AreaTab[] {
  const tabs: AreaTab[] = [];
  const push = (id: string, label: string | null, pick: (c: PlacedCourse) => boolean) => {
    if (!label) return;
    const ids = courses.filter(pick).map((c) => c.id);
    if (ids.length === 0) return;
    if (tabs.some((t) => t.label.toLowerCase() === label.toLowerCase())) return;
    tabs.push({ id, label, courseIds: ids });
  };
  if (home) {
    if (home.lat != null && home.lng != null) {
      push('near', 'Near you', (c) => c.lat != null && c.lng != null && haversineKm(home.lat!, home.lng!, c.lat, c.lng) <= NEAR_KM);
    }
    if (home.region) push('region', home.region, (c) => c.region === home.region);
    if (home.subCountry) push('sub', home.subCountry, (c) => c.subCountry === home.subCountry);
  }
  const homeUki = !home || home.country === UKI_GROUPING;
  if (homeUki) push('uki', 'UK & Ireland', (c) => c.country === UKI_GROUPING);
  else push('uki', home?.subCountry ?? null, (c) => c.subCountry === home?.subCountry);
  const continent = home ? home.continent : 'Europe';
  push('continent', continent, (c) => c.continent === continent);
  const abroad = new Map<string, string[]>();
  for (const c of courses) {
    if (!continent || c.continent === continent) continue;
    const nation = c.subCountry || c.country;
    if (!nation) continue;
    abroad.set(nation, [...(abroad.get(nation) ?? []), c.id]);
  }
  for (const [nation, ids] of [...abroad.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const label = shortCountry(nation);
    if (tabs.some((t) => t.label.toLowerCase() === label.toLowerCase())) continue;
    tabs.push({ id: `c:${nation}`, label, courseIds: ids });
  }
  return tabs;
}

export interface RingGroup { courseId: string; rounds: number; latestDate: string; latestScoreId: string }
/** Busiest first; ties go to the most recent round. */
export function orderRings<T extends RingGroup>(groups: T[]): T[] {
  return [...groups].sort((a, b) => b.rounds - a.rounds || b.latestDate.localeCompare(a.latestDate));
}

export type SeenMap = Record<string, string>;
export const seenKey = (userId: string | null | undefined) => `clbhouz:played-seen:${userId || 'guest'}`;
export function readSeen(userId: string | null | undefined): SeenMap | null {
  try {
    const raw = window.localStorage.getItem(seenKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as SeenMap) : {};
  } catch {
    return null;
  }
}
export function writeSeen(userId: string | null | undefined, map: SeenMap): void {
  try { window.localStorage.setItem(seenKey(userId), JSON.stringify(map)); } catch { /* storage unavailable */ }
}
export const isNewRing = (g: RingGroup, seen: SeenMap | null) => !seen || seen[g.courseId] !== g.latestScoreId;
