import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  buildDoNext, profileCompleteness, formatWaitingSince, resolveDoNextMsg, resolveDoNextSub,
  type DoNextBusiness, type DoNextInputs, type DoNextMsg,
} from '@/components/business/home/doNext';
import i18next from 'i18next';
import enCommon from '../../public/locales/en/common.json';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

// CB68.1 — copy is resolved through a real i18next instance loaded with the
// shipped English catalogue, so these assertions read the rendered English.
const i18n = i18next.createInstance();
void i18n.init({ lng: 'en', resources: { en: { common: enCommon } }, defaultNS: 'common', interpolation: { escapeValue: false }, initAsync: false });
const tt = (k: string, o?: Record<string, unknown>) => i18n.t(k, o) as string;
const R = (m: DoNextMsg) => resolveDoNextMsg(tt, m);
const built = (i: DoNextInputs) => buildDoNext(i).map((x) => ({ ...x, title: R(x.title), sub: resolveDoNextSub(tt, x.sub), action: R(x.action) }));

const NOW = new Date('2026-10-23T12:00:00'); // Friday
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

const complete: DoNextBusiness = {
  id: 'b1', name: 'Hartwell', category: 'Other', club_id: null, is_verified: false,
  logo_url: 'l', cover_image_url: 'c', description: 'd', lat: 1, lng: 2, website: 'w',
  social_links: { instagram: 'x' }, booking_url: null,
};
const week = (o: Partial<{ last_post_at: string | null; followers_total: number; website: number }> = {}) => ({
  last_post_at: 'last_post_at' in o ? o.last_post_at! : daysAgo(2),
  followers_total: o.followers_total ?? 0,
  taps: { website: o.website ?? 0 },
});
const base = (o: Partial<DoNextInputs> = {}): DoNextInputs => ({ role: 'owner', business: complete, week: week(), now: NOW, ...o });
const kinds = (i: DoNextInputs) => buildDoNext(i).map((x) => x.kind);
const club: DoNextBusiness = { ...complete, category: 'Golf Club', club_id: 'c1', is_verified: true, show_opening_hours: true, opening_hours: { Mon: { open: '08:00', close: '18:00' } } };

describe('CB68 order and cap', () => {
  it('shows the first three in priority order', () => {
    const b = { ...club, cover_image_url: null };
    expect(kinds(base({
      business: b,
      pending: { count: 2, oldestAt: daysAgo(3) },
      reviews: { awaiting: 3 },
      week: week({ last_post_at: null, website: 31 }),
    }))).toEqual(['team', 'reviews', 'post']);
  });
  it('fills in priority order after skipped triggers', () => {
    const b = { ...club, cover_image_url: null };
    expect(kinds(base({ business: b, week: week({ website: 31 }) }))).toEqual(['booking', 'profile']);
  });
  it('returns nothing when no trigger applies', () => {
    expect(buildDoNext(base())).toEqual([]);
  });
});

describe('CB68 role gating', () => {
  const all = { pending: { count: 1, oldestAt: daysAgo(0) }, reviews: { awaiting: 1 }, week: week({ last_post_at: null }) };
  it('analyst sees nothing', () => {
    expect(kinds(base({ role: 'analyst', business: club, ...all }))).toEqual([]);
  });
  it('editor never sees team or reviews', () => {
    expect(kinds(base({ role: 'editor', business: club, ...all }))).toEqual(['post']);
  });
  it('admin sees team and reviews', () => {
    expect(kinds(base({ role: 'admin', business: club, ...all }))).toEqual(['team', 'reviews', 'post']);
  });
});

describe('CB68 T1 team', () => {
  it('plural and singular', () => {
    expect(built(base({ pending: { count: 2, oldestAt: daysAgo(0) } }))[0].title).toBe('2 people asked to join your team');
    const one = built(base({ pending: { count: 1, oldestAt: daysAgo(0) } }))[0];
    expect(one.title).toBe('1 person asked to join your team');
    expect(one.sub).toBe('Waiting since today.');
    expect(one.onTap).toEqual({ type: 'navigate', to: '/business/b1/team' });
  });
  it('hidden at zero', () => {
    expect(kinds(base({ pending: { count: 0, oldestAt: null } }))).toEqual([]);
  });
  it('formats when', () => {
    expect(R(formatWaitingSince('2026-10-23T08:00:00', NOW))).toBe('today');
    expect(R(formatWaitingSince('2026-10-22T23:00:00', NOW))).toBe('yesterday');
    expect(R(formatWaitingSince('2026-10-20T10:00:00', NOW))).toBe('Tuesday');
    expect(R(formatWaitingSince('2026-10-17T10:00:00', NOW))).toBe('Saturday');
    expect(R(formatWaitingSince('2026-10-16T10:00:00', NOW))).toBe('16 Oct');
    expect(R(formatWaitingSince('2026-10-12T10:00:00', NOW))).toBe('12 Oct');
  });
});

