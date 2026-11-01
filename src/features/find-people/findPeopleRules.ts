/**
 * WF1 — pure rules for the Find people page (/find-people).
 *
 * Every grouping, reason line, figures line and label is decided here so the
 * page only wires handlers and the rules are tested directly. No locale, no
 * DOM, no network: reason lines are returned as { key, def, vars } descriptors
 * the component hands to t() (key + English defaultValue + interpolation
 * vars), so the i18n mock and the real catalogues share one source.
 *
 * Data comes from the get_people_suggestions / get_suggested_businesses RPCs
 * (WF1_PEOPLE_V1, run by Ben). This module never invents a row.
 */
import { formatHcp } from '@/lib/formatHcp';
import { shortCourseName } from '@/lib/courses/shortCourseName';

/* ── RPC row shapes (mirror src/integrations/supabase/types.ts) ─────── */
export interface PersonSuggestion {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  reason_type: string;
  reason_club_name: string | null;
  reason_course_name: string | null;
  reason_date: string | null;
  mutual_count: number | null;
  recent_rounds: number | null;
  rounds_total: number | null;
  handicap_index: number | null;
  is_verified: boolean | null;
}

export interface BusinessSuggestion {
  business_id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  category: string | null;
  city: string | null;
  is_verified: boolean | null;
  followers: number | null;
  reason_type: string;
  distance_miles: number | null;
}

/** A t() descriptor: catalogue key, English defaultValue, interpolation vars. */
export interface Copy {
  key: string;
  def: string;
  vars?: Record<string, unknown>;
}

export type FindPeopleTab = 'suggested' | 'golfers' | 'businesses';

export interface PeopleGroup {
  id: string;
  label: Copy;
  /** Right-aligned count in the label's own style; omitted when unknown. */
  count?: number;
  /** The From-{club} group on Suggested carries the Follow-all action. */
  followAll?: boolean;
  people: PersonSuggestion[];
  businesses: BusinessSuggestion[];
}

/* ── small formatters ───────────────────────────────────────────────── */

/** "11 Oct" — day + short month, locale-driven, invalid dates → ''. */
export function shortDayMonth(iso: string | null | undefined, locale = 'en'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d);
}

/** Miles: one decimal under 10, whole number at 10 and above. */
export function formatMiles(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(m)) return '';
  return m < 10 ? (Math.round(m * 10) / 10).toFixed(1) : String(Math.round(m));
}

/**
 * Golfer figures: "{hcp} hcp · {rounds} rounds" via formatHcp, dropping the
 * handicap part when null and the rounds part when 0. '' when neither exists.
 */
export function golferFigures(g: PersonSuggestion): string {
  const parts: string[] = [];
  if (g.handicap_index !== null && g.handicap_index !== undefined) {
    parts.push(`${formatHcp(g.handicap_index)} hcp`);
  }
  if ((g.rounds_total ?? 0) > 0) {
    parts.push(`${g.rounds_total} rounds`);
  }
  return parts.join(' · ');
}

/* ── reason lines ───────────────────────────────────────────────────── */

/** Golfer reason line per WF1 §3. Unknown reasons → null (row shows none). */
export function golferReason(g: PersonSuggestion): Copy | null {
  switch (g.reason_type) {
    case 'club':
      return { key: 'findPeople.reason.club', def: 'Member at {{club}}', vars: { club: g.reason_club_name ?? '' } };
    case 'played_with': {
      const course = shortCourseName(g.reason_course_name ?? '');
      const when = shortDayMonth(g.reason_date);
      if (course && when) return { key: 'findPeople.reason.playedWith', def: '{{course}}, {{date}}', vars: { course, date: when } };
      if (course) return { key: 'findPeople.reason.playedWithCourse', def: '{{course}}', vars: { course } };
      if (when) return { key: 'findPeople.reason.playedWithDate', def: '{{date}}', vars: { date: when } };
      return { key: 'findPeople.reason.playedWithFallback', def: 'Played with you' };
    }
    case 'reciprocal':
      return { key: 'findPeople.reason.reciprocal', def: 'Follows you' };
    case 'course':
      return { key: 'findPeople.reason.course', def: 'Plays {{course}}', vars: { course: shortCourseName(g.reason_course_name ?? '') } };
    case 'clubmate_mutual':
      return { key: 'findPeople.reason.clubmateMutual', def: 'Followed by {{count}} from {{club}}', vars: { count: g.mutual_count ?? 0, club: g.reason_club_name ?? '' } };
    case 'mutual':
      return { key: 'findPeople.reason.mutual', def: 'Followed by {{count}} you follow', vars: { count: g.mutual_count ?? 0 } };
    case 'popular':
      return { key: 'findPeople.reason.popular', def: 'Popular on clbhouz' };
    case 'active':
      return { key: 'findPeople.reason.active', def: '{{count}} rounds in the last two weeks', vars: { count: g.recent_rounds ?? 0 } };
    case 'recently_joined':
      return { key: 'findPeople.reason.recentlyJoined', def: 'New to clbhouz' };
    default:
      return null;
  }
}

