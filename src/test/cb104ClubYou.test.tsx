import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ClubYouCard, clubYouFacts, clubYouFaces, clubYouTitle, type ClubCourseResult } from '@/components/business/ClubYouCard';
import { clubPlaceLine } from '@/components/business/hero/ClubProfileHero';
import type { BoardCoursePlayer } from '@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { CIRCLE_PLAYERS_LIMIT } from '@/components/courses/course-detail/you/circleNamesLine';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({ stats: vi.fn(), players: vi.fn() }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: (...args: unknown[]) => mocks.stats(...args) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers', () => ({ useBoardCoursePlayers: (...args: unknown[]) => mocks.players(...args) }));

const east = { id: 'east', name: 'Sundridge Park Golf Club (East Course)', country: 'England', region: 'Kent' };
const west = { ...east, id: 'west', name: 'Sundridge Park Golf Club (West Course)' };
const player = (id: string, name: string | null, rounds = 1): BoardCoursePlayer => ({ user_id: id, display_name: name, rounds, profile_photo_url: null, best_gross: null, best_to_par: null, last_played: null });
const results: ClubCourseResult[] = [
  { course: east, stats: { your_rounds: 4, your_best: 74 }, players: [player('viewer', 'Viewer', 99), player('sam', 'Sam Morris', 2), player('blank', ' ', 90)] },
  { course: west, stats: { your_rounds: 2, your_best: 72 }, players: [player('sam', 'Sam Morris', 3), player('chris', 'Chris Davies', 4), player('unreadable', null, 80)] },
];
const labels = { golfClub: 'Golf club', courses: (n: number) => `${n} courses` };
const mount = (over: Partial<React.ComponentProps<typeof ClubYouCard>> = {}) => render(<ClubYouCard isClub viewerId="viewer" courses={[east, west]} businessName="Sundridge Park Golf Club" {...over} />);
beforeEach(() => {
  mocks.stats.mockReset(); mocks.players.mockReset();
  mocks.stats.mockImplementation((id: string) => ({ data: results.find(r => r.course.id === id)?.stats, isLoading: false, isError: false }));
  mocks.players.mockImplementation((_viewer: string, id: string) => ({ data: results.find(r => r.course.id === id)?.players, isLoading: false, isError: false }));
});
afterEach(cleanup);

describe('CB104 own rounds and title', () => {
  it('sums own rounds and takes the best from the right course', () => {
    expect(clubYouFacts(results, 'viewer')).toMatchObject({ rounds: 6, best: 72, bestCourse: west });
  });
  it('breaks a best tie by more viewer rounds', () => {
    const tied = results.map(r => ({ ...r, stats: { ...r.stats, your_best: 72 } }));
    expect(clubYouFacts(tied, 'viewer').bestCourse).toEqual(east);
  });
  it('multiple rounds include the within-club best course', () => {
    expect(clubYouTitle(6, 72, west, 2)).toEqual({ first: "You've played 6 rounds here.", second: 'Your best is 72, on the West Course.' });
  });
  it('single-course clubs omit the best course suffix', () => {
    expect(clubYouTitle(6, 72, east, 1).second).toBe('Your best is 72.');
  });
  it('one round says one round and the score, not best', () => {
    expect(clubYouTitle(1, 84, east, 1)).toEqual({ first: "You've played one round here.", second: 'You went round in 84.' });
  });
  it('rounds without a best have only the first sentence', () => {
    expect(clubYouTitle(3, null, null, 2)).toEqual({ first: "You've played 3 rounds here.", second: '' });
    expect(clubYouTitle(1, null, null, 2)).toEqual({ first: "You've played one round here.", second: '' });
  });
  it('zero rounds states no round played yet', () => {
    expect(clubYouTitle(0, null, null, 2)).toEqual({ first: "You haven't played a round here yet.", second: '' });
  });
  it('groups large round counts with the locale', () => {
    expect(clubYouTitle(1234, 72, east, 1).first).toBe("You've played 1,234 rounds here.");
  });
});

