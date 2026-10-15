import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { YourHundredSection } from '@/components/courses/top100/YourHundredSection';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';

vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback', () => ({ CourseImageFallback: () => null }));

afterEach(cleanup);

function e(id: string, o: Partial<Top100Enrichment> = {}): Top100Enrichment {
  return {
    courseId: id, rating: null, ratingCount: 0, roundsTracked: 0, avgOverPar: null, yourRounds: 0, yourBest: null,
    ratedByYou: false, yourRating: null, yourActivity: false, harderThanPct: null,
    subScores: { design: null, condition: null, facilities: null, clubhouse: null },
    playerCount: 0, recordGross: null, recordHolder: null, players: [], ...o,
  };
}

const ids = ['a', 'b', 'c', 'd', 'r', 'k'];
const enrichment = new Map([
  ['a', e('a', { yourActivity: true, yourRounds: 2, yourBest: 78, roundsTracked: 2 })],
  ['b', e('b', { ratedByYou: true, yourRating: 8.4, playerCount: 3 })],
  ['c', e('c', { roundsTracked: 4, playerCount: 4, recordGross: 71, recordHolder: 'Sam' })],
  ['d', e('d')],
  ['k', e('k', { yourActivity: true, ratedByYou: true, yourRating: 7.9 })],
  ['r', e('r', { yourActivity: true, yourRounds: 1, ratedByYou: true, yourRating: 8.1, yourBest: 80 })],
]);
const subjects = new Map([
  ['a', { name: 'Royal Dornoch', imageUrl: null, memberships: [{ list_slug: 'global', rank: 47 }, { list_slug: 'gb-i', rank: 12 }] }],
  ['b', { name: 'Cruden Bay', imageUrl: null, memberships: [{ list_slug: 'global', rank: 101 }] }],
  ['c', { name: 'Muirfield', imageUrl: null, memberships: [{ list_slug: 'global', rank: 9 }] }],
  ['d', { name: 'Nobody Links', imageUrl: null, memberships: [] }],
  ['k', { name: 'Kingsbarns', imageUrl: null, memberships: [] }],
  ['r', { name: 'Turnberry', imageUrl: null, memberships: [] }],
]);

function mount() {
  render(<YourHundredSection listSlug="gb-i" viewerPlayed={3} total={6} courseIds={ids} enrichment={enrichment} subjects={subjects} onOpenCourse={() => {}} />);
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
  it('solid marks rounds+review, ring marks rounds only, review-only is not amber', () => {
    mount();
    expect(cell('Turnberry').style.boxShadow).toBe('');
    expect(cell('Turnberry').style.background).not.toBe('transparent');
    expect(cell('Royal Dornoch').style.background).toBe('transparent');
    expect(cell('Royal Dornoch').style.boxShadow).toContain('inset');
    expect(cell('Cruden Bay').style.background).toBe(cell('Nobody Links').style.background);
    expect(cell('Cruden Bay').style.boxShadow).toBe('');
    const solid = cell('Turnberry').style.background;
    const all = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    const amber = all.filter((b) => b.style.background === solid || b.style.boxShadow.includes('inset')).length;
    expect(amber).toBe(3);
  });
  it('the ring square says Not yet reviewed', () => {
    mount();
    fireEvent.click(cell('Royal Dornoch'));
    expect(screen.getByText(/Not yet reviewed/)).toBeInTheDocument();
  });
  it('the drop-through square says You reviewed', () => {
    mount();
    fireEvent.click(cell('Cruden Bay'));
    expect(screen.getByText(/You reviewed/)).toBeInTheDocument();
  });
  it('the nobody-yet state prints the caption line', () => {
    mount();
    fireEvent.click(cell('Nobody Links'));
    expect(screen.getByText('No member has logged an official round yet.')).toBeInTheDocument();
  });
  it('activity and a rating with no rounds is solid amber, says Reviewed, never Best', () => {
    mount();
    expect(cell('Kingsbarns').style.background).toBe(cell('Turnberry').style.background);
    expect(cell('Kingsbarns').style.background).not.toBe(cell('Nobody Links').style.background);
    fireEvent.click(cell('Kingsbarns'));
    const line = screen.getByText('You played').parentElement!.textContent!;
    expect(line).toContain('Reviewed');
    expect(line).not.toContain('Best');
  });
  it('activity and rounds with no rating is the ring and says Best and Not yet reviewed', () => {
    mount();
    expect(cell('Royal Dornoch').style.boxShadow).toContain('inset');
    fireEvent.click(cell('Royal Dornoch'));
    const line = screen.getByText('You played').parentElement!.textContent!;
    expect(line).toContain('Best');
    expect(line).toContain('Not yet reviewed');
  });
  it('solid plus ring equals the played figure passed in', () => {
    mount();
    const solid = cell('Turnberry').style.background;
    const all = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    const n = all.filter((b) => b.style.background === solid || b.style.boxShadow.includes('inset')).length;
    expect(n).toBe(3);
  });
});
