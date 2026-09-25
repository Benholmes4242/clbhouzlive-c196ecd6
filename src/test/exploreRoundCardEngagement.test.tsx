import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExploreCard, type RoundCardEngagement } from '@/features/explore-magazine/ExploreCard';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { CELEBRATE_GLYPH_SIZE } from '@/lib/reactionKind';
import { playDateFull } from '@/features/explore-magazine/exploreCopy';
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
    expect(view.container.querySelector('[data-round-identity-meta="true"]')).toBeNull();
    expect(view.container.querySelector('[data-round-identity-course="true"]')?.textContent).toBe('Test Course');
    expect(view.container.querySelector('[data-round-identity-date="true"]')?.textContent).toBe(playDateFull('2026-09-15'));
    expect(view.container.querySelector('[data-round-identity-figures="true"]')?.textContent).toContain('NET76VS HCP+4');
    expect(view.container.querySelector('[data-round-reactions-row="true"] [data-round-reactions="controls"]')).not.toBeNull();
    expect(view.container.querySelector('[data-explore-headline="true"]')).toBeNull();
    expect(view.container.querySelector('[data-explore-kicker="true"]')).toBeNull();
  });

  it('keeps course and full play date on separate lines and includes a prior year', () => {
    const priorYear = `${new Date().getFullYear() - 1}-09-13`;
    const view = render(
      <ExploreCard item={{ ...item, facts: { ...item.facts, play_date: priorYear } }} size="std" onTap={vi.fn()} engagement={engagement()} />,
    );
    const course = view.container.querySelector<HTMLElement>('[data-round-identity-course="true"]');
    const date = view.container.querySelector<HTMLElement>('[data-round-identity-date="true"]');
    expect(course?.textContent).toBe('Test Course');
    expect(course?.style.textOverflow).toBe('ellipsis');
    expect(date?.textContent).toBe(playDateFull(priorYear));
    expect(date?.textContent).toContain(String(new Date().getFullYear() - 1));
    expect(date?.style.textOverflow).toBe('');
  });

  it('shows both controls with a post and only the available subset without one', () => {
    const both = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement()} />);
    expect(both.getByRole('button', { name: 'Celebrate this round' })).toBeTruthy();
    expect(both.getByRole('button', { name: 'Comments, 0' })).toBeTruthy();
    both.unmount();

    const likeOnly = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement({ commentAvailable: false })} />);
    expect(likeOnly.getByRole('button', { name: 'Celebrate this round' })).toBeTruthy();
    expect(likeOnly.queryByRole('button', { name: /Comments/ })).toBeNull();
    likeOnly.unmount();

    const neither = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={null} />);
    expect(neither.container.querySelector('[data-round-reactions]')).toBeNull();
  });

  /* BRIEF_CELEBRATE_GLYPH_AND_NAMES_LINE: a ROUND is celebrated with the
     clap (Phosphor hands-clapping fill, one path), not the Heart. State is
     carried by colour, so the path stays currentColor. */
  it('uses amber for the celebrated clap and count, never the under-par red', () => {
    const view = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement({ liked: true, likeCount: 4 })} />);
    const control = view.getByRole('button', { name: 'Celebrated' });
    expect(control.style.color).toBe('rgb(247, 147, 30)');
    const svg = control.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 256 256');
    expect(svg?.classList.contains('lucide-heart')).toBe(false);
    expect(svg?.querySelectorAll('path')).toHaveLength(1);
    expect(svg?.querySelector('path')?.getAttribute('fill')).toBe('currentColor');
    expect(control.style.color).not.toMatch(/255,?\s*107,?\s*96/i);
  });

  it('stops card propagation and invokes the requested action immediately', () => {
    const cardTap = vi.fn();
    const toggle = vi.fn();
    const openComments = vi.fn();
    const view = render(
      <ExploreCard item={item} size="std" onTap={cardTap} engagement={engagement({ onToggleLike: toggle, onOpenComments: openComments })} />,
    );
    fireEvent.click(view.getByRole('button', { name: 'Celebrate this round' }));
    expect(toggle).toHaveBeenCalledOnce();
    expect(cardTap).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: 'Comments, 0' }));
    expect(openComments).toHaveBeenCalledOnce();
    expect(cardTap).not.toHaveBeenCalled();
  });

  /* BRIEF_CELEBRATE_ROW_CONSISTENCY §1: clap and comment share one 44x44
     footprint and both glyphs read CELEBRATE_GLYPH_SIZE — asserted against
     the imported constant, never a typed number. */
  it('hides zero numerals and keeps 44 by 44 tap targets on both controls', () => {
    const view = render(<ExploreCard item={item} size="std" onTap={vi.fn()} engagement={engagement()} />);
    const like = view.getByRole('button', { name: 'Celebrate this round' });
    const comment = view.getByRole('button', { name: 'Comments, 0' });
    expect(like.textContent).toBe('');
    for (const control of [like, comment]) {
      expect(control.style.minWidth).toBe('44px');
      expect(control.style.height).toBe('44px');
      expect(control.querySelector('svg')?.getAttribute('width')).toBe(String(CELEBRATE_GLYPH_SIZE));
    }
  });

  /* The dense pair variant keeps its own 14 and is NOT tied to the constant. */
  it('keeps the pair glyphs at their own dense size', () => {
    const view = render(<ExploreCard item={item} size="pair" onTap={vi.fn()} engagement={engagement({ likeCount: 3, commentCount: 2 })} />);
    const svgs = view.container.querySelectorAll('[data-round-reactions="counts"] svg');
    expect(svgs.length).toBe(2);
    svgs.forEach((svg) => expect(svg.getAttribute('width')).toBe('14'));
  });

  it('shows non-interactive nonzero counts on a pair and hides zeros', () => {
    const view = render(<ExploreCard item={item} size="pair" onTap={vi.fn()} engagement={engagement({ likeCount: 3, commentCount: 0 })} />);
    const counts = view.container.querySelector('[data-round-reactions="counts"]');
    expect(counts?.textContent).toBe('3');
    expect(view.queryByRole('button', { name: 'Celebrate this round' })).toBeNull();
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