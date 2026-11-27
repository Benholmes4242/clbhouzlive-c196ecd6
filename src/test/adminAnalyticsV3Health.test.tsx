import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mapHealth, type AnalyticsHealth } from '@/features/admin/hooks/useAnalyticsLenses';

let data: AnalyticsHealth;
vi.mock('@/features/admin/hooks/useAnalyticsLenses', async (orig) => {
  const real = await orig<typeof import('@/features/admin/hooks/useAnalyticsLenses')>();
  return { ...real, useAnalyticsHealth: () => ({ data, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }) };
});

import HealthLens from '@/features/admin/components/analytics/HealthLens';

function fixture(over: { notConnected?: number; joined?: number; prior?: number } = {}): AnalyticsHealth {
  return mapHealth({
    days: 30,
    weekly_golfers: { weeks: [12, 10, 10, 8, 6, 13, 8, 11, 12, 10, 16, 14].map((n, i) => ({ week: `2026-0${(i % 9) + 1}-01`, n })), this_week: 14, last_week: 16, last_week_to_date: 16 },
    activity: { dau_avg: 9, dau_peak: 17, dau_avg_30: 9, wau: 34, mau: 68, members: 139, members_ex_staff: 137 },
    handicap: { connected_n: 33, not_connected_n: 104, connected_back_pct: 76, not_connected_back_pct: over.notConnected ?? 40, median_days_to_connect: 0 },
    cohorts: [
      { month: 'Jul', month_start: '2026-07-01', n: 41, cells: [100, 49, 44, 39, 27, null] },
      { month: 'Sep', month_start: '2026-09-01', n: 6, cells: [100, 33, 33, null, null, null] },
    ],
    growth: { joined: over.joined ?? 28, joined_prior: over.prior ?? 10, members: 139, connected_new: 7, daily: [{ d: '2026-10-24', n: 1 }, { d: '2026-11-22', n: 0 }] },
  });
}

function mount(onRange = vi.fn()) {
  return render(<MemoryRouter><HealthLens range="30d" onRange={onRange} /></MemoryRouter>);
}

describe('ANALYTICS_V3_1_HEALTH', () => {
  beforeEach(() => { data = fixture(); });

  it('(a) weekly delta reads −2 vs last week so far, mute-toned', () => {
    const { container } = mount();
    const el = container.querySelector('[data-weekly-delta]')!;
    expect(el.textContent).toBe('\u22122 vs last week so far');
    expect(el.getAttribute('data-weekly-delta')).toBe('mu');
  });

  it('(b) range control sits after Weekly golfers and before Active members and calls onRange', () => {
    const onRange = vi.fn();
    const { container } = mount(onRange);
    const text = container.textContent!;
    const wg = text.indexOf('Weekly golfers'), rr = text.indexOf('Range for activity and growth'), am = text.indexOf('Active members');
    expect(wg).toBeGreaterThanOrEqual(0);
    expect(rr).toBeGreaterThan(wg);
    expect(am).toBeGreaterThan(rr);
    const row = container.querySelector('[data-range-row]') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: '7d' }));
    expect(onRange).toHaveBeenCalledWith('7d');
    expect(within(row).getByRole('button', { name: '30d' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('(c) lift line reads 1.9× for 76 and 40, absent when not connected is 0', () => {
    const { container, unmount } = mount();
    expect(container.querySelector('[data-lift]')!.textContent).toMatch(/^1\.9×/);
    unmount();
    data = fixture({ notConnected: 0 });
    const again = mount();
    expect(again.container.querySelector('[data-lift]')).toBeNull();
  });

  it('(d) cohort grid has M1–M5, no M0, empty cells carry no number, n 6 row dimmed', () => {
    const { container } = mount();
    const head = container.querySelector('[data-cohort-head]')!;
    const labels = Array.from(head.children).map((c) => c.textContent).filter((s) => /^M\d$/.test(s ?? ''));
    expect(labels).toEqual(['M1', 'M2', 'M3', 'M4', 'M5']);
    expect(container.textContent).not.toContain('M0');
    const rows = container.querySelectorAll('[data-cohort-row]');
    expect(rows[0].querySelectorAll('[data-cohort-cell]').length).toBe(5);
    const empty = container.querySelectorAll('[data-cohort-cell="empty"]');
    expect(empty.length).toBeGreaterThan(0);
    empty.forEach((e) => expect(e.textContent).toBe(''));
    expect(rows[1].getAttribute('data-dim')).toBe('true');
    expect(rows[0].getAttribute('data-dim')).toBeNull();
    (rows[1].querySelectorAll('[data-cohort-cell="value"]') as NodeListOf<HTMLElement>).forEach((c) => expect(c.style.opacity).toBe('0.55'));
  });

  it('(e) Growth reads +18 for 28 vs 10 and ↗ 40% for 28 vs 20', () => {
    const { container, unmount } = mount();
    expect(container.querySelector('[data-growth-delta]')!.textContent).toBe('+18');
    unmount();
    data = fixture({ prior: 20 });
    const again = mount();
    expect(again.container.querySelector('[data-growth-delta]')!.textContent).toBe('\u2197 40%');
  });

  it('(f) source scan: no weight above 700, no size below 10, no amber', () => {
    for (const f of ['src/features/admin/components/analytics/HealthLens.tsx', 'src/features/admin/components/analytics/analyticsUi.tsx']) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/fontWeight:\s*(\d+)/g)) expect(Number(m[1])).toBeLessThanOrEqual(700);
      for (const m of src.matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
      expect(src).not.toMatch(/t\.brand/);
      expect(src).not.toMatch(/LIT\.amber/);
      expect(src).not.toMatch(/rgba\(255,\s*168,\s*58/);
    }
  });
});
