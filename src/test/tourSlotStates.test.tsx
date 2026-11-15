import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { LastYearFinisher } from '@/features/tourhub/hooks/useTournamentLastYearTop4';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { SlotTournament, SlotState } from '@/features/clubhouse-tour/tourSlotRules';

const h = vi.hoisted(() => ({ lastYear: null as LastYearFinisher[] | null, ids: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: (id: string | null) => { h.ids(id); return { data: h.lastYear }; } }));
import { TourSlotView } from '@/features/clubhouse-tour/TourSlot';
import { SlotLastYearBoard } from '@/features/clubhouse-tour/SlotBoard';
import { resultSentence, slotTopThree } from '@/features/clubhouse-tour/tourSlotRules';
import { roundMovementCards } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';

const event: SlotTournament = { id: 'event', name: 'DP World Tour Championship', status: 'inprogress', event_type: 'stroke', start_date: '2026-11-12', end_date: '2026-11-15', purse: 10000000, winning_share: null, currency: 'USD', venue_id: null, venue_name: 'Jumeirah Golf Estates', venue_course_name: null, venue_city: 'Dubai', venue_state: null, venue_country: 'UAE', venue_par: 72, venue_yardage: 7706, winner_id: null, defending_champion: 'Matt Fitzpatrick', champion_narrative: null, season_id: 'season', current_round: 4, current_round_status: null, season: { id: 'season', tour_id: 'euro', tour_name: 'euro', year: 2026 }, locksAt: null };
const row = (position: number, name: string, score: number, prior = 0): BoardEntry => ({ id: name, position, score, thru: 18, round_1: prior, round_2: 0, round_3: 0, round_4: score - prior, player: { id: name, full_name: name, photo_url: '/portrait.jpg' } });
const board = [row(1, 'Tyrrell Hatton', -15, -2), row(2, 'Rory McIlroy', -10, -3), row(3, 'Eugenio Lopez-Chacarra', -8, 0), row(3, 'Oliver Lindell', -8, -1), row(5, 'Mikael Lindberg', -7, -4)];
function mount(state: SlotState, round = 4, entries = board, format = 'stroke') {
  const tournament = { ...event, current_round: round, event_type: format };
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><TourSlotView selection={{ tournament, tour: 'euro', state }} board={entries} image={null} sentence="Live sentence" chase={null} lastYear={<SlotLastYearBoard event={tournament} />} onOpen={() => {}} /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { h.lastYear = null; h.ids.mockClear(); });
describe('Tour slot all states', () => {
  it('(a) upcoming keeps facts and reads prior-year top three, omitting a null board', () => {
    h.lastYear = [1, 2, 3, 3].map((n, i) => ({ rank: n === 3 ? 'T3' : String(n), name: `Player ${i}`, score: '−18', year: '2025', country: '', photoUrl: null }));
    const view = mount('preview');
    expect(view.container.querySelector('[data-tour-slot-facts]')).not.toBeNull();
    expect(view.container.querySelectorAll('[data-slot-board-row]')).toHaveLength(4);
    expect(h.ids).toHaveBeenCalledWith('event');
    view.unmount(); h.lastYear = null;
    expect(mount('preview').container.querySelector('[data-tour-slot-board]')).toBeNull();
  });
  it('upcoming does not request history for a team event', () => {
    const view = mount('preview', 4, board, 'team');
    expect(h.ids).toHaveBeenCalledWith(null);
    expect(view.container.querySelector('[data-tour-slot-board]')).toBeNull();
  });
  it('(b) keeps four rows for 1, 2, T3 twice', () => {
    expect(slotTopThree(board).map(r => [r.entry.position, r.others])).toEqual([[1, 0], [2, 0], [3, 0], [3, 0]]);
  });
  it('(b) folds T3 four times into the first name and three others', () => {
    const entries = [...board.slice(0, 4), row(3, 'Another Player', -8), row(3, 'Fourth Player', -8)];
    expect(slotTopThree(entries).map(r => [r.entry.player?.full_name, r.others])).toEqual([['Tyrrell Hatton', 0], ['Rory McIlroy', 0], ['Eugenio Lopez-Chacarra', 3]]);
    expect(mount('result', 4, entries).container.querySelectorAll('[data-slot-board-row]')).toHaveLength(3);
  });
  it('(c) day one has no movers and only R1', () => {
    const entries = board.map(r => ({ ...r, round_2: null, round_3: null, round_4: null }));
    const { container } = mount('live', 1, entries);
    expect(container.querySelector('[data-overview-movement]')).toBeNull();
    expect([...container.querySelectorAll('[data-slot-round-header]')].map(e => e.getAttribute('data-slot-round-header'))).toEqual(['1']);
  });
  it('(d) round four has dots, movers and five rows with R1–R4', () => {
    const { container } = mount('live');
    expect(container.querySelectorAll('[data-round-node]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-round-node="done"]')).toHaveLength(3);
    expect(container.querySelector('[data-round-node="live"]')).not.toBeNull();
    expect(container.querySelector('[data-overview-movement]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot-board-row]')).toHaveLength(5);
    expect([...container.querySelectorAll('[data-slot-round-header]')].map(e => e.getAttribute('data-slot-round-header'))).toEqual(['1', '2', '3', '4']);
  });
  it('(e) result has no dots or round columns and uses final-round movers and top three', () => {
    const { container } = mount('result');
    expect(container.querySelector('[data-overview-round-spine]')).toBeNull();
    expect(container.querySelector('[data-slot-round-header]')).toBeNull();
    expect(container.querySelector('[data-slot-board-kind="result"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot-board-row]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-overview-movement-card]')).toHaveLength(roundMovementCards(board, 4, 72, 'euro').length);
    expect(container.querySelector('[data-tour-slot-result-sentence] strong')).not.toBeNull();
  });
  it('(f) result sentence names a five-shot margin and second place', () => {
    expect(resultSentence(board)).toEqual({ headline: 'Hatton wins by five at 15 under par.', chase: 'McIlroy is second on 10 under.' });
  });
  it('(f) result sentence names a play-off at equal regulation scores', () => {
    expect(resultSentence([row(1, 'Matt Fitzpatrick', -18), row(2, 'Rory McIlroy', -18)])).toEqual({ headline: 'Fitzpatrick wins a play-off at 18 under par.', chase: 'McIlroy is second on 18 under.' });
  });
  it('(f) result sentence counts a tie for second', () => {
    expect(resultSentence([board[0], board[1], { ...board[3], position: 2, score: -10 }])?.chase).toBe('2 players share second on 10 under.');
  });
  it('(f) result sentence handles level par', () => {
    expect(resultSentence([row(1, 'A Winner', 0), row(2, 'B Runner', 1)] )).toEqual({ headline: 'Winner wins by one at level par.', chase: 'Runner is second on 1 over.' });
  });
  it('(f) result sentence handles over par', () => {
    expect(resultSentence([row(1, 'A Winner', 2), row(2, 'B Runner', 4)] )).toEqual({ headline: 'Winner wins by two at 2 over par.', chase: 'Runner is second on 4 over.' });
  });
  it('(g) single leader has a portrait block and a tie has none', () => {
    const view = mount('live');
    expect(view.container.querySelector('[data-tour-slot-leader-face]')).not.toBeNull();
    view.unmount();
    expect(mount('live', 4, [board[0], { ...board[1], position: 1, score: -15 }, board[2]]).container.querySelector('[data-tour-slot-leader-face]')).toBeNull();
  });
});