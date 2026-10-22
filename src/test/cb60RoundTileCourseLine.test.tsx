import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Same harness as exploreRoundTileLikedByNoBubble.test.tsx (no react-i18next mock).
vi.mock('@/hooks/usePostLikers', () => ({
  usePostLikers: () => ({ likers: [], isLoading: false }),
  likerFirstNames: () => [],
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/components/likes/LikesSheet', () => ({ LikesSheet: () => null }));

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { roundPostItem } from '@/components/feed/roundPostItem';
import type { PostRound } from '@/hooks/feed/usePostRounds';

afterEach(cleanup);

const round = {
  whsScoreId: 's1', totalHoles: 18, grossScore: 80, netScore: 76, courseHandicap: 4, coursePar: 72,
  deltaIndex: null, playDate: '2026-09-15', birdies: 0, eagles: 0, albatrosses: 0, holesInOne: 0,
  beatPar: false, cleanCard: false, slopeRating: null, longestBirdieRun: null, holeShape: null, crown: null,
  whsCourseName: 'St Pierre-Old Course',
} as PostRound;

const courseLine = (item: ReturnType<typeof roundPostItem>) =>
  render(<ExploreCard item={item} size="std" feedPlot onTap={() => {}} />)
    .container.querySelector('[data-feed-round-course="true"]');

describe('CB60 round tile course line', () => {
  it('course_id null with an England Golf name renders that name', () => {
    const item = roundPostItem({ id: 'p1', userId: 'u1', courseId: null, courseName: null } as never, round, 'me');
    expect(item.subject?.course_name).toBe('St Pierre-Old Course');
    expect(item.subject?.course_id).toBeNull();
    expect(courseLine(item)?.textContent).toBe('St Pierre-Old Course');
  });
  it('a catalogue name wins over the England Golf name', () => {
    const item = roundPostItem({ id: 'p1', userId: 'u1', courseId: 'c1', courseName: 'St Pierre (Old)' } as never, round, 'me');
    expect(courseLine(item)?.textContent).toBe('St Pierre (Old)');
  });
  it('with neither name, no course line element renders', () => {
    const item = roundPostItem({ id: 'p1', userId: 'u1', courseId: null, courseName: null } as never, { ...round, whsCourseName: null }, 'me');
    expect(courseLine(item)).toBeNull();
  });
});
