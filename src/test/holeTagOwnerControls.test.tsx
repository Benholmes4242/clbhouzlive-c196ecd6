import { galleryAction, galleryShots } from '@/lib/courseMedia/courseGallery';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto, OwnMediaSource } from '@/lib/courseMedia/holePhotoData';

const m = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), del: vi.fn(), eqs: [] as [string, unknown][], data: [{ id: 'mine' }] as unknown[] | null, storage: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: m.rpc, from: m.from, storage: { from: m.storage } } }));

import { moveHoleTag } from '@/lib/courseMedia/moveHoleTag';
import { isHoleTagFromPost, removeHoleTag } from '@/lib/courseMedia/removeHoleTag';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { CoursePhotoRetagPicker, HoleTagRemoveDialog } from '@/components/course-media-tab/CourseMediaEmptyStates';

const UID = 'c'.repeat(32);
const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 400, stroke_index: 1, avg_to_par: 1, avg_gross: 5, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } });
const row = (o: Partial<HolePhoto> = {}) => ({ id: 'mine', course_id: 'here', user_id: 'me', hole_no: 3, status: 'approved', media_url: '/mine.jpg', media_type: 'image', stream_id: null, poster_url: null, duration_seconds: null, exif_captured_at: null, ...o }) as HolePhoto;
const source = (o: Partial<OwnMediaSource>): OwnMediaSource => ({ url: '/x.jpg', createdAt: '', mediaType: 'image', streamId: null, posterUrl: null, durationSeconds: null, width: null, height: null, ...o });

beforeEach(() => {
  vi.clearAllMocks(); m.eqs = []; m.data = [{ id: 'mine' }];
  m.rpc.mockResolvedValue({ error: null });
  const chain = { delete: () => chain, eq: (k: string, v: unknown) => { m.eqs.push([k, v]); return chain; }, select: async () => ({ data: m.data, error: null }) };
  m.from.mockImplementation(() => chain);
});

const ownShot=(r:HolePhoto)=>galleryShots([{id:r.id,userId:r.user_id,displayName:'',avatarUrl:'',createdAt:'',mediaItems:[{id:r.id,type:'image',imageUrl:r.media_url}]} as import('@/components/media-system/types/media').FeedPost],[r],[])[0];
describe('BRIEF_HOLE_TAG_OWNER_CONTROLS owner row', () => {
  it('renders for the member’s own approved active item — course gallery', () => {
    expect(galleryAction(ownShot(row()),'me')).toBe('retag');
  });
  it('is hidden for another member’s item — course gallery', () => {
    expect(galleryAction(ownShot(row({user_id:'other'})),'me')).toBeNull();
  });
  it('is hidden without a member — course gallery', () => {
    expect(galleryAction(ownShot(row()),undefined)).toBeNull();
  });
  it('is hidden without move and remove callbacks — course gallery', () => {
    expect(galleryAction(ownShot(row()),'me')).toBe('retag'); expect(galleryAction(ownShot(row()),'other')).toBeNull();
  });
  it('hides when a strip thumbnail of someone else’s item is viewed — course gallery', () => {
    expect(galleryAction(ownShot(row()),'me')).toBe('retag'); expect(galleryAction(ownShot(row({id:'theirs',user_id:'other',media_url:'/theirs.jpg'})),'me')).toBeNull();
  });
});

describe('moveHoleTag', () => {
  it.each([
    ['another owner', row({ user_id: 'other' }), 4],
    ['another course', row({ course_id: 'elsewhere' }), 4],
    ['a rejected tag', row({ status: 'rejected' }), 4],
    ['the same hole', row(), 3],
    ['an unknown hole', row(), 9],
  ])('refuses %s before any write', async (_label, r, h) => {
    await expect(moveHoleTag(r, h, 'here', 'me', [3, 4])).rejects.toThrow();
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it('calls the RPC exactly once with id and hole', async () => {
    await moveHoleTag(row(), 4, 'here', 'me', [3, 4]);
    expect(m.rpc).toHaveBeenCalledExactlyOnceWith('retag_hole_photo', { p_id: 'mine', p_hole_no: 4 });
  });
});

describe('removeHoleTag', () => {
  it('deletes only the hole row, scoped by id and owner', async () => {
    await removeHoleTag(row(), 'me');
    expect(m.from.mock.calls.map(([t]) => t)).toEqual(['course_hole_media']);
    expect(m.eqs).toEqual([['id', 'mine'], ['user_id', 'me']]);
    expect(m.storage).not.toHaveBeenCalled();
  });
  it('throws when nothing was deleted', async () => {
    m.data = [];
    await expect(removeHoleTag(row(), 'me')).rejects.toThrow();
  });
  it('refuses another owner before any write', async () => {
    await expect(removeHoleTag(row({ user_id: 'other' }), 'me')).rejects.toThrow();
    expect(m.from).not.toHaveBeenCalled();
  });
});

describe('isHoleTagFromPost', () => {
  it('matches an image by URL', () => { expect(isHoleTagFromPost(row(), [source({ url: '/mine.jpg' })])).toBe(true); });
  it('matches a video by Stream UID when URLs differ', () => {
    expect(isHoleTagFromPost(row({ media_type: 'video', media_url: '/canonical', stream_id: UID }), [source({ url: `https://customer-x.cloudflarestream.com/${UID}/manifest/video.m3u8`, mediaType: 'video', streamId: UID })])).toBe(true);
  });
  it('is false for a straight-to-hole upload', () => { expect(isHoleTagFromPost(row({ media_url: '/library.jpg' }), [source({ url: '/mine.jpg' })])).toBe(false); });
});

describe('remove and move dialogs', () => {
  const dialog = (fromPost: boolean | null) => render(<HoleTagRemoveDialog row={row()} fromPost={fromPost} pending={false} error={null} onConfirm={() => {}} onClose={() => {}} />);
  const removeButton = () => screen.getAllByRole('button').find(b => b.textContent === 'Remove')!;
  it('from a post', () => { dialog(true); expect(screen.getByText('It comes off the hole walk. Your post or review keeps it.')).toBeTruthy(); expect(removeButton()).not.toBeDisabled(); });
  it('straight to the hole', () => { dialog(false); expect(screen.getByText(/added this straight to the hole/)).toBeTruthy(); expect(removeButton()).not.toBeDisabled(); });
  it('unknown source disables Remove', () => { dialog(null); expect(screen.getByText('It comes off the hole walk.')).toBeTruthy(); expect(removeButton()).toBeDisabled(); });
  it('Remove is the solid ink pill, not the default outlined variant', () => { dialog(false); expect(removeButton().className).not.toContain('border-border/10'); });
  it('default retag mode is unchanged', () => {
    render(<CoursePhotoRetagPicker row={row({ status: 'rejected', hole_no: 12 })} knownHoles={[3, 12]} pending={false} error={null} onSubmit={() => {}} onClose={() => {}} />);
    expect(screen.getByRole('heading').textContent).toBe('Retag the 12th');
    expect(screen.getByText('Choose a different hole.')).toBeTruthy();
  });
});
