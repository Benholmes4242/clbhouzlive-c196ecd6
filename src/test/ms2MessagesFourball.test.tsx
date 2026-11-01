/**
 * MS2 — Messages: the true round count and the last four-ball card.
 * Mock: ms2-fourball.html (signed off). Structure asserted, never words
 * beyond the brief's own copy; the react-i18next mock returns defaultValue.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rpcMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/hooks/messaging/useMessagingActor', () => ({
  useMessagingActor: () => ({ actorType: 'personal', actorId: 'me' }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'me' } }),
}));
vi.mock('@/hooks/messaging/usePlayedWith', () => ({
  usePlayedWith: () => ({ members: [], isLoading: false }),
}));
vi.mock('@/features/search-v2/hooks/useEntityPickerSearch', () => ({
  useEntityPickerSearch: () => ({ people: [], businesses: [], isLoading: false }),
}));

/* Keep the real useSharedGroundOne/dedupe re-export; stub only the batch hook
   the sheet uses for played-with context lines. */
vi.mock('@/hooks/messaging/useSharedGround', async (importActual) => {
  const actual = await importActual<typeof import('@/hooks/messaging/useSharedGround')>();
  return { ...actual, useSharedGroundBatch: () => ({ byUserId: {}, isLoading: false }) };
});

/* MS2 §2 — the four-ball read, configurable per test. */
let fourballState: {
  data: unknown[] | undefined;
  isLoading: boolean;
  isError: boolean;
} = { data: undefined, isLoading: true, isError: false };
vi.mock('@/hooks/messaging/useLastFourball', () => ({
  useLastFourball: () => fourballState,
}));

import { fetchSharedRounds, dedupeSharedRounds } from '@/lib/whs/api';
import { useSharedGroundOne } from '@/hooks/messaging/useSharedGround';
import NewConversationSheet from '@/pages/messaging-v2/NewConversationSheet';

const ROW = {
  play_date: '2026-10-11',
  course_id: 'c1',
  course_name: 'Sundridge Park Golf Club (West)',
  user_stableford: 36,
  rival_stableford: 34,
  user_gross: 88,
  rival_gross: 90,
  stableford_outcome: 'W',
  gross_outcome: 'W',
};

function rpcForSharedRounds(rows: unknown[]) {
  rpcMock.mockImplementation((fn: string) => {
    if (fn === 'detect_shared_rounds') return Promise.resolve({ data: rows, error: null });
    return Promise.resolve({ data: null, error: null });
  });
}

const FOURBALL = [
  { user_id: 'u-simon', display_name: 'Simon Savage', username: 'simon', profile_photo_url: null, course_name: 'Sundridge Park Golf Club (West)', play_date: '2026-10-11' },
  { user_id: 'u-chris', display_name: 'Chris Leeson', username: 'chris', profile_photo_url: null, course_name: 'Sundridge Park Golf Club (West)', play_date: '2026-10-11' },
  { user_id: 'u-matt', display_name: 'Matt Green', username: 'matt', profile_photo_url: null, course_name: 'Sundridge Park Golf Club (West)', play_date: '2026-10-11' },
];

function renderSheet() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewConversationSheet open onClose={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  rpcMock.mockReset();
  rpcMock.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  fourballState = { data: undefined, isLoading: true, isError: false };
});

afterEach(() => cleanup());

