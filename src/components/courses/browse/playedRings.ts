import { HOLE_DIFFICULTY_MIN_ROUNDS } from '@/lib/courses/holeDifficulty';
/**
 * WHAT'S BEEN PLAYED — pure rules (BRIEF_WHATS_BEEN_PLAYED_V2, on top of
 * BRIEF_WHATS_BEEN_PLAYED). Activity = rounds + published posts + reviews in
 * the 30-day window. Tabs run from the home county outwards (county, nation,
 * then fixed world tabs); tabs overlap by design. Rails hold every active
 * course outside the FIRST tab, so a course may sit in a tab and a rail.
 * New/seen is per device: localStorage holds the newest activity key seen per
 * course ("round:<id>", "post:<id>", "review:<id>"); a storage failure reads
 * every course as new.
 *
 * Geography: golf_courses.country is a REGION GROUPING ("Britain & Ireland",
 * "Continental Europe", "Rest of World"), not a country (see
 * lib/whs/countryVocabulary.ts); nations key on sub_country.
 */
export const ACTIVITY_WINDOW_DAYS = 30;
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

/** USA tab nations. countryVocabulary holds no US spellings; these are the brief's. */
export const USA_NATIONS = ['United States', 'United States of America', 'USA'] as const;
/** Middle East tab nations. countryVocabulary holds none of these; the brief's spellings. */
export const MIDDLE_EAST_NATIONS = ['United Arab Emirates', 'Qatar', 'Bahrain', 'Oman', 'Saudi Arabia', 'Kuwait', 'Jordan', 'Israel', 'Lebanon'] as const;
const inList = (list: readonly string[], v: string | null) => !!v && list.some((x) => x.toLowerCase() === v.trim().toLowerCase());
const isGbi = (c: Pick<PlacedCourse, 'country'>) => c.country === UKI_GROUPING;
const isEurope = (c: Pick<PlacedCourse, 'country' | 'continent'>) => !isGbi(c) && ((c.continent ?? '').toLowerCase() === 'europe' || c.country === 'Continental Europe');
const isUsa = (c: Pick<PlacedCourse, 'subCountry'>) => inList(USA_NATIONS, c.subCountry);
const isMiddleEast = (c: Pick<PlacedCourse, 'subCountry'>) => inList(MIDDLE_EAST_NATIONS, c.subCountry);
/** The fixed world tabs, in order. Rest of world = none of the others. */
export const WORLD_TABS: ReadonlyArray<{ id: string; label: string; pick: (c: PlacedCourse) => boolean; nations?: readonly string[] }> = [
  { id: 'gbi', label: 'GB&I', pick: isGbi },
  { id: 'europe', label: 'Europe', pick: isEurope },
  { id: 'usa', label: 'USA', pick: isUsa, nations: USA_NATIONS },
  { id: 'middle-east', label: 'Middle East', pick: isMiddleEast },
  { id: 'world', label: 'Rest of world', pick: (c) => !isGbi(c) && !isEurope(c) && !isUsa(c) && !isMiddleEast(c) },
];

/**
 * §3: the home county (golf_courses.region), the home nation (sub_country),
 * then the world tabs. Each only with an active course (`courses` holds active
 * courses only); a tab whose label repeats an earlier one is skipped (USA also
 * when the home nation is a US spelling). No home → world tabs only.
 */
export function buildAreaTabs(courses: PlacedCourse[], home: HomePlace | null): AreaTab[] {
  const tabs: AreaTab[] = [];
  const push = (id: string, label: string | null, pick: (c: PlacedCourse) => boolean) => {
    if (!label) return;
    if (tabs.some((t) => t.label.toLowerCase() === label.toLowerCase())) return;
    const ids = courses.filter(pick).map((c) => c.id);
    if (ids.length === 0) return;
    tabs.push({ id, label, courseIds: ids });
  };
  if (home?.region) push('region', home.region, (c) => c.region === home.region);
  if (home?.subCountry) push('nation', home.subCountry, (c) => c.subCountry === home.subCountry);
  for (const w of WORLD_TABS) {
    if (w.nations && home && inList(w.nations, home.subCountry)) continue;
    push(w.id, w.label, w.pick);
  }
  return tabs;
}

/** `activity` = rounds + posts + reviews in the window; `latestKey` = the newest activity's seen key. */
export interface RingGroup { courseId: string; activity: number; latestDate: string; latestKey: string }
/** Busiest by activity first; ties go to the most recent activity. */
export function orderRings<T extends RingGroup>(groups: T[]): T[] {
  return [...groups].sort((a, b) => b.activity - a.activity || b.latestDate.localeCompare(a.latestDate));
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
/** Rank-1 hole only once its row has HOLE_DIFFICULTY_MIN_ROUNDS rounds; else none. */
export function hardestHoleFromRanks(rows: Array<{ hole_no: number; difficulty_rank: number; rounds: number | null }>): number | null {
  const top = rows.find((r) => r.difficulty_rank === 1);
  return top && (top.rounds ?? 0) >= HOLE_DIFFICULTY_MIN_ROUNDS ? top.hole_no : null;
}
export const isNewRing = (g: RingGroup, seen: SeenMap | null) => !seen || seen[g.courseId] !== g.latestKey;

/* ── §4 region rails ───────────────────────────────────────────────────── */
export type RailKind = 'home' | 'nation' | 'ireland' | 'abroad';
export interface RailPlan { key: string; kind: RailKind; nations: string[]; kicker: string; title: string; courseIds: string[]; playedTotal: number; activity: number }

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
 * Every active course outside the first tab, grouped by nation inside the home's
 * grouping (no home → Britain & Ireland), everything else in one Abroad rail.
 * Home nation first, other nations by activity, Abroad last. Each rail
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
      activity: b.groups.reduce((n, g) => n + g.activity, 0),
    });
  }
  const rank = (p: RailPlan) => (p.kind === 'home' ? 0 : p.kind === 'abroad' ? 2 : 1);
  return plans.sort((a, b) => rank(a) - rank(b) || b.activity - a.activity || a.key.localeCompare(b.key));
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
const byGross = (a: ScoredRound, b: ScoredRound) => (a.gross_score as number) - (b.gross_score as number) || b.play_date.localeCompare(a.play_date);
/** Each golfer's best round (lowest gross, ties to the more recent), then the
 *  n lowest of those, ties to the more recent. Never one golfer twice. */
export function bestLately<T extends ScoredRound>(rows: T[], n = 2): T[] {
  const best = new Map<string, T>();
  for (const r of [...rows].filter((x) => x.gross_score != null).sort(byGross)) if (!best.has(r.user_id)) best.set(r.user_id, r);
  return [...best.values()].sort(byGross).slice(0, n);
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
