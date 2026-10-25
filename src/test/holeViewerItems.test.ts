import { describe, expect, it } from 'vitest';
import { buildHoleViewerItems, type HoleViewerShot } from '@/lib/courseMedia/holeViewerItems';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { buildHlsUrl } from '@/utils/streamId';

/** BRIEF_COURSES_LATEST_FROM_COURSES §7/§9 — the shared hole viewer item
 * builder. The snapshot fixture mirrors holePanelCarousel.test.tsx exactly
 * (Royal Portrush (Dunluce), hole 14, par 4, 432 yards, Thomas Holmes,
 * added 2026-03-11) so a drift from the hole walk's pre-extraction output
 * fails here. */

const image = (id: string, over: Partial<HoleViewerShot> = {}): HoleViewerShot => ({
  id, media_type: 'image', media_url: `/${id}.jpg`, poster_url: null, stream_id: null,
  duration_seconds: null, added_at: '2026-03-11T10:00:00Z', author: 'Thomas Holmes',
  hole_no: 14, par: 4, yards: 432, ...over,
});
// buildHlsUrl only accepts a 32-hex Cloudflare UID, so the fixture uses one.
const STREAM = 'c'.padEnd(32, '0');
const video = (id: string, duration: number | null): HoleViewerShot => image(id, {
  media_type: 'video', stream_id: STREAM, poster_url: `/${id}-poster.jpg`, duration_seconds: duration,
});

describe('BRIEF_COURSES_LATEST_FROM_COURSES hole viewer items', () => {
  it('scored hole: output equals what the hole walk produced before extraction', () => {
    const items = buildHoleViewerItems([image('a'), image('b', { author: 'Benjamin Holmes', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)], { courseName: 'Royal Portrush Golf Club (Dunluce)', scored: true });
    expect(items).toEqual([
      {
        id: 'a', type: 'image', order: 0,
        previewUrl: '/a.jpg', thumbnailUrl: holeMediaPoster(image('a')), hlsUrl: undefined,
        caption: { kicker: 'The fourteenth', title: 'Royal Portrush (Dunluce) · Par 4 · 432 yards', credit: 'Thomas Holmes · Mar 2026' },
      },
      {
        id: 'b', type: 'image', order: 1,
        previewUrl: '/b.jpg', thumbnailUrl: holeMediaPoster(image('b')), hlsUrl: undefined,
        caption: { kicker: 'The fourteenth', title: 'Royal Portrush (Dunluce) · Par 4 · 432 yards', credit: 'Benjamin Holmes · Jun 2026' },
      },
      {
        id: 'c', type: 'video', order: 2,
        previewUrl: holeMediaPoster(video('c', 42)), thumbnailUrl: holeMediaPoster(video('c', 42)), hlsUrl: buildHlsUrl(STREAM),
        caption: { kicker: 'The fourteenth', title: 'Royal Portrush (Dunluce) · Par 4 · 432 yards', credit: 'Thomas Holmes · Mar 2026' },
      },
    ]);
  });

  it('unscored hole: title carries no par or yardage', () => {
    const items = buildHoleViewerItems([image('a', { par: null, yards: null })], { courseName: 'Royal Portrush Golf Club (Dunluce)', scored: false });
    expect(items).toHaveLength(1);
    expect(items[0].caption).toEqual({ kicker: 'The fourteenth', title: 'Royal Portrush (Dunluce)', credit: 'Thomas Holmes · Mar 2026' });
  });

  it('scored hole with null yards omits the yardage but keeps the par', () => {
    const items = buildHoleViewerItems([image('a', { yards: null })], { courseName: 'Old Head Golf Links', scored: true });
    expect(items[0].caption?.title).toBe('Old Head · Par 4');
  });

  it('processing videos are excluded and the credit line is omitted when empty', () => {
    const items = buildHoleViewerItems([
      video('p', null),
      image('a', { author: null, added_at: null }),
    ], { courseName: 'Old Head Golf Links', scored: true });
    expect(items.map(item => item.id)).toEqual(['a']);
    expect(items[0].caption?.credit).toBeUndefined();
  });
});
