import React from 'react';
import { cleanup, render, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, error: null as unknown, calls: [] as unknown[], openByScore: vi.fn() }));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (name: string, args: unknown) => { f.calls.push({ name, args }); return Promise.resolve(f.error ? { data: null, error: f.error } : { data: f.rows, error: null }); } },
}));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({
  useScorecardOpener: () => ({ target: null, openByScore: f.openByScore, openProfile: vi.fn(), close: vi.fn() }),
}));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));

import CourseHonoursSection from '@/components/courses/course-detail/about/CourseHonoursSection';
import { holeOrdinal } from '@/components/courses/course-detail/about/honoursRules';

function honour(i: number, extra: Record<string, unknown> = {}) {
  return { kind: 'ace', whs_score_id: `s${i}`, user_id: `u${i}`, display_name: `Golfer ${i}`, play_date: '2026-08-14', hole_no: 11, par: 3, strokes: 1, yards: 155, is_competition: false, ...extra };
}
function mount(userId: string | null = 'me') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><CourseHonoursSection courseId="c1" userId={userId ?? undefined} /></QueryClientProvider>);
}
const ready = () => waitFor(() => expect(document.querySelector('[data-course-honours="ready"]')).not.toBeNull());

beforeEach(() => { f.rows = []; f.error = null; f.calls = []; f.openByScore.mockReset(); });
afterEach(cleanup);

describe('Honours board', () => {
  it('hidden signed out, with no read', () => {
    const { container } = mount(null);
    expect(container.innerHTML).toBe('');
    expect(f.calls.length).toBe(0);
  });
  it('hidden when errored (function missing) and warns', async () => {
    f.error = { message: 'function get_course_honours does not exist' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = mount();
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
    warn.mockRestore();
  });
  it('hidden when empty', async () => {
    const { container } = mount();
    await waitFor(() => expect(f.calls.length).toBe(1));
    await waitFor(() => expect(container.innerHTML).toBe(''));
    expect(f.calls[0]).toEqual({ name: 'get_course_honours', args: { p_course_id: 'c1' } });
  });
  it('group counts; one page has no counter or dots; yards null; COMPETITION tag', async () => {
    f.rows = [honour(1, { is_competition: true }), honour(2, { yards: null }), honour(3, { kind: 'albatross', hole_no: 13, par: 5, strokes: 2, yards: 498 })];
    mount();
    await ready();
    expect(document.querySelector('[data-honours-group="ace"] [data-honours-count]')?.textContent).toBe('2');
    expect(document.querySelector('[data-honours-group="albatross"] [data-honours-count]')?.textContent).toBe('1');
    expect(document.querySelector('[data-honours-position]')).toBeNull();
    expect(document.querySelector('[data-honours-dots]')).toBeNull();
    const subs = [...document.querySelectorAll('[data-honour-sub]')].map((s) => s.textContent);
    expect(subs).toEqual(['11th · 155 yds · par 3', '11th · par 3', '2 on the 13th · 498 yds']);
    const rows = document.querySelectorAll('[data-honour-row]');
    expect(rows[0].querySelector('[data-honour-competition]')).not.toBeNull();
    expect(rows[1].querySelector('[data-honour-competition]')).toBeNull();
    expect(rows[0].textContent).toContain('14 Aug 2026');
  });
  it('seven aces give two pages, "1 of 2" and dots; albatross group absent', async () => {
    f.rows = Array.from({ length: 7 }, (_, i) => honour(i));
    mount();
    await ready();
    expect(document.querySelectorAll('[data-honours-page]').length).toBe(2);
    expect(document.querySelector('[data-honours-position]')?.textContent).toBe('1 of 2');
    expect(document.querySelectorAll('[data-honours-dots] i').length).toBe(2);
    expect(document.querySelector('[data-honours-dots] i[data-on="true"]')).toBe(document.querySelector('[data-honours-dots] i'));
    expect(document.querySelector('[data-honours-group="albatross"]')).toBeNull();
  });
  it('a par-4 ace is listed in both groups, in arrival order', async () => {
    f.rows = [honour(1, { par: 4, hole_no: 7 }), honour(1, { kind: 'albatross', par: 4, hole_no: 7 })];
    mount();
    await ready();
    expect(document.querySelectorAll('[data-honours-group="ace"] [data-honour-row]').length).toBe(1);
    expect(document.querySelectorAll('[data-honours-group="albatross"] [data-honour-row]').length).toBe(1);
    expect(document.querySelector('[data-honours-group="albatross"] [data-honour-mark]')?.textContent).toBe('1');
  });
  it('a row tap opens the round sheet', async () => {
    f.rows = [honour(4)];
    mount();
    await ready();
    fireEvent.click(document.querySelector('[data-honour-row]')!);
    expect(f.openByScore).toHaveBeenCalledWith('s4', null, 'u4');
    expect(holeOrdinal(1)).toBe('1st');
    expect(holeOrdinal(12)).toBe('12th');
    expect(holeOrdinal(22)).toBe('22nd');
  });
});