describe('CB68 T2 reviews', () => {
  it('needs club and verification', () => {
    const r = { reviews: { awaiting: 3 } };
    expect(kinds(base({ business: { ...club, is_verified: false }, ...r }))).toEqual([]);
    expect(kinds(base({ business: { ...club, club_id: null }, ...r }))).toEqual([]);
    expect(kinds(base({ business: club, reviews: { awaiting: 0 } }))).toEqual([]);
  });
  it('copy branches', () => {
    const it3 = built(base({ business: club, reviews: { awaiting: 3 } }))[0];
    expect(it3.title).toBe('Reply to 3 reviews');
    expect(it3.sub).toBe('Replies show on your course page.');
    expect(it3.action).toBe('Reply');
    expect(it3.onTap).toEqual({ type: 'navigate', to: '/business/b1/reviews?filter=unreplied' });
    const one = built(base({ business: club, reviews: { awaiting: 1 } }))[0];
    expect(one.title).toBe('Reply to 1 review');
    expect(one.sub).toBe('Replies show on your course page.');
  });
});

describe('CB68 T3 post', () => {
  it('shows at 14 days, not 13', () => {
    expect(kinds(base({ week: week({ last_post_at: daysAgo(13) }) }))).toEqual([]);
    expect(built(base({ week: week({ last_post_at: daysAgo(14) }) }))[0].sub).toBe('Nothing from Hartwell in 14 days.');
  });
  it('never posted, followers plural and singular, action', () => {
    const n = built(base({ week: week({ last_post_at: null, followers_total: 212 }) }))[0];
    expect(n.title).toBe('Post something this week');
    expect(n.sub).toBe("You haven't posted as Hartwell yet. Your 212 followers are the golfers most likely to see it.");
    expect(n.onTap).toEqual({ type: 'post', actorId: 'b1' });
    expect(built(base({ week: week({ last_post_at: daysAgo(23), followers_total: 1 }) }))[0].sub)
      .toBe('Nothing from Hartwell in 23 days. Your 1 follower is the golfer most likely to see it.');
  });
});

describe('CB68 T4 booking', () => {
  const fitter = { ...complete, category: 'Club Fitter', show_opening_hours: true, opening_hours: { Mon: { closed: true } } };
  it('needs bookable, no link and 5+ taps', () => {
    expect(kinds(base({ business: fitter, week: week({ website: 4 }) }))).toEqual([]);
    expect(kinds(base({ business: { ...fitter, booking_url: 'https://x' }, week: week({ website: 9 }) }))).toEqual([]);
    expect(kinds(base({ business: { ...complete, category: 'Brand / Manufacturer' }, week: week({ website: 9 }) }))).toEqual([]);
    const it5 = built(base({ business: fitter, week: week({ website: 5 }) }))[0];
    expect(it5.sub).toBe('5 taps through to your website this week. Send them straight to booking.');
    expect(it5.onTap).toEqual({ type: 'navigate', to: '/business/b1/edit' });
  });
});

describe('CB68 T5 profile and completeness', () => {
  it('non-venue counts six', () => {
    expect(profileCompleteness(complete)).toEqual({ done: 6, total: 6, missing: [] });
    const c = profileCompleteness({ ...complete, cover_image_url: null, social_links: { x: '  ' } });
    expect(c).toEqual({ done: 4, total: 6, missing: ['cover photo', 'social links'] });
  });
  it('venue counts seven with the profile opening-hours rule', () => {
    const v = { ...complete, category: 'Bar / Pub', show_opening_hours: false, opening_hours: { Mon: { open: '1', close: '2' } } };
    expect(profileCompleteness(v)).toEqual({ done: 6, total: 7, missing: ['opening hours'] });
    expect(profileCompleteness({ ...v, show_opening_hours: true }).total).toBe(7);
    expect(profileCompleteness({ ...v, show_opening_hours: true }).missing).toEqual([]);
    expect(profileCompleteness({ ...v, show_opening_hours: true, opening_hours: { Mon: { open: '1' } } }).missing).toEqual(['opening hours']);
  });
  it('location needs both coordinates; description is trimmed', () => {
    expect(profileCompleteness({ ...complete, lng: null, description: '  ' }).missing).toEqual(['description', 'location']);
  });
  it('copy branches', () => {
    expect(built(base({ business: { ...complete, logo_url: null } }))[0].sub).toBe('5 of 6 done. Missing: logo.');
    expect(built(base({ business: { ...complete, logo_url: null, cover_image_url: null } }))[0].sub).toBe('4 of 6 done. Missing: logo, cover photo.');
    expect(built(base({ business: { ...complete, logo_url: null, cover_image_url: null, description: null, website: null } }))[0].sub)
      .toBe('2 of 6 done. Missing: logo, cover photo and 2 more.');
  });
});

