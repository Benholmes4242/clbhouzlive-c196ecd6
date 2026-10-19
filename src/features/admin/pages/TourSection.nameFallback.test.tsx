// Rankings name fallback exercises the real rows, directory and PhotoSheet.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({ from: vi.fn(), directory: [] as Record<string, unknown>[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from } }));
vi.mock('../hooks/useContentDesk', () => ({
  useFeedsHealth: () => ({ data: { players: {}, rankings: { season: 2026, rows: 1, by_tour: [] }, failures_24h: 0 }, isError: false }),
  isPermissionError: () => false,
}));

import { TourSection } from './ContentPage';

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin-v2/content?section=tour']}>
    <TourSection /><Location />
  </MemoryRouter></QueryClientProvider>);
}

const player = (id: string, full_name: string | null = 'Eugenio Chacarra') => ({
  id, full_name, first_name: 'Eugenio', last_name: 'Chacarra', country: 'ESP', country_code: 'ES',
  tour_codes: ['euro'], headshot_override: null, photo_url: null, updated_at: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  f.directory = [];
  f.from.mockImplementation((table: string) => {
    const range = async () => ({ data: table === 'sr_players' ? f.directory : [{
      id: 'r1', player_name: 'Eugenio CHACARRA', position: 1, points: 100,
      tour_code: 'euro', player_id: null, manual_player_id: null,
    }], error: null });
    return { select: () => ({ order: () => ({ range }), eq: () => ({ order: () => ({ range }) }) }) };
  });
});
afterEach(cleanup);

async function tapRanking() {
  fireEvent.click(await screen.findByRole('button', { name: /Eugenio Chacarra/ }));
}

describe('Rankings unlinked name fallback', () => {
  it('a unique normalised full name opens that player PhotoSheet', async () => {
    f.directory = [player('unique', '  Eugenio  CHACARRA ')];
    mount();
    await tapRanking();
    expect(await screen.findByText('Manage headshot')).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toContain('player=unique');
  });

  it('uses first and last name when full_name is absent', async () => {
    f.directory = [player('parts', null)];
    mount();
    await tapRanking();
    expect(await screen.findByText('Manage headshot')).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toContain('player=parts');
  });

  it('two same-name players open the directory with q prefilled and clear q on leaving', async () => {
    f.directory = [player('one'), player('two')];
    mount();
    await tapRanking();
    expect(await screen.findByPlaceholderText('Search by name or country…')).toHaveValue('Eugenio Chacarra');
    const params = new URLSearchParams(screen.getByTestId('location').textContent ?? '');
    expect(params.get('sub')).toBe('players');
    expect(params.get('q')).toBe('Eugenio Chacarra');
    expect(params.has('player')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Tour data/ }));
    expect(new URLSearchParams(screen.getByTestId('location').textContent ?? '').has('q')).toBe(false);
  });

  it('no name match opens the prefilled directory without a player sheet', async () => {
    mount();
    await tapRanking();
    expect(await screen.findByPlaceholderText('Search by name or country…')).toHaveValue('Eugenio Chacarra');
    expect(screen.queryByText('Manage headshot')).not.toBeInTheDocument();
  });
});