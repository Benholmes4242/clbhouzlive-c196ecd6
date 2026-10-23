/**
 * CB68 — Business home "Do next": pure trigger logic and profile completeness.
 *
 * Five triggers in fixed priority; the first three that apply are shown.
 * Each source is passed as `undefined` when it errored (or is not read for
 * this role): that drops ONLY the triggers that depend on it.
 */
import { displaysOpeningHours } from '@/lib/business/openingHours';

export type DoNextRole = 'owner' | 'admin' | 'editor' | 'analyst';
export type DoNextKind = 'team' | 'reviews' | 'post' | 'booking' | 'profile';
export type DoNextAction =
  | { type: 'navigate'; to: string }
  | { type: 'post'; actorId: string };

/**
 * CB68.1 — copy lives in `common:business.doNext.*` (en + en-XA). Triggers
 * return a message key + params, never finished English; the card resolves
 * them with `resolveDoNextMsg`. A param may itself be a message (lists).
 */
export interface DoNextMsg {
  key: string;
  params?: Record<string, string | number | DoNextMsg>;
}

export interface DoNextItem {
  kind: DoNextKind;
  title: DoNextMsg;
  /** Sentences joined by a space; empty = no sub line. */
  sub: DoNextMsg[];
  action: DoNextMsg;
  onTap: DoNextAction;
}

const K = 'business.doNext.';
const msg = (key: string, params?: DoNextMsg['params']): DoNextMsg => ({ key: K + key, params });

type TFn = (key: string, opts?: Record<string, unknown>) => string;
export function resolveDoNextMsg(t: TFn, m: DoNextMsg): string {
  const opts: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m.params ?? {})) opts[k] = typeof v === 'object' ? resolveDoNextMsg(t, v) : v;
  return t(m.key, opts);
}
export const resolveDoNextSub = (t: TFn, sub: DoNextMsg[]) => sub.map((m) => resolveDoNextMsg(t, m)).join(' ');

export interface DoNextBusiness {
  id: string;
  name: string;
  category: string | null;
  club_id: string | null;
  is_verified: boolean | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  social_links?: unknown;
  booking_url?: string | null;
  opening_hours?: unknown;
  show_opening_hours?: boolean | null;
}

export const MAX_DO_NEXT = 3;
const DAY = 86_400_000;

export const VENUE_CATEGORIES = [
  'Golf Club', 'Golf Academy', 'Retailer / Pro Shop', 'Club Fitter', 'Resort',
  'Hotel / Accommodation', 'Restaurant / Cafe', 'Bar / Pub',
] as const;
export const BOOKABLE_CATEGORIES = [
  'Golf Club', 'Golf Academy', 'Coach / Instructor', 'Club Fitter', 'Resort',
  'Hotel / Accommodation', 'Restaurant / Cafe',
] as const;

const filled = (v: string | null | undefined) => !!v && v.trim().length > 0;

export interface Completeness {
  done: number;
  total: number;
  missing: string[];
}

/** Items in order: logo, cover photo, description, location, contact details,
 *  social links, and (venues only) opening hours by the profile's own rule. */
export function profileCompleteness(b: DoNextBusiness): Completeness {
  const social = b.social_links && typeof b.social_links === 'object'
    ? Object.values(b.social_links as Record<string, unknown>).some((v) => typeof v === 'string' && v.trim().length > 0)
    : false;
  const items: Array<[string, boolean]> = [
    ['logo', filled(b.logo_url)],
    ['cover photo', filled(b.cover_image_url)],
    ['description', filled(b.description)],
    ['location', b.lat != null && b.lng != null],
    ['contact details', filled(b.website) || filled(b.phone) || filled(b.email)],
    ['social links', social],
  ];
  if ((VENUE_CATEGORIES as readonly string[]).includes(b.category ?? '')) {
    items.push(['opening hours', displaysOpeningHours(b)]);
  }
  const missing = items.filter(([, ok]) => !ok).map(([l]) => l);
  return { done: items.length - missing.length, total: items.length, missing };
}

