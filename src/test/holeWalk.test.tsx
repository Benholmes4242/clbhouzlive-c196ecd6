import { describe, expect, it, vi } from 'vitest';
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
  it('selection keeps the sparse rail and full coverage mounted', () => {
    render(<HoleWalk available holes={[hole(1), hole(3)]} rows={[photo('a', 1), photo('b', 3)]} totalMedia={0} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 3' }));
    expect(screen.getByRole('button', { name: 'Hole 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hole 3' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('open coverage segment passes its hole directly to Add first', () => {
    const selected: number[] = []; render(<HoleWalk available holes={[hole(1), hole(3)]} rows={[photo('a', 1)]} totalMedia={1} onAddFirst={n => selected.push(n)} />);
    fireEvent.click(document.querySelectorAll('.media-v2-coverage button')[1]); expect(selected).toEqual([3]);
  });
  it('eight photos reconcile as eight selectable thumbnails including the active shot', () => {
    render(<HoleWalk available holes={[hole(9)]} rows={Array.from({ length: 8 }, (_, i) => photo(String(i), 9))} totalMedia={8} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 9' }));
    expect(screen.getAllByRole('button', { name: /^Show shot \d of 8$/ })).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Show shot 1 of 8' })).toHaveAttribute('aria-current', 'true');
  });
  it('existing picker preselects and submits selected hole', () => {
    const submitted: number[] = [];
    render(<HolePhotoTagDialog imageUrl="/photo.jpg" initialHole={3} holeCount={2} knownHoleNumbers={[1, 3]} pending={false} error={null} onClose={() => {}} onSubmit={n => submitted.push(n)} />);
    expect(screen.getByRole('button', { name: 'Hole 3' })).toHaveAttribute('aria-pressed', 'true'); fireEvent.click(screen.getByRole('button', { name: 'Hole 3' })); expect(submitted).toEqual([]); fireEvent.click(screen.getByRole('button', { name: /^Tag to the / })); expect(submitted).toEqual([3]);
  });
  it('hole 4 opens its existing region directly under the rail', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.parentElement?.previousElementSibling).toHaveClass('media-v2-hole-rail');
    expect(panel.nextElementSibling).toBeNull();
  });
  it('tapping tile 4 again closes its region and clears aria-pressed', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    const button = screen.getByRole('button', { name: 'Hole 4' });
    fireEvent.click(button); fireEvent.click(button);
    expect(screen.queryByRole('region')).toBeNull();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
  it('switching from hole 4 to hole 11 retains one region under the rail', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 11' }));
    const panel = screen.getByRole('region', { name: 'Hole 11' });
    expect(panel.parentElement?.previousElementSibling).toHaveClass('media-v2-hole-rail');
    expect(panel.nextElementSibling).toBeNull();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });
  it('hole 18 opens its region under the rail', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 18' }));
    const panel = screen.getByRole('region', { name: 'Hole 18' });
    expect(panel.parentElement?.previousElementSibling).toHaveClass('media-v2-hole-rail');
    expect(panel.nextElementSibling).toBeNull();
  });
  it('switching holes resets the displayed photograph to the first', () => {
    render(<HoleWalk available holes={[hole(4), hole(11)]} rows={[photo('a', 4), photo('b', 4), photo('c', 11)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 11' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.querySelector('.hole-walk-photo img')).toHaveAttribute('src', '/photo-a.jpg');
  });
  it.each([['below', window.innerHeight + 1, 1], ['visible', 100, 0]] as const)('scrolls only when the region is %s the viewport', (_state, top, calls) => {
    const scroll = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
    try {
      render(<HoleWalk available holes={[hole(4)]} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
      expect(scroll).toHaveBeenCalledTimes(calls);
      if (calls) expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    } finally { rect.mockRestore(); HTMLElement.prototype.scrollIntoView = original; }
  });
});
