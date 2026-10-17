import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { NobodyHasPlayed } from '@/components/profile/handicap/whs/sections/course-legends/flat/NobodyHasPlayed';
import { PostedChampions, postedStates, selectedDefence } from '@/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions';
import { CHAMPIONS_ORDER_ALL_TIME, CHAMPIONS_ORDER_90D, withAvailableSources } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';
import type { LegendCategory } from '@/lib/gam/types';
import type { FlatRow } from '@/components/profile/handicap/whs/sections/course-legends/flat/championsFlatBits';

afterEach(cleanup);
const tiles = () => screen.getAllByRole('listitem').filter(item => item.hasAttribute('data-state'));
const row = (over: Partial<FlatRow>): FlatRow => ({ rank: 1, name: 'Lennon Hill', photoUrl: null, value: 70, valueDisplay: '70', attained_at: '2026-06-01', isSelf: false, userId: 'other', ...over });

describe('CHAMPIONS_NET_SOURCE_1', () => {
  it('RA7a: a failed source is absent from the cabinet and the headline count, which agree', () => {
    const categories = withAvailableSources(CHAMPIONS_ORDER_ALL_TIME, new Set<LegendCategory>(['lowest_net_all_time']));
    render(<NobodyHasPlayed categories={categories} courseName="Sundridge" showConnect={false} onConnect={vi.fn()} />);
    expect(tiles()).toHaveLength(8);
    expect(document.querySelector('[data-category="lowest_net_all_time"]')).toBeNull();
    expect(document.body.textContent).toMatch(/eight/i);
    expect(document.body.textContent).not.toMatch(/nine/i);
  });

  it('RA7b: a source that answered with zero rows is drawn dashed (never claimed) and counted', () => {
    const categories = withAvailableSources(CHAMPIONS_ORDER_ALL_TIME, new Set());
    render(<NobodyHasPlayed categories={categories} courseName="Sundridge" showConnect={false} onConnect={vi.fn()} />);
    expect(tiles()).toHaveLength(9);
    expect(document.querySelector('[data-category="lowest_net_all_time"]')?.getAttribute('data-state')).toBe('never-claimed');
    expect(document.body.textContent).toMatch(/nine/i);
  });

  it('RA4: the 90-day window has no net candidate, so it is eight either way', () => {
    expect(withAvailableSources(CHAMPIONS_ORDER_90D, new Set<LegendCategory>(['lowest_net_all_time']))).toHaveLength(8);
    expect(withAvailableSources(CHAMPIONS_ORDER_90D, new Set())).toHaveLength(8);
  });
});

describe('CHAMPIONS_STATE_4', () => {
  const grouped = () => {
    const m = new Map<LegendCategory, { rows: FlatRow[]; total: number }>();
    m.set('lowest_gross_all_time', { rows: [row({ rank: 1, value: 70 }), row({ rank: 2, value: 70, isSelf: true, userId: 'me', name: 'Me' })], total: 2 });
    m.set('most_birdies_all_time', { rows: [row({ rank: 1, value: 12, isSelf: true, userId: 'me', name: 'Me' }), row({ rank: 2, value: 9, userId: 'r', name: 'Rival Ross' })], total: 2 });
    m.set('most_birdies_90d', { rows: [row({ rank: 1, value: 6, userId: 'r', name: 'Rival Ross' }), row({ rank: 2, value: 3, isSelf: true, userId: 'me' })], total: 2 });
    m.set('most_eagles_all_time', { rows: [row({ rank: 1, value: 3 }), row({ rank: 2, value: 2, isSelf: true, userId: 'me' })], total: 2 });
    m.set('most_rounds_all_time', { rows: [row({ rank: 1, value: 9 })], total: 1 });
    return m;
  };

  it('PB: owned is Yours; a score-board tie reaches; a counting gap of exactly one reaches; nothing is Not started', () => {
    const states = postedStates(CHAMPIONS_ORDER_ALL_TIME, grouped());
    expect(states.get('most_birdies_all_time')?.state).toBe('yours');
    expect(states.get('lowest_gross_all_time')?.state).toBe('in-reach');
    expect(states.get('most_eagles_all_time')?.state).toBe('in-reach');
    expect(states.get('most_rounds_all_time')?.state).toBe('held');
    expect([...states.values()].some(s => s.state === 'not-started')).toBe(false);
  });

  it('PD: defence on an owned cumulative board uses 90-day values and only dates a closing rival', () => {
    const now = new Date('2026-10-17T12:00:00Z');
    const result = selectedDefence('most_birdies_all_time', grouped(), now);
    expect(result?.rival?.name).toBe('Rival Ross');
    expect(result?.defence?.margin).toBe(3);
    expect(result?.defence?.trend).toBe('closing');
    expect(result?.defence?.gain90).toBe(3);
    expect(selectedDefence('lowest_gross_all_time', grouped(), now)).toBeNull();
  });

  it('PD2: Your defence replaces What it takes only when the selected board is owned', () => {
    const base = { categories: CHAMPIONS_ORDER_ALL_TIME.map(key => ({ key, label: key, short: key })), grouped: grouped(), courseName: 'X', onSelect: vi.fn(), legendWindow: 'all_time' as const, onWindowChange: vi.fn(), onOpenFull: vi.fn(), par: 71, fieldOverPar: null, rounds: 40 };
    const { rerender } = render(<PostedChampions {...base} activeKey="most_birdies_all_time" />);
    expect(document.querySelector('[data-section="your-defence"]')).not.toBeNull();
    expect(document.querySelector('[data-section="what-it-takes"]')).toBeNull();
    rerender(<PostedChampions {...base} activeKey="lowest_gross_all_time" />);
    expect(document.querySelector('[data-section="your-defence"]')).toBeNull();
    expect(document.querySelector('[data-section="what-it-takes"]')).not.toBeNull();
    expect(document.querySelector('[data-ghost-row]')).toBeNull();
  });
});
