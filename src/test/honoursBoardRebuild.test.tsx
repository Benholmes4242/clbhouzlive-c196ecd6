import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  HonoursBoard,
  groupLeaders,
  PLAQUE_W,
  CARD_H,
  ACE_GROUND,
  ALBATROSS_GROUND,
  METAL_INK,
  METAL_YEAR,
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

  it('ranks albatross above ace with champagne and bone feat blocks only', () => {
    const { container } = render(
      <HonoursBoard
        events={[
          ev({ id: 'albatross', kind: 'albatross', at: '2024-06-03T00:00:00Z' }),
          ev({ id: 'ace-1', at: '2024-06-02T00:00:00Z' }),
          ev({ id: 'ace-2', at: '2024-06-01T00:00:00Z' }),
        ]}
      />,
    );
    const champagne = container.querySelector<HTMLElement>('[data-honours-feat-block="albatross"]');
    const bone = [...container.querySelectorAll<HTMLElement>('[data-honours-feat-block="ace"]')];
    expect(champagne?.dataset.honoursMetal).toBe(ALBATROSS_GROUND);
    expect(bone).toHaveLength(2);
    expect(bone.every((head) => head.dataset.honoursMetal === ACE_GROUND)).toBe(true);
    /* ONE MATERIAL: the metal ground now lives on the card shell, full height;
       the feat block carries no background of its own. */
    expect(champagne?.parentElement?.style.backgroundImage).toBe(ALBATROSS_GROUND);
    expect(bone[0].parentElement?.style.backgroundImage).toBe(ACE_GROUND);
    expect(champagne?.style.background).toBe('');
    expect(bone[0].style.background).toBe('');
  });

  it('uses full ink for feat copy, a measured quiet ink for the year, and ink for the course name on the one-material card', () => {
    const { container } = render(<HonoursBoard events={[ev({ id: 'a' })]} />);
    const head = container.querySelector<HTMLElement>('[data-honours-feat-block="ace"]');
    expect(head).toBeTruthy();
    const ink = 'rgb(11, 15, 20)';
    expect(screen.getByText('Ace').style.color).toBe(ink);
    expect(screen.getByText('Sam Fairway').style.color).toBe(ink);
    expect(screen.getByText(/Par 3/).style.color).toBe('rgba(11, 15, 20, 0.6)');
    expect(screen.getByText('2024').style.color).toBe('rgba(11, 15, 20, 0.6)');
    const course = screen.getByText('Royal Test');
    expect(course.style.color).toBe(ink);
    expect(course.parentElement?.style.borderTop.replace(/\s/g, '')).toBe('1pxsolidrgba(216,169,60,0.22)');
  });

  it('uses a lazy-loaded 40px squircle avatar in the unchanged 44px footprint', () => {
    const { container } = render(
      <HonoursBoard events={[ev({ id: 'a', actorAvatar: 'https://example.com/avatar.jpg' })]} />,
    );
    const avatar = container.querySelector('img');
    expect(avatar?.getAttribute('loading')).toBe('lazy');
    const ring = container.querySelector<HTMLElement>('[data-honours-avatar-ring]');
    expect(ring?.style.width).toBe('44px');
    const outline = ring?.firstElementChild as HTMLElement | undefined;
    expect(outline?.style.width).toBe('40px');
    expect(outline?.style.outline.replace(/\s/g, '')).toBe('1pxsolidrgba(11,15,20,0.28)');
    expect(outline?.style.outlineOffset).toBe('0.5px');
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
