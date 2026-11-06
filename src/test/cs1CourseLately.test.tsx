import React from 'react';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const f = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  error: null as unknown,
  calls: [] as Array<Record<string, unknown>>,
  shapeCalls: [] as unknown[][],
  openByScore: vi.fn(),
  openProfile: vi.fn(),
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => (typeof o === 'string' ? o : o?.defaultValue ?? ''), i18n: { language: 'en' } }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => {
      f.calls.push({ name, ...args });
      if (f.error) return Promise.resolve({ data: null, error: f.error });
      const off = Number(args.p_offset ?? 0);
      return Promise.resolve({ data: f.rows.slice(off, off + Number(args.p_limit ?? 10)), error: null });
    },
  },
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({
  useRoundHoleShapes: (ids: unknown[]) => { f.shapeCalls.push(ids); return new Map(); },
}));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({
  useScorecardOpener: () => ({ target: null, openByScore: f.openByScore, openProfile: f.openProfile, close: vi.fn() }),
}));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));

import CourseLatelySection from '@/components/courses/course-detail/about/CourseLatelySection';
import { signedAvg, latelyShortDate } from '@/components/courses/course-detail/about/latelyRules';
import { recentSentenceParts } from '@/features/explore-magazine/watch/roundsShelfRules';
import { HeroCourseRecord } from '@/components/courses/course-detail/about/HeroCourseRecord';
import { readFileSync } from 'node:fs';

function row(i: number, extra: Record<string, unknown> = {}) {
  return {
    pos: i, user_id: `u${i}`, display_name: `Golfer ${i}`, profile_photo_url: null, whs_score_id: `s${i}`,
    play_date: '2026-11-04', course_id: 'c1', course_name: 'Sundridge Park', gross_score: 80, course_par: 71,
    net_score: 71, course_handicap: 9, is_competition: false, prior_n: 0, avg_topar: null, best_topar: null,
    last_better: null, delta: null, in_circle: false, total_count: 4, golfers: 3, window_avg_topar: 10.8,
    best_gross: 74, best_gross_date: '2026-10-29', ...extra,
  };
}

function mount(userId: string | undefined | 'signed-out' = 'me') {
  const viewer = userId === 'signed-out' ? undefined : userId;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}><MemoryRouter><CourseLatelySection courseId="c1" userId={viewer} /></MemoryRouter></QueryClientProvider>,
  );
}

const ready = () => waitFor(() => expect(document.querySelector('[data-course-lately="ready"]')).not.toBeNull());

beforeEach(() => { f.rows = []; f.error = null; f.calls = []; f.shapeCalls = []; f.openByScore.mockReset(); });
afterEach(cleanup);

