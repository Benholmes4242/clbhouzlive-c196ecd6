import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import { formatTimeHm, formatWeekdayShort } from '@/i18n/format';
import { LeadersGroup, LeadersGroupContent } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup';
import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { allLeaders, groupState, leadersBaseRound, leadersShownRound, leadersGroupVisible, pickLeadersGroup, otherLeaders, leadersNote, roundEntry } from '@/features/tourhub/components/overview-v3/HybridHeroBands/leadersGroupRules';
import { todayFromEntry, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';

const fixture = vi.hoisted(() => ({ groups: [] as TeeGroup[], loading: false, picks: false, target: null as unknown }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: fixture.groups, isLoading: fixture.loading }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [1], isLoading: false }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: fixture.picks ? { topContenders: [{ playerId: 'a', playerName: 'Ben Kohles' }], tournament: { name: 'Event' } } : null }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: ({ open, target }: { open: boolean; target: unknown }) => { if (open) fixture.target = target; return open ? <div data-scorecard-open /> : null; } }));
const language = i18next.createInstance();
void language.init({ lng: 'en', resources: { en: { tourhub: en } }, initAsync: false });
const entry = (id: string, position = 1, today: number | null = -8, thru = 13): BoardEntry => ({
  id: `row-${id}`, position, position_tied: true, score: -8, today, today_round: today == null ? null : 1, thru,
  player: { id, full_name: id === 'a' ? 'Ben Kohles' : `Player ${id}` },
});
const group = (ids: string[], time = '2026-10-23T15:38:00Z'): TeeGroup => ({ teeTime: time, startingHole: 1, players: ids.map(id => ({ id, name: `Player ${id}` })) });
const entries = [entry('a'), entry('b', 9), entry('c', 41), entry('d'), entry('e')];
const g = group(['a', 'b', 'c']);
const props = { tournamentId: 'event', phase: 'live' as const, entries, currentRound: 1, totalRounds: 4, tourSlug: 'pga' };
const mount = (element: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><I18nextProvider i18n={language}>{element}</I18nextProvider></MemoryRouter></QueryClientProvider>);
afterEach(() => { cleanup(); fixture.groups = []; fixture.loading = false; fixture.picks = false; fixture.target = null; });

describe('CB58 pure leaders group rules', () => {
  it('returns every position-1 player, not the next-lowest position', () => expect(allLeaders(entries).map(e => e.player?.id)).toEqual(['a', 'd', 'e']));
  it('prefers most leaders before group state or latest time', () => {
    const many = group(['d', 'e'], '2026-10-23T08:00:00Z');
    expect(pickLeadersGroup([g, many], allLeaders(entries), entries, 1)).toBe(many);
  });
  it('then prefers a group still on the course', () => {
    const late = group(['d'], '2026-10-23T20:00:00Z');
    const field = entries.map(e => e.player?.id === 'd' ? { ...e, today: null, today_round: null } : e);
    expect(pickLeadersGroup([late, g], allLeaders(field), field, 1)).toBe(g);
  });
  it('then prefers the latest tee time', () => {
    const late = group(['d'], '2026-10-23T20:00:00Z');
    expect(pickLeadersGroup([g, late], allLeaders(entries), entries, 1)).toBe(late);
  });
  it('retains input order on exact ties without mutating groups', () => {
    const second = group(['d']); const groups = [g, second];
    expect(pickLeadersGroup(groups, allLeaders(entries), entries, 1)).toBe(g);
    expect(groups).toEqual([g, second]);
  });
  it.each([['before', null, 18], ['onCourse', -8, 13], ['finished', -8, 18]] as const)('derives %s through board rules', (state, today, thru) => {
    expect(groupState(g, g.players.map(p => entry(p.id ?? '', 1, today, thru)), 1)).toBe(state);
  });
  it('some started and some finished is still on-course', () => expect(groupState(g, [entry('a', 1, -8, 18), entry('b', 9, -5, 3)], 1)).toBe('onCourse'));
  it('keeps finished groups until the next draw is published', () => {
    const field = entries.map(e => ({ ...e, thru: 18 }));
    expect(leadersShownRound(1, [g, group(['d', 'e'])], allLeaders(field), field, [1], 4)).toBe(1);
    expect(leadersShownRound(1, [g, group(['d', 'e'])], allLeaders(field), field, [1, 2], 4)).toBe(2);
  });
  it('does not switch when another leaders group is unfinished', () => {
    const field = entries.map(e => e.player?.id === 'a' || e.player?.id === 'b' || e.player?.id === 'c' ? { ...e, thru: 18 } : e);
    expect(leadersShownRound(1, [g, group(['d', 'e'])], allLeaders(field), field, [2], 4)).toBe(1);
  });
  it('ignores early current-round advancement and supports late advancement', () => {
    const leaders = [entry('a', 1, -8, 18)];
    expect(leadersBaseRound(leaders, 2)).toBe(1);
    expect(leadersBaseRound(leaders, 1)).toBe(1);
    expect(leadersShownRound(1, [g], leaders, entries.map(e => ({ ...e, thru: 18 })), [2], 4)).toBe(2);
  });
  it('historical completed card scopes thru/today despite a later partial round', () => {
    const e = { ...entry('a'), round_1: -8, today_round: 2, today: -1, thru: 3 };
    expect(roundEntry(e, 1).thru).toBe(18);
    expect(todayFromEntry(roundEntry(e, 1), 1)).toBe(-8);
    expect(todayFromEntry(roundEntry(e, 2), 2)).toBe(-1);
  });
  it.each([1, 2, 3, 4, 5])('note descriptor for %s leaders elsewhere preserves named/count grammar', n => {
    const others = Array.from({ length: n }, (_, i) => entry(`other${i}`));
    const note = leadersNote(others);
    expect(note).toEqual({ key: n === 1 ? 'one' : n < 4 ? 'named' : 'many', count: n, names: n < 4 ? others.map(e => e.player?.full_name.split(' ').at(-1)) : [] });
  });
  it('omits the note when all leaders are in the group', () => expect(leadersNote(otherLeaders(g, [entries[0]], [g]))).toBeNull());
  it('orders leaders elsewhere by tee time in the selected round', () => {
    expect(otherLeaders(g, allLeaders(entries), [g, group(['d'], '2026-10-23T18:00:00Z'), group(['e'], '2026-10-23T12:00:00Z')]).map(e => e.player?.id)).toEqual(['e', 'd']);
  });
  it.each(['upcoming', 'completed'])('hides in %s phase', phase => expect(leadersGroupVisible(phase, false, entries, false)).toBe(false));
  it('hides team events and loading', () => {
    expect(leadersGroupVisible('live', true, entries, false)).toBe(false);
    expect(leadersGroupVisible('live', false, entries, true)).toBe(false);
  });
  it('hides before any tournament score, but accepts a real level score', () => {
    expect(leadersGroupVisible('live', false, entries.map(e => ({ ...e, score: null })), false)).toBe(false);
    expect(leadersGroupVisible('live', false, [{ ...entries[0], score: 0 }], false)).toBe(true);
  });
});

