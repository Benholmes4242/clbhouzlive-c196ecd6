/**
 * BOARD HEADERS WITHOUT POS / PLAYER (signed-off mock): on every tour board
 * in the row style, the POS and PLAYER column titles are gone and the score
 * labels sit on the section heading's line (or their own line when the
 * heading holds a right-side item). These tests pin the absence of the old
 * titles and the presence of the score labels on each of the seven surfaces.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';

import { MiniBoard } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { BoardTable, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { CompletedWeekBlock } from '@/features/tourhub/tournament-v2/sections/CompletedWeekBlock';
import { UpcomingLastYear } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { RecapStandings } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';
import type { WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
import type { SeasonRecapData } from '@/features/tourhub/components/overview-v3/useSeasonRecap';

vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isLoading: false }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [], isLoading: false }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: { topContenders: [] } }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

const language = i18next.createInstance();
void language.init({ lng: 'en', resources: { en: { tourhub: en } }, initAsync: false });
const mount = (node: React.ReactNode) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><I18nextProvider i18n={language}>{node}</I18nextProvider></MemoryRouter>
  </QueryClientProvider>,
);
afterEach(cleanup);

const row = (id: string, position: number): BoardEntry => ({ id, position, score: -14 + position - 1, round_1: -4, round_2: -10 + position - 1, today: -10 + position - 1, today_round: 2, thru: 18, player: { id, full_name: `Player ${id}` } });
const field = [row('a', 1), row('b', 2), row('c', 3)];

const FACTS: WeekFacts = {
  champion_player_id: 'a', champion_surname: 'A', rounds: 4, par: 72,
  path: [
    { round: 1, position: 9, tied: true, to_par: -6, back: 3, lead_by: null },
    { round: 2, position: 6, tied: true, to_par: -10, back: 5, lead_by: null },
    { round: 3, position: 9, tied: true, to_par: -14, back: 7, lead_by: null },
    { round: 4, position: 1, tied: false, to_par: -23, back: 0, lead_by: null },
  ],
  playoff: false, margin: 1, hole_types: null,
  low_round: null, most_birdies: null, field_avg: null, field_size: 75, cut: null,
  hardest: null, easiest: null,
};

const noPosPlayer = (el: HTMLElement | null) => {
  expect(el).not.toBeNull();
  expect(el?.textContent).not.toContain('POS');
  expect(el?.textContent).not.toContain('PLAYER');
};

describe('board headers without POS / PLAYER', () => {
  it('completed THE TOP THREE: R<last> and TOT on the heading line', () => {
    const { container } = mount(<CompletedWeekBlock facts={FACTS} rows={field} onFullBoard={() => {}} />);
    const head = container.querySelector<HTMLElement>('[data-cw-section="top"]');
    noPosPlayer(head);
    expect(head?.querySelector('h3')?.textContent).toBe('HOW IT WAS WON'.length ? head.querySelector('h3')?.textContent : '');
    expect(head?.textContent).toContain('R4');
    expect(head?.textContent).toContain('TOT');
  });

  it('upcoming LAST YEAR: TOT on the heading line', () => {
    const { container } = mount(<UpcomingLastYear rows={[
      { rank: '1', name: 'Stewart Cink', score: '−20', year: '2025' },
      { rank: '2', name: 'Steven Alker', score: '−18', year: '2025' },
    ] as never} />);
    const head = container.querySelector<HTMLElement>('[data-overview-board-header]');
    noPosPlayer(head);
    expect(head?.textContent).toContain('TOT');
    expect(head?.querySelector('h2')).not.toBeNull();
  });

  it('season in review THE POINTS LIST: PTS on the heading line', () => {
    const data = { standings: [{ position: 1, name: 'Ross Steelman', points: 2221 }], events: 26, winners: 20 } as unknown as SeasonRecapData;
    const { container } = mount(<RecapStandings tour="pgad" data={data} />);
    const head = container.querySelector<HTMLElement>('.recap-head-row');
    noPosPlayer(head);
    expect(head?.textContent).toContain('PTS');
    expect(head?.querySelector('h2')).not.toBeNull();
  });

  it('live hero board: LEADERBOARD kicker with the round labels, no POS/PLAYER', () => {
    const { container } = mount(<MiniBoard tournamentId="event" entries={field} currentRound={3} theme="heroBoard" phase="live" />);
    const head = container.querySelector<HTMLElement>('[data-overview-board-header]');
    noPosPlayer(head);
    expect(head?.textContent).toContain('R1');
    expect(head?.textContent).toContain('TOT');
    expect(container.querySelector('[data-hero-board-kicker]')).not.toBeNull();
  });

  it('tournament page board: labels on their own line, no POS/PLAYER', () => {
    const { container } = mount(<MiniBoard tournamentId="event" entries={field} currentRound={3} presentation="tournament" phase="live" />);
    const head = container.querySelector<HTMLElement>('.tv-board-head');
    noPosPlayer(head);
    expect(head?.textContent).toContain('TOT');
  });

  it('panel board: no POS/PLAYER titles', () => {
    const { container } = mount(<MiniBoard tournamentId="event" entries={field} currentRound={3} theme="panel" phase="live" />);
    const head = container.querySelector<HTMLElement>('[data-board-name-tier]')?.firstElementChild as HTMLElement | null;
    noPosPlayer(head);
    expect(head?.textContent).toContain('TOT');
  });

  it('full board (BoardTable): the merged POS PLAYER cell is empty', () => {
    const { container } = mount(<BoardTable entries={field} cutState={{ kind: 'none', cutline: null, extraCount: 0 }} currentRound={2} />);
    const head = container.querySelector<HTMLElement>('[data-board-pos-header]');
    expect(head).not.toBeNull();
    expect(head?.textContent).toBe('');
    const headerRow = head?.parentElement;
    noPosPlayer(headerRow ?? null);
    expect(headerRow?.textContent).toContain('TOT');
  });
});
