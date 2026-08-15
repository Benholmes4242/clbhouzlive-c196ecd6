import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  HonoursBoard,
  groupHonours,
  HONOURS_FEATS_BEFORE_COLLAPSE,
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
    holeNo: 7,
    holePar: 3,
    holeYards: 165,
    ...over,
  } as unknown as WireEvent;
}

describe('BRIEF_HONOURS_BOARD_PLAYER_LED', () => {
  it('groups by member id, never by display name', () => {
    const groups = groupHonours([
      ev({ id: 'a', userId: 'u1', actorName: 'Sam Fairway' }),
      ev({ id: 'b', userId: 'u2', actorName: 'Sam Fairway' }),
    ]);
    expect(groups).toHaveLength(2);
  });

  it('orders groups by feat count then recency, and does not pin the member', () => {
    const groups = groupHonours([
      ev({ id: 'a', userId: 'me', isOwn: true, at: '2025-01-01T00:00:00Z' }),
      ev({ id: 'b', userId: 'u2', at: '2020-01-01T00:00:00Z' }),
      ev({ id: 'c', userId: 'u2', at: '2021-01-01T00:00:00Z' }),
    ]);
    expect(groups[0].userId).toBe('u2');
    expect(groups[0].events[0].id).toBe('c');
  });

  it('renders one counted badge per distinct feat kind', () => {
    render(
      <HonoursBoard
        events={[
          ev({ id: 'a' }),
          ev({ id: 'b' }),
          ev({ id: 'c', kind: 'albatross', holePar: 5 }),
        ]}
      />,
    );
    expect(screen.getByText(/Albatross/)).toBeTruthy();
    expect(screen.getByText(/×2/)).toBeTruthy();
  });

  it('never prints the feat as a row line', () => {
    const { container } = render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    expect(container.textContent).not.toMatch(/Hole in one/i);
    expect(container.textContent).toMatch(/Par 3/);
    expect(container.textContent).toMatch(/165/);
  });

  it('collapses only above the threshold, with a real button that toggles', () => {
    const three = [1, 2, 3].map((n) => ev({ id: `x${n}`, at: `202${n}-01-01T00:00:00Z` }));
    const { unmount } = render(<HonoursBoard events={three} />);
    expect(screen.queryByRole('button', { name: /more/i })).toBeNull();
    unmount();

    const four = [...three, ev({ id: 'x4', at: '2019-01-01T00:00:00Z' })];
    render(<HonoursBoard events={four} />);
    const btn = screen.getByRole('button', { name: /1 more/i });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: /Show less/i }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: /Show less/i }));
    expect(screen.getByRole('button', { name: /1 more/i })).toBeTruthy();
    expect(HONOURS_FEATS_BEFORE_COLLAPSE).toBe(3);
  });

  it('renders nothing for an empty board and one group for one player', () => {
    const { container, unmount } = render(<HonoursBoard events={[]} />);
    expect(container.textContent).toBe('');
    unmount();
    render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    expect(screen.getByText('Royal Test')).toBeTruthy();
  });
});
