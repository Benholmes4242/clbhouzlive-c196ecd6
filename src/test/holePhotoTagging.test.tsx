import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { FeedPost } from '@/components/media-system/types/media';
import { HolePhotoTagButton } from '@/components/course-media-tab/HolePhotoTagButton';
import { HolePhotoPicker } from '@/components/course-media-tab/HolePhotoPicker';
import { canTagHolePhoto, photoCoverage, readAllPages, type HolePhoto } from '@/lib/courseMedia/holePhotoData';

const post = { userId: 'member', actorType: 'personal', mediaItems: [{ id: 'photo', type: 'image', imageUrl: 'https://example.com/photo.jpg', width: 32, height: 32 }] } as FeedPost;
const tag = (overrides: Partial<HolePhoto>) => ({ hole_no: 1, status: 'approved', user_id: 'member', media_url: 'https://example.com/photo.jpg', ...overrides }) as HolePhoto;

describe('MEDIA_ENGINE_1_R2 tagging rules', () => {
  it('renders the Tag control only for the member’s own untagged photograph', () => {
    const chosen: FeedPost[] = [];
    render(<HolePhotoTagButton post={post} memberId="member" holeCount={9} taggedUrls={new Set()} onTag={value => chosen.push(value)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photograph' }));
    expect(chosen).toEqual([post]);
  });
  it('does not render Tag on somebody else’s photograph', () => {
    render(<HolePhotoTagButton post={{ ...post, userId: 'other' }} memberId="member" holeCount={9} taggedUrls={new Set()} onTag={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('does not render Tag on an already-tagged photograph', () => {
    render(<HolePhotoTagButton post={post} memberId="member" holeCount={9} taggedUrls={new Set(['https://example.com/photo.jpg'])} onTag={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('unknown analysis silently removes Tag', () => {
    render(<HolePhotoTagButton post={post} memberId="member" holeCount={null} taggedUrls={new Set()} onTag={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('business-authored items and videos cannot be tagged', () => {
    expect(canTagHolePhoto({ ...post, actorType: 'business' }, 'member', 9, new Set())).toBe(false);
    expect(canTagHolePhoto({ ...post, mediaItems: [{ ...post.mediaItems[0], type: 'video' }] }, 'member', 9, new Set())).toBe(false);
  });
  it('sparse analysis holes preserve the RPC’s numbers and order', () => {
    render(<HolePhotoPicker holeCount={3} knownHoleNumbers={[2, 7, 11]} selectedHole={null} onSelect={() => {}} />);
    expect(screen.getAllByRole('button').map(button => button.getAttribute('aria-label'))).toEqual(['Hole 2', 'Hole 7', 'Hole 11']);
  });
  it('coverage denominator is known holes and only published photos cover them', () => {
    expect(photoCoverage([2, 7, 11], [tag({ hole_no: 2 }), tag({ hole_no: 7, status: 'pending' }), tag({ hole_no: 18 })])).toEqual({ known: 3, unphotographed: 2 });
  });
  it('zero published photos honestly leaves every known hole unphotographed', () => {
    expect(photoCoverage([1, 2, 3], [])).toEqual({ known: 3, unphotographed: 3 });
  });
  it('complete reads continue past the row cap', async () => {
    const requested: number[] = [];
    const rows = await readAllPages<number>(async from => {
      requested.push(from);
      return { data: from === 0 ? Array.from({ length: 500 }, (_, i) => i) : [500], error: null };
    });
    expect(requested).toEqual([0, 500]);
    expect(rows).toHaveLength(501);
  });
});