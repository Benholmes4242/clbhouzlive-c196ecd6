// BRIEF_TOUR_RANKINGS_OPEN_PLAYER — linked ranking rows open the headshot sheet.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({
  feeds: vi.fn(),
  range: vi.fn(),
}));

vi.mock('../../hooks/useContentDesk', () => ({
  useFeedsHealth: f.feeds,
  isPermissionError: () => false,
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ range: f.range }),
        }),
      }),
    }),
  },
}));

import TourDataSection from './TourDataSection';

const ROWS = [
  { id: 'r1', player_name: 'Eugenio CHACARRA', position: 1, points: 100, tour_code: 'euro', player_id: 'p1', manual_player_id: 'm1' },
  { id: 'r2', player_name: 'Rory MCILROY', position: 2, points: 90, tour_code: 'pga', player_id: 'p2', manual_player_id: null },
  { id: 'r3', player_name: 'Ghost PLAYER', position: 3, points: 80, tour_code: 'pga', player_id: null, manual_player_id: null },
];

function mount(onOpenPlayer = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TourDataSection
        syncing={false}
        syncLabel=""
        onRunSync={async () => {}}
        onAddPhoto={() => {}}
        onOpenDirectory={() => {}}
        onOpenPlayer={onOpenPlayer}
        noPhotoSet={0}
      />
    </QueryClientProvider>,
  );
  return onOpenPlayer;
}

beforeEach(() => {
  vi.clearAllMocks();
  f.feeds.mockReturnValue({
    data: { players: {}, rankings: { season: 2026, rows: 3, by_tour: [] }, failures_24h: 0 },
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
  f.range.mockResolvedValue({ data: ROWS, error: null });
});

afterEach(cleanup);

describe('BRIEF_TOUR_RANKINGS_OPEN_PLAYER rows', () => {
  it('a linked row is a button and opens the manual player id when set', async () => {
    const onOpenPlayer = mount();
    const btn = await screen.findByRole('button', { name: /Eugenio Chacarra/ });
    fireEvent.click(btn);
    expect(onOpenPlayer).toHaveBeenCalledWith('m1', 'Eugenio Chacarra');
  });

  it('falls back to player_id when there is no manual override', async () => {
    const onOpenPlayer = mount();
    const btn = await screen.findByRole('button', { name: /Rory Mcilroy/ });
    fireEvent.click(btn);
    expect(onOpenPlayer).toHaveBeenCalledWith('p2', 'Rory Mcilroy');
  });

  it('an unlinked row is not a button', async () => {
    mount();
    const name = await screen.findByText('Ghost Player');
    expect(name.closest('button')).toBeNull();
  });
});