describe('CB104 circle merge and wording', () => {
  it('merges courses, removes the viewer and unreadable names, and orders by rounds', () => {
    expect(clubYouFacts(results, 'viewer').players.map(p => [p.user_id, p.rounds])).toEqual([['sam', 5], ['chris', 4]]);
  });
  it('breaks a rounds tie by full display name', () => {
    const facts = clubYouFacts([{ course: east, players: [player('z', 'Zoe Jones', 4), player('a', 'Amy Smith', 4)] }], 'viewer');
    expect(facts.players.map(p => p.display_name)).toEqual(['Amy Smith', 'Zoe Jones']);
  });
  it('one followed golfer wording', () => {
    expect(clubYouFaces([player('s', 'Sam Morris')], false)).toEqual({ names: 'Sam Morris', rest: ', who you follow, has played here.' });
  });
  it('two followed golfers wording', () => {
    expect(clubYouFaces([player('s', 'Sam Morris'), player('c', 'Chris Davies')], false)).toEqual({ names: 'Sam Morris and Chris Davies', rest: ', who you follow, have played here.' });
  });
  it('three followed golfers use one other', () => {
    expect(clubYouFaces([player('s', 'Sam Morris'), player('c', 'Chris Davies'), player('m', 'Mike Smith')], false)).toEqual({ names: 'Sam Morris, Chris Davies', rest: ' and 1 other you follow have played here.' });
  });
  it('four or more followed golfers use others', () => {
    expect(clubYouFaces(['a', 'b', 'c', 'd'].map(id => player(id, id)), false).rest).toBe(' and 2 others you follow have played here.');
  });
  it('any course hitting the limit produces capped merged-count wording', () => {
    const raw = Array.from({ length: CIRCLE_PLAYERS_LIMIT }, (_, i) => player(`${i}`, `Golfer ${i}`));
    raw[0] = player('viewer', 'Viewer');
    const facts = clubYouFacts([{ course: east, players: raw }, { course: west, players: [player('extra', 'Extra Golfer')] }], 'viewer');
    expect(facts.capped).toBe(true);
    expect(facts.players).toHaveLength(500);
    expect(clubYouFaces(facts.players, facts.capped)).toEqual({ names: '', rest: '500+ golfers you follow have played here.' });
  });
});

