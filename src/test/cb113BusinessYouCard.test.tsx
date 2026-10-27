/**
 * CB113 — BusinessYouCard. Copy rules are asserted through the pure helpers
 * with an interpolating t; rendered states assert structure only.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const db = vi.hoisted(() => ({
  circle: [] as string[],
  follows: [] as Array<{ follower_actor_id: string; created_at: string }>,
  profiles: [] as Array<{ id: string; display_name: string | null; profile_photo_url: string | null }>,
  nearby: [] as Array<{ course_id: string; course_name: string }>,
  batch: [] as unknown[],
  batchError: null as unknown,
  hcp: [] as Array<{ user_id: string; handicap_index: number | null }>,
  calls: [] as Array<[string, unknown]>,
  followFilters: [] as Array<[string, unknown]>,
}));
const fetchCircleIds = vi.hoisted(() => vi.fn(async () => db.circle));
vi.mock('@/lib/social/circle', () => ({ fetchCircleIds }));

function chain(table: string) {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit']) q[m] = () => q;
  q.eq = (c: string, v: unknown) => { if (table === 'follows') db.followFilters.push([c, v]); return q; };
  q.in = (c: string, v: unknown) => { if (table === 'follows') db.followFilters.push([c, v]); return q; };
  q.then = (f: (v: unknown) => unknown, r?: (e: unknown) => unknown) => Promise.resolve({
    data: table === 'follows' ? db.follows : table === 'user_profiles' ? db.profiles : [], error: null,
  }).then(f, r);
  return q;
}
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (t: string) => chain(t),
    rpc: async (name: string, args: unknown) => {
      db.calls.push([name, args]);
      if (name === 'get_nearby_courses') return { data: db.nearby, error: null };
      if (name === 'get_course_stats_batch') return { data: db.batchError ? null : db.batch, error: db.batchError };
      if (name === 'get_visible_handicaps') return { data: db.hcp, error: null };
      return { data: null, error: null };
    },
  },
}));

import { BusinessYouCard, averageHcp, followFaces, nearbyFacts, nearbyTitle } from '@/components/business/BusinessYouCard';
import { ClubYouCard } from '@/components/business/ClubYouCard';
import { nearbyCountsKey } from '@/hooks/useBusinessNearbyCounts';

const t = (_k: string, o: Record<string, unknown>) =>
  String(o.defaultValue ?? '').replace(/\{\{(\w+)\}\}/g, (_m, k) => String(o[k] ?? ''));

afterEach(() => {
  cleanup();
  Object.assign(db, { circle: [], follows: [], profiles: [], nearby: [], batch: [], batchError: null, hcp: [], calls: [], followFilters: [] });
  fetchCircleIds.mockClear();
});

const golfers = (n: number) => {
  db.circle = Array.from({ length: n }, (_, i) => `g${i}`);
  db.follows = db.circle.map((id, i) => ({ follower_actor_id: id, created_at: `2026-10-${String(20 - i).padStart(2, '0')}` }));
  db.profiles = db.circle.map((id, i) => ({ id, display_name: `Golfer${i}`, profile_photo_url: null }));
};
const hotel = { id: 'b1', name: 'The Fairway Inn', category: 'Hotel / Accommodation', lat: 51.4, lng: 0.01 };
const brand = { id: 'b2', name: 'clbhouz', category: 'Creator', lat: null, lng: null };
const nearby6 = () => { db.nearby = Array.from({ length: 6 }, (_, i) => ({ course_id: `c${i}`, course_name: `Course ${i}` })); };

let qc: QueryClient;
const mount = (business: typeof hotel | typeof brand, viewerId: string | undefined = 'me') => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><BusinessYouCard isClub={false} viewerId={viewerId} business={business} /></QueryClientProvider>);
};
const settle = () => new Promise((r) => setTimeout(r, 30));
const card = (c: HTMLElement) => c.querySelector('[data-business-you]');

describe('CB113 copy rules', () => {
  const s = (id: string, name: string, your_rounds: number | null, your_best: number | null) => ({ id, name, your_rounds, your_best });
  it('A: played of N with best at short course name', () => {
    const f = nearbyFacts([s('a', 'Sundridge Park Golf Club (East Course)', 4, 78), s('b', 'B', 2, 81), s('c', 'C', 0, null)]);
    expect(nearbyTitle(6, f, t)).toEqual({ first: "You've played 2 of the 6 courses near here.", second: 'Your best is 78, at Sundridge Park (East Course).' });
  });
  it('B: none played', () => {
    expect(nearbyTitle(6, nearbyFacts([s('a', 'A', 0, null)]), t)).toEqual({ first: "You haven't played any of the 6 courses near here yet.", second: '' });
  });
  it('N = 1 both ways', () => {
    expect(nearbyTitle(1, nearbyFacts([s('a', 'A', 2, 80)]), t).first).toBe("You've played the one course near here.");
    expect(nearbyTitle(1, nearbyFacts([s('a', 'A', 0, null)]), t).first).toBe("You haven't played the one course near here yet.");
  });
  it('total rounds 1 reads "You went round in"', () => {
    expect(nearbyTitle(6, nearbyFacts([s('a', 'Alpha', 1, 84)]), t).second).toBe('You went round in 84, at Alpha.');
  });
  it('best tie → more rounds, then name', () => {
    expect(nearbyFacts([s('a', 'Zed', 2, 78), s('b', 'Bee', 5, 78)]).best!.id).toBe('b');
    expect(nearbyFacts([s('a', 'Zed', 3, 78), s('b', 'Bee', 3, 78)]).best!.id).toBe('b');
  });
  it('faces copy for 1, 2, 3 and 14', () => {
    const p = (n: number) => Array.from({ length: n }, (_, i) => ({ user_id: `u${i}`, display_name: i === 0 ? 'Sam' : i === 1 ? 'Chris' : `X${i}` }));
    const line = (n: number) => { const f = followFaces(p(n), 'The Fairway Inn', t); return f.names + f.rest; };
    expect(line(1)).toBe('Sam, who you follow, follows The Fairway Inn.');
    expect(line(2)).toBe('Sam and Chris, who you follow, follow The Fairway Inn.');
    expect(line(3)).toBe('Sam, Chris and 1 other you follow follow The Fairway Inn.');
    expect(line(14)).toBe('Sam, Chris and 12 others you follow follow The Fairway Inn.');
    expect(followFaces(p(2), 'X', t).names).toBe('Sam and Chris');
  });
  it('average shown at 3 handicaps, hidden at 2, plus formatted "+"', () => {
    expect(averageHcp([10, 12.4, null, 14])).toBe('12.1');
    expect(averageHcp([10, 12, null])).toBeNull();
    expect(averageHcp([-2, -1, -3])).toBe('+2.0');
  });
});

describe('CB113 rendered states', () => {
  it('A: nearby played with faces (up to three)', async () => {
    nearby6(); golfers(4);
    db.batch = [{ course_id: 'c0', your_rounds: 3, your_best: 78 }, { course_id: 'c1', your_rounds: 0, your_best: null }];
    const { container } = mount(hotel);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(card(container)!.querySelector('.club-you-title span')).not.toBeNull();
    expect(container.querySelectorAll('[data-face]')).toHaveLength(3);
    expect(db.calls.filter(([n]) => n === 'get_course_stats_batch')).toEqual([['get_course_stats_batch', { p_course_ids: ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'] }]]);
    expect((card(container)!.querySelector('.club-you-kicker') as HTMLElement).style.textOverflow).toBe('ellipsis');
  });
  it('B: nothing played but followed golfers → card, no second sentence', async () => {
    nearby6(); golfers(1);
    db.batch = [{ course_id: 'c0', your_rounds: 0, your_best: null }];
    const { container } = mount(hotel);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(card(container)!.querySelector('.club-you-title span')).toBeNull();
    expect(container.querySelectorAll('[data-face]')).toHaveLength(1);
  });
  it('played = 0 and F = 0 → no card', async () => {
    nearby6(); db.batch = [];
    const { container } = mount(hotel);
    await settle();
    expect(card(container)).toBeNull();
  });
  it('C: other category, F ≥ 3 with average and faces row', async () => {
    golfers(3); db.hcp = [{ user_id: 'g0', handicap_index: 10 }, { user_id: 'g1', handicap_index: 12 }, { user_id: 'g2', handicap_index: 14 }];
    const { container } = mount(brand);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(card(container)!.querySelector('.club-you-title span')).not.toBeNull();
    expect(container.querySelector('[data-club-you-faces]')).not.toBeNull();
    expect(db.calls.some(([n]) => n === 'get_nearby_courses')).toBe(false);
  });
  it('C: average hidden with only two handicaps', async () => {
    golfers(3); db.hcp = [{ user_id: 'g0', handicap_index: 10 }, { user_id: 'g1', handicap_index: 12 }];
    const { container } = mount(brand);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(card(container)!.querySelector('.club-you-title span')).toBeNull();
  });
  it('D: F = 1 or 2 → title only, no faces row', async () => {
    golfers(2);
    const { container } = mount(brand);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(container.querySelector('[data-club-you-faces]')).toBeNull();
  });
  it('E: F = 0 → no card', async () => {
    const { container } = mount(brand);
    await settle();
    expect(card(container)).toBeNull();
  });
  it('a failed batch drops the nearby sentences and keeps the faces logic', async () => {
    nearby6(); golfers(1); db.batchError = { message: 'down' };
    const { container } = mount(hotel);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(container.querySelector('[data-club-you-faces]')).toBeNull();
  });
  it('signed out gives no card and reads nothing', async () => {
    golfers(3);
    const { container } = mount(brand, '');
    await settle();
    expect(card(container)).toBeNull();
    expect(fetchCircleIds).not.toHaveBeenCalled();
  });
  it('the circle read uses fetchCircleIds, then personal follows of this business', async () => {
    golfers(1);
    const { container } = mount(brand);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(fetchCircleIds).toHaveBeenCalledWith('me');
    expect(db.followFilters).toEqual(expect.arrayContaining([
      ['following_actor_type', 'business'], ['following_actor_id', 'b2'], ['follower_actor_type', 'personal'], ['follower_actor_id', ['g0']],
    ]));
  });
  it('the nearby read shares the hero key', async () => {
    nearby6(); golfers(1); db.batch = [];
    const { container } = mount(hotel);
    await waitFor(() => expect(card(container)).not.toBeNull());
    expect(qc.getQueryData([...nearbyCountsKey(51.4, 0.01)])).toMatchObject({ coursesNear: 6 });
    expect(db.calls.filter(([n]) => n === 'get_nearby_courses')).toHaveLength(1);
  });
});

describe('CB113 club separation', () => {
  it('a club never renders BusinessYouCard; a non-club never renders ClubYouCard', () => {
    const q = new QueryClient();
    const { container } = render(<QueryClientProvider client={q}>
      <BusinessYouCard isClub viewerId="me" business={brand} />
      <ClubYouCard isClub={false} viewerId="me" courses={[{ id: 'k', name: 'K', region: null, country: null } as never]} businessName="X" />
    </QueryClientProvider>);
    expect(container.innerHTML).toBe('');
  });
  it('the page renders ClubYouCard unchanged and BusinessYouCard after it', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/pages/BusinessProfilePage.tsx'), 'utf8');
    expect(src).toContain('<ClubYouCard isClub={isClub} viewerId={user?.id} courses={courses} businessName={business.name} />');
    expect(src.indexOf('<BusinessYouCard')).toBeGreaterThan(src.indexOf('<ClubYouCard'));
  });
});