describe('fetchSharedRounds — MS2 §1 one count everywhere', () => {
  it('counts four duplicate rows for one day and course once', async () => {
    rpcForSharedRounds([ROW, { ...ROW }, { ...ROW }, { ...ROW }]);
    const res = await fetchSharedRounds('me', 'thomas');
    expect(res.shared_rounds_count).toBe(1);
    expect(res.shared_round_results).toHaveLength(1);
  });

  it('tallies the records from the deduped rows', async () => {
    rpcForSharedRounds([ROW, { ...ROW }, { ...ROW }, { ...ROW }]);
    const res = await fetchSharedRounds('me', 'thomas');
    expect(res.stableford_record).toEqual({ wins: 1, losses: 0, ties: 0 });
    expect(res.gross_record).toEqual({ wins: 1, losses: 0, ties: 0 });
  });

  it('dedupes the 90-day figure too', async () => {
    const old = { ...ROW, play_date: '2020-01-01', course_id: 'c2', stableford_outcome: 'L', gross_outcome: 'L' };
    rpcForSharedRounds([ROW, { ...ROW }, old, { ...old }]);
    const res = await fetchSharedRounds('me', 'thomas');
    expect(res.shared_rounds_count).toBe(2);
    expect(res.shared_rounds_last_90d).toBe(1);
  });

  it('useSharedGround count always equals its deduped rounds', async () => {
    rpcForSharedRounds([ROW, { ...ROW }, { ...ROW }, { ...ROW }]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let seen: { count: number; rounds: number } | null = null;
    const Probe: React.FC = () => {
      const { ground } = useSharedGroundOne('me', 'thomas');
      seen = { count: ground.count, rounds: ground.rounds.length };
      return null;
    };
    render(
      <QueryClientProvider client={qc}>
        <Probe />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(seen?.rounds).toBe(1));
    expect(seen?.count).toBe(1);
    expect(seen?.count).toBe(seen?.rounds);
  });

  it('re-exports dedupeSharedRounds from useSharedGround', async () => {
    const mod = await import('@/hooks/messaging/useSharedGround');
    expect(mod.dedupeSharedRounds).toBe(dedupeSharedRounds);
  });
});

describe('four-ball card — MS2 §2', () => {
  it('shows the four-ball title for three people', () => {
    fourballState = { data: FOURBALL, isLoading: false, isError: false };
    renderSheet();
    expect(screen.getByTestId('fourball-card')).toBeTruthy();
    expect(screen.getByText('Your last four-ball')).toBeTruthy();
  });

  it('shows the three-ball title for two people', () => {
    fourballState = { data: FOURBALL.slice(0, 2), isLoading: false, isError: false };
    renderSheet();
    expect(screen.getByText('Your last three-ball')).toBeTruthy();
  });

  it('joins first names with the short course name and date', () => {
    fourballState = { data: FOURBALL, isLoading: false, isError: false };
    renderSheet();
    const card = screen.getByTestId('fourball-card');
    const line = card.textContent ?? '';
    expect(line).toContain('Simon, Chris and Matt');
    expect(line).toContain('Sundridge Park · West');
    expect(line).toContain('11');
    expect(line).toContain('Oct');
  });

  it('shows nothing for zero people', () => {
    fourballState = { data: [], isLoading: false, isError: false };
    renderSheet();
    expect(screen.queryByTestId('fourball-card')).toBeNull();
  });

  it('shows nothing for one person', () => {
    fourballState = { data: FOURBALL.slice(0, 1), isLoading: false, isError: false };
    renderSheet();
    expect(screen.queryByTestId('fourball-card')).toBeNull();
  });

  it('shows nothing while loading', () => {
    fourballState = { data: undefined, isLoading: true, isError: false };
    renderSheet();
    expect(screen.queryByTestId('fourball-card')).toBeNull();
  });

  it('shows nothing on error', () => {
    fourballState = { data: undefined, isLoading: false, isError: true };
    renderSheet();
    expect(screen.queryByTestId('fourball-card')).toBeNull();
  });

  it('hides while the search field has text', () => {
    fourballState = { data: FOURBALL, isLoading: false, isError: false };
    renderSheet();
    expect(screen.getByTestId('fourball-card')).toBeTruthy();
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'th' },
    });
    expect(screen.queryByTestId('fourball-card')).toBeNull();
  });

  it('Start a group runs the existing group path with exactly those members', async () => {
    fourballState = { data: FOURBALL, isLoading: false, isError: false };
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'msg_create_group') return Promise.resolve({ data: 'conv-new', error: null });
      return Promise.resolve({ data: null, error: null });
    });
    renderSheet();
    fireEvent.click(screen.getByText('Start a group'));
    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith(
        'msg_create_group',
        expect.objectContaining({
          p_as_actor_type: 'personal',
          p_as_actor_id: 'me',
          p_members: [
            { actor_type: 'personal', actor_id: 'u-simon' },
            { actor_type: 'personal', actor_id: 'u-chris' },
            { actor_type: 'personal', actor_id: 'u-matt' },
          ],
        }),
      ),
    );
  });
});
