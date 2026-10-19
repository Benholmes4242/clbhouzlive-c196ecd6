// BRIEF_TOUR_RANKINGS_OPEN_PLAYER — a linked id outside the loaded directory
// is fetched from sr_players and opened in the headshot sheet.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({
  from: vi.fn(),
  maybeSingle: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from } }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: f.toastError } }));
vi.mock('../components/content/TourDataSection', () => ({
  default: ({ onOpenPlayer }: { onOpenPlayer: (id: string, name: string) => void }) => (
    <button type="button" onClick={() => onOpenPlayer('linked-1', 'Linked Player')}>open-linked</button>
  ),
}));

import { TourSection } from './ContentPage';

const FETCHED = {
  id: 'linked-1',
  full_name: 'Linked Player',
  first_name: 'Linked',
  last_name: 'Player',
  country: 'ESP',
  country_code: 'ES',
  tour_codes: ['euro'],
  headshot_override: null,
  photo_url: null,
  updated_at: null,
};

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin-v2/content?section=tour']}>
        <TourSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  f.maybeSingle.mockResolvedValue({ data: FETCHED, error: null });
  f.from.mockImplementation(() => ({
    select: () => ({
      // useAdminPlayers directory read: empty, so linked-1 is not in the list.
      order: () => ({ range: async () => ({ data: [], error: null }) }),
      // Single-row fetch for the fallback.
      eq: () => ({ maybeSingle: f.maybeSingle }),
    }),
  }));
});

afterEach(cleanup);

describe('BRIEF_TOUR_RANKINGS_OPEN_PLAYER fallback fetch', () => {
  it('fetches a linked id missing from the players list and opens the sheet with that name', async () => {
    mount();
    fireEvent.click(await screen.findByText('open-linked'));
    expect(await screen.findByText('Linked Player')).toBeInTheDocument();
    expect(f.maybeSingle).toHaveBeenCalled();
    expect(f.toastError).not.toHaveBeenCalled();
  });

  it('toasts and does not open the sheet when the fetch fails', async () => {
    f.maybeSingle.mockResolvedValue({ data: null, error: new Error('nope') });
    mount();
    fireEvent.click(await screen.findByText('open-linked'));
    await screen.findByText('open-linked');
    await vi.waitFor(() => expect(f.toastError).toHaveBeenCalledWith('Could not open this player'));
    expect(screen.queryByText('Linked Player')).not.toBeInTheDocument();
  });
});
