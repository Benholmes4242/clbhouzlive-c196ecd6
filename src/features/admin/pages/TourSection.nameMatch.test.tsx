// BRIEF_TOUR_RANKINGS_NAME_MATCH - word-based directory search and tap fallback.
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
  return <output data-testid="location">{useLocation().search}</output>;
}

function mount(url = '/admin-v2/content?section=tour') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}>
    <TourSection /><Location />
  </MemoryRouter></QueryClientProvider>);
}

const player = (id: string, full_name: string, country = 'Spain') => ({
  id, full_name, first_name: null, last_name: null, country, country_code: 'ES',
  tour_codes: ['euro'], headshot_override: null, photo_url: null, updated_at: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  f.directory = [];
  f.from.mockImplementation((table: string) => {
    const range = async () => ({ data: table === 'sr_players' ? f.directory : [{
      id: 'r1', player_name: 'EUGENIO CHACARRA', position: 1, points: 100,
      tour_code: 'euro', player_id: null, manual_player_id: null,
    }], error: null });
    return { select: () => ({ order: () => ({ range }), eq: () => ({ order: () => ({ range }) }) }) };
  });
});
afterEach(cleanup);

describe('Directory word search', () => {
  it('"Eugenio Chacarra" finds Lopez-Chacarra and the DUP row', async () => {
    f.directory = [player('lc', 'Eugenio Lopez-Chacarra'), player('dup', 'Eugenio-DUP Chacarra-DUP'), player('x', 'Tom Kim', 'Korea')];
    mount('/admin-v2/content?section=tour&sub=players&q=Eugenio%20Chacarra');
    expect(await screen.findByText('Eugenio Lopez-Chacarra')).toBeInTheDocument();
    expect(screen.getByText('Eugenio-DUP Chacarra-DUP')).toBeInTheDocument();
    expect(screen.queryByText('Tom Kim')).not.toBeInTheDocument();
  });

  it('"Spain" still filters by country', async () => {
    f.directory = [player('lc', 'Eugenio Lopez-Chacarra'), player('x', 'Tom Kim', 'Korea')];
    mount('/admin-v2/content?section=tour&sub=players&q=Spain');
    expect(await screen.findByText('Eugenio Lopez-Chacarra')).toBeInTheDocument();
    expect(screen.queryByText('Tom Kim')).not.toBeInTheDocument();
  });
});

describe('Tap fallback word match', () => {
  it('opens the single non-DUP word match', async () => {
    f.directory = [player('lc', 'Eugenio Lopez-Chacarra'), player('dup', 'Eugenio-DUP Chacarra-DUP')];
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Eugenio Chacarra/ }));
    expect(await screen.findByText('Manage headshot')).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toContain('player=lc');
  });

  it('two non-DUP word matches open the prefilled directory', async () => {
    f.directory = [player('a', 'Eugenio Lopez-Chacarra'), player('b', 'Eugenio Chacarra Ruiz')];
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Eugenio Chacarra/ }));
    expect(await screen.findByPlaceholderText('Search by name or country…')).toHaveValue('EUGENIO CHACARRA');
    expect(new URLSearchParams(screen.getByTestId('location').textContent ?? '').has('player')).toBe(false);
  });
});
