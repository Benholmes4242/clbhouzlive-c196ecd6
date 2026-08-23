import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  HonoursBoard,
  groupLeaders,
  PLAQUE_W,
  CARD_H,
  ACE_GROUND,
  PLATINUM_GROUND,
  METAL_INK,
  METAL_YEAR,
  METAL_SUPPORT,
  sortHonoursRail,
} from '@/components/explore-tab-new/courseled/HonoursBoard';
import type { WireEvent } from '@/components/explore-tab-new/hooks/useDiscoverWire';

function ev(over: Partial<WireEvent> & { id: string }): WireEvent {
  return {
    id: over.id,
    kind: 'ace',
    at: '2024-06-01T00:00:00Z',
    actorName: 'Sam Fairway',
    actorAvatar: null,
    userId: 'u1',
    isOwn: false,
    courseId: 'c1',
    courseName: 'Royal Test',
    scoreId: 's1',
    holeNo: 5,
    holePar: 3,
    holeYards: 152,
    ...over,
  } as unknown as WireEvent;
}

describe('BRIEF_HONOURS_BOARD_THE_HOLE', () => {
  it('leads each card with the member and puts hole, par and yardage beneath', () => {
    const { container } = render(
      <HonoursBoard events={[ev({ id: 'a', actorAvatar: 'https://example.com/avatar.jpg' })]} />,
    );
    expect(container.textContent).toMatch(/152/);
    expect(container.textContent).toMatch(/152 yds/i);
    expect(container.textContent).toMatch(/Par 3/);
    expect(screen.getByText('Ace')).toBeTruthy();
    expect(screen.getAllByText('Sam Fairway')).toHaveLength(1);
    expect(PLAQUE_W).toBe(206);
  });

  it('states the computed totals and the hedged rarity once, in the subline', () => {
    const { container } = render(
      <HonoursBoard
        events={[ev({ id: 'a' }), ev({ id: 'b' }), ev({ id: 'c', kind: 'albatross' })]}
      />,
    );
    expect(container.textContent).toMatch(/2 aces/);
    expect(container.textContent).toMatch(/1 albatross/);
    expect(container.textContent).toMatch(/all time/);
    expect(container.textContent).toMatch(/commonly quoted at 12,500 to 1/);
    /* E — no card carries the odds: it is said once, above the rail. */
    expect(container.textContent!.match(/12,500/g)).toHaveLength(1);
  });

  it('carries NO recent / leaders toggle on the section', () => {
    render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    expect(screen.queryByRole('button', { name: /Leaders/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Recent$/i })).toBeNull();
  });

  it('gives every card in the rail the same declared height and width', () => {
    const { container } = render(
      <HonoursBoard
        events={[ev({ id: 'a', userId: 'u1' }), ev({ id: 'b', userId: 'u1' })]}
      />,
    );
    /* H — a member with two feats appears twice, in two identical cards. */
    const cards = [...container.querySelectorAll('button')];
    expect(cards).toHaveLength(2);
    for (const c of cards) {
      expect((c as HTMLElement).style.height).toBe(`${CARD_H}px`);
      expect((c as HTMLElement).style.width).toBe(`${PLAQUE_W}px`);
    }
  });

  it('ranks albatross above ace with platinum and gold feat blocks only', () => {
    const { container } = render(
      <HonoursBoard
        events={[
          ev({ id: 'albatross', kind: 'albatross', at: '2024-06-03T00:00:00Z' }),
          ev({ id: 'ace-1', at: '2024-06-02T00:00:00Z' }),
          ev({ id: 'ace-2', at: '2024-06-01T00:00:00Z' }),
        ]}
      />,
    );
    const platinum = container.querySelector<HTMLElement>('[data-honours-feat-block="albatross"]');
    const gold = [...container.querySelectorAll<HTMLElement>('[data-honours-feat-block="ace"]')];
    expect(platinum?.dataset.honoursMetal).toBe(PLATINUM_GROUND);
    expect(gold).toHaveLength(2);
    expect(gold.every((head) => head.dataset.honoursMetal === ACE_GROUND)).toBe(true);
    expect(platinum?.parentElement?.style.background).not.toBe(PLATINUM_GROUND);
    expect(gold[0].parentElement?.style.background).not.toBe(ACE_GROUND);
  });

  it('uses full ink for feat copy and a measured quiet ink for the year', () => {
    const { container } = render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    const head = container.querySelector<HTMLElement>('[data-honours-feat-block="ace"]');
    expect(head).toBeTruthy();
    const ink = 'rgb(15, 23, 42)';
    expect(screen.getByText('Ace').style.color).toBe(ink);
    expect(screen.getByText('Sam Fairway').style.color).toBe(ink);
    expect(screen.getByText(/Par 3/).style.color).toBe('rgba(15, 23, 42, 0.8)');
    expect(screen.getByText('2024').style.color).toBe('rgba(15, 23, 42, 0.8)');
  });

  it('uses a lazy-loaded 44px squircle avatar on every card', () => {
    const { container } = render(
      <HonoursBoard events={[ev({ id: 'a', actorAvatar: 'https://example.com/avatar.jpg' })]} />,
    );
    const avatar = container.querySelector('img');
    expect(avatar?.getAttribute('loading')).toBe('lazy');
    expect(avatar?.parentElement?.style.width).toBe('44px');
  });

  it('renders the member name with no "You" substitution', () => {
    render(<HonoursBoard events={[ev({ id: 'a', isOwn: true })]} />);
    expect(screen.getByText('Sam Fairway')).toBeTruthy();
    expect(screen.queryByText('You')).toBeNull();
  });

  it('orders rarity first, then most recent within each rarity', () => {
    const ordered = sortHonoursRail([
      ev({ id: 'new-ace', at: '2025-01-01T00:00:00Z' }),
      ev({ id: 'old-albatross', kind: 'albatross', at: '2020-01-01T00:00:00Z' }),
      ev({ id: 'new-albatross', kind: 'albatross', at: '2024-01-01T00:00:00Z' }),
    ]);
    expect(ordered.map((event) => event.id)).toEqual(['new-albatross', 'old-albatross', 'new-ace']);
  });

  it('still ranks leaders for the sheet: total, then albatrosses, then recency', () => {
    const leaders = groupLeaders([
      ev({ id: 'a', userId: 'u1', at: '2020-01-01T00:00:00Z' }),
      ev({ id: 'b', userId: 'u1', at: '2021-01-01T00:00:00Z' }),
      ev({ id: 'c', userId: 'u2', kind: 'albatross', at: '2019-01-01T00:00:00Z' }),
      ev({ id: 'd', userId: 'u3', at: '2025-01-01T00:00:00Z' }),
    ]);
    expect(leaders.map((l) => l.userId)).toEqual(['u1', 'u2', 'u3']);
    expect(leaders[0].events[0].id).toBe('b');
  });

  it('groups by member id, never by display name', () => {
    expect(
      groupLeaders([
        ev({ id: 'a', userId: 'u1', actorName: 'Sam Fairway' }),
        ev({ id: 'b', userId: 'u2', actorName: 'Sam Fairway' }),
      ]),
    ).toHaveLength(2);
  });

  it('renders nothing for an empty board', () => {
    const { container } = render(<HonoursBoard events={[]} />);
    expect(container.textContent).toBe('');
  });
});
