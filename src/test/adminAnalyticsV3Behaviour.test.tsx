import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mapBehaviour, type AnalyticsBehaviour } from '@/features/admin/hooks/useAnalyticsLenses';

let data: AnalyticsBehaviour;
vi.mock('@/features/admin/hooks/useAnalyticsLenses', async (orig) => {
  const real = await orig<typeof import('@/features/admin/hooks/useAnalyticsLenses')>();
  return { ...real, useAnalyticsBehaviour: () => ({ data, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }) };
});

import BehaviourLens, { busiestLabel, ELSE_COLOUR, SHARE_COLOURS } from '@/features/admin/components/analytics/BehaviourLens';
import { CC3 } from '@/features/admin/components/InboxPanels';

const SRC = 'src/features/admin/components/analytics/BehaviourLens.tsx';

function fixture(): AnalyticsBehaviour {
  return mapBehaviour({
    days: 30,
    features: { avg_ret: 50, base_users: 137, rows: [
      { name: 'Tiny', users: 5, ret: 65 },
      { name: 'Rounds', users: 20, ret: 75 },
      { name: 'Settings', users: 24, ret: 35 },
    ] },
    rhythm: { grid: Array.from({ length: 7 }, () => Array.from({ length: 12 }, (_, i) => i)), busiest: { dow: 2, slot: 10 }, weekend_pct: 15 },
    after_round: { rounds: 60, opened_pct: 42, median_wait_secs: 120, first_screens: [{ label: 'Home feed', pct: 33 }, { label: 'Round', pct: 8 }] },
    time_share: [{ area: 'Feed', pct: 33 }, { area: 'Courses', pct: 27 }, { area: 'Profile', pct: 19 }, { area: 'Social', pct: 6 }, { area: 'Everything else', pct: 15 }],
  });
}

describe('ANALYTICS_V3_2_BEHAVIOUR', () => {
  beforeEach(() => { data = fixture(); });

  it('(a) a 5-user row shows small sample, is dimmed and faint-toned at 1.3×', () => {
    const { container } = render(<BehaviourLens />);
    const row = Array.from(container.querySelectorAll('[data-feature-row]')).find((r) => r.textContent?.includes('Tiny')) as HTMLElement;
    expect(row.textContent).toContain('small sample');
    expect(row.getAttribute('data-small')).toBe('true');
    expect(row.style.opacity).toBe('0.6');
    const lift = row.querySelector('[data-tone]')!;
    expect(lift.textContent).toBe('1.3×');
    expect(lift.getAttribute('data-tone')).toBe('faint');
  });

  it('(b) 1.5× with 20 users is good-toned, 0.7× bad-toned', () => {
    const { container } = render(<BehaviourLens />);
    const rows = Array.from(container.querySelectorAll('[data-feature-row]'));
    const tone = (name: string) => rows.find((r) => r.textContent?.includes(name))!.querySelector('[data-tone]')!;
    expect(tone('Rounds').textContent).toBe('1.5×');
    expect(tone('Rounds').getAttribute('data-tone')).toBe('good');
    expect(tone('Settings').textContent).toBe('0.7×');
    expect(tone('Settings').getAttribute('data-tone')).toBe('bad');
  });

  it('(c) busiest slot 10 Wednesday and slot 11 rollover', () => {
    render(<BehaviourLens />);
    expect(screen.getByText('Wed 20:00 to 22:00')).toBeTruthy();
    expect(busiestLabel({ dow: 2, slot: 11 })).toBe('Wed 22:00 to 00:00');
  });

  it('(d) weekend sub reads 29% if every day were equal', () => {
    render(<BehaviourLens />);
    expect(screen.getByText('29% if every day were equal')).toBeTruthy();
  });

  it('(e) Opened in 24h is not green and shows 25 of 60 rounds', () => {
    render(<BehaviourLens />);
    expect(screen.getByText('25 of 60 rounds')).toBeTruthy();
    const line = readFileSync(SRC, 'utf8').split('\n').find((l) => l.includes('label="Opened in 24h"'))!;
    expect(line).toContain('valueColor={CC3.ink}');
    expect(line).not.toMatch(/good|okText/);
  });

  it('(f) Everything else takes the track colour and no share colour is amber', () => {
    const { container } = render(<BehaviourLens />);
    const els = container.querySelector('[data-share="Everything else"]')!;
    expect(els.getAttribute('data-colour')).toBe(CC3.track);
    expect(ELSE_COLOUR).toBe(CC3.track);
    for (const c of SHARE_COLOURS) expect(c).not.toMatch(/255,\s*168,\s*58|brand/);
  });

  it('(g) source scan: no weight above 700, no size below 10, no amber, no okText', () => {
    const src = readFileSync(SRC, 'utf8');
    for (const m of src.matchAll(/fontWeight:\s*(\d+)/g)) expect(Number(m[1])).toBeLessThanOrEqual(700);
    for (const m of src.matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
    expect(src).not.toMatch(/t\.brand/);
    expect(src).not.toMatch(/t\.okText/);
    expect(src).not.toMatch(/rgba\(255,\s*168,\s*58/);
  });
});
