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

/* ── §4 region rails (BRIEF_WHATS_BEEN_PLAYED_V3 §4) ──────────────────── */
export type RailKind = 'home' | 'rest' | 'abroad';
export interface RailPlan { key: string; kind: RailKind; nations: string[]; kicker: string; title: string; courseIds: string[]; playedTotal: number; activity: number }

const isIreland = (n: string | null) => !!n && (IRELAND_NATIONS as readonly string[]).includes(n);
/** Nation key inside the grouping: the nation, Ireland merged. */
export const nationKey = (n: string | null) => (isIreland(n) ? 'ireland' : n);

/** Rail headings. `nation` is the home nation (rest rail) or the rail's nation (home rail). */
export function railHeading(kind: RailKind, nation: string | null, grouping: string = UKI_GROUPING): { kicker: string; title: string } {
  if (kind === 'abroad') return { kicker: 'FURTHER AFIELD', title: 'Abroad' };
  const label = (nation ?? '').toUpperCase();
  if (kind === 'home') return { kicker: `ACROSS ${label}`, title: 'Played lately' };
  const title = grouping === UKI_GROUPING ? 'The rest of GB&I' : 'Played lately';
  // No home nation: nothing to be "beyond"; the rail covers the whole grouping.
  return { kicker: nation ? `BEYOND ${label}` : (grouping === UKI_GROUPING ? 'ACROSS GB&I' : `ACROSS ${grouping.toUpperCase()}`), title };
}

/**
 * Every active course outside the first tab: the home nation rail, ONE rail
 * for every other nation in the home's grouping (no home → Britain & Ireland),
 * then one Abroad rail. Each holds its courses busiest first (ties to most
 * recent), capped at RAIL_MAX. A rail shows only when it has a course.
 */
export function buildRails<T extends RingGroup>(courses: PlacedCourse[], groups: T[], tabCourseIds: ReadonlySet<string>, home: HomePlace | null): RailPlan[] {
  const grouping = home?.country ?? UKI_GROUPING;
  const homeKey = home ? nationKey(home.subCountry) : null;
  const byId = new Map(courses.map((c) => [c.id, c]));
  const buckets: Record<RailKind, { nations: Set<string>; groups: T[] }> = {
    home: { nations: new Set(), groups: [] }, rest: { nations: new Set(), groups: [] }, abroad: { nations: new Set(), groups: [] },
  };
  for (const g of groups) {
    if (tabCourseIds.has(g.courseId)) continue;
    const c = byId.get(g.courseId);
    if (!c) continue;
    const key = nationKey(c.subCountry);
    const kind: RailKind = c.country !== grouping ? 'abroad' : homeKey && key === homeKey ? 'home' : 'rest';
    if (kind !== 'abroad' && !key) continue;
    if (c.subCountry) buckets[kind].nations.add(c.subCountry);
    buckets[kind].groups.push(g);
  }
  const homeLabel = homeKey === 'ireland' ? 'Ireland' : home?.subCountry ?? null;
  const plans: RailPlan[] = [];
  for (const kind of ['home', 'rest', 'abroad'] as const) {
    const b = buckets[kind];
    if (b.groups.length === 0) continue;
    const nations = kind === 'home' && homeKey === 'ireland' ? [...IRELAND_NATIONS] : kind === 'home' ? [homeKey as string] : [...b.nations];
    const ordered = orderRings(b.groups);
    plans.push({
      key: kind, kind, nations, ...railHeading(kind, kind === 'abroad' ? null : homeLabel, grouping),
      courseIds: ordered.slice(0, RAIL_MAX).map((g) => g.courseId),
      playedTotal: ordered.length,
      activity: b.groups.reduce((n, g) => n + g.activity, 0),
    });
  }
  return plans;
}

/** "See all ›": the home nation rail only, more active courses than a rail shows. */
export const railShowsSeeAll = (p: RailPlan) => p.kind === 'home' && p.playedTotal > RAIL_MAX;

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