/** "today" / "yesterday" / weekday within the last 6 days / "12 Oct". Calendar days, local time. */
export function formatWaitingSince(iso: string, now: Date = new Date(), locale = 'en-GB'): DoNextMsg {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / DAY);
  if (days <= 0) return msg('team.since.today');
  if (days === 1) return msg('team.since.yesterday');
  if (days <= 6) return msg('team.since.weekday', { day: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d) });
  return msg('team.since.date', { date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d) });
}

const MISSING_KEY: Record<string, string> = {
  logo: 'logo', 'cover photo': 'coverPhoto', description: 'description', location: 'location',
  'contact details': 'contact', 'social links': 'social', 'opening hours': 'openingHours',
};

const wholeDays = (iso: string, now: Date) => Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY));

export interface DoNextInputs {
  role: DoNextRole;
  business: DoNextBusiness;
  /** undefined = errored / not read. */
  pending?: { count: number; oldestAt: string | null };
  /** CB68.1: count only. review_date is the golfer's played date, not submission, so no wait is claimed. */
  reviews?: { awaiting: number };
  week?: { last_post_at: string | null; followers_total: number; taps: { website: number } };
  now?: Date;
  /** Locale for weekday/month names in "Waiting since". */
  locale?: string;
}

export function buildDoNext({ role, business: b, pending, reviews, week, now = new Date(), locale = 'en-GB' }: DoNextInputs): DoNextItem[] {
  if (role === 'analyst') return [];
  const manager = role === 'owner' || role === 'admin';
  const out: DoNextItem[] = [];

  // T1 team requests
  if (manager && pending && pending.count > 0) {
    out.push({
      kind: 'team',
      title: msg('team.title', { count: pending.count }),
      sub: pending.oldestAt ? [msg('team.waiting', { when: formatWaitingSince(pending.oldestAt, now, locale) })] : [],
      action: msg('actions.review'),
      onTap: { type: 'navigate', to: `/business/${b.id}/team` },
    });
  }

  // T2 reviews awaiting a reply (replies need a verified club)
  if (manager && b.club_id && b.is_verified === true && reviews && reviews.awaiting > 0) {
    out.push({
      kind: 'reviews',
      title: msg('reviews.title', { count: reviews.awaiting }),
      sub: [msg('reviews.sub')],
      action: msg('actions.reply'),
      onTap: { type: 'navigate', to: `/business/${b.id}/reviews?filter=unreplied` },
    });
  }

  // T3 no recent post
  if (week) {
    const last = week.last_post_at;
    const d = last ? wholeDays(last, now) : null;
    if (d === null || d >= 14) {
      const sub = [d === null ? msg('post.never', { name: b.name }) : msg('post.quiet', { name: b.name, count: d })];
      const f = week.followers_total;
      if (f > 0) sub.push(msg('post.followers', { count: f }));
      out.push({ kind: 'post', title: msg('post.title'), sub, action: msg('actions.post'), onTap: { type: 'post', actorId: b.id } });
    }
  }

  // T4 no booking link
  if (week && !filled(b.booking_url) && (BOOKABLE_CATEGORIES as readonly string[]).includes(b.category ?? '')) {
    const n = week.taps?.website ?? 0;
    if (n >= 5) {
      out.push({
        kind: 'booking',
        title: msg('booking.title'),
        sub: [msg('booking.sub', { count: n })],
        action: msg('actions.add'),
        onTap: { type: 'navigate', to: `/business/${b.id}/edit` },
      });
    }
  }

  // T5 profile gaps
  const c = profileCompleteness(b);
  if (c.missing.length > 0) {
    const item = (l: string) => msg(`profile.items.${MISSING_KEY[l]}`);
    const [a, second, ...rest] = c.missing;
    const list = !second
      ? msg('profile.list.one', { a: item(a) })
      : rest.length
        ? msg('profile.list.more', { a: item(a), b: item(second), count: rest.length })
        : msg('profile.list.two', { a: item(a), b: item(second) });
    out.push({
      kind: 'profile',
      title: msg('profile.title'),
      sub: [msg('profile.sub', { done: c.done, total: c.total, list })],
      action: msg('actions.finish'),
      onTap: { type: 'navigate', to: `/business/${b.id}/edit` },
    });
  }

  return out.slice(0, MAX_DO_NEXT);
}
