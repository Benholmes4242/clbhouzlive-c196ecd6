import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: { topContenders: [{ playerId: 'a', playerName: 'Player A' }] } }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [{ time: '13:40' }] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [{ rank: '1', name: 'Winner', score: '−20', year: '2025' }, { rank: '2', name: 'Runner', score: '−19', year: '2025' }] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isLoading: false }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [], isLoading: false }) }));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

import { PhotoBand, OVERVIEW_SENTENCE_BLOCK, OVERVIEW_SPINE_BLOCK } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand';
import { HeroBoardSection, RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { ChampionStrip } from '@/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip';
import { LeadersGroupContent } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { MiniBoard } from '@/features/tourhub/tournament-v2/sections/MiniBoard';

afterEach(cleanup);
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
const states: HeroState[] = [{ kind: 'upcoming', variant: 'far', countdown: '', meta: '' }, { kind: 'live', round: 2, totalRounds: 4 }, { kind: 'results', variant: 'standard', finishDate: '2026-11-01', meta: '' }];
const field: BoardEntry[] = [{ id: 'a', position: 1, score: -6, round_1: -4, round_2: -2, today: -2, today_round: 2, thru: 9, player: { id: 'a', full_name: 'Player A' } }];
const photo = (state: HeroState, onOpen = vi.fn(), onFullBoard?: () => void) => <PhotoBand title="Event" venueName="Venue" datesString="Dates" venueImageUrl="https://example.test/course.jpg" state={state} tourLabel="PGA" leader={{ score: -6, faces: [], caps: 'A' }} countdown={[{ value: 2, label: 'days' }]} startDay={null} segments={[{ text: 'Figure ', figure: false }, { text: '6', figure: true }]} note="Note" onOpen={onOpen} onFullBoard={onFullBoard} />;

describe('Merged Airy photo', () => {
  it.each(states)('puts the sentence and note on the photo in $kind at the derived height', state => {
    const v = mount(photo(state));
    const band = v.container.querySelector<HTMLElement>('[data-overview-photo-band]');
    // Live keeps 350; states without the round spine drop exactly its block.
    expect(band?.style.height).toBe(state.kind === 'live' ? '350px' : '');
    expect(band?.querySelector('[data-overview-photo-situation]')).not.toBeNull();
    expect(band?.querySelector('[data-overview-situation-note]')).not.toBeNull();
    expect(v.container.querySelector('[data-overview-situation]')).toBeNull();
    const text = band?.querySelector<HTMLElement>('[data-overview-photo-text]');
    expect(text?.style.position).toBe(state.kind === 'live' ? 'absolute' : 'relative');
    expect(state.kind === 'live' ? text?.style.bottom : text?.style.paddingBottom).toBe('14px');
    expect(band?.querySelector('h1')?.style.fontSize).toBe('26px');
    expect(band?.querySelector<HTMLElement>('[data-overview-photo-situation]')?.style.lineHeight).toBe('1.4');
    expect(band?.querySelector<HTMLElement>('[data-overview-situation-note]')?.style.marginTop).toBe('4px');
    expect(Boolean(band?.querySelector('[data-overview-leader-trio]'))).toBe(state.kind === 'live');
    expect(Boolean(band?.querySelector('[data-overview-countdown]'))).toBe(state.kind === 'upcoming');
  });
  it('isolates Full board clicks and keyboard events from the tournament door without nested buttons', () => {
    const open = vi.fn(), full = vi.fn(); const v = mount(photo(states[1], open, full));
    const band = v.container.querySelector<HTMLElement>('[data-overview-photo-band]');
    if (!band) throw new Error('Photo band absent');
    const button = screen.getByRole('button', { name: 'Full leaderboard' });
    expect(band.tagName).toBe('DIV'); expect(band.querySelector('button button')).toBeNull();
    fireEvent.click(button); fireEvent.keyDown(button, { key: 'Enter' }); expect(full).toHaveBeenCalledTimes(1); expect(open).not.toHaveBeenCalled();
    fireEvent.click(band); fireEvent.keyDown(band, { key: 'Enter' }); fireEvent.keyDown(band, { key: ' ' }); expect(open).toHaveBeenCalledTimes(3);
  });
  it('omits Full board when no opener is available', () => { mount(photo(states[0])); expect(screen.queryByRole('button', { name: 'Full leaderboard' })).toBeNull(); });
  it('a finished band with no sentence drops both live-only lines', () => {
    const v = mount(<PhotoBand title="Event" venueName="Venue" datesString="Dates" venueImageUrl={null} state={states[2]} tourLabel="PGA" leader={null} countdown={[]} startDay={null} segments={[]} note={null} onOpen={() => {}} />);
    const band = v.container.querySelector<HTMLElement>('[data-overview-photo-band]');
    expect(band?.style.height).toBe('');
    expect(band?.querySelector<HTMLElement>('[data-overview-photo-text]')?.style.position).toBe('relative');
    expect(band?.querySelector('[data-overview-photo-situation]')).toBeNull();
    expect(band?.querySelector('[data-overview-round-spine]')).toBeNull();
  });
});

describe('Merged Airy lower sections', () => {
  it.each(['live', 'completed'] as const)('compresses only the %s hero board', phase => {
    const v = mount(<MiniBoard tournamentId="e" entries={field} currentRound={2} phase={phase} theme="heroBoard" />);
    const header = v.container.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.style.minHeight).toBe('24px'); expect(header?.style.paddingTop).toBe('2px'); expect(header?.parentElement?.style.paddingTop).toBe('12px');
    const row = v.container.querySelector<HTMLElement>('[data-hero-tie]')?.parentElement;
    expect(row?.style.minHeight).toBe('31px'); expect(row?.style.paddingTop).toBe('4px'); // one-column board: same single-line geometry in every phase
  });
  it.each(['panel', 'light'] as const)('preserves the %s board spacing', theme => {
    const v = mount(<MiniBoard tournamentId="e" entries={field} currentRound={2} theme={theme} />);
    const root = v.container.querySelector<HTMLElement>('[data-board-name-tier]');
    expect((root?.firstElementChild as HTMLElement)?.style.padding).toBe('8px 16px');
    expect(root?.querySelector('button')?.style.padding).toBe('10px 16px');
  });
  it.each(['upcoming', 'live', 'completed'] as const)('adds the picks hairline and tighter cards in %s', phase => {
    const v = mount(<HeroBoardSection tournamentId="e" entries={field} currentRound={2} totalRounds={4} phase={phase} />);
    const picks = v.container.querySelector<HTMLElement>('[data-overview-picks]');
    expect(picks?.style.paddingTop).toBe('8px'); const hairline = picks?.querySelector<HTMLElement>('[data-overview-picks-hairline]'); expect(hairline).not.toBeNull(); expect(hairline?.style.borderTop).toBe('1px solid rgba(255,255,255,0.06)');
    expect(picks?.querySelector<HTMLElement>('[data-overview-picks-heading]')?.style.paddingTop).toBe('16px');
    expect(picks?.querySelector<HTMLElement>('[data-overview-pick-card]')?.style.padding).toBe('7px');
    expect(picks?.querySelector<HTMLElement>('[data-overview-picks-grid]')?.style.paddingBottom).toBe('0px');
  });
  it('tightens upcoming first tee and last-year rows without changing their contents', () => {
    const v = mount(<HeroBoardSection tournamentId="e" entries={[]} currentRound={null} phase="upcoming" />);
    expect(v.container.querySelector<HTMLElement>('[data-overview-facts]')?.style.padding).toBe('10px 20px');
    const last = v.container.querySelector<HTMLElement>('[data-overview-last-year]');
    expect(last?.style.paddingBottom).toBe('');
    expect((last?.children[0] as HTMLElement)?.style.padding).toBe('2px 20px');
    expect((last?.children[1] as HTMLElement)?.style.padding).toBe('5px 20px');
    expect((last?.children[2] as HTMLElement)?.style.padding).toBe('5px 20px');
  });
  it('tightens movers and their figure gap', () => {
    const v = mount(<RoundMovementBand round={2} cards={[{ key: 'a', name: 'Player A', candidates: [], delta: 2, toPar: -2, gross: 70 }]} />);
    const movement = v.container.querySelector<HTMLElement>('[data-overview-movement]');
    expect(movement?.style.padding).toBe('12px 20px 10px'); expect((movement?.children[1] as HTMLElement)?.style.marginTop).toBe('8px');
    const card = movement?.querySelector<HTMLElement>('[data-overview-movement-card]'); expect(card?.style.padding).toBe('7px'); expect((card?.children[1].children[1] as HTMLElement)?.style.marginTop).toBe('1px');
  });
  it('tightens leaders with a six-pixel gap and top hairline', () => {
    const group = { teeTime: '2026-11-01T12:00:00Z', startingHole: 1, players: [{ id: 'a', name: 'Player A' }] };
    const v = mount(<LeadersGroupContent tournamentId="e" entries={field} currentRound={2} totalRounds={4} phase="live" round={2} group={group} groups={[group]} />);
    const section = v.container.querySelector<HTMLElement>('[data-leaders-group]'); expect(section?.style.padding).toBe('14px 20px 12px'); expect(section?.style.marginTop).toBe('6px'); expect(section?.style.borderTop).toBe('1px solid rgba(255,255,255,0.06)');
    expect(section?.querySelector<HTMLElement>('[data-leaders-group-state]')?.style.marginTop).toBe('6px'); expect(section?.querySelector<HTMLElement>('[data-leaders-group-header]')?.style.marginTop).toBe('10px'); expect(section?.querySelector<HTMLElement>('[data-leaders-group-row]')?.style.minHeight).toBe('33px');
  });
  it('renders the shared champion block with the narrative line and a gold ring, tighter and faded', () => {
    const v = mount(<ChampionStrip name="Player A" score="−6" scoreValue={-6} narrativeParts={[{ text: 'Led all week.' }]} />);
    const block = v.container.querySelector('.tv-champion');
    expect(block).not.toBeNull();
    expect(block?.querySelector('.tv-champion-line')?.textContent).toBe('Led all week.');
    expect(block?.querySelector('[data-active-ring="on"]')).not.toBeNull();
    v.unmount();
    const plain = mount(<ChampionStrip name="Player A" score="−6" />);
    expect(plain.container.querySelector('.tv-champion-line')).toBeNull();
    // The chrome lives in championStrip.css (jsdom drops imported styles):
    // 10px vertical padding, no border-bottom, 16px top/bottom fade mask.
    const css = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/championStrip.css', 'utf8');
    expect(css).toContain('padding: 10px 20px;');
    expect(css).not.toContain('border-bottom:');
    expect(css).toContain('mask-image: linear-gradient(180deg, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);');
    expect(css).toContain('linear-gradient(90deg, rgba(251,188,46,.12), rgba(251,188,46,0) 70%), var(--tv-panel)');
  });
});
