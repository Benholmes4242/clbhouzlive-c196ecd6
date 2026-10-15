import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { YourHundredSection } from '@/components/courses/top100/YourHundredSection';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';

vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback', () => ({ CourseImageFallback: () => null }));

afterEach(cleanup);

function e(id: string, o: Partial<Top100Enrichment> = {}): Top100Enrichment {
  return {
    courseId: id, rating: null, ratingCount: 0, roundsTracked: 0, avgOverPar: null, yourRounds: 0, yourBest: null,
    ratedByYou: false, yourRating: null, harderThanPct: null,
    subScores: { design: null, condition: null, facilities: null, clubhouse: null },
    playerCount: 0, recordGross: null, recordHolder: null, players: [], ...o,
  };
}

const ids = ['a', 'b', 'c', 'd'];
const enrichment = new Map([
  ['a', e('a', { yourRounds: 2, yourBest: 78, roundsTracked: 2 })],
  ['b', e('b', { ratedByYou: true, yourRating: 8.4, playerCount: 3 })],
  ['c', e('c', { roundsTracked: 4, playerCount: 4, recordGross: 71, recordHolder: 'Sam' })],
  ['d', e('d')],
]);
const subjects = new Map([
  ['a', { name: 'Royal Dornoch', imageUrl: null, memberships: [{ list_slug: 'global', rank: 47 }, { list_slug: 'gb-i', rank: 12 }] }],
  ['b', { name: 'Cruden Bay', imageUrl: null, memberships: [{ list_slug: 'global', rank: 101 }] }],
  ['c', { name: 'Muirfield', imageUrl: null, memberships: [{ list_slug: 'global', rank: 9 }] }],
  ['d', { name: 'Nobody Links', imageUrl: null, memberships: [] }],
]);

function mount() {
  render(<YourHundredSection viewerPlayed={1} total={4} courseIds={ids} enrichment={enrichment} subjects={subjects} onOpenCourse={() => {}} />);
}
const cell = (name: string) => screen.getByRole('button', { name: new RegExp(name) });

describe('Your hundred peek row', () => {
  it('tapping a square names it with its ranks and hides the legend', () => {
    mount();
    fireEvent.click(cell('Royal Dornoch'));
    expect(screen.getByText('Royal Dornoch')).toBeInTheDocument();
    expect(screen.getByText('#47 World · #12 GB&I')).toBeInTheDocument();
    expect(screen.queryByTestId('hundred-legend')).toBeNull();
  });
  it('tapping the same square again restores the legend', () => {
    mount();
    fireEvent.click(cell('Royal Dornoch'));
    fireEvent.click(cell('#1 Royal Dornoch'));
    expect(screen.getByTestId('hundred-legend')).toBeInTheDocument();
    expect(screen.queryByText('Royal Dornoch')).toBeNull();
  });
  it('tapping a different square swaps the subject directly', () => {
    mount();
    fireEvent.click(cell('Royal Dornoch'));
    fireEvent.click(cell('#3 Muirfield'));
    expect(screen.getByText('Muirfield')).toBeInTheDocument();
    expect(screen.queryByText('Royal Dornoch')).toBeNull();
    expect(screen.queryByTestId('hundred-legend')).toBeNull();
  });
  it('a course with no qualifying rank prints no rank line', () => {
    mount();
    fireEvent.click(cell('Cruden Bay'));
    expect(screen.getByText('Cruden Bay')).toBeInTheDocument();
    expect(screen.queryByTestId('peek-ranks')).toBeNull();
  });
  it('the nobody-yet state prints the caption line', () => {
    mount();
    fireEvent.click(cell('Nobody Links'));
    expect(screen.getByText('No member has logged an official round yet.')).toBeInTheDocument();
  });
});
