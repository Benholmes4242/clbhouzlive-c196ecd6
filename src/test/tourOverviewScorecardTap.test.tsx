import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { MiniBoard } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';

vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({
  ScorecardSheet: ({ open, target }: { open: boolean; target: { playerId: string } | null }) =>
    open && target ? <div role="dialog" data-target={target.playerId} /> : null,
}));

afterEach(cleanup);

const mount = (entries: BoardEntry[]) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <MiniBoard tournamentId="event" entries={entries} limit={5} currentRound={2} phase="live" theme="heroBoard" totalRounds={4} />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('heroBoard row tap opens a round panel', () => {
  it('opens the tapped player panel and preserves the full-scorecard door', () => {
    const entries = [
      { id: 'a', position: 1, score: -6, thru: 9, round_1: -1, round_2: -5, player: { id: 'pa', full_name: 'Alan Barker' } },
      { id: 'b', position: 2, score: -4, thru: 8, round_1: -4, round_2: 0, player: { id: 'pb', full_name: 'Brian Cole' } },
    ] as unknown as BoardEntry[];
    const view = mount(entries);
    const rows = view.container.querySelectorAll('button[data-hero-board-row]');
    expect(rows.length).toBe(2);
    expect(rows[1].hasAttribute('aria-pressed')).toBe(false);
    fireEvent.click(rows[1]);
    expect(rows[1]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('dialog')).toBeNull();
    const door = view.container.querySelector('[data-hero-full-scorecard]');
    if (!door) throw new Error('Missing full-scorecard door');
    fireEvent.click(door);
    expect(screen.getByRole('dialog').getAttribute('data-target')).toBe('pb');
  });

  it('a team row with no player id is not a button', () => {
    const entries = [
      { id: 't', position: 1, score: -8, thru: 9, round_1: -4, round_2: -4, team: { id: 'team', display_name: 'Team One', members: [] } },
    ] as unknown as BoardEntry[];
    const view = mount(entries);
    expect(view.container.querySelectorAll('button').length).toBe(0);
  });
});

describe('movement card to-par colour', () => {
  it('pick-style movers have direction-only arrows and independent white place counts', () => {
    const view = render(<RoundMovementBand round={3} cards={[{ key:'up',name:'Tommy Fleetwood',candidates:[],delta:18,toPar:-8,gross:64 },{ key:'down',name:'Stefano Mazzoli',candidates:[],delta:-31,toPar:5,gross:77 }]} />);
    const cards = view.container.querySelectorAll<HTMLElement>('[data-overview-movement-card]');
    for (const card of cards) {
      expect(card.style.background).toBe('transparent'); expect(card.style.borderRadius).toBe('12px'); expect(card.style.padding).toBe('7px');
      expect(card.querySelector('[style*="width: 28px"]')).not.toBeNull();
      expect(card.querySelector<HTMLElement>('[data-movement-places]')?.style.color).toBe('rgb(248, 250, 252)');
    }
    expect(view.container.querySelector<HTMLElement>('[data-movement-dir="up"]')?.style.color).toBe('rgb(52, 215, 127)');
    expect(view.container.querySelector<HTMLElement>('[data-movement-dir="down"]')?.style.color).toBe('rgb(194, 74, 74)');
    expect(view.container.querySelector('[data-movement-dir="up"]')?.textContent?.trim()).toBe('▲');
    expect(view.container.querySelector('[data-movement-dir="down"]')?.textContent?.trim()).toBe('▼');
  });
  const card = (toPar: number, gross: number | null) => ({ key: `k${toPar}${gross}`, name: 'Alan Barker', candidates: [], delta: 2, toPar, gross });

  it('under par takes the under-par colour; level and over take the colour law', () => {
    const view = render(<RoundMovementBand round={2} cards={[card(-6, 64), card(0, null), card(2, null)]} />);
    const figures = view.container.querySelectorAll<HTMLElement>('[data-movement-topar]');
    expect(figures[0].style.color).toBe(rgb(getScoreColor(-6, 'dark')));
    expect(figures[1].style.color).toBe(rgb(getScoreColor(0, 'dark')));
    expect(figures[2].style.color).toBe(rgb(getScoreColor(2, 'dark')));
    expect(figures[0].style.color).not.toBe(figures[2].style.color);
  });

  it('drops the brackets when no gross is present', () => {
    const view = render(<RoundMovementBand round={2} cards={[card(-4, null), card(-6, 64)]} />);
    const scores = view.container.querySelectorAll('[data-movement-score]');
    expect(scores[0].textContent).toBe('\u22124');
    expect(scores[1].textContent).toBe('\u22126');
  });

  it('drops gross 77 and brackets while keeping bare +5 in the tight figure line', () => {
    const view = render(<RoundMovementBand round={3} cards={[card(5, 77)]} />);
    const chip = view.container.querySelector<HTMLElement>('[data-overview-movement-card]');
    expect(chip?.style.height).toBe('46px');
    expect(chip?.querySelector('[data-movement-score]')?.textContent).toBe('+5');
    expect(chip?.querySelector('[data-movement-gross]')).toBeNull();
    expect(chip?.textContent).not.toMatch(/77|[()]/);
    expect((chip?.children[1].children[1] as HTMLElement)?.style.marginTop).toBe('1px');
  });
});

/** jsdom normalises inline colours to rgb()/rgba(); compare in the same form. */
function rgb(color: string): string {
  const probe = document.createElement('span');
  probe.style.color = color;
  return probe.style.color;
}
