import { galleryShots, filteredGallery } from '@/lib/courseMedia/courseGallery';
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
  it('selection keeps the sparse rail and full coverage mounted — course gallery', () => {
    const open = vi.fn(); render(<HoleWalk available holes={[hole(1), hole(3)]} rows={[photo('a', 1), photo('b', 3)]} totalMedia={0} onAddFirst={() => {}} onOpen={open} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 3' })); expect(open).toHaveBeenCalledWith(3, expect.any(HTMLElement), 'hole-card'); expect(screen.getByRole('button', { name: 'Hole 1' })).toBeInTheDocument(); expect(screen.queryByRole('region')).toBeNull();
  });
  it('open coverage segment passes its hole directly to Add first', () => {
    const selected: number[] = []; render(<HoleWalk available holes={[hole(1), hole(3)]} rows={[photo('a', 1)]} totalMedia={1} onAddFirst={n => selected.push(n)} />);
    fireEvent.click(document.querySelectorAll('.media-v2-coverage button')[1]); expect(selected).toEqual([3]);
  });
  it('eight photos reconcile as eight selectable thumbnails including the active shot — course gallery', () => {
    const rows = Array.from({ length: 8 }, (_, i) => photo(String(i), 9));
    const posts = rows.map(row => ({ id: row.id, userId: row.user_id, mediaItems: [{ id: row.id, type: 'image', imageUrl: row.media_url }], displayName: '', avatarUrl: '', createdAt: '' })) as import('@/components/media-system/types/media').FeedPost[];
    const list = filteredGallery(galleryShots(posts, rows, []), 'holes'); expect(list).toHaveLength(8); expect(list[0].id).toBe('0');
  });
  it('existing picker preselects and submits selected hole', () => {
    const submitted: number[] = [];
    render(<HolePhotoTagDialog imageUrl="/photo.jpg" initialHole={3} holeCount={2} knownHoleNumbers={[1, 3]} pending={false} error={null} onClose={() => {}} onSubmit={n => submitted.push(n)} />);
    expect(screen.getByRole('button', { name: 'Hole 3' })).toHaveAttribute('aria-pressed', 'true'); fireEvent.click(screen.getByRole('button', { name: 'Hole 3' })); expect(submitted).toEqual([]); fireEvent.click(screen.getByRole('button', { name: /^Tag to the / })); expect(submitted).toEqual([3]);
  });
  it('hole 4 opens its existing region directly under the rail — course gallery', () => {
    const open = vi.fn(); render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} onOpen={open} />); fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); expect(open).toHaveBeenCalledWith(4, expect.any(HTMLElement), 'hole-card'); expect(screen.queryByRole('region')).toBeNull();
  });
  it('tapping tile 4 again closes its region and clears aria-pressed — course gallery', () => {
    const open = vi.fn(); render(<HoleWalk available holes={[hole(4)]} rows={[photo('4', 4)]} totalMedia={1} onAddFirst={() => {}} onOpen={open} />); const button = screen.getByRole('button', { name: 'Hole 4' }); fireEvent.click(button); fireEvent.click(button); expect(open).toHaveBeenCalledTimes(2); expect(button).not.toHaveAttribute('aria-pressed'); expect(screen.queryByRole('region')).toBeNull();
  });
  it('switching from hole 4 to hole 11 retains one region under the rail — course gallery', () => {
    const open = vi.fn(); render(<HoleWalk available holes={[hole(4), hole(11)]} rows={[photo('4', 4), photo('11', 11)]} totalMedia={2} onAddFirst={() => {}} onOpen={open} />); fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); fireEvent.click(screen.getByRole('button', { name: 'Hole 11' })); expect(open.mock.calls.map(call => call[0])).toEqual([4,11]); expect(screen.queryByRole('region')).toBeNull();
  });
  it('hole 18 opens its region under the rail — course gallery', () => {
    const open = vi.fn(); render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} onOpen={open} />); fireEvent.click(screen.getByRole('button', { name: 'Hole 18' })); expect(open).toHaveBeenCalledWith(18, expect.any(HTMLElement), 'hole-card'); expect(screen.queryByRole('region')).toBeNull();
  });
  it('switching holes resets the displayed photograph to the first — course gallery', () => {
    const rows = [photo('a', 4), photo('b', 4), photo('c', 11)]; const walk = deriveHoleWalk([hole(4),hole(11)], rows); expect(walk.tiles.find(t=>t.hole.hole_no===4)?.photos[0].id).toBe('a'); expect(walk.tiles.find(t=>t.hole.hole_no===11)?.photos[0].id).toBe('c');
  });
  it.each([['below', window.innerHeight + 1, 0], ['visible', 100, 0]] as const)('gallery opening never scrolls the page when the former panel would be %s the viewport', (_state, top, calls) => {
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
