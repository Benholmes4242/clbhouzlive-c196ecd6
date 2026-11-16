// @vitest-environment jsdom
/** BRIEF_ONE_INDEX_CHART: one window, one tone, one chart; the cut line is white. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { indexWindow, indexToneOf, DAY_MS } from '@/lib/whs/indexWindow';
import { IndexWindowChart, indexLine } from '@/components/handicap/IndexWindowChart';
import LastTwentyBars from '@/components/profile/handicap/whs/charts/LastTwentyBars';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

const NOW = Date.parse('2026-11-16T00:00:00Z');
const ago = (d: number) => new Date(NOW - d * DAY_MS).toISOString();
const toPoints = (w: ReturnType<typeof indexWindow>) => w.pts.map((p) => ({ value: p.v, observed_at: new Date(p.ts).toISOString() }));

describe('indexWindow', () => {
  it('adds a lead edge at the window start with the index in force, and a trail edge at today', () => {
    const w = indexWindow([{ observed_at: ago(200), handicap_index: 14 }, { observed_at: ago(40), handicap_index: 12 }], 90, NOW);
    expect(w.pts).toEqual([{ ts: NOW - 90 * DAY_MS, v: 14, edge: 'lead' }, { ts: NOW - 40 * DAY_MS, v: 12 }, { ts: NOW, v: 12, edge: 'trail' }]);
    expect(w.net).toBe(-2);
  });
  it.each([[-0.1, INDEX_DELTA.dark.improved, 'down'], [0, '#F8FAFC', 'flat'], [0.1, INDEX_DELTA.dark.drifted, 'up']] as const)('net %s tones %s', (net, tone, dir) => {
    const w = indexWindow([{ observed_at: ago(120), handicap_index: 10 }, { observed_at: ago(10), handicap_index: 10 + net }], 90, NOW);
    expect(w.tone).toBe(tone);
    expect(w.direction).toBe(dir);
    expect(indexToneOf(net)).toBe(tone);
  });
});

describe('IndexWindowChart', () => {
  const w = indexWindow([{ observed_at: ago(120), handicap_index: 1.9 }, { observed_at: ago(30), handicap_index: 1.2 }, { observed_at: ago(4), handicap_index: 1.9 }], 90, NOW);
  const rounds = [{ id: 'a', date: ago(20), counts: false, days: 20 }, { id: 'b', date: ago(12), counts: true, days: 12 }, { id: 'c', date: ago(4), counts: false, days: 4 }];
  it('places each round dot by date and greens only counting rounds; low label and axis', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const { container } = render(<IndexWindowChart points={toPoints(w)} windowDays={90} rounds={rounds} />);
    const line = indexLine(toPoints(w), NOW)!;
    for (const r of rounds) {
      const dot = container.querySelector<HTMLElement>(`[data-form-round-dot="${r.id}"]`)!;
      expect(parseFloat(dot.style.left)).toBeCloseTo(line.at(r.date)!.x / 361 * 100);
      expect(parseFloat(dot.style.left)).toBeCloseTo((90 - r.days) / 90 * 100);
      expect(dot.getAttribute('data-counts')).toBe(r.counts ? 'true' : 'false');
    }
    expect(container.querySelectorAll('[data-counts="true"]')).toHaveLength(1);
    expect(container.querySelector('[data-index-low-label]')?.textContent).toBe('Low 1.2');
    expect(container.querySelector('[data-index-axis]')?.textContent).toBe('90 days ago' + 'Today');
    vi.restoreAllMocks();
  });
});

describe('profile 90 DAYS figure', () => {
  it('reads the window net (no 0.2 floor), the same net that tones the line', () => {
    const src = readFileSync('src/components/profile/hero/ProfileHero.tsx', 'utf8');
    expect(src).not.toMatch(/SHORT_FLOOR/);
    expect(src).toMatch(/const shortDelta = win90\.pts\.length >= 2 \? Math\.round\(win90\.net \* 10\) \/ 10 : null/);
    expect(src).toMatch(/const shortDirection = win90\.direction/);
    const w = indexWindow([{ observed_at: ago(120), handicap_index: 10 }, { observed_at: ago(10), handicap_index: 9.9 }], 90, NOW);
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const { container } = render(<IndexWindowChart points={toPoints(w)} windowDays={90} />);
    expect(w.direction).toBe('down');
    expect(container.querySelector('[data-index-line]')?.getAttribute('data-index-line')).toBe(w.tone);
    vi.restoreAllMocks();
  });
});

describe('Eight of your last twenty cut line', () => {
  it('is white, not amber', () => {
    const { container } = render(<LastTwentyBars rounds={[{ diff: 10, counts: true }, { diff: 14, counts: false }]} cut={{ value: 10 }} selectedIndex={null} onSelectIndex={() => {}} />);
    const cut = [...container.querySelectorAll<HTMLElement>('div[aria-hidden]')].find((d) => d.style.height === '1px')!;
    expect(cut.style.background).toBe('rgba(248, 250, 252, 0.9)');
    expect(cut.style.background).not.toMatch(/247, 147, 30/);
  });
});
