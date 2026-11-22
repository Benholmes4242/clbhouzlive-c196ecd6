import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { SlotSelection, SlotTournament } from '@/features/clubhouse-tour/tourSlotRules';
import { slotDaysUntil, slotLead, slotPlayedRound } from '@/features/clubhouse-tour/slotLeadRules';
import en from '@/locales/en/tourhub.json';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { TourSlotView } from '@/features/clubhouse-tour/TourSlot';

const event: SlotTournament = { id: 'event', name: 'The RSM Classic', status: 'inprogress', event_type: 'stroke', start_date: '2026-11-19', end_date: '2026-11-22', purse: 7600000, winning_share: null, currency: 'USD', venue_id: null, venue_name: 'Sea Island Resort', venue_course_name: null, venue_city: 'St Simons Island', venue_state: null, venue_country: 'USA', venue_par: 70, venue_yardage: 7005, winner_id: null, defending_champion: 'Sami Välimäki', champion_narrative: null, season_id: 'season', current_round: 3, current_round_status: null, season: { id: 'season', tour_id: 'pga', tour_name: 'pga', year: 2026 }, locksAt: null };
const selection = (state: SlotSelection['state'] = 'live'): SlotSelection => ({ tournament: event, tour: 'pga', state });
const row = (position: number, full_name: string, score: number | null, extra: Partial<BoardEntry> = {}): BoardEntry => ({ id: full_name, position, score, round_1: -5, round_2: -6, round_3: -4, thru: 14, today_round: 3, player: { id: full_name, full_name }, ...extra });
const leader = row(1, 'Ludvig Åberg', -15);
const runner = row(2, 'Sepp Straka', -14);
// Pure-copy tests use the real English catalogue, not a partial i18next mock.
const translate = (key: string, opts: Record<string, unknown> = {}) => {
  const path = key.split('.');
  let value: unknown = en;
  for (const part of path) value = value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined;
  return typeof value === 'string' ? value.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(opts[name] ?? '')) : '';
};
const live = (board: BoardEntry[]) => slotLead(selection(), board, translate);
const final = (board: BoardEntry[]) => slotLead(selection('result'), board, translate);

