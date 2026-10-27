/**
 * CB114 — BusinessNearbyCourses. Structure only; formatting via pure helpers.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

type NRow = { course_id: string; course_name: string; distance_km: number; thumbnail_image?: string | null; rating_avg?: number | null; review_count?: number | null };
const db = vi.hoisted(() => ({
  nearby: [] as NRow[],
  members: [] as Array<{ course_id: string }>,
  batch: [] as unknown[],
  batchError: null as unknown,
  calls: [] as Array<[string, unknown]>,
  circle: [] as string[],
}));
vi.mock('@/lib/social/circle', () => ({ fetchCircleIds: async () => db.circle }));
vi.mock('@/lib/getScrollParent', async (orig) => ({ ...(await orig<Record<string, unknown>>()), scrollElementIntoView: vi.fn() }));

function chain(table: string) {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'eq', 'in']) q[m] = () => q;
  q.then = (f: (v: unknown) => unknown, r?: (e: unknown) => unknown) => Promise.resolve({
    data: table === 'course_top100_memberships' ? db.members : [], error: null,
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
      return { data: [], error: null };
    },
  },
}));

import { BusinessNearbyCourses, metaLine, milesLabel, playsLabel, scrollToNearbyCard } from '@/components/business/BusinessNearbyCourses';
import { BusinessYouCard } from '@/components/business/BusinessYouCard';
import { useBusinessNearbyCounts } from '@/hooks/useBusinessNearbyCounts';
import { scrollElementIntoView } from '@/lib/getScrollParent';
import { formatNumber } from '@/i18n/format';

afterEach(() => {
  cleanup();
  Object.assign(db, { nearby: [], members: [], batch: [], batchError: null, calls: [], circle: [] });
  vi.mocked(scrollElementIntoView).mockClear();
});

const hotel = { id: 'b1', name: 'The Fairway Inn', category: 'Hotel / Accommodation', lat: 51.4, lng: 0.01 };
const nearbyN = (n: number) => {
  db.nearby = Array.from({ length: n }, (_, i) => ({ course_id: `c${i}`, course_name: `Course ${i}`, distance_km: 1 + i, rating_avg: i === 0 ? 8.24 : null, review_count: i === 0 ? 3 : 0 }));
  db.batch = db.nearby.map((r) => ({ course_id: r.course_id, rounds_tracked: 5, avg_over_par: 14.6, your_rounds: 0, your_best: null }));
};
function HeroProbe({ b }: { b: typeof hotel }) {
  const q = useBusinessNearbyCounts(b.category, b.lat, b.lng);
  return <span data-hero-n>{q.data?.coursesNear ?? ''}</span>;
}
function Loc() { const l = useLocation(); return <span data-loc>{l.pathname}</span>; }
function mount(b: typeof hotel, opts: { isClub?: boolean; withYou?: boolean } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/business/b1']}>
        <Routes><Route path="*" element={<>
          <HeroProbe b={b} />
          {opts.withYou && <BusinessYouCard isClub={!!opts.isClub} viewerId="v1" business={b} />}
          <BusinessNearbyCourses isClub={!!opts.isClub} viewerId="v1" business={b} />
          <Loc />
        </>} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const card = () => document.querySelector('[data-business-nearby]');
const settle = () => waitFor(() => expect(db.calls.some(([n]) => n === 'get_nearby_courses')).toBe(true));

describe('CB114 visibility', () => {
  it.each(['Hotel / Accommodation', 'Resort', 'Restaurant / Cafe', 'Bar / Pub', 'Driving Range'])('shown for %s with a pin and N ≥ 1', async (category) => {
    nearbyN(1);
    mount({ ...hotel, category });
    await waitFor(() => expect(card()).not.toBeNull());
  });
  it('hidden at N = 0', async () => {
    mount(hotel); await settle();
    await new Promise((r) => setTimeout(r, 20));
    expect(card()).toBeNull();
  });
  it('hidden with no pin, for other categories and on a club', async () => {
    nearbyN(3);
    mount({ ...hotel, lat: null as unknown as number });
    mount({ ...hotel, category: 'Golf Academy' });
    mount(hotel, { isClub: true });
    await new Promise((r) => setTimeout(r, 30));
    expect(card()).toBeNull();
  });
});

describe('CB114 rows, All row and sheet', () => {
  it('first four nearest first; All row above 4 with N matching the hero; sheet lists all; row opens course', async () => {
    nearbyN(6);
    const { container } = mount(hotel);
    await waitFor(() => expect(card()).not.toBeNull());
    expect(Array.from(card()!.querySelectorAll('[data-nearby-row]')).map((e) => e.getAttribute('data-nearby-row'))).toEqual(['c0', 'c1', 'c2', 'c3']);
    const all = card()!.querySelector('[data-nearby-all]')!;
    expect(all.getAttribute('data-nearby-all')).toBe(container.querySelector('[data-hero-n]')!.textContent);
    expect(container.querySelector('[data-hero-n]')!.textContent).toBe('6');
    fireEvent.click(all);
    await waitFor(() => expect(document.querySelector('[data-nearby-sheet]')).not.toBeNull());
    const sheetRows = document.querySelectorAll('[data-nearby-sheet] [data-nearby-row]');
    expect(sheetRows).toHaveLength(6);
    fireEvent.click(sheetRows[5]);
    await waitFor(() => expect(container.querySelector('[data-loc]')!.textContent).toBe('/courses/c5'));
  });
  it('no All row at exactly 4', async () => {
    nearbyN(4);
    mount(hotel);
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-nearby-all]')).toBeNull();
  });
});

describe('CB114 meta line', () => {
  const c = { id: 'c', name: 'C', distanceKm: 1.931, thumbnail: null, ratingAvg: null, reviewCount: 0, isTop100: false };
  const s = (rounds: number | null, avg: number | null = 14.6) => ({ id: 'c', name: 'C', your_rounds: null, your_best: null, rounds_tracked: rounds, avg_over_par: avg });
  it('plays + rounds at 1764, then 2, 1 and 0', () => {
    expect(metaLine(c, s(1764), false).line).toBe(`1.2 mi \u00B7 +14.6 \u00B7 ${formatNumber(1764)} rounds`);
    expect(metaLine(c, s(1764), false).line.split(' \u00B7 ').slice(0, 2)).toEqual(['1.2 mi', '+14.6']);
    expect(metaLine(c, s(2), false).line).toBe('1.2 mi \u00B7 2 rounds');
    expect(metaLine(c, s(1), false).line).toBe('1.2 mi \u00B7 1 round');
    expect(metaLine(c, s(0), false).line).toBe('1.2 mi \u00B7 No rounds yet');
    expect(metaLine(c, s(null), false).line).toBe('1.2 mi \u00B7 No rounds yet');
  });
  it('plays formatted +14.6, −1.4 and Level', () => {
    expect(playsLabel(14.6)).toBe('+14.6');
    expect(playsLabel(-1.4)).toBe('\u22121.4');
    expect(playsLabel(0.04)).toBe('Level');
  });
  it('failed stats read: distance only, never "No rounds yet", and no foot', async () => {
    expect(metaLine(c, null, true).line).toBe('1.2 mi');
    nearbyN(2); db.batchError = { message: 'denied' };
    mount(hotel);
    await waitFor(() => expect(card()).not.toBeNull());
    const metas = Array.from(card()!.querySelectorAll('[data-nearby-meta]')).map((e) => e.textContent);
    expect(metas).toEqual(['0.6 mi', '1.2 mi']);
    expect(card()!.querySelector('[data-nearby-foot]')).toBeNull();
  });
  it('foot present when a shown row has a plays figure', async () => {
    nearbyN(2);
    mount(hotel);
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector('[data-nearby-foot]')).not.toBeNull();
  });
  it('miles conversion', () => {
    expect(milesLabel(1.609344)).toBe('1.0 mi');
    expect(milesLabel(16)).toBe('9.9 mi');
  });
});

describe('CB114 rating column and Top 100 chip', () => {
  it('rating with review_count ≥ 1 in INK, absent at 0', async () => {
    nearbyN(2);
    mount(hotel);
    await waitFor(() => expect(card()).not.toBeNull());
    const rows = card()!.querySelectorAll('[data-nearby-row]');
    const v = rows[0].querySelector('[data-nearby-rating-value]') as HTMLElement;
    expect(v.textContent).toBe('8.2');
    expect(v.style.color.replace(/\s/g, '')).toBe('rgb(248,250,252)');
    expect(rows[1].querySelector('[data-nearby-rating]')).toBeNull();
  });
  it('Top 100 chip on a member course; only that name wraps', async () => {
    nearbyN(2); db.members = [{ course_id: 'c1' }];
    mount(hotel);
    await waitFor(() => expect(card()).not.toBeNull());
    const rows = card()!.querySelectorAll('[data-nearby-row]');
    expect(rows[0].querySelector('[data-nearby-top100]')).toBeNull();
    expect(rows[1].querySelector('[data-nearby-top100]')).not.toBeNull();
    expect((rows[0].querySelector('[data-nearby-name]') as HTMLElement).style.whiteSpace).toBe('nowrap');
    expect((rows[1].querySelector('[data-nearby-name]') as HTMLElement).style.whiteSpace).toBe('');
  });
});

describe('CB114 shared reads', () => {
  it('one get_nearby_courses and one get_course_stats_batch across hero, BusinessYouCard and this card', async () => {
    nearbyN(6);
    mount(hotel, { withYou: true });
    await waitFor(() => expect(card()).not.toBeNull());
    await new Promise((r) => setTimeout(r, 30));
    expect(db.calls.filter(([n]) => n === 'get_nearby_courses')).toHaveLength(1);
    expect(db.calls.filter(([n]) => n === 'get_course_stats_batch')).toEqual([['get_course_stats_batch', { p_course_ids: ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'] }]]);
  });
  it("BusinessYouCard's output is unchanged (no nearby card markup inside it)", async () => {
    nearbyN(2);
    db.batch = [{ course_id: 'c0', your_rounds: 3, your_best: 78, rounds_tracked: 5, avg_over_par: 2 }];
    mount(hotel, { withYou: true });
    await waitFor(() => expect(document.querySelector('[data-business-you]')).not.toBeNull());
    const you = document.querySelector('[data-business-you]')!;
    expect(you.querySelector('[data-nearby-row]')).toBeNull();
    expect(you.querySelector('.club-you-title')).not.toBeNull();
  });
});

describe('CB114 hero link', () => {
  it('hero Courses near / Top 100 near cells scroll to the card', async () => {
    const src = readFileSync(resolve(process.cwd(), 'src/pages/BusinessProfilePage.tsx'), 'utf8');
    expect(src).toMatch(/k === 'coursesNear' \|\| k === 'top100Near'\s*\?\s*scrollToNearbyCard/);
    nearbyN(1);
    mount(hotel);
    await waitFor(() => expect(card()).not.toBeNull());
    scrollToNearbyCard();
    expect(vi.mocked(scrollElementIntoView)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(scrollElementIntoView).mock.calls[0][0]).toBe(card());
  });
});

