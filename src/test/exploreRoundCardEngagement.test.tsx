import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExploreCard, type RoundCardEngagement } from '@/features/explore-magazine/ExploreCard';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

const item: StreamItem = {
  id: 'round:score-1', kind: 'round', ring: 'own', lane: 'news', score: 1,
  consequence: null,
  subject: { course_id: null, course_name: 'Test Course', region: null, sub_country: null, image_url: null, pending: false },
  who: { user_id: 'player', display_name: 'A player name long enough to require ellipsis', photo_url: null, is_viewer: false },
  facts: { score_id: 'score-1', gross: 80, to_par: 8, net: 76, course_par: 72, course_handicap: 4, play_date: '2026-09-15' },
  payload: {}, seen: false,
};

function engagement(patch: Partial<RoundCardEngagement> = {}): RoundCardEngagement {
  return {
    likeCount: 0,
    liked: false,
    likeAvailable: true,
    commentCount: 0,
    commentAvailable: true,
    onToggleLike: vi.fn(),
    onOpenComments: vi.fn(),
    ...patch,
  };
}

describe('Explore round-card who-line engagement', () => {
  it('uses identity and figures as the always-present row with reactions beneath', () => {
    const view = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement()} />);
    expect(view.container.querySelector('[data-explore-stat-strip="round"]')).toBeNull();
    expect(view.container.querySelector('[data-round-identity-row="true"]')).not.toBeNull();
    expect(view.container.querySelector('[data-round-identity-meta="true"]')?.textContent).toContain('Test Course');
    expect(view.container.querySelector('[data-round-identity-figures="true"]')?.textContent).toContain('NET76VS HCP+4');
    expect(view.container.querySelector('[data-round-reactions-row="true"] [data-round-reactions="controls"]')).not.toBeNull();
    expect(view.container.querySelector('[data-explore-headline="true"]')).toBeNull();
    expect(view.container.querySelector('[data-explore-kicker="true"]')).toBeNull();
  });

  it('shows both controls with a post and only the available subset without one', () => {
    const both = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement()} />);
    expect(both.getByRole('button', { name: 'Like, 0 likes' })).toBeTruthy();
    expect(both.getByRole('button', { name: 'Comments, 0' })).toBeTruthy();
    both.unmount();

    const likeOnly = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement({ commentAvailable: false })} />);
    expect(likeOnly.getByRole('button', { name: 'Like, 0 likes' })).toBeTruthy();
    expect(likeOnly.queryByRole('button', { name: /Comments/ })).toBeNull();
    likeOnly.unmount();

    const neither = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={null} />);
    expect(neither.container.querySelector('[data-round-reactions]')).toBeNull();
  });

  it('uses amber for the liked icon and count, never the under-par red', () => {
    const view = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement({ liked: true, likeCount: 4 })} />);
    const control = view.getByRole('button', { name: 'Like, 4 likes' });
    expect(control.style.color).toBe('rgb(247, 147, 30)');
    expect(control.querySelector('svg')?.getAttribute('fill')).toBe(A.AMBER);
    expect(control.style.color).not.toMatch(/255,?\s*107,?\s*96/i);
  });

  it('stops card propagation and invokes the requested action immediately', () => {
    const cardTap = vi.fn();
    const toggle = vi.fn();
    const openComments = vi.fn();
    const view = render(
      <ExploreCard item={item} size="std" onTap={cardTap} engagement={engagement({ onToggleLike: toggle, onOpenComments: openComments })} />,
    );
    fireEvent.click(view.getByRole('button', { name: 'Like, 0 likes' }));
    expect(toggle).toHaveBeenCalledOnce();
    expect(cardTap).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: 'Comments, 0' }));
    expect(openComments).toHaveBeenCalledOnce();
    expect(cardTap).not.toHaveBeenCalled();
  });

  it('hides zero numerals and keeps 40 by 32 tap targets', () => {
    const view = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement()} />);
    const like = view.getByRole('button', { name: 'Like, 0 likes' });
    expect(like.textContent).toBe('');
    expect(like.style.minWidth).toBe('40px');
    expect(like.style.height).toBe('32px');
  });

  it('shows non-interactive nonzero counts on a pair and hides zeros', () => {
    const view = render(<ExploreCard item={item} size="pair" onTap={vi.fn()} engagement={engagement({ likeCount: 3, commentCount: 0 })} />);
    const counts = view.container.querySelector('[data-round-reactions="counts"]');
    expect(counts?.textContent).toBe('3');
    expect(view.queryByRole('button', { name: 'Like, 3 likes' })).toBeNull();
    expect(view.queryByLabelText('Comments, 0')).toBeNull();
  });

  it('preserves a nonshrinking reaction group and ellipsising name', () => {
    const view = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement({ likeCount: 123, commentCount: 456 })} />);
    const group = view.container.querySelector<HTMLElement>('[data-round-reactions="controls"]');
    expect(group?.style.flex).toBe('0 0 auto');
    expect(group?.style.whiteSpace).toBe('nowrap');
    expect(view.getByText(item.who?.display_name ?? '').style.textOverflow).toBe('ellipsis');
  });
});