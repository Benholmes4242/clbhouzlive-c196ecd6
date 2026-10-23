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

export interface DoNextItem {
  kind: DoNextKind;
  title: string;
  sub: string;
  action: string;
  onTap: DoNextAction;
}

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

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "today" / "yesterday" / weekday within the last 6 days / "12 Oct". Calendar days, local time. */
export function formatWaitingSince(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 6) return WEEKDAYS[d.getDay()];
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const wholeDays = (iso: string, now: Date) => Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY));

export interface DoNextInputs {
  role: DoNextRole;
  business: DoNextBusiness;
  /** undefined = errored / not read. */
  pending?: { count: number; oldestAt: string | null };
  reviews?: { awaiting: number; oldestAt: string | null };
  week?: { last_post_at: string | null; followers_total: number; taps: { website: number } };
  now?: Date;
}

export function buildDoNext({ role, business: b, pending, reviews, week, now = new Date() }: DoNextInputs): DoNextItem[] {
  if (role === 'analyst') return [];
  const manager = role === 'owner' || role === 'admin';
  const out: DoNextItem[] = [];

  // T1 team requests
  if (manager && pending && pending.count > 0) {
    const n = pending.count;
    out.push({
      kind: 'team',
      title: n === 1 ? '1 person asked to join your team' : `${n} people asked to join your team`,
      sub: pending.oldestAt ? `Waiting since ${formatWaitingSince(pending.oldestAt, now)}.` : '',
      action: 'Review',
      onTap: { type: 'navigate', to: `/business/${b.id}/team` },
    });
  }

  // T2 reviews awaiting a reply (replies need a verified club)
  if (manager && b.club_id && b.is_verified === true && reviews && reviews.awaiting > 0) {
    const n = reviews.awaiting;
    const d = reviews.oldestAt ? wholeDays(reviews.oldestAt, now) : 0;
    const lead = d === 0
      ? 'The oldest arrived today.'
      : `The oldest has waited ${d} ${d === 1 ? 'day' : 'days'}.`;
    out.push({
      kind: 'reviews',
      title: n === 1 ? 'Reply to 1 review' : `Reply to ${n} reviews`,
      sub: `${lead} Replies show on your course page.`,
      action: 'Reply',
      onTap: { type: 'navigate', to: `/business/${b.id}/reviews?filter=unreplied` },
    });
  }

  // T3 no recent post
  if (week) {
    const last = week.last_post_at;
    const d = last ? wholeDays(last, now) : null;
    if (d === null || d >= 14) {
      let sub = d === null ? `You haven't posted as ${b.name} yet.` : `Nothing from ${b.name} in ${d} days.`;
      const f = week.followers_total;
      if (f > 0) {
        sub += f === 1
          ? ' Your 1 follower is the golfer most likely to see it.'
          : ` Your ${f} followers are the golfers most likely to see it.`;
      }
      out.push({ kind: 'post', title: 'Post something this week', sub, action: 'Post', onTap: { type: 'post', actorId: b.id } });
    }
  }

  // T4 no booking link
  if (week && !filled(b.booking_url) && (BOOKABLE_CATEGORIES as readonly string[]).includes(b.category ?? '')) {
    const n = week.taps?.website ?? 0;
    if (n >= 5) {
      out.push({
        kind: 'booking',
        title: 'Add a booking link',
        sub: `${n} taps through to your website this week. Send them straight to booking.`,
        action: 'Add',
        onTap: { type: 'navigate', to: `/business/${b.id}/edit` },
      });
    }
  }

  // T5 profile gaps
  const c = profileCompleteness(b);
  if (c.missing.length > 0) {
    const [a, second, ...rest] = c.missing;
    const list = second
      ? `${a}, ${second}${rest.length ? ` and ${rest.length} more` : ''}`
      : a;
    out.push({
      kind: 'profile',
      title: 'Finish your profile',
      sub: `${c.done} of ${c.total} done. Missing: ${list}.`,
      action: 'Finish',
      onTap: { type: 'navigate', to: `/business/${b.id}/edit` },
    });
  }

  return out.slice(0, MAX_DO_NEXT);
}