describe('CS1 Lately here', () => {
  it('(a) mounts after the verdict and before About this course', () => {
    const src = readFileSync('src/components/courses/course-detail/CourseAboutTab.tsx', 'utf8');
    const v = src.indexOf('<TheVerdict');
    const l = src.indexOf('<CourseLatelySection');
    const a = src.indexOf('<AboutThisPlace');
    expect(v).toBeGreaterThan(-1);
    expect(l).toBeGreaterThan(v);
    expect(a).toBeGreaterThan(l);
  });

  it('(b) lede uses plural and singular forms', async () => {
    f.rows = [row(1, { total_count: 1, golfers: 1 })];
    mount();
    await ready();
    const bolds = document.querySelectorAll('[data-course-lately-lede] b');
    expect([...bolds].map((b) => b.textContent)).toEqual(['1 round', '1 golfer']);
    cleanup();
    f.rows = Array.from({ length: 4 }, (_, i) => row(i, { total_count: 23, golfers: 9 }));
    mount();
    await ready();
    expect([...document.querySelectorAll('[data-course-lately-lede] b')].map((b) => b.textContent)).toEqual(['23 rounds', '9 golfers']);
  });

  it('(c) tiles show at 4, hide at 3; signed average', async () => {
    f.rows = Array.from({ length: 4 }, (_, i) => row(i));
    mount();
    await ready();
    const tiles = document.querySelector('[data-course-lately-tiles]');
    expect(tiles?.children.length).toBe(3);
    expect(tiles?.querySelectorAll('b')[0].textContent).toBe('4');
    expect(tiles?.querySelectorAll('b')[1].textContent).toBe('+10.8');
    expect(tiles?.querySelectorAll('b')[2].textContent).toBe('74');
    cleanup();
    f.rows = Array.from({ length: 3 }, (_, i) => row(i, { total_count: 3 }));
    mount();
    await ready();
    expect(document.querySelector('[data-course-lately-tiles]')).toBeNull();
    expect(document.querySelectorAll('[data-rounds-shelf-card="round"]').length).toBe(3);
    expect(signedAvg(0)).toBe('E');
    expect(signedAvg(-1.2)).toBe('\u22121.2');
    expect(signedAvg(10.84)).toBe('+10.8');
    expect(latelyShortDate('2026-10-29', 'en', new Date('2026-11-05'))).toBe('Oct 29');
    expect(latelyShortDate('2025-10-29', 'en', new Date('2026-11-05'))).toContain('2025');
  });

  it('(d) date-only sub, CIRCLE only when in_circle, amber own round', async () => {
    f.rows = [row(1, { user_id: 'me', total_count: 2 }), row(2, { in_circle: true, total_count: 2 })];
    mount();
    await ready();
    const cards = document.querySelectorAll('[data-rounds-shelf-card="round"]');
    expect(cards[0].getAttribute('data-own-round')).toBe('true');
    expect((cards[0] as HTMLElement).style.border.replace(/\s/g, '')).toContain('rgba(247,147,30,0.35)');
    expect((cards[0].querySelector('[data-round-card-name]') as HTMLElement).style.color).toBe('rgb(247, 147, 30)');
    expect(cards[1].getAttribute('data-own-round')).toBeNull();
    expect(cards[0].querySelector('[data-round-card-circle]')).toBeNull();
    expect(cards[1].querySelector('[data-round-card-circle]')).not.toBeNull();
    const sub = cards[0].querySelector('[data-round-card-name]')?.nextElementSibling;
    expect(sub?.textContent).not.toContain('Sundridge');
    expect(document.querySelector('[data-course-lately-foot]')?.textContent).toBe('Newest first. Your circle is marked.');
    fireEvent.click(cards[1]);
    expect(f.openByScore).toHaveBeenCalledWith('s2', null, 'u2');
  });

  it('(e) here-sentences per rule; Recent rounds keeps course-named lines', () => {
    const base = row(1) as never as Parameters<typeof recentSentenceParts>[0];
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ prior_n: 0 }, 'First round here'],
      [{ prior_n: 5, last_better: null }, 'Best ever here'],
      [{ prior_n: 5, last_better: '2026-08-01', delta: -2 }, 'Best here since {{month}}'],
      [{ prior_n: 2, last_better: '2026-10-30', delta: 1 }, '{{ordinal}} round here'],
      [{ prior_n: 5, last_better: '2026-10-30', delta: -2 }, '{{n}} shots better than average here'],
      [{ prior_n: 5, last_better: '2026-10-30', delta: 2 }, '{{n}} shots above average here'],
      [{ prior_n: 5, last_better: '2026-10-30', delta: 0.4 }, 'Right on average here'],
    ];
    for (const [extra, expected] of cases) {
      const r = { ...base, ...extra } as typeof base;
      expect(recentSentenceParts(r, 'en', { here: true })?.defaultValue).toBe(expected);
      expect(recentSentenceParts(r, 'en')?.defaultValue).toContain('{{course}}');
    }
  });

  it('(f) one batched hole-shapes call over loaded rounds', async () => {
    f.rows = Array.from({ length: 4 }, (_, i) => row(i));
    mount();
    await ready();
    const last = f.shapeCalls[f.shapeCalls.length - 1];
    expect(last).toEqual(['s0', 's1', 's2', 's3']);
    expect(f.shapeCalls.every((c) => Array.isArray(c))).toBe(true);
  });

  it('(g) paging requests offset 10 next', async () => {
    const io: Array<(e: Array<{ isIntersecting: boolean }>) => void> = [];
    (globalThis as any).IntersectionObserver = class { constructor(cb: any) { io.push(cb); } observe() {} disconnect() {} };
    f.rows = Array.from({ length: 15 }, (_, i) => row(i, { total_count: 15 }));
    mount();
    await ready();
    expect(f.calls[0]).toMatchObject({ name: 'get_course_lately', p_course_id: 'c1', p_limit: 10, p_offset: 0 });
    io[io.length - 1]([{ isIntersecting: true }]);
    await waitFor(() => expect(f.calls.some((c) => c.p_offset === 10)).toBe(true));
    await waitFor(() => expect(document.querySelectorAll('[data-rounds-shelf-card="round"]').length).toBe(15));
  });

  it('(h) total_count 0 renders nothing', async () => {
    f.rows = [];
    const { container } = mount();
    await waitFor(() => expect(f.calls.length).toBe(1));
    await waitFor(() => expect(container.innerHTML).toBe(''));
  });

  it('(i) an error does not render the empty state', async () => {
    f.error = { message: 'boom' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount();
    await waitFor(() => expect(document.querySelector('[data-course-lately="error"]')).not.toBeNull());
    expect(document.querySelector('[data-course-lately="ready"]')).toBeNull();
    expect(document.querySelector('[data-course-lately-lede]')).toBeNull();
    warn.mockRestore();
  });

  it('signed-out viewers get nothing and make no read', () => {
    const { container } = mount('signed-out');
    expect(container.innerHTML).toBe('');
    expect(f.calls.length).toBe(0);
  });

  it('(j) hero label reads Course record', () => {
    render(<HeroCourseRecord holders={[{ user_id: 'a', user_display_name: 'Lennon Hill', value: 65 } as never]} />);
    expect(screen.getByText('Course record')).toBeTruthy();
  });
});