describe('CB68 erroring source', () => {
  it('a missing (errored) source drops only its own trigger', () => {
    const b = { ...club, cover_image_url: null };
    expect(kinds(base({ business: b, pending: undefined, reviews: { awaiting: 2 }, week: week({ last_post_at: null }) })))
      .toEqual(['reviews', 'post', 'profile']);
    expect(kinds(base({ business: b, pending: { count: 1, oldestAt: daysAgo(0) }, week: undefined }))).toEqual(['team', 'profile']);
  });
});

/* ───────── Component ───────── */

const rpc = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, from } }));

import { BusinessDoNextCard } from '@/components/business/home/BusinessDoNextCard';

const membership = (role: BusinessMembership['role'], b: Partial<BusinessMembership['business']> = {}): BusinessMembership => ({
  id: 'm', role, clubCourses: [],
  business: {
    id: 'b1', name: 'Hartwell', slug: null, category: 'Other', location: null, city: null, region: null, country: null,
    logo_url: 'l', is_verified: false, is_deleted: false, club_id: null,
    cover_image_url: 'c', description: 'd', lat: 1, lng: 2, website: 'w', social_links: { i: 'x' }, ...b,
  },
});
const pendingChain = (result: { data: unknown; count: number | null; error: unknown }) => {
  const c: Record<string, unknown> = {};
  for (const k of ['select', 'eq', 'order']) c[k] = () => c;
  c.limit = () => Promise.resolve(result);
  return c;
};
const weekData = { last_post_at: null, followers_total: 0, taps: { website: 0, directions: 0, call: 0, message: 0 } };
const mount = (m: BusinessMembership) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter><BusinessDoNextCard membership={m} /></MemoryRouter></QueryClientProvider>);
};

afterEach(() => { cleanup(); rpc.mockReset(); from.mockReset(); });

describe('CB68 card', () => {
  it('renders null when no trigger applies', async () => {
    rpc.mockResolvedValue({ data: { ...weekData, last_post_at: new Date().toISOString() }, error: null });
    from.mockReturnValue(pendingChain({ data: [], count: 0, error: null }));
    const { container } = mount(membership('owner'));
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(container.innerHTML).toBe('');
  });
  it('analyst renders nothing and reads nothing', () => {
    const { container } = mount(membership('analyst', { logo_url: null }));
    expect(container.innerHTML).toBe('');
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
  it('renders nothing until sources settle, then rows in order', async () => {
    let resolveWeek: (v: unknown) => void = () => {};
    rpc.mockReturnValue(new Promise((r) => { resolveWeek = r; }));
    from.mockReturnValue(pendingChain({ data: [{ created_at: new Date().toISOString() }], count: 2, error: null }));
    const { container } = mount(membership('owner'));
    await new Promise((r) => setTimeout(r, 20));
    expect(container.querySelector('[data-business-do-next]')).toBeNull();
    resolveWeek({ data: weekData, error: null });
    await waitFor(() => expect(container.querySelector('[data-business-do-next]')).not.toBeNull());
    expect([...container.querySelectorAll('[data-do-next]')].map((e) => e.getAttribute('data-do-next'))).toEqual(['team', 'post']);
  });
  it('an erroring pending read drops only the team row', async () => {
    rpc.mockResolvedValue({ data: weekData, error: null });
    from.mockReturnValue(pendingChain({ data: null, count: null, error: { message: 'boom' } }));
    const { container } = mount(membership('owner'));
    await waitFor(() => expect(container.querySelector('[data-business-do-next]')).not.toBeNull());
    expect([...container.querySelectorAll('[data-do-next]')].map((e) => e.getAttribute('data-do-next'))).toEqual(['post']);
  });
});
