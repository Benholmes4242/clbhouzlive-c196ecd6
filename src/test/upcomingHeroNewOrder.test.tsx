/** TOUR OVERVIEW · UPCOMING HERO new order: facts → last year → course → picks,
 * scorecard course block and row-style upcoming picks. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }), Trans: () => null }));

const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: i === 4 || i === 13 ? 5 : i === 2 || i === 11 ? 3 : 4, yards: 350 + i * 10, course_par: 72, course_name: 'C' }));
const f = vi.hoisted(() => ({ picks: [] as Array<{ playerId: string; playerName: string }>, tees: new Map<string, string>() }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: f.picks.length ? { topContenders: f.picks, tournament: { name: 'Event' } } : null }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: f.tees, isFetched: true }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup', () => ({ LeadersGroup: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/useUpcomingOverview', () => ({ useUpcomingOverview: () => ({ field: [{ id: 'x', name: 'X' }], drawn: false, first: null, last: [{ rank: '1', name: 'Winner', country: 'USA', score: '−20', year: '2025' }], zone: null, startDate: null, holes }) }));

import { UpcomingLastYear } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { UpcomingCourse, UpcomingFacts } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';

const wrap = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
afterEach(() => { cleanup(); f.picks = []; f.tees = new Map(); });

describe('upcoming hero new order', () => {
  it('renders facts, Last year, course, then picks with no THE EVENT kicker', () => {
    f.picks = [{ playerId: 'a', playerName: 'Alpha One' }];
    const v = wrap(<HeroBoardSection tournamentId="e" entries={[]} currentRound={null} venuePar={72} phase="upcoming" />);
    const order = [...v.container.querySelectorAll('[data-overview-event],[data-overview-last-year],[data-overview-course],[data-overview-picks]')]
      .map(el => ['data-overview-event', 'data-overview-last-year', 'data-overview-course', 'data-overview-picks'].find(a => el.hasAttribute(a)));
    expect(order).toEqual(['data-overview-event', 'data-overview-last-year', 'data-overview-course', 'data-overview-picks']);
    expect(v.container.querySelector('[data-overview-event] h2')).toBeNull();
  });
  it('facts row is the flex space-between band with four cells', () => {
    const v = wrap(<UpcomingFacts first={null} zone={null} field={132} purse={3000000} par={71} yards={6860} />);
    expect(v.container.querySelector('[data-overview-facts]')?.classList.contains('upcoming-event-facts')).toBe(true);
    expect(v.container.querySelectorAll('[data-upcoming-fact]')).toHaveLength(4);
    const css = readFileSync('src/styles/hybrid-hero.css', 'utf8');
    expect(css).toContain('.upcoming-event-facts{display:flex;justify-content:space-between;gap:8px;margin:20px 20px 0}');
  });
  it('course renders OUT/IN scorecards with summed totals, par-5 marks and no bar strip', () => {
    const v = wrap(<UpcomingCourse holes={holes} tournamentId="e" />);
    const cards = v.container.querySelectorAll('[data-scorecard-card]');
    expect(cards).toHaveLength(2);
    cards.forEach((card, c) => {
      const nine = holes.slice(c * 9, c * 9 + 9);
      expect(card.querySelectorAll('.n')).toHaveLength(10);
      expect(card.querySelector('[data-scorecard-yards-total]')?.textContent).toBe(nine.reduce((a, h) => a + h.yards, 0).toLocaleString('en-GB'));
      expect(card.querySelector('[data-scorecard-par-total]')?.textContent).toBe(String(nine.reduce((a, h) => a + h.par, 0)));
    });
    expect(v.container.querySelectorAll('.p[data-par5]')).toHaveLength(2);
    expect(v.container.querySelector('.tv-strip, .tv-strip-key')).toBeNull();
  });
  it('shows the lead line alone when any hole lacks par or yards', () => {
    const v = wrap(<UpcomingCourse holes={holes.map(h => h.hole_no === 7 ? { ...h, yards: 0 } : h)} tournamentId="e" />);
    expect(v.container.querySelector('.tv-lead')).not.toBeNull();
    expect(v.container.querySelector('[data-scorecard-card]')).toBeNull();
  });
  it('COURSE GUIDE uses the kicker class and navigates to ?section=course', () => {
    const Loc = () => <output role="status">{useLocation().search}</output>;
    wrap(<><UpcomingCourse holes={holes} tournamentId="e" /><Loc /></>);
    const btn = document.querySelector<HTMLElement>('[data-course-guide]');
    expect(btn?.classList.contains('upcoming-sec-kick')).toBe(true);
    fireEvent.click(btn!);
    expect(screen.getByRole('status').textContent).toBe('?section=course');
  });
  it('upcoming picks are full-name rows sorted by tee time with 32px avatars', () => {
    f.picks = [{ playerId: 'a', playerName: 'Alpha One' }, { playerId: 'b', playerName: 'Bravo Two' }, { playerId: 'c', playerName: 'Charlie Three' }];
    const base = Date.now() + 3 * 86_400_000;
    f.tees = new Map([['a', new Date(base + 7_200_000).toISOString()], ['c', new Date(base).toISOString()]]);
    const v = wrap(<HeroBoardSection tournamentId="e" entries={[]} currentRound={null} phase="upcoming" />);
    const rows = [...v.container.querySelectorAll<HTMLElement>('[data-overview-pick-row]')];
    expect(rows.map(r => r.querySelector('[data-overview-pick-name]')?.textContent)).toEqual(['Charlie Three', 'Alpha One', 'Bravo Two']);
    expect(rows[2].querySelector('[data-overview-pick-tee]')).toBeNull();
    expect(v.container.querySelector('[data-overview-picks-grid]')).toBeNull();
    const avatar = rows[0].querySelector<HTMLElement>('[data-overview-pick-avatar] > *');
    expect(avatar?.outerHTML).toMatch(/32px|"32"/);
  });
  it('≤340px rule narrows the total column to 36px and yards to 10.5px', () => {
    const css = readFileSync('src/styles/hybrid-hero.css', 'utf8');
    const rule = css.slice(css.indexOf('@media (max-width:340px){.upcoming-event-facts'));
    expect(rule).toContain('grid-template-columns:repeat(9,minmax(0,1fr)) 36px');
    expect(rule).toContain('.upcoming-sct .y{font-size:10.5px;letter-spacing:-.01em}');
  });
  it('computed: course sits 30px under Last year and fact cells carry no padding', () => {
    const style = document.createElement('style');
    style.textContent = readFileSync('src/styles/hybrid-hero.css', 'utf8').replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '');
    document.head.appendChild(style);
    try {
      const v = wrap(<><UpcomingFacts first={null} zone={null} field={132} purse={3000000} par={71} yards={6860} /><UpcomingLastYear rows={[{ rank: '1', name: 'Winner', country: 'USA', score: '−20', year: '2025' }]} /><UpcomingCourse holes={holes} tournamentId="e" /></>);
      const course = v.container.querySelector<HTMLElement>('[data-overview-course]')!;
      expect(course.previousElementSibling?.hasAttribute('data-overview-last-year')).toBe(true);
      expect(getComputedStyle(course).paddingTop).toBe('30px');
      const cells = v.container.querySelectorAll<HTMLElement>('[data-upcoming-fact]');
      expect(cells.length).toBe(4);
      // jsdom reports an undeclared padding as '' (initial 0px); the old var() rule would report its own value.
      cells.forEach(cell => { const cs = getComputedStyle(cell); for (const v of [cs.padding, cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft]) expect(['', '0px']).toContain(v); });
    } finally { style.remove(); }
  });
});
