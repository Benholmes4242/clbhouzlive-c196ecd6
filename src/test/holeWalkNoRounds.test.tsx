import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CourseHole, CourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const f = vi.hoisted(() => ({ analysis: null as CourseHoleAnalysis | null, rows: [] as HolePhoto[], total: 8, known: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: f.analysis }) }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: (_course: string, _member: string, known: number[] | null) => {
  f.known(known);
  return { ready: true, own: { data: [] }, sources: { data: [], isSuccess: true }, tags: { data: f.rows, isSuccess: true }, taggedUrls: new Set(), submit: { reset: vi.fn() }, move: { reset: vi.fn() }, remove: { reset: vi.fn() } };
} }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: () => ({ posts: [], postsForFullscreen: [], mediaCounts: { total: f.total, photos: f.total, videos: 0 }, countsReady: true }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaHeader', () => ({ CourseMediaHeader: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));

import { courseWalkHoles, deriveHoleWalk, UNSCORED_HOLE_COUNT } from '@/lib/courseMedia/holeWalk';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';

const emptyAnalysis: CourseHoleAnalysis = { available: true, total_rounds: 0, holes: [] };
const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 412, stroke_index: 3, rounds: 10, avg_to_par: 1, avg_gross: 5, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } });
const photo = (n: number, id = String(n)): HolePhoto => ({ id, course_id: 'course', hole_no: n, status: 'approved', user_id: 'member', media_type: 'image', media_url: `/photo-${id}.jpg`, exif_captured_at: null }) as HolePhoto;
const numbers = Array.from({ length: 18 }, (_, i) => i + 1);
const quiet = 'No rounds have been posted here yet, so par and yardage are still to come. They fill in with the first tracked round.';
function unscored() {
  const result = courseWalkHoles(emptyAnalysis);
  if (!result) throw new Error('Expected available unscored holes');
  return result.holes;
}
beforeEach(() => { vi.clearAllMocks(); f.analysis = emptyAnalysis; f.rows = [photo(1), photo(4), photo(7), photo(15)]; f.total = 8; });
afterEach(cleanup);
function mountTab() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tab = <MemoryRouter><QueryClientProvider client={cache}><CourseMediaTabNew courseId="course" courseName="Old Head Golf Links" /></QueryClientProvider></MemoryRouter>;
  return { ...render(tab), tab };
}

describe('BRIEF_HOLE_WALK_NO_ROUNDS', () => {
  it('null data remains loading with no fallback', () => { expect(courseWalkHoles(null)).toBeNull(); });
  it('undefined data remains loading with no fallback', () => { expect(courseWalkHoles(undefined)).toBeNull(); });
  it('unavailable analysis keeps no hole list', () => { expect(courseWalkHoles({ ...emptyAnalysis, available: false })).toBeNull(); });
  it('real holes retain the same array and objects with scored true', () => {
    const holes = [hole(4), hole(1)];
    const result = courseWalkHoles({ available: true, total_rounds: 10, holes });
    expect(result?.scored).toBe(true); expect(result?.holes).toBe(holes); expect(result?.holes[0]).toBe(holes[0]);
  });
  it('empty available analysis supplies eighteen unscored holes without invented scores', () => {
    const result = courseWalkHoles(emptyAnalysis);
    expect(UNSCORED_HOLE_COUNT).toBe(18); expect(result?.scored).toBe(false);
    expect(result?.holes.map(h => h.hole_no)).toEqual(numbers);
    for (const h of result?.holes ?? []) {
      expect(h.avg_to_par).toBeNaN(); expect(h.avg_gross).toBeNaN();
      expect([h.par, h.rounds, h.yards, h.stroke_index]).toEqual([0, 0, null, null]);
      expect(h.dist).toEqual({ ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 });
    }
  });
  it('four photographed fallback holes have the eighteen-hole headline and no hardest hole', () => {
    const walk = deriveHoleWalk(unscored(), f.rows);
    expect(walk.headline).toBe('Four of the eighteen have been photographed'); expect(walk.hardestOpen).toBeNull();
  });
  it('selected unscored photographed hole has its kicker but no title or stats', () => {
    render(<HoleWalk available scored={false} holes={unscored()} rows={f.rows} totalMedia={8} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel).toHaveClass('hole-walk-panel-unscored');
    expect(panel.querySelector('.hole-walk-title')).toBeNull(); expect(panel.querySelector('.hole-walk-stats')).toBeNull();
    expect(panel.querySelector('.hole-walk-kicker')?.textContent).toBe('The fourth');
    expect(document.querySelector('.hole-walk-quiet')).toBeNull();
  });
  it('unselected unscored walk shows the exact quiet line without a field-loses claim', () => {
    const view = render(<HoleWalk available scored={false} holes={unscored()} rows={f.rows} totalMedia={8} onAddFirst={() => {}} />);
    expect(view.container.querySelector('.hole-walk-quiet')?.textContent).toBe(quiet);
    expect(view.container.textContent).not.toMatch(/field loses/i);
  });
  it('quiet line remains when every unscored hole is photographed and observation is absent', () => {
    const view = render(<HoleWalk available scored={false} holes={unscored()} rows={numbers.map(n => photo(n))} totalMedia={18} onAddFirst={() => {}} />);
    expect(view.container.querySelector('.hole-walk-observation')).toBeNull();
    expect(view.container.querySelector('.hole-walk-quiet')?.textContent).toBe(quiet);
  });
  it('omitted scored prop preserves the existing panel title and stats without quiet copy', () => {
    const view = render(<HoleWalk available holes={[hole(4)]} rows={[photo(4)]} totalMedia={1} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.querySelector('.hole-walk-title')?.textContent).toBe('Par 4 · 412 yards');
    expect(panel.querySelector('.hole-walk-stats')).not.toBeNull(); expect(panel).not.toHaveClass('hole-walk-panel-unscored');
    expect(view.container.querySelector('.hole-walk-quiet')).toBeNull();
  });
  it('Media with photos and empty available analysis renders eighteen walk tiles and enables known holes', () => {
    const view = mountTab();
    expect(view.container.querySelectorAll('.hole-walk-tile')).toHaveLength(18);
    expect(f.known).toHaveBeenLastCalledWith(numbers);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    expect(screen.getByRole('region', { name: 'Hole 4' })).toHaveClass('hole-walk-panel-unscored');
  });
  it('Media with no photos and no rounds renders the first-photo screen with eighteen open choices', () => {
    f.total = 0; f.rows = [];
    mountTab();
    expect(screen.getByRole('heading', { name: 'You would be the first' })).toBeInTheDocument();
    const tiles = screen.getAllByRole('button').filter(b => b.hasAttribute('data-state'));
    expect(tiles.map(b => b.getAttribute('aria-label'))).toEqual(numbers.map(n => `Hole ${n}`));
    for (const tile of tiles) { expect(tile).toHaveAttribute('data-state', 'open'); expect(tile).toBeEnabled(); }
    expect(f.known).toHaveBeenLastCalledWith(numbers);
  });
  it('Media automatically restores real scored holes when analysis receives rounds', () => {
    const view = mountTab(); fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    f.analysis = { available: true, total_rounds: 10, holes: [hole(4)] };
    view.rerender(view.tab);
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel).not.toHaveClass('hole-walk-panel-unscored'); expect(panel.querySelector('.hole-walk-stats')).not.toBeNull();
    expect(panel.querySelector('.hole-walk-title')?.textContent).toBe('Par 4 · 412 yards');
    expect(view.container.querySelectorAll('.hole-walk-tile')).toHaveLength(1); expect(f.known).toHaveBeenLastCalledWith([4]);
  });
});