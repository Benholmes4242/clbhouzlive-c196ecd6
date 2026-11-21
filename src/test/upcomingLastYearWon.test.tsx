import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpcomingLastYear, UpcomingFacts, upcomingPar5Count } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { RecapStandings } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';
import type { WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { SeasonRecapData } from '@/features/tourhub/components/overview-v3/useSeasonRecap';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const finishers = ['Puig', 'Ding', 'Voke'].map((name, i) => ({ rank: String(i + 1), name, country: '', score: ['−18', '−16', '−15'][i], year: '2026', photoUrl: null }));
const rows: BoardEntry[] = finishers.map((p, i) => ({ id: p.name, player: { id: p.name, full_name: p.name }, position: i + 1, score: [-18, -16, -15][i], round_1: -3, round_2: -4, round_3: -5, round_4: [-6, -4, -3][i] }));
const facts: WeekFacts = { champion_player_id: 'Puig', champion_surname: 'Puig', rounds: 4, par: 71,
  path: [-3, -7, -12, -18].map((to_par, i) => ({ round: i + 1, position: i ? 1 : 5, tied: i === 0, to_par, back: null, lead_by: null })),
  playoff: false, margin: 2, hole_types: null, low_round: null, most_birdies: null, field_avg: null, field_size: null, cut: null, hardest: null, easiest: null };
const mount = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);

describe('upcoming prior-edition chart and Tour lists', () => {
  it('(a) prior facts and board render the shared chart and three key items for the actual rounds', () => {
    const v = mount(<UpcomingLastYear rows={finishers} year="2026" facts={facts} entries={rows} tourCode="euro" />);
    expect(v.container.querySelector('.cw-kick')?.textContent).toContain('2026');
    expect(v.container.querySelectorAll('[data-won-key-item]')).toHaveLength(3);
    expect(v.container.querySelectorAll('.cw-chart-round')).toHaveLength(4);
    expect(v.container.querySelector('.upcoming-ly-rows')).toBeNull();
    v.rerender(<MemoryRouter><UpcomingLastYear rows={finishers} facts={{ ...facts, rounds: 3, path: facts.path.slice(0, 3) }} entries={rows} /></MemoryRouter>);
    expect(v.container.querySelectorAll('.cw-chart-round')).toHaveLength(3);
  });
  it('(b) no prior facts keeps the original list; invalid charts fall back and no prior edition stays absent', () => {
    const v = mount(<UpcomingLastYear rows={finishers} />);
    expect(v.container.querySelector('.upcoming-ly-rows')?.children).toHaveLength(3);
    expect(v.container.querySelector('[data-won-key]')).toBeNull();
    for (const invalid of [{ ...facts, rounds: 1 }, { ...facts, path: [] }]) {
      v.rerender(<MemoryRouter><UpcomingLastYear rows={finishers} facts={invalid} entries={rows} /></MemoryRouter>);
      expect(v.container.querySelector('.upcoming-ly-rows')?.children).toHaveLength(3);
    }
    v.rerender(<MemoryRouter><UpcomingLastYear rows={[]} /></MemoryRouter>);
    expect(v.container.children).toHaveLength(0);
  });
  it('(c) PAR 5S and WON AT fill available cells in order while the cap remains four and pars require all 18 holes', () => {
    const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: i < 3 ? 5 : 4, yards: 0, course_par: 75, course_name: 'Course' }));
    expect(upcomingPar5Count(holes)).toBe(3);
    expect(upcomingPar5Count(holes.slice(1))).toBeNull();
    expect(upcomingPar5Count(holes.map(h => h.hole_no === 18 ? { ...h, par: 0 } : h))).toBeNull();
    const v = mount(<UpcomingFacts first={null} zone={null} field={0} purse={null} par={71} yards={7228} par5s={3} wonAt={-18} />);
    const cells = () => [...v.container.querySelectorAll('[data-upcoming-fact]')];
    expect(cells().map(c => [c.getAttribute('data-upcoming-fact'), c.querySelector('b')?.textContent])).toEqual([['par', '71'], ['yards', '7,228'], ['par5s', '3'], ['wonAt', '−18']]);
    v.rerender(<MemoryRouter><UpcomingFacts first={null} zone={null} field={132} purse={3000000} par={71} yards={7228} par5s={3} wonAt={-18} /></MemoryRouter>);
    expect(cells().map(c => c.getAttribute('data-upcoming-fact'))).toEqual(['field', 'purse', 'par', 'yards']);
  });
  it('(d) points Behind is an em dash for the leader and the formatted difference for other rows', () => {
    const data: SeasonRecapData = { events: 0, winners: 0, maxWins: 0, mostWinsSurname: null, tiedLeaders: 0, standingsSource: null, cardLine: null, cardEarners: [],
      standings: ['Ross Steelman', 'Sandy Scott', 'Ian Holt'].map((name, i) => ({ position: i + 1, name, playerId: null, points: [2221, 2191, 1618][i] })) };
    const v = mount(<RecapStandings tour="pgad" data={data} />);
    expect([...v.container.querySelectorAll('[data-recap-behind]')].map(c => c.textContent)).toEqual(['—', '30', '603']);
    expect(v.container.querySelector('[data-recap-trophy]')).not.toBeNull();
    expect(v.container.querySelectorAll('.recap-pts')).toHaveLength(3);
  });
});