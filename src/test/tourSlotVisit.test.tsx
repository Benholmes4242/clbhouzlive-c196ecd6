/** Rotation owner: the visit cursor. These cases drive the real KeepAlive
 * provider, so an isActive flip is a real return to the page, and the real
 * data hook over a pre-filled cache, so selection follows the cursor without
 * any network read. */
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeepAliveOutlet } from '@/components/keep-alive/KeepAliveOutlet';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { CURSOR_KEY, type SlotPick, type SlotTournament } from '@/features/clubhouse-tour/tourSlotRules';
import { useTourSlotData, useTourSlotVisit, type SlotPayload, type TourSlotVisit } from '@/features/clubhouse-tour/useTourSlotData';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ select: () => ({ in: () => ({ order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }) }) }) }),
  rpc: () => Promise.resolve({ data: null, error: null }),
} }));

function event(id: string, tour: string, overrides: Partial<SlotTournament> = {}): SlotTournament {
  return { id, name: `${tour} Event`, status: 'scheduled', event_type: 'stroke', start_date: '2026-11-12', end_date: '2026-11-15', purse: 10000000, winning_share: null, currency: 'USD', venue_id: null, venue_name: 'Barton Creek', venue_course_name: null, venue_city: 'Austin', venue_state: null, venue_country: 'USA', venue_par: 72, venue_yardage: 7706, winner_id: null, defending_champion: null, champion_narrative: null, season_id: 'season', current_round: 2, current_round_status: null, season: { id: 'season', tour_id: 'tour', tour_name: tour, year: 2026 }, locksAt: '2099-01-01T00:00:00Z', ...overrides };
}
const row = (position: number, name: string, score: number): BoardEntry => ({ id: name, position, position_tied: false, score, thru: 18, player: { id: name, full_name: name } });
const picks: SlotPick[] = [{ rank: 1, playerId: 'a', playerName: 'A Player' }, { rank: 2, playerId: 'b', playerName: 'B Player' }, { rank: 3, playerId: 'c', playerName: 'C Player' }];
const board = [row(1, 'a', -10), row(2, 'b', -9), row(3, 'c', -8)];
/** Two eligible tournaments: PGA stays Preview (lock is in 2099), LPGA is Live
 * with three positioned rows. Ordered list is therefore [pga, lpga]. */
const payload: SlotPayload = {
  tournaments: [event('pga-event', 'pga'), event('lpga-event', 'lpga', { status: 'inprogress', locksAt: null })],
  predictions: new Map([['pga-event', picks], ['lpga-event', picks]]),
  boards: new Map([['pga-event', board], ['lpga-event', board]]),
};

/** Only getClientRects/getBoundingClientRect are read by the fold guard, so a
 * plain object stands in for the rendered slot at a chosen viewport offset. */
const slotEl = (top: number) => ({ getClientRects: () => [{ top }], getBoundingClientRect: () => ({ top }) }) as unknown as HTMLElement;

function Consumer({ onVisit }: { onVisit: (visit: TourSlotVisit) => void }) {
  const visit = useTourSlotVisit();
  const { selection } = useTourSlotData(visit, null);
  useEffect(() => { onVisit(visit); }, [visit, onVisit]);
  return <output data-testid="state">{selection ? `${selection.tour}:${selection.state}` : 'none'}</output>;
}
function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return <>
    <button onClick={() => navigate('/away')}>away</button>
    <button onClick={() => navigate('/')}>home</button>
    <output data-testid="path">{pathname}</output>
  </>;
}
const tree = (onVisit: (visit: TourSlotVisit) => void, client: QueryClient) => (
  <QueryClientProvider client={client}>
    <MemoryRouter initialEntries={['/']}>
      <KeepAliveOutlet keepAliveRoutes={[{ path: '/', element: <Consumer onVisit={onVisit} /> }]} maxCached={2} />
      <Nav />
    </MemoryRouter>
  </QueryClientProvider>
);

async function mounted() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['clubhouse-tour-slot', 'data'], payload);
  let visit!: TourSlotVisit;
  const utils = render(tree(v => { visit = v; }, client));
  await waitFor(() => expect(visit.ready).toBe(true));
  await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('pga:preview'));
  return { visit, client, ...utils };
}

beforeEach(() => { localStorage.clear(); });

describe('Tour slot rotation', () => {
  it('advances on reactivation when the slot is below the viewport', async () => {
    const { visit } = await mounted();
    expect(localStorage.getItem(CURSOR_KEY)).toBe('1');
    visit.el = slotEl(window.innerHeight + 200);
    fireEvent.click(screen.getByText('away'));
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/away'));
    fireEvent.click(screen.getByText('home'));
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('lpga:live'));
    expect(localStorage.getItem(CURSOR_KEY)).toBe('2');
    expect(visit.cursor).toBe(1);
  });

  it('does not advance on reactivation when the slot has been scrolled past', async () => {
    const { visit } = await mounted();
    visit.el = slotEl(-400);
    fireEvent.click(screen.getByText('away'));
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/away'));
    fireEvent.click(screen.getByText('home'));
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/'));
    expect(localStorage.getItem(CURSOR_KEY)).toBe('1');
    expect(visit.cursor).toBe(0);
    expect(screen.getByTestId('state').textContent).toBe('pga:preview');
  });

  it('advances on pull-to-refresh', async () => {
    const { visit } = await mounted();
    visit.el = slotEl(window.innerHeight + 200);
    act(() => { visit.refresh?.(); });
    expect(localStorage.getItem(CURSOR_KEY)).toBe('2');
    expect(visit.cursor).toBe(1);
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('lpga:live'));
  });

  it('does not advance on pull-to-refresh when the slot has been scrolled past', async () => {
    const { visit } = await mounted();
    visit.el = slotEl(-400);
    act(() => { visit.refresh?.(); });
    expect(localStorage.getItem(CURSOR_KEY)).toBe('1');
    expect(visit.cursor).toBe(0);
    expect(screen.getByTestId('state').textContent).toBe('pga:preview');
  });

  it('does not change the tournament while the page stays active', async () => {
    const { visit, client, rerender } = await mounted();
    fireEvent.click(screen.getByText('home'));
    rerender(tree(v => { v.cursor = visit.cursor; }, client));
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/'));
    expect(localStorage.getItem(CURSOR_KEY)).toBe('1');
    expect(visit.cursor).toBe(0);
    expect(screen.getByTestId('state').textContent).toBe('pga:preview');
  });

  it('wraps at the end of the list', async () => {
    const { visit } = await mounted();
    act(() => { visit.refresh?.(); });
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('lpga:live'));
    act(() => { visit.refresh?.(); });
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('pga:preview'));
    act(() => { visit.refresh?.(); });
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('lpga:live'));
    expect(localStorage.getItem(CURSOR_KEY)).toBe('4');
    expect(visit.cursor).toBe(3);
  });
});
