/** Upcoming/live scale adopts completed references without changing completed picks. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [], isLoading: false, isError: false }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));
vi.mock('@/features/tourhub/tournament-v2/sections/HeroRoundPanel', () => ({ HeroRoundPanel: () => null }));
vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({ useOurPickRecord: () => ({ data: null, isFetched: true, isLoading: false, fetchStatus: 'idle' }) }));
import { LiveHeroBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard';
import { LiveFacts } from '@/features/tourhub/components/overview-v3/LiveOverviewSections';
import { LastYearRow } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow';
import { PicksBlock } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
const css = readFileSync('src/styles/hybrid-hero.css', 'utf8');
const pickProps = { picks: [{ playerId: 'a', playerName: 'Alpha One' }] as never, tourCode: 'pga', boardByPlayer: new Map(), teeByPlayer: null, startedPlayers: new Set<string>(), championPlayerId: null, championPlayerIds: [], intro: null, onOpenPick: vi.fn(), tournamentId: 't', seasonYear: 2026, currentRound: null, pickResults: [], onOpenRecord: vi.fn() };
function required(root: ParentNode, selector: string): HTMLElement {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}
describe('overview type scale', () => {
  it('(a) live board has 31px rows, 13px names and 22px avatars', () => {
    const entry = { id: 'a', player: { id: 'a', full_name: 'Alpha One' }, position: 1, score: -1, round_1: -1, thru: 4 } as BoardEntry;
    const { container } = render(<LiveHeroBoard tournamentId="t" entries={[entry]} stage="round1" round={1} nextRound={null} />);
    expect(required(container, '[data-live-board-row]').style.minHeight).toBe('31px');
    expect(required(container, '.live-board-name-full').parentElement?.style.fontSize).toBe('13px');
    expect(required(container, '.live-board-face [style*="width: 22px"]').style.width).toBe('22px');
  });
  it('(b) live facts use 15px/700 figures and 800 labels', () => {
    const { container } = render(<LiveFacts cells={[{ key: 'lowRound', value: '−2', toPar: -2 }]} />);
    const figure = required(container, '[data-live-fact] b');
    expect(figure.style.fontSize).toBe('15px'); expect(figure.style.fontWeight).toBe('700');
    const rule = css.match(/\.upcoming-event-facts span\{([^}]+)\}/)?.[1];
    expect(rule).toContain('font-weight:800');
  });
  it('(c) LastYearRow has a 13px name', () => {
    const { container } = render(<LastYearRow rank="2" name="Alpha One" score="−2" />);
    expect(required(container, '[data-last-year-row]').children[1].getAttribute('style')).toContain('font-size: 13px');
  });
  it('(d) upcoming picks have 13px names and 26px avatars', () => {
    const { container } = render(<MemoryRouter><PicksBlock {...pickProps} phase="upcoming" /></MemoryRouter>);
    expect(required(container, '[data-overview-pick-name]').style.fontSize).toBe('13px');
    expect(required(container, '[data-overview-pick-avatar] [style*="width: 26px"]').style.width).toBe('26px');
  });
  it('(e) upcoming sections use the existing section-gap token', () => {
    expect(css.match(/\.upcoming-sec\{([^}]+)\}/)?.[1]).toContain('padding:var(--hero-section-gap)');
  });
  it('(f) completed picks retain their name and avatar sizes', () => {
    const { container } = render(<MemoryRouter><PicksBlock {...pickProps} phase="completed" /></MemoryRouter>);
    const name = required(container, '[data-overview-pick-name]');
    const avatar = required(container, '[data-overview-pick-avatar] [style*="width: 28px"]');
    expect({ name: name.style.fontSize, weight: name.style.fontWeight, avatar: avatar.style.width }).toEqual({ name: '12.5px', weight: '700', avatar: '28px' });
  });
});
