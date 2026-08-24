import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  HonoursBoard,
  groupLeaders,
  PLAQUE_W,
  CARD_H,
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
  it('leads each card with the yardage and puts the hole and par beneath', () => {
    const { container } = render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    expect(container.textContent).toMatch(/152/);
    expect(container.textContent).toMatch(/YARDS/i);
    expect(container.textContent).toMatch(/Par 3/);
    expect(screen.getByText('Ace')).toBeTruthy();
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

  it('shows no photograph on any card', () => {
    const { container } = render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('renders the member name with no "You" substitution', () => {
    render(<HonoursBoard events={[ev({ id: 'a', isOwn: true })]} />);
    expect(screen.getByText('Sam Fairway')).toBeTruthy();
    expect(screen.queryByText('You')).toBeNull();
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
