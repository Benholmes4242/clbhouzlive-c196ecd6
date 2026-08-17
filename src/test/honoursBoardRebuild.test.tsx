import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  HonoursBoard,
  groupLeaders,
  PLAQUE_W,
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

describe('BRIEF_HONOURS_BOARD_PLAQUE_RAIL', () => {
  it('names the feat in words on every plaque and prints the hole detail', () => {
    const { container } = render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    expect(screen.getByText('Ace')).toBeTruthy();
    expect(container.textContent).toMatch(/Par 3/);
    expect(container.textContent).toMatch(/152/);
    expect(PLAQUE_W).toBe(168);
  });

  it('computes the headline, pluralises each part and omits a zero part', () => {
    const { container, unmount } = render(
      <HonoursBoard events={[ev({ id: 'a' }), ev({ id: 'b' })]} />,
    );
    expect(container.textContent).toMatch(/2 aces\./);
    expect(container.textContent).not.toMatch(/albatross/i);
    unmount();

    const { container: container2 } = render(
      <HonoursBoard events={[ev({ id: 'c' }), ev({ id: 'd', kind: 'albatross' })]} />,
    );
    expect(container2.textContent).toMatch(/1 ace\. 1 albatross\./);
  });

  it('opens on RECENT with two aria-pressed buttons and switches mode', () => {
    render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    const recent = screen.getByRole('button', { name: /Recent/i });
    const leaders = screen.getByRole('button', { name: /Leaders/i });
    expect(recent.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(leaders);
    expect(leaders.getAttribute('aria-pressed')).toBe('true');
  });

  it('ranks leaders by total, then albatrosses, then recency', () => {
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

  it('prints the year on each recent card', () => {
    render(
      <HonoursBoard
        events={[ev({ id: 'a', at: '2024-05-01T00:00:00Z' }), ev({ id: 'b', at: '2022-05-01T00:00:00Z' })]}
      />,
    );
    expect(screen.getAllByText('2024').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2022').length).toBeGreaterThan(0);
  });
});

