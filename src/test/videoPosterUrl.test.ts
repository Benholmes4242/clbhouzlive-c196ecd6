import { describe, expect, it } from 'vitest';
import { getThumbnailUrl } from '@/utils/thumbnail';
import { derivePosterUrl, posterSeconds } from '@/uploads/posterUrl';

describe('VIDEO_POSTERS_1 explicit thumbnail times', () => {
  it('default stream thumbnail carries time=1s', () => { expect(getThumbnailUrl({ streamId: 'default' })).toContain('&time=1s'); });
  it('zero stream thumbnail carries time=0s', () => { expect(getThumbnailUrl({ streamId: 'zero', time: 0 })).toContain('&time=0s'); });
  it('unknown-duration derived poster carries time=1s', () => { expect(derivePosterUrl({ streamId: 'unknown' })).toContain('&time=1s'); });
  it('non-stream images are unchanged', () => { expect(getThumbnailUrl({ imageUrl: '/photo.jpg' })).toBe('/photo.jpg'); });
  it.each([7, 0, 12.5])('posterSeconds parses %ss', time => { expect(posterSeconds(`https://example.test/poster.jpg?height=1080&time=${time}s`)).toBe(time); });
  it('posterSeconds returns null with no time', () => { expect(posterSeconds('/poster.jpg')).toBeNull(); expect(posterSeconds(null)).toBeNull(); });
  it('posterSeconds rejects invalid or embedded time text', () => { expect(posterSeconds('/poster?time=-2s')).toBeNull(); expect(posterSeconds('/poster?notime=7s')).toBeNull(); });
});