describe('CB58 render and tap behavior', () => {
  it.each(['noGroups', 'leaderMissing', 'teeLoading', 'boardLoading', 'team'] as const)('renders nothing for %s', condition => {
    fixture.groups = condition === 'noGroups' ? [] : condition === 'leaderMissing' ? [group(['absent'])] : [g];
    fixture.loading = condition === 'teeLoading';
    const view = mount(<LeadersGroup {...props} leaderboardLoading={condition === 'boardLoading'} eventType={condition === 'team' ? 'team' : 'stroke'} />);
    expect(view.container.childElementCount).toBe(0);
  });
  it('renders after picks and directly after the board without picks', () => {
    fixture.groups = [g]; fixture.picks = true;
    const view = mount(<HeroBoardSection {...props} />);
    const section = view.container.querySelector('[data-leaders-group]');
    expect(section?.previousElementSibling?.hasAttribute('data-overview-picks')).toBe(true);
    expect(section?.getAttribute('style')).not.toMatch(/border/);
    cleanup(); fixture.picks = false;
    const without = mount(<HeroBoardSection {...props} />);
    expect(without.container.querySelector('[data-leaders-group]')?.previousElementSibling?.querySelectorAll('[data-hero-tie]').length).toBe(5);
  });
  it('before tee-off has empty thru/today and always passes weekday and time from one instant', () => {
    const view = mount(<LeadersGroupContent {...props} entries={entries.map(e => ({ ...e, today: null, today_round: null }))} group={g} groups={[g]} round={2} />);
    expect(view.container.querySelector('[data-group-state="before"]')).not.toBeNull();
    expect([...view.container.querySelectorAll('[data-group-thru], [data-group-today]')].map(e => e.textContent)).toEqual(['', '', '', '', '', '']);
    const instant = '2026-10-23T00:38:00Z';
    const date = new Date(instant);
    expect(formatWeekdayShort(instant)).toBe(new Intl.DateTimeFormat('en-GB-u-hc-h12', { weekday: 'short' }).format(date));
    expect(formatTimeHm(instant)).toBe(new Intl.DateTimeFormat('en-GB-u-hc-h12', { hour: 'numeric', minute: '2-digit' }).format(date));
  });
  it.each([1, 2, 3, 4])('renders %s-leader note with named ink spans only below four', n => {
    const other = Array.from({ length: n }, (_, i) => entry(`other${i}`));
    const view = mount(<LeadersGroupContent {...props} entries={[...entries.slice(0, 3), ...other]} group={g} groups={[g, group(other.map(e => e.player?.id ?? ''))]} round={1} />);
    const note = view.container.querySelector('[data-leaders-group-note]');
    expect(note).not.toBeNull();
    expect(note?.querySelectorAll('span[style]')).toHaveLength(n < 4 ? n : 0);
  });
  it('renders two-player group without reserved rows or note', () => {
    const view = mount(<LeadersGroupContent {...props} entries={entries.slice(0, 2)} group={group(['a', 'b'])} groups={[]} round={1} />);
    expect(view.container.querySelectorAll('[data-leaders-group-row]')).toHaveLength(2);
    expect(view.container.querySelector('[data-leaders-group-note]')).toBeNull();
  });
  it('preserves missing player row and opens scorecard with matching analytics handler', () => {
    const onRowTap = vi.fn();
    const view = mount(<LeadersGroupContent {...props} onRowTap={onRowTap} group={group(['a', 'missing'])} groups={[g]} round={1} />);
    const rows = view.container.querySelectorAll('[data-leaders-group-row]');
    expect(rows).toHaveLength(2);
    expect(rows[1].querySelector('[data-group-today]')?.textContent).toBe('');
    fireEvent.click(rows[0]);
    expect(onRowTap).toHaveBeenCalledWith('a');
    expect(fixture.target).toMatchObject({ playerId: 'a', total: -8, today: -8, thru: 13 });
    expect(view.container.querySelector('[data-scorecard-open]')).not.toBeNull();
  });
});