describe('Feed Tour lead rules', () => {
  it.each([1, 2])('one leader uses a digit margin of %i', gap => {
    expect(live([leader, { ...runner, score: -15 + gap }])?.heading).toBe(`LEADS BY ${gap}`);
  });
  it('one leader with no next row is leading', () => { expect(live([leader])?.heading).toBe('LEADING'); });
  it('one leader with no gap is leading', () => { expect(live([leader, { ...runner, score: null }])?.heading).toBe('LEADING'); });
  it('one leader retains the full name and shared score', () => { expect(live([leader, runner])).toMatchObject({ kind: 'leader', name: 'Ludvig Åberg', figure: '−15', score: -15 }); });
  it('today reads the current round and capitalises Thru 14', () => { expect(live([leader, runner])?.detail).toBe('−4 today · Thru 14'); });
  it('today has Finished at 18', () => { expect(live([{ ...leader, thru: 18 }, runner])?.detail).toBe('−4 today · Finished'); });
  it.each([0, null, 19])('today omits an unsupported thru value %s', thru => { expect(live([{ ...leader, thru }, runner])?.detail).toBe('−4 today'); });
  it('unstarted current round never falls back to a prior score', () => { expect(live([{ ...leader, round_3: null, today: null, thru: 0 }, runner])?.detail).toBe('Yet to start round 3'); });
  it('two joint leaders use surnames and a shot clear', () => { expect(live([leader, { ...runner, position: 1, score: -15 }, row(3, 'Si Woo Kim', -14)])).toMatchObject({ kind: 'joint', heading: 'JOINT LEADERS', name: 'Åberg & Straka', detail: 'A shot clear' }); });
  it('two joint leaders spell two shots clear', () => { expect(live([leader, { ...runner, position: 1, score: -15 }, row(3, 'Si Woo Kim', -13)])?.detail).toBe('Two shots clear'); });
  it('three joint leaders use countInWords and players', () => { expect(live([leader, { ...runner, position: 1, score: -15 }, row(1, 'Si Woo Kim', -15)])).toMatchObject({ name: 'Three players', detail: null }); });
  it('joint leaders omit the clearance without a next score', () => { expect(live([leader, { ...runner, position: 1 }, row(3, 'Si Woo Kim', null)])?.detail).toBeNull(); });
  it('joint layout uses only the first three avatars', () => { const lead = live([leader, ...['Sepp Straka', 'Si Woo Kim', 'Mackenzie Hughes'].map(name => row(1, name, -15))]); expect(lead?.avatars.map(r => r.id)).toEqual(['Ludvig Åberg', 'Sepp Straka', 'Si Woo Kim']); expect(lead?.name).toBe('Four players'); });
  it.each([1, 2])('winner uses digit margin %i', gap => { expect(final([leader, { ...runner, score: -15 + gap }])?.heading).toBe(`WON BY ${gap}`); });
  it('equal regulation scores use the play-off heading', () => { expect(final([leader, { ...runner, score: -15 }])?.heading).toBe('WON A PLAY-OFF'); });
  it('winner shows the highest played round score', () => { expect(final([{ ...leader, round_4: -3 }, runner])).toMatchObject({ kind: 'winner', name: 'Ludvig Åberg', detail: '−3 in the final round', figure: '−15' }); });
  it('winner uses round three when round four is absent', () => { expect(final([{ ...leader, round_4: null }, runner])?.detail).toBe('−4 in the final round'); });
  it('winner omits final-round detail with no round score', () => { expect(final([{ ...leader, round_1: null, round_2: null, round_3: null, round_4: null }, runner])?.detail).toBeNull(); });
  it('joint team winners use the joint layout', () => { const teams = [leader, runner].map((r, i) => ({ ...r, position: 1, score: -15, player: null, team: { id: `team-${i}`, display_name: i ? 'Team South' : 'Team North' } })); expect(final(teams)).toMatchObject({ kind: 'joint', heading: 'JOINT WINNERS', name: 'North & South' }); });
  it.each([
    ['2026-11-19T12:00:00Z', 'Today', null, true],
    ['2026-11-18T12:00:00Z', '1', 'DAY', false],
    ['2026-11-15T12:00:00Z', '4', 'DAYS', false],
  ] as const)('preview countdown at %s', (now, figure, figureLabel, today) => {
    expect(slotLead(selection('preview'), [], translate, new Date(now))).toMatchObject({ kind: 'first-tee', avatars: [], heading: 'FIRST TEE', name: 'Thursday 19 Nov', detail: '4 rounds · ends Sun 22 Nov', figure, figureLabel, today });
  });
  it('countdown changes at London midnight during BST', () => { expect(slotDaysUntil('2026-07-02', new Date('2026-07-01T23:30:00Z'))).toBe(0); });
  it('countdown counts calendar days across the spring clock change', () => { expect(slotDaysUntil('2026-03-30', new Date('2026-03-28T12:00:00Z'))).toBe(2); });
  it('result board includes the highest played round even with stale current round', () => { expect(slotPlayedRound([{ ...leader, round_4: -4 }], 2)).toBe(4); });
  it('unpositioned rows cannot become leaders', () => { expect(live([{ ...runner, position: null, score: -20 }, leader])?.name).toBe('Ludvig Åberg'); });
  it('an empty live board has no invented lead', () => { expect(live([])).toBeNull(); });
});

describe('Feed Tour scoped presentation', () => {
  it('preview facts use the centred grid', () => {
    const { container } = render(<TourSlotView selection={selection('preview')} board={[]} image={null} onOpen={() => {}} />);
    const facts = container.querySelector<HTMLElement>('[data-tour-slot-facts]');
    expect(facts?.classList.contains('tour-slot-facts')).toBe(true);
    expect(facts?.style.getPropertyValue('--slot-fact-count')).toBe('3');
    expect(readFileSync('src/features/clubhouse-tour/tourSlot.css', 'utf8')).toMatch(/\.tour-slot-facts \{[^}]*text-align: center;/);
  });
  it('preview omits an entirely null facts row', () => {
    const { container } = render(<TourSlotView selection={{ ...selection('preview'), tournament: { ...event, purse: null, venue_par: null, defending_champion: null } }} board={[]} image={null} onOpen={() => {}} />);
    expect(container.querySelector('[data-tour-slot-facts]')).toBeNull();
  });
  it('the local card has no weight 800 declarations or rendered inline weights', () => {
    for (const state of ['live', 'result', 'preview'] as const) {
      const view = render(<TourSlotView selection={selection(state)} board={[leader, runner]} image={null} onOpen={() => {}} />);
      expect([...view.container.querySelectorAll<HTMLElement>('*')].some(el => el.style.fontWeight === '800')).toBe(false);
      view.unmount();
    }
    expect(readFileSync('src/features/clubhouse-tour/tourSlot.css', 'utf8')).not.toMatch(/font-weight:\s*800/);
    expect(readFileSync('src/features/clubhouse-tour/TourSlot.tsx', 'utf8')).not.toMatch(/fontWeight:\s*800/);
  });
});