describe('CB104 card visibility and existing reads', () => {
  it('signed-out viewers render no card or reads', () => {
    expect(mount({ viewerId: undefined }).container.childElementCount).toBe(0);
    expect(mocks.stats).not.toHaveBeenCalled(); expect(mocks.players).not.toHaveBeenCalled();
  });
  it('non-club profiles render no card or reads', () => {
    expect(mount({ isClub: false }).container.childElementCount).toBe(0);
    expect(mocks.stats).not.toHaveBeenCalled();
  });
  it('no own rounds and no readable circle renders no card', () => {
    mocks.stats.mockReturnValue({ data: { your_rounds: 0, your_best: null }, isLoading: false });
    mocks.players.mockReturnValue({ data: [], isLoading: false });
    expect(mount().container.querySelector('[data-club-you]')).toBeNull();
  });
  it('loading either stats or circle renders nothing until both settle', async () => {
    mocks.stats.mockReturnValue({ data: undefined, isLoading: true });
    const view = mount();
    expect(view.container.querySelector('[data-club-you]')).toBeNull();
    mocks.stats.mockReturnValue({ data: { your_rounds: 1, your_best: 84 }, isLoading: false });
    mocks.players.mockReturnValue({ data: undefined, isLoading: true });
    view.rerender(<ClubYouCard isClub viewerId="viewer" courses={[east]} businessName="Sundridge Park Golf Club" />);
    expect(view.container.querySelector('[data-club-you]')).toBeNull();
    mocks.players.mockReturnValue({ data: [], isLoading: false });
    view.rerender(<ClubYouCard isClub viewerId="viewer" courses={[east]} businessName="Sundridge Park Golf Club" />);
    await waitFor(() => expect(view.container.querySelector('[data-club-you]')).not.toBeNull());
  });
  it('failed reads count as empty, including stale data', () => {
    mocks.stats.mockReturnValue({ data: { your_rounds: 3, your_best: 72 }, isError: true, isLoading: false });
    mocks.players.mockReturnValue({ data: [player('sam', 'Sam Morris')], isError: true, isLoading: false });
    expect(mount().container.querySelector('[data-club-you]')).toBeNull();
  });
  it('played-only state has no faces row', () => {
    mocks.players.mockReturnValue({ data: [], isLoading: false });
    const { container } = mount();
    expect(container.querySelector('[data-club-you]')).not.toBeNull();
    expect(container.querySelector('[data-club-you-faces]')).toBeNull();
  });
  it('circle-only state shows the card', () => {
    mocks.stats.mockReturnValue({ data: { your_rounds: 0, your_best: null }, isLoading: false });
    const { container } = mount();
    expect(container.querySelector('[data-club-you]')).not.toBeNull();
    expect(container.querySelector('[data-club-you-faces]')).not.toBeNull();
  });
  it('kicker uses the trimmed club name and the title keeps two sentence elements', () => {
    const { container } = mount();
    expect(container.querySelector('.club-you-kicker')?.textContent).toBe('You and Sundridge Park');
    expect(container.querySelector('h2 > span')).not.toBeNull();
  });
  it('reuses exact per-course stats and all-time circle query inputs', () => {
    mount();
    for (const course of [east, west]) {
      expect(mocks.stats).toHaveBeenCalledWith(course.id, true);
      expect(mocks.players).toHaveBeenCalledWith('viewer', course.id, { ...DEFAULT_FILTERS, scope: 'circle', window: 'all' }, { limit: CIRCLE_PLAYERS_LIMIT });
    }
  });
  it('faces row is inert and has at most four avatars', () => {
    mocks.players.mockReturnValue({ data: ['a', 'b', 'c', 'd', 'e'].map(id => player(id, `Name ${id}`)), isLoading: false });
    const { container } = mount();
    expect(container.querySelectorAll('[data-face]')).toHaveLength(4);
    expect(container.querySelectorAll('button, a')).toHaveLength(0);
  });
});

describe('CB104 place line', () => {
  it('England as city with Kent region gives Kent', () => {
    expect(clubPlaceLine({ city: 'England', region: 'Kent', country: 'England', courseCount: 2 }, labels)).toBe('Golf club · Kent · 2 courses');
  });
  it('Scotland as region with Troon city gives Troon', () => {
    expect(clubPlaceLine({ city: 'Troon', region: 'Scotland', country: 'UK', courseCount: 1 }, labels)).toBe('Golf club · Troon');
  });
  it('city equal to own country is ignored case-insensitively', () => {
    expect(clubPlaceLine({ city: ' portugal ', country: 'Portugal', firstCourseRegion: 'Algarve', courseCount: 1 }, labels)).toBe('Golf club · Algarve');
  });
  it('real city and region remain Bromley, Kent', () => {
    expect(clubPlaceLine({ city: 'Bromley', region: 'Kent', country: 'England', courseCount: 2 }, labels)).toBe('Golf club · Bromley, Kent · 2 courses');
  });
});

describe('CB104 title typography', () => {
  it('title carries -0.01em letter-spacing', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    const rule = css.match(/\.club-you-title \{([^}]*)\}/);
    expect(rule, '.club-you-title rule must exist in src/index.css').not.toBeNull();
    expect(rule?.[1]).toMatch(/letter-spacing:\s*-0\.01em/);
    expect(rule?.[1]).not.toMatch(/letter-spacing:\s*0(?![.\d])/);
  });
});