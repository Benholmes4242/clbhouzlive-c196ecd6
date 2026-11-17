/**
 * WHAT'S BEEN PLAYED — pure rules (BRIEF_WHATS_BEEN_PLAYED, replacing
 * BRIEF_PLAYED_RINGS_AND_AREA_TABS). Tabs cover the member's own patch only
 * (Near you, home county; nation fallbacks); every other played course goes to
 * a region rail, so no course appears twice on the page. New/seen is per
 * device: localStorage holds the newest whs_score_id seen per course, and any
 * storage failure reads every course as new.
 *
 * Geography: golf_courses.country is a REGION GROUPING ("Britain & Ireland",
 * "Continental Europe", "Rest of World"), not a country (see
 * lib/whs/countryVocabulary.ts); nations key on sub_country.
 */
export const NEAR_KM = 40;
export const UKI_GROUPING = 'Britain & Ireland';
/** Ireland and Northern Ireland share one rail (countryVocabulary's Ireland set). */
export const IRELAND_NATIONS = ['Ireland', 'Northern Ireland'] as const;
export const RAIL_MAX = 10;
export const RAIL_MIN = 3;
export const TILE_PHOTO_CAP = 12;

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

/**
 * §1: "Near you" then the home county, each only with a course, a repeated
 * label skipped. Neither → the home nation; that empty or no home → the nation
 * with the most rounds lately (`roundsByCourse` counts rounds per course id).
 */
