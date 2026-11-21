/**
 * CONTENT_V3_3_TOUR_DATA — admin Content Tour data tab in the v3 grammar.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const f = vi.hoisted(() => ({ feeds: vi.fn(), range: vi.fn() }));
vi.mock('@/features/admin/hooks/useContentDesk', () => ({ useFeedsHealth: f.feeds, isPermissionError: () => false }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ range: f.range }) }) }) }) },
}));

import TourDataSection from '@/features/admin/components/content/TourDataSection';
import { normaliseRankingName, rankingTourLabel } from '@/features/admin/lib/tourDataDisplay';

const ROWS = [
  { id: 'e1', player_name: 'Eugenio CHACARRA', position: 1, points: 100, tour_code: 'euro', player_id: 'p1', manual_player_id: null },
  { id: 'e2', player_name: 'Rory MCILROY', position: 2, points: 90, tour_code: 'euro', player_id: null, manual_player_id: null },
  { id: 'e3', player_name: 'Marco PENGE', position: 3, points: 80, tour_code: 'euro', player_id: null, manual_player_id: null },
  { id: 'l1', player_name: 'Nelly KORDA', position: 1, points: 70, tour_code: 'lpga', player_id: 'p9', manual_player_id: null },
  { id: 'v1', player_name: 'Jon RAHM', position: 1, points: 60, tour_code: 'liv', player_id: 'p8', manual_player_id: null },
];
const now = new Date().toISOString();

function feeds(over: any = {}) {
  return {
    data: {
      players: { last_sync: now, count: 3078, countries: 96 },
      rankings: { season: 2026, rows: 5, tours: 3, last_update: now, by_tour: [{ tour_code: 'liv', n: 1 }, { tour_code: 'euro', n: 3 }, { tour_code: 'lpga', n: 2 }] },
      round_results: {}, failures_24h: 0, ...over,
    },
    isError: false, error: null, refetch: vi.fn(),
  };
}

function mount(props: any = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TourDataSection syncing={false} syncLabel="" onRunSync={async () => {}} onAddPhoto={() => {}} onOpenDirectory={() => {}}
        onOpenPlayer={() => {}} noPhotoSet={3000} {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  f.feeds.mockReturnValue(feeds());
  f.range.mockResolvedValue({ data: ROWS, error: null });
});

describe('CONTENT_V3_3 Tour data tab', () => {
  it('fixes all-caps Mc surnames without a Mac rule', () => {
    expect(normaliseRankingName('Rory MCILROY')).toBe('Rory McIlroy');
    expect(normaliseRankingName('Graeme MCDOWELL')).toBe('Graeme McDowell');
    expect(normaliseRankingName('Robert MACINTYRE')).toBe('Robert Macintyre');
    expect(normaliseRankingName('MC')).toBe('Mc');
  });

  it('labels champ as Champions', () => {
    expect(rankingTourLabel('champ')).toBe('Champions');
  });

  it('sorts tour chips by count with no All chip, selecting the largest and showing only its rows', async () => {
    const { container } = mount();
    await screen.findByText('Eugenio Chacarra');
    const chips = within(container.querySelector('[data-section="tours"]') as HTMLElement).getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual(['DP World 3', 'LPGA 2', 'LIV 1']);
    expect(screen.queryByRole('button', { name: /^All/ })).toBeNull();
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByText('Nelly Korda')).toBeNull();
    expect(screen.queryByText('Jon Rahm')).toBeNull();
    expect(screen.getByText('DP World 2026')).toBeTruthy();
  });

  it('lists every row under Rankings {season} when by_tour is empty', async () => {
    f.feeds.mockReturnValue(feeds({ rankings: { season: 2026, rows: 5, by_tour: [] } }));
    mount();
    for (const name of ['Eugenio Chacarra', 'Nelly Korda', 'Jon Rahm']) expect(await screen.findByText(name)).toBeTruthy();
    expect(screen.getByText('Rankings 2026')).toBeTruthy();
  });

  it('counts not-linked rows across the whole selected tour and marks unlinked rows', async () => {
    mount();
    await screen.findByText('Rory McIlroy');
    expect(screen.getByText('2 not linked')).toBeTruthy();
    expect(screen.getAllByText('not linked to the directory')).toHaveLength(2);
  });

  it('marks a stale feed row and the headline bad', async () => {
    f.feeds.mockReturnValue(feeds({ players: { last_sync: null, count: 3078, countries: 96 } }));
    const { container } = mount();
    const dot = container.querySelector('[data-feed="players"] [data-tone]');
    expect(dot?.getAttribute('data-tone')).toBe('bad');
    expect(screen.getByText('1 needs a run').getAttribute('data-tone')).toBe('bad');
  });

  it('shows Own photo from ownPhoto and no No photo set figure', () => {
    const { container } = mount({ ownPhoto: 2 });
    expect(screen.getByText('Own photo')).toBeTruthy();
    expect(container.querySelector('[data-figure="own-photo"]')?.textContent).toBe('2');
    expect(screen.queryByText('No photo set')).toBeNull();
  });

  it('source has no heavy weights, tiny sizes, amber or ellipsis', () => {
    const src = readFileSync(resolve(__dirname, '../features/admin/components/content/TourDataSection.tsx'), 'utf8');
    for (const m of src.matchAll(/fontWeight:\s*(\d+)/g)) expect(Number(m[1])).toBeLessThanOrEqual(700);
    for (const m of src.matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
    for (const bad of ['warnText', 't.warn', 'brandText', 't.brand', 'warnOutline', 'ellipsis']) expect(src).not.toContain(bad);
  });
});
