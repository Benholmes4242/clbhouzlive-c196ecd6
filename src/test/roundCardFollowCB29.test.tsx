import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';


import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import type { FeaturedRound } from '@/features/explore-magazine/useFeaturedRound';

afterEach(cleanup);

const item: StreamItem = {
  id: 'round:s1', kind: 'round', ring: 'own', lane: 'news', score: 1, consequence: null,
  subject: { course_id: null, course_name: 'Test Course', region: null, sub_country: null, image_url: null, pending: false },
  who: { user_id: 'author', display_name: 'Author', photo_url: null, is_viewer: false },
  facts: { score_id: 's1', gross: 80, to_par: 8, net: 76, course_par: 72, course_handicap: 4, play_date: '2026-09-15' },
  payload: {}, seen: false,
};

const round: FeaturedRound = {
  whs_score_id: 's1', user_id: 'author', display_name: 'Author', photo_url: null, course_id: 'c1',
  course_name: 'Test Course', image_url: null, play_date: '2026-09-15', gross: 70, course_par: 72, to_par: -2,
  stableford: null, birdies: null, eagles: null, albatrosses: null, holes_in_one: null, clean_card: null,
  net_score: 66, vs_hcp: -6, tier: 1, reason: 'x', joint_name: null, joint_count: null,
};

describe('CB29 follow control on round cards', () => {
  it('ExploreCard renders follow for another member and never opens the round on tap; absent on own round', () => {
    const onTap = vi.fn(); const onFollow = vi.fn();
    const v = render(<ExploreCard item={item} size="std" onTap={onTap} isFollowed={false} onFollow={onFollow} />);
    const ctl = v.container.querySelector('[data-round-identity-row="true"] [data-round-follow="true"] button');
    expect(ctl).not.toBeNull();
    fireEvent.click(ctl!);
    expect(onFollow).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();
    v.unmount();
    const own = render(<ExploreCard item={{ ...item, who: { ...item.who!, is_viewer: true } }} size="std" onTap={vi.fn()} isFollowed={false} onFollow={vi.fn()} />);
    expect(own.container.querySelector('[data-round-follow]')).toBeNull();
  });

  it('FeaturedRoundCard renders follow for another member and never opens the round on tap; absent on own round', () => {
    const onOpen = vi.fn(); const onFollow = vi.fn();
    const v = render(<FeaturedRoundCard round={round} viewerId="viewer" onOpen={onOpen} isFollowed={false} onFollow={onFollow} />);
    const ctl = v.container.querySelector('[data-featured-band="true"] [data-featured-follow="true"] button');
    expect(ctl).not.toBeNull();
    fireEvent.click(ctl!);
    expect(onFollow).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
    v.unmount();
    const own = render(<FeaturedRoundCard round={round} viewerId="author" onOpen={vi.fn()} isFollowed={false} onFollow={vi.fn()} />);
    expect(own.container.querySelector('[data-featured-follow]')).toBeNull();
  });
});