export function buildAreaTabs(courses: PlacedCourse[], home: HomePlace | null, roundsByCourse: ReadonlyMap<string, number> = new Map()): AreaTab[] {
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
    if (tabs.length) return tabs;
    if (home.subCountry) push('nation', home.subCountry, (c) => c.subCountry === home.subCountry);
    if (tabs.length) return tabs;
  }
  const byNation = new Map<string, number>();
  for (const c of courses) if (c.subCountry) byNation.set(c.subCountry, (byNation.get(c.subCountry) ?? 0) + (roundsByCourse.get(c.id) ?? 0));
  const busiest = [...byNation.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
  push('nation', busiest, (c) => c.subCountry === busiest);
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

/* ── §4 region rails ───────────────────────────────────────────────────── */
export type RailKind = 'home' | 'nation' | 'ireland' | 'abroad';
export interface RailPlan { key: string; kind: RailKind; nations: string[]; kicker: string; title: string; courseIds: string[]; playedTotal: number; rounds: number }

const isIreland = (n: string | null) => !!n && (IRELAND_NATIONS as readonly string[]).includes(n);
/** Rail key for one course inside the grouping: the nation, Ireland merged. */
export const nationKey = (n: string | null) => (isIreland(n) ? 'ireland' : n);

export function railHeading(kind: RailKind, nation: string | null): { kicker: string; title: string } {
  if (kind === 'abroad') return { kicker: 'FURTHER AFIELD', title: 'Abroad' };
  const label = kind === 'ireland' ? 'IRELAND' : (nation ?? '').toUpperCase();
  if (kind === 'home') return { kicker: `ACROSS ${label}`, title: 'Played lately' };
  if (kind === 'ireland') return { kicker: 'IRELAND', title: 'Across the water' };
  return { kicker: label, title: nation === 'Scotland' ? 'North of the border' : 'Played lately' };
}

/**
 * Every played course not in a tab, grouped by nation inside the home's
 * grouping (no home → Britain & Ireland), everything else in one Abroad rail.
 * Home nation first, other nations by rounds lately, Abroad last. Each rail
 * holds its played courses busiest first, capped at RAIL_MAX.
 */
export function buildRails<T extends RingGroup>(courses: PlacedCourse[], groups: T[], tabCourseIds: ReadonlySet<string>, home: HomePlace | null): RailPlan[] {
  const grouping = home?.country ?? UKI_GROUPING;
  const homeKey = home ? nationKey(home.subCountry) : null;
  const byId = new Map(courses.map((c) => [c.id, c]));
  const buckets = new Map<string, { nations: Set<string>; groups: T[] }>();
  for (const g of groups) {
    if (tabCourseIds.has(g.courseId)) continue;
    const c = byId.get(g.courseId);
    if (!c) continue;
    const key = c.country !== grouping ? '__abroad' : nationKey(c.subCountry);
    if (!key) continue;
    const b = buckets.get(key) ?? { nations: new Set<string>(), groups: [] };
    if (c.subCountry) b.nations.add(c.subCountry);
    b.groups.push(g);
    buckets.set(key, b);
  }
  const plans: RailPlan[] = [];
  for (const [key, b] of buckets) {
    if (b.groups.length === 0) continue;
    const kind: RailKind = key === '__abroad' ? 'abroad' : key === homeKey ? 'home' : key === 'ireland' ? 'ireland' : 'nation';
    const nations = key === 'ireland' ? [...IRELAND_NATIONS] : key === '__abroad' ? [...b.nations] : [key];
    const nation = key === 'ireland' ? 'Ireland' : key === '__abroad' ? null : key;
    const ordered = orderRings(b.groups);
    plans.push({
      key, kind, nations, ...railHeading(kind, nation),
      courseIds: ordered.slice(0, RAIL_MAX).map((g) => g.courseId),
      playedTotal: ordered.length,
      rounds: b.groups.reduce((n, g) => n + g.rounds, 0),
    });
  }
  const rank = (p: RailPlan) => (p.kind === 'home' ? 0 : p.kind === 'abroad' ? 2 : 1);
  return plans.sort((a, b) => rank(a) - rank(b) || b.rounds - a.rounds || a.key.localeCompare(b.key));
}

/** "See all ›": single-nation rails only, more played courses than a rail shows. */
export const railShowsSeeAll = (p: RailPlan) => (p.kind === 'home' || p.kind === 'nation') && p.playedTotal > RAIL_MAX;

export interface RatedCandidate { courseId: string; rating: number | null; country: string | null; subCountry: string | null }
/** Tops a rail with fewer than RAIL_MIN played courses up with the best rated
 *  courses nobody played lately, best first, skipping anything already shown. */
export function topUpRail(playedIds: string[], candidates: RatedCandidate[], onPage: ReadonlySet<string>): string[] {
  const need = RAIL_MIN - playedIds.length;
  if (need <= 0) return [];
  return [...candidates]
    .filter((c) => c.rating != null && !onPage.has(c.courseId))
    .sort((a, b) => (b.rating as number) - (a.rating as number))
    .filter((c, i, arr) => arr.findIndex((x) => x.courseId === c.courseId) === i)
    .slice(0, need)
    .map((c) => c.courseId);
}

/* ── §3 tile rules ─────────────────────────────────────────────────────── */
export interface ScoredRound { whs_score_id: string; user_id: string; play_date: string; gross_score: number | null }
/** The two lowest gross rounds, ties to the more recent. */
export function bestLately<T extends ScoredRound>(rows: T[], n = 2): T[] {
  return rows.filter((r) => r.gross_score != null)
    .sort((a, b) => (a.gross_score as number) - (b.gross_score as number) || b.play_date.localeCompare(a.play_date))
    .slice(0, n);
}

/** To par with a true minus, "E" when level. */
export function toParText(gross: number, par: number | null | undefined): string | null {
  if (par == null || !Number.isFinite(par)) return null;
  const d = gross - par;
  return d === 0 ? 'E' : d > 0 ? `+${d}` : `\u2212${Math.abs(d)}`;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Three-letter weekday within 6 days, otherwise "9 Nov". */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(d)) / DAY_MS);
  return days >= 0 && days <= 6 ? WEEKDAYS[d.getDay()] : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Whole miles from the home course: "Under a mile away", "1 mile away". */
export function milesAwayText(km: number): string {
  const miles = Math.round(km / 1.609344);
  if (miles < 1) return 'Under a mile away';
  return miles === 1 ? '1 mile away' : `${miles.toLocaleString('en-GB')} miles away`;
}

export interface TileHole { kind: 'hole'; holeNo: number; addedAt: string }
export interface TileCoursePhoto { kind: 'course'; createdAt: string }
/** Hole photos: the hardest hole first when it has one, then newest first.
 *  Then alternate hole, course, hole, course; the other carries on; cap 12. */
export function interleaveTilePhotos<H extends TileHole, C extends TileCoursePhoto>(holes: H[], photos: C[], hardestHole: number | null): Array<H | C> {
  const hs = [...holes].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const hi = hardestHole == null ? -1 : hs.findIndex((h) => h.holeNo === hardestHole);
  if (hi > 0) hs.unshift(hs.splice(hi, 1)[0]);
  const cs = [...photos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const out: Array<H | C> = [];
  for (let i = 0; out.length < TILE_PHOTO_CAP && (i < hs.length || i < cs.length); i += 1) {
    if (i < hs.length) out.push(hs[i]);
    if (out.length < TILE_PHOTO_CAP && i < cs.length) out.push(cs[i]);
  }
  return out;
}
