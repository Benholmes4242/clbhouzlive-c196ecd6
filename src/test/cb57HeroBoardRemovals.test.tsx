import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enTourhub from '../../public/locales/en/tourhub.json';
import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { OVERVIEW } from '@/features/tourhub/components/overview-v3/overviewTokens';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';

const fixture = vi.hoisted(() => ({ picks: true, facts: true }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: fixture.picks ? { topContenders: [{ playerId: 'p0', playerName: 'Player A' }], tournament: { name: 'Event' } } : null }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: fixture.facts ? [{ time: '09:00' }] : [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
// Populated former dependencies make the removal regression meaningful:
// the old version could show BOTH removed rows, not just an empty draw.
vi.mock('@/features/tourhub/overview/data/useTournamentVenueRecord', () => ({ useTournamentVenueRecord: () => ({ data: { courseId: 'course' } }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [3] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [{ teeTime: '2026-10-23T09:00:00Z', players: [{ id: 'p0', name: 'Player A' }] }] }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

const language = i18next.createInstance();
void language.init({ lng: 'en', resources: { en: { tourhub: enTourhub } }, initAsync: false });
const entries: BoardEntry[] = [1, 1, 1, 4, 4].map((position, i) => ({
  id: `r${i}`, position, position_tied: true, score: position === 1 ? -6 : -4,
  thru: 9, round_1: -2, round_2: position === 1 ? -4 : -2,
  player: { id: `p${i}`, full_name: `Player ${String.fromCharCode(65 + i)}` },
}));
const mount = (phase: 'live' | 'completed' | 'upcoming') => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><I18nextProvider i18n={language}>
      <HeroBoardSection tournamentId="event" entries={entries} phase={phase} currentRound={2} totalRounds={4} venuePar={72} />
    </I18nextProvider></MemoryRouter>
  </QueryClientProvider>,
);
afterEach(() => { cleanup(); fixture.picks = true; fixture.facts = true; });

describe('CB57 hero board removals', () => {
  it.each(['live', 'completed', 'upcoming'] as const)('removes every specified rule and action in %s with picks', (phase) => {
    const view = mount(phase);
    expect(view.container.querySelector('[data-overview-picks]')).not.toBeNull();
    for (const selector of ['data-hero-tie-separator', 'data-overview-next-round', 'data-overview-action-row', 'data-overview-board-cta', 'data-overview-course-cta']) {
      expect(view.container.querySelector(`[${selector}]`)).toBeNull();
    }
  });
  it.each(['live', 'completed', 'upcoming'] as const)('adds no removed row when %s has no picks', (phase) => {
    fixture.picks = false;
    const view = mount(phase);
    expect(view.container.querySelector('[data-overview-picks]')).toBeNull();
    expect(view.container.querySelector('[data-overview-next-round], [data-overview-action-row], [data-overview-board-cta], [data-overview-course-cta], [data-hero-tie-separator]')).toBeNull();
  });
  it.each(['live', 'completed'] as const)('uses identical position-cell brackets for top and lower ties in %s', (phase) => {
    const view = mount(phase);
    const brackets = [...view.container.querySelectorAll<HTMLElement>('[data-hero-tie-bracket]')];
    expect(brackets).toHaveLength(5);
    brackets.forEach((bar, i) => {
      expect(bar.style.left).toBe('');
      expect(bar.style.right).toBe('2px');
      expect(bar.style.width).toBe('1.5px');
      expect(bar.style.borderRadius).toBe('1px');
      const expected = document.createElement('span');
      expected.style.background = OVERVIEW.bracket;
      expect(bar.style.background).toBe(expected.style.background);
      expect(bar.style.top).toBe([0, 3].includes(i) ? '50%' : '-6px');
      expect(bar.style.bottom).toBe([2, 4].includes(i) ? '50%' : '-6px');
      expect(bar.parentElement?.style.position).toBe('relative');
      expect(bar.parentElement?.style.alignSelf).toBe('stretch');
    });
    if (phase === 'live') expect(view.container.querySelectorAll('[data-hero-tie="capped"]')).toHaveLength(3);
  });
  it('renders an empty upcoming band without a placeholder or reserved height', () => {
    fixture.picks = false; fixture.facts = false;
    const view = mount('upcoming');
    expect(view.container.firstElementChild?.childElementCount).toBe(0);
    expect((view.container.firstElementChild as HTMLElement).style.height).toBe('');
    expect((view.container.firstElementChild as HTMLElement).style.minHeight).toBe('');
  });
});