/**
 * Business reason line per WF1 §3. `categoryLabel` is the already-resolved
 * display word (businessCategoryWord / 'Golf club'); `tab` decides the
 * your_club line, which differs between Suggested and Businesses.
 */
export function businessReason(
  b: BusinessSuggestion,
  tab: FindPeopleTab,
  categoryLabel: string,
): Copy | null {
  const cat = categoryLabel;
  const city = b.city ?? '';
  switch (b.reason_type) {
    case 'your_club':
      if (tab === 'suggested') {
        return { key: 'findPeople.bizReason.yourClubSuggested', def: 'Your club · {{category}}', vars: { category: cat } };
      }
      return city
        ? { key: 'findPeople.bizReason.yourClubCity', def: '{{category}} · {{city}}', vars: { category: cat, city } }
        : { key: 'findPeople.bizReason.categoryOnly', def: '{{category}}', vars: { category: cat } };
    case 'near_club':
    case 'coach': {
      const miles = formatMiles(b.distance_miles);
      return miles
        ? { key: 'findPeople.bizReason.nearClubMiles', def: '{{category}} · {{miles}} miles', vars: { category: cat, miles } }
        : { key: 'findPeople.bizReason.categoryOnly', def: '{{category}}', vars: { category: cat } };
    }
    case 'popular':
      return city
        ? { key: 'findPeople.bizReason.popularCity', def: '{{category}} · {{city}}', vars: { category: cat, city } }
        : { key: 'findPeople.bizReason.categoryOnly', def: '{{category}}', vars: { category: cat } };
    default:
      return null;
  }
}

/* ── grouping ───────────────────────────────────────────────────────── */

/**
 * The viewer's home-club name, derived from the suggestions themselves:
 * the your_club business first, then any club golfer's reason_club_name.
 * Null when the viewer has no home club — the "Your club" / "Near …" groups
 * and the "From …" label then stay hidden.
 */
export function clubNameFrom(people: PersonSuggestion[], biz: BusinessSuggestion[]): string | null {
  const own = biz.find((b) => b.reason_type === 'your_club');
  if (own?.name) return own.name;
  const member = people.find((p) => p.reason_type === 'club' && p.reason_club_name);
  return member?.reason_club_name ?? null;
}

const byReason = <T extends { reason_type: string }>(rows: T[], ...types: string[]): T[] =>
  rows.filter((r) => types.includes(r.reason_type));

/** Suggested tab: From {club} (club business first, then club golfers) with
 *  Follow all, Played with you, Plays your courses, Popular on clbhouz
 *  (popular golfers, then up to 3 popular businesses). Empty groups hidden. */
