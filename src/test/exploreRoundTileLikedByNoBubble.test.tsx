import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// No react-i18next mock: ExploreCard reads i18n.language, as in exploreRoundCardEngagement.test.tsx.

const likers = [
  { userId: 'me', actorId: 'me', actorType: 'personal', displayName: 'Me', username: 'me', avatarUrl: null, handicapIndex: 5, isViewer: true, isFollowing: false, businessType: null },
  { userId: 't', actorId: 't', actorType: 'personal', displayName: 'Thomas', username: 'thomas', avatarUrl: null, handicapIndex: 5, isViewer: false, isFollowing: true, businessType: null },
];
vi.mock('@/hooks/usePostLikers', () => ({
  usePostLikers: () => ({ likers, isLoading: false }),
  likerFirstNames: (l: any[], n: number) => l.slice(0, n).map((x) => x.displayName),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
// Stand-in sheet: renders a person row when open, so taps inside it can be fired.
vi.mock('@/components/likes/LikesSheet', () => ({
  LikesSheet: ({ open }: { open: boolean }) => (open ? <div data-likes-sheet><button type="button" data-person-row>row</button></div> : null),
}));

import { ExploreCard, type RoundCardEngagement } from '@/features/explore-magazine/ExploreCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

const item: StreamItem = {
  id: 'round:score-1', kind: 'round', ring: 'own', lane: 'news', score: 1,
  consequence: null,
  subject: { course_id: null, course_name: 'Test Course', region: null, sub_country: null, image_url: null, pending: false },
  who: { user_id: 'player', display_name: 'Ben', photo_url: null, is_viewer: false },
  facts: { score_id: 'score-1', gross: 80, to_par: 8, net: 76, course_par: 72, course_handicap: 4, play_date: '2026-09-15' },
  payload: {}, seen: false,
};
const engagement: RoundCardEngagement = {
  likeCount: 3, liked: true, likeAvailable: true, commentCount: 0, commentAvailable: true,
  onToggleLike: vi.fn(), onOpenComments: vi.fn(), reactionSubjectId: 'score-1',
};

describe('ExploreCard round tile and the celebrated row', () => {
  it('the celebrated row does not tap the tile; elsewhere still does, once', () => {
    const onTap = vi.fn();
    const v = render(<ExploreCard item={item} size="std" feedPlot onTap={onTap} engagement={engagement} />);
    const tile = v.container.querySelector('[data-feed-round-tile="true"]')!;
    expect(tile).not.toBeNull();
    const row = v.container.querySelector('[data-round-reactions-row="true"] button')!;
    fireEvent.click(row);
    expect(onTap).not.toHaveBeenCalled();
    fireEvent.click(v.container.querySelector('[data-feed-round-course="true"]')!);
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
