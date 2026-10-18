import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { deriveHoleWalk, holePhotoMonths } from '@/lib/courseMedia/holeWalk';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { HolePhotoTagDialog } from '@/components/course-media-tab/HolePhotoTagDialog';
const hole = (n: number, avg = n): CourseHole => ({ hole_no: n, par: 4, yards: 475, stroke_index: 3, avg_to_par: avg, avg_gross: 5.9, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } });
const photo = (id: string, n: number, status = 'approved', month = '2026-05'): HolePhoto => ({ id, hole_no: n, status, user_id: 'member', media_url: `/photo-${id}.jpg`, exif_captured_at: `${month}-12T12:00:00Z` }) as HolePhoto;
describe('MEDIA_WALK_1_R', () => {
  it('only the ten-or-more headline owns a total', () => {
    expect(deriveHoleWalk(Array.from({ length: 9 }, (_, i) => hole(i + 1)), []).headlineTotal).toBeNull();
    expect(deriveHoleWalk(Array.from({ length: 10 }, (_, i) => hole(i + 1)), []).headlineTotal).toBe(10);
  });
  it('orders sparse analysis holes without inventing holes', () => { expect(deriveHoleWalk([hole(11), hole(2), hole(7)], []).tiles.map(t => t.hole.hole_no)).toEqual([2, 7, 11]); });
  it('excludes pending from all public populations', () => {
    const r = deriveHoleWalk([hole(1), hole(2)], [photo('a', 1), photo('b', 2, 'pending')]);
    expect([r.photoCount, r.photographed, r.openCount]).toEqual([1, 1, 1]); expect(r.tiles[1]?.photos).toEqual([]);
  });
  it('ignores rows outside known holes', () => { expect(deriveHoleWalk([hole(2)], [photo('a', 18)]).photoCount).toBe(0); });
  it('requires unique winner with at least two photos', () => {
    const holes = [hole(1), hole(2)];
    expect(deriveHoleWalk(holes, [photo('a', 1)]).most).toBeNull();
    expect(deriveHoleWalk(holes, [photo('a', 1), photo('b', 1), photo('c', 2), photo('d', 2)]).most).toBeNull();
    expect(deriveHoleWalk(holes, [photo('a', 1), photo('b', 1), photo('c', 2)]).most).toBe(1);
  });
  it('hardest clause requires that hole to be open', () => {
    const holes = [hole(1, 1.4), hole(3, 1.9)];
    expect(deriveHoleWalk(holes, [photo('a', 1)]).hardestOpen).toBe(3);
    expect(deriveHoleWalk(holes, [photo('a', 3)]).hardestOpen).toBeNull();
  });
  it('month groups require two EXIF months and exclude pending', () => {
    expect(holePhotoMonths([photo('a', 1), photo('b', 1)])).toEqual([]);
    expect(holePhotoMonths([photo('a', 1), photo('b', 1, 'pending', '2026-10')])).toEqual([]);
    expect(holePhotoMonths([photo('a', 1), photo('b', 1, 'approved', '2026-10')])).toEqual([{ month: '2026-05', count: 1 }, { month: '2026-10', count: 1 }]);
  });
  it('missing EXIF never substitutes upload month', () => { expect(holePhotoMonths([{ ...photo('a', 1), exif_captured_at: null, created_at: '2026-10-01' }, photo('b', 1)])).toEqual([]); });
  it('eight undated shots still count without season groups', () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({ ...photo(String(i), 1), exif_captured_at: null, created_at: '2026-10-01' }));
    expect(deriveHoleWalk([hole(1)], rows).photoCount).toBe(8);
    expect(holePhotoMonths(rows)).toEqual([]);
  });
  it('unavailable removes entire section', () => {
    const { container } = render(<HoleWalk available={false} holes={[hole(1)]} rows={[]} totalMedia={0} onAddFirst={() => {}} />); expect(container.childElementCount).toBe(0);
  });
  it('selection keeps every tile mounted', () => {
    render(<HoleWalk available holes={[hole(1), hole(3)]} rows={[]} totalMedia={0} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 3' }));
    expect(screen.getByRole('button', { name: 'Hole 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hole 3' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('Add first passes selected hole', () => {
    const selected: number[] = []; render(<HoleWalk available holes={[hole(3)]} rows={[]} totalMedia={0} onAddFirst={n => selected.push(n)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 3' })); fireEvent.click(screen.getByRole('button', { name: 'Add the first' })); expect(selected).toEqual([3]);
  });
  it('eight photos reconcile as active plus seven selectable thumbnails', () => {
    render(<HoleWalk available holes={[hole(9)]} rows={Array.from({ length: 8 }, (_, i) => photo(String(i), 9))} totalMedia={8} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 9' })); expect(screen.getAllByRole('button', { name: 'View photograph' })).toHaveLength(7);
  });
  it('existing picker preselects and submits selected hole', () => {
    const submitted: number[] = [];
    render(<HolePhotoTagDialog imageUrl="/photo.jpg" initialHole={3} holeCount={2} knownHoleNumbers={[1, 3]} usedHoles={[]} pending={false} result={null} error={null} onClose={() => {}} onSubmit={n => submitted.push(n)} />);
    expect(screen.getByRole('button', { name: 'Hole 3' })).toHaveAttribute('aria-pressed', 'true'); fireEvent.click(screen.getByRole('button', { name: 'Tag' })); expect(submitted).toEqual([3]);
  });
});