export function suggestedGroups(people: PersonSuggestion[], biz: BusinessSuggestion[]): PeopleGroup[] {
  const club = clubNameFrom(people, biz);
  const groups: PeopleGroup[] = [];

  const clubBiz = byReason(biz, 'your_club');
  const clubPeople = byReason(people, 'club');
  if (club && (clubBiz.length > 0 || clubPeople.length > 0)) {
    groups.push({
      id: 'from-club',
      label: { key: 'findPeople.group.fromClub', def: 'From {{club}}', vars: { club } },
      followAll: true,
      count: clubBiz.length + clubPeople.length,
      businesses: clubBiz,
      people: clubPeople,
    });
  }

  const playedWith = byReason(people, 'played_with');
  if (playedWith.length > 0) {
    groups.push({
      id: 'played-with',
      label: { key: 'findPeople.group.playedWith', def: 'Played with you' },
      count: playedWith.length,
      people: playedWith,
      businesses: [],
    });
  }

  const playsCourses = byReason(people, 'course');
  if (playsCourses.length > 0) {
    groups.push({
      id: 'plays-courses',
      label: { key: 'findPeople.group.playsCourses', def: 'Plays your courses' },
      count: playsCourses.length,
      people: playsCourses,
      businesses: [],
    });
  }

  const popularPeople = byReason(people, 'popular');
  const popularBiz = byReason(biz, 'popular').slice(0, 3);
  if (popularPeople.length > 0 || popularBiz.length > 0) {
    groups.push({
      id: 'popular',
      label: { key: 'findPeople.group.popular', def: 'Popular on clbhouz' },
      people: popularPeople,
      businesses: popularBiz,
    });
  }

  return groups;
}

/** Golfers tab: every golfer reason in the brief's order; empty groups hidden. */
export function golferGroups(people: PersonSuggestion[], biz: BusinessSuggestion[]): PeopleGroup[] {
  const club = clubNameFrom(people, biz);
  const out: PeopleGroup[] = [];
  const push = (id: string, label: Copy, rows: PersonSuggestion[]) => {
    if (rows.length > 0) out.push({ id, label, count: rows.length, people: rows, businesses: [] });
  };

  const clubRows = byReason(people, 'club');
  if (club && clubRows.length > 0) {
    out.push({
      id: 'from-club',
      label: { key: 'findPeople.group.fromClub', def: 'From {{club}}', vars: { club } },
      count: clubRows.length,
      people: clubRows,
      businesses: [],
    });
  }
  push('played-with', { key: 'findPeople.group.playedWith', def: 'Played with you' }, byReason(people, 'played_with'));
  push('follows-you', { key: 'findPeople.group.followsYou', def: 'Follows you' }, byReason(people, 'reciprocal'));
  push('plays-courses', { key: 'findPeople.group.playsCourses', def: 'Plays your courses' }, byReason(people, 'course'));
  push(
    'known',
    { key: 'findPeople.group.known', def: 'Followed by people you know' },
    byReason(people, 'clubmate_mutual', 'mutual'),
  );
  push('popular', { key: 'findPeople.group.popular', def: 'Popular on clbhouz' }, byReason(people, 'popular'));
  push('active', { key: 'findPeople.group.active', def: 'Playing lately' }, byReason(people, 'active'));
  push('new', { key: 'findPeople.group.new', def: 'New to clbhouz' }, byReason(people, 'recently_joined'));
  return out;
}

/** Businesses tab: Your club, Near {club}, Coaches and academies, Popular.
 *  With no home club the first two groups never appear. */
export function businessGroups(people: PersonSuggestion[], biz: BusinessSuggestion[]): PeopleGroup[] {
  const club = clubNameFrom(people, biz);
  const out: PeopleGroup[] = [];
  const push = (id: string, label: Copy, rows: BusinessSuggestion[]) => {
    if (rows.length > 0) out.push({ id, label, count: rows.length, people: [], businesses: rows });
  };

  if (club) {
    push('your-club', { key: 'findPeople.group.yourClub', def: 'Your club' }, byReason(biz, 'your_club'));
    push('near-club', { key: 'findPeople.group.nearClub', def: 'Near {{club}}', vars: { club } }, byReason(biz, 'near_club'));
  }
  push('coaches', { key: 'findPeople.group.coaches', def: 'Coaches and academies' }, byReason(biz, 'coach'));
  push('popular', { key: 'findPeople.group.popular', def: 'Popular on clbhouz' }, byReason(biz, 'popular'));
  return out;
}

/** Groups for a tab, in the brief's order. */
export function groupsForTab(
  tab: FindPeopleTab,
  people: PersonSuggestion[],
  biz: BusinessSuggestion[],
): PeopleGroup[] {
  if (tab === 'golfers') return golferGroups(people, biz);
  if (tab === 'businesses') return businessGroups(people, biz);
  return suggestedGroups(people, biz);
}

/** Initials for a business with no logo (white tile, canvas-colour letters). */
export function businessInitials(name: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
