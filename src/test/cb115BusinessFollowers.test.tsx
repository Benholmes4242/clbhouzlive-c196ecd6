/**
 * CB115 — BusinessFollowersCard + CB114 tidy. Structure only.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const db = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  hcp: null as number | null,
  nearby: [] as unknown[],
  calls: [] as string[],
}));
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: (id?: string) => ({ data: id && db.hcp != null ? { id: 'conn' } : null }),
  useHandicapTrend: (id?: string) => ({ data: id ? { current: db.hcp } : undefined }),
}));
vi.mock('@/lib/social/circle', () => ({ fetchCircleIds: async () => [] }));
function chain() {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'eq', 'in']) q[m] = () => q;
  q.then = (f: (v: unknown) => unknown, r?: (e: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(f, r);
  return q;
}
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => chain(),
    rpc: async (name: string) => {
      db.calls.push(name);
      if (name === 'get_business_follower_golf') return { data: db.error ? null : db.result, error: db.error };
      if (name === 'get_nearby_courses') return { data: db.nearby, error: null };
      return { data: [], error: null };
    },
  },
}));

import { BusinessFollowersCard, bandFor, bandPct } from '@/components/business/BusinessFollowersCard';
import { BusinessNearbyCourses, metaLine, roundsLabel } from '@/components/business/BusinessNearbyCourses';

afterEach(() => { cleanup(); Object.assign(db, { result: null, error: null, hcp: null, nearby: [], calls: [] }); });

const bands = { under5: 1, b5: 2, b10: 3, b15: 3, b20: 2 }; // 11
const courses = [
  { course_id: 'c1', name: 'Royal Course Golf Club', thumbnail_image: null, rounds: 41, golfers: 5 },
  { course_id: 'c2', name: 'Second Course', thumbnail_image: null, rounds: 12, golfers: 3 },
];
const stateA = () => ({ handicap_count: 11, bands, courses });
const stateB = () => ({ handicap_count: 11, bands, courses: [] });
const stateC = () => ({ handicap_count: null, bands: null, courses });
const stateD = () => ({ handicap_count: null, bands: null, courses: [] });

function Loc() { const l = useLocation(); return <span data-loc>{l.pathname}</span>; }
function mount(opts: { isClub?: boolean; viewer?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/business/b1']}>
        <Routes><Route path="*" element={<>
          <BusinessFollowersCard isClub={!!opts.isClub} businessId="b1" viewerId={opts.viewer} />
          <Loc />
        </>} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const card = () => document.querySelector('[data-business-followers]');
const settle = () => waitFor(() => expect(db.calls).toContain('get_business_follower_golf'));
const wait = () => new Promise((r) => setTimeout(r, 20));

describe('CB115 states', () => {
  it('A: mix and courses', async () => {
    db.result = stateA(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-followers-mix]')).not.toBeNull();
    expect(card()!.querySelectorAll('[data-followers-course]')).toHaveLength(2);
  });
  it('B: mix only', async () => {
    db.result = stateB(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-followers-mix]')).not.toBeNull();
    expect(card()!.querySelector('[data-followers-courses]')).toBeNull();
  });
  it('C: courses only', async () => {
    db.result = stateC(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-followers-mix]')).toBeNull();
    expect(card()!.querySelectorAll('[data-followers-course]')).toHaveLength(2);
  });
  it('D: no bands and no courses gives no card', async () => {
    db.result = stateD(); mount(); await settle(); await wait();
    expect(card()).toBeNull();
  });
  it('failed read and null result give no card', async () => {
    db.error = { message: 'x' }; mount(); await settle(); await wait();
    expect(card()).toBeNull();
    cleanup(); db.error = null; db.result = null; db.calls = [];
    mount(); await settle(); await wait();
    expect(card()).toBeNull();
  });
  it('never on a club', async () => {
    db.result = stateA(); mount({ isClub: true }); await wait();
    expect(card()).toBeNull();
    expect(db.calls).not.toContain('get_business_follower_golf');
  });
});

describe('CB115 mix', () => {
  it('count shown only when handicap_count is non-null', async () => {
    db.result = stateA(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-followers-count]')).not.toBeNull();
    cleanup(); db.result = stateC(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-followers-count]')).toBeNull();
  });
  it('five bands in order; 3/11 is 27% and fill width is count ÷ total', async () => {
    db.result = stateA(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    const rows = Array.from(card()!.querySelectorAll('[data-band]'));
    expect(rows.map((r) => r.getAttribute('data-band'))).toEqual(['under5', 'b5', 'b10', 'b15', 'b20']);
    const b10 = rows[2];
    expect(b10.querySelector('[data-band-value]')!.textContent).toBe('27%');
    expect((b10.querySelector('[data-band-fill]') as HTMLElement).style.width).toBe(`${(3 / 11) * 100}%`);
    expect(bandPct(3, 11)).toBe(27);
  });
  it('viewer at 12.4 highlights 10–15', async () => {
    db.result = stateA(); db.hcp = 12.4; mount({ viewer: 'v1' });
    await waitFor(() => expect(card()!.querySelector('[data-band-me]')).not.toBeNull());
    const me = card()!.querySelectorAll('[data-band-me]');
    expect(me).toHaveLength(1);
    expect(me[0].getAttribute('data-band')).toBe('b10');
    expect(me[0].querySelector('[data-band-you]')).not.toBeNull();
  });
  it('a plus handicap falls in Under 5', () => {
    expect(bandFor(-2.1)).toBe('under5');
    expect(bandFor(4.9)).toBe('under5');
    expect(bandFor(5)).toBe('b5');
    expect(bandFor(20)).toBe('b20');
  });
  it('no viewer handicap highlights nothing', async () => {
    db.result = stateA(); mount({ viewer: 'v1' });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-band-me]')).toBeNull();
    expect(bandFor(null)).toBeNull();
  });
});

describe('CB115 courses and foot', () => {
  it('first-row meta differs from later rows; rows navigate', async () => {
    db.result = stateA(); const { container } = mount();
    await waitFor(() => expect(card()).not.toBeNull());
    const metas = Array.from(card()!.querySelectorAll('[data-followers-meta]')).map((e) => e.textContent);
    expect(metas[0]).not.toBe(metas[1]);
    expect(metas[0]!.length).toBeGreaterThan(metas[1]!.length);
    fireEvent.click(card()!.querySelectorAll('[data-followers-course]')[1]);
    await waitFor(() => expect(container.querySelector('[data-loc]')!.textContent).toBe('/courses/c2'));
  });
  it('foot copy has two forms', async () => {
    db.result = stateA(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    const withCourses = card()!.querySelector('[data-followers-foot]')!.textContent;
    cleanup(); db.result = stateB(); mount();
    await waitFor(() => expect(card()).not.toBeNull());
    const mixOnly = card()!.querySelector('[data-followers-foot]')!.textContent;
    expect(withCourses).not.toBe(mixOnly);
    expect(withCourses!.startsWith(mixOnly!)).toBe(true);
  });
});

describe('CB115 placement', () => {
  const src = readFileSync(resolve(process.cwd(), 'src/pages/BusinessProfilePage.tsx'), 'utf8');
  it('after the nearby card and the You card, before How it plays/tabs', () => {
    const you = src.indexOf('<BusinessYouCard');
    const near = src.indexOf('<BusinessNearbyCourses');
    const fol = src.indexOf('<BusinessFollowersCard');
    const hip = src.indexOf('<ClubHowItPlays');
    expect(you).toBeGreaterThan(0);
    expect(near).toBeGreaterThan(you);
    expect(fol).toBeGreaterThan(near);
    expect(hip).toBeGreaterThan(fol);
  });
});

describe('CB114 tidy', () => {
  it('no signed-in viewer: distance-only meta lines and no foot', async () => {
    db.nearby = [{ course_id: 'n1', course_name: 'Near One', distance_km: 1.609344, review_count: 0 }];
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={qc}><MemoryRouter>
      <BusinessNearbyCourses isClub={false} business={{ name: 'Inn', category: 'Hotel / Accommodation', lat: 51, lng: 0 }} />
    </MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(document.querySelector('[data-business-nearby]')).not.toBeNull());
    expect(Array.from(document.querySelectorAll('[data-nearby-meta]')).map((e) => e.textContent)).toEqual(['1.0 mi']);
    expect(document.querySelector('[data-nearby-foot]')).toBeNull();
  });
  it('round counts go through i18n keys with plurals', () => {
    const seen: Array<[string, number | undefined]> = [];
    const tr = (k: string, o: { count?: number; defaultValue: string }) => { seen.push([k, o.count]); return k; };
    roundsLabel(0, tr); roundsLabel(1, tr); roundsLabel(2, tr); roundsLabel(7, tr);
    expect(seen).toEqual([['business.nearby.noRounds', undefined], ['business.nearby.rounds', 1], ['business.nearby.rounds', 2], ['business.nearby.rounds', 7]]);
    const c = { id: 'x', name: 'X', distanceKm: null } as unknown as Parameters<typeof metaLine>[0];
    expect(metaLine(c, { id: 'x', name: 'X', rounds_tracked: 1, avg_over_par: null, your_rounds: null, your_best: null }, false, tr).line).toBe('business.nearby.rounds');
    const en = JSON.parse(readFileSync(resolve(process.cwd(), 'public/locales/en/common.json'), 'utf8'));
    expect(Object.keys(en.business.nearby)).toEqual(expect.arrayContaining(['noRounds', 'rounds_one', 'rounds_other']));
    expect(Object.keys(en.business.followers)).toEqual(expect.arrayContaining(['withHandicap_one', 'withHandicap_other', 'firstRounds_one', 'rounds_one']));
  });
});
