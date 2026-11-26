/** Brief 35: share card as the feed photo block, ten-photo resolution with proxy, and the proxy handler. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { TopTenShareCard, type TopTenShareCourse } from '@/components/profile/hero/topTenShare/TopTenShareCard';
import { resolveSharePhoto, proxyUrlFor } from '@/components/profile/hero/topTenShare/resolveSharePhotos';
import { handleProxy } from '../../supabase/functions/course-image-proxy/handler';

const course = (position: number, rating: number | null = 9.0): TopTenShareCourse => ({ position, course_id: `00000000-0000-4000-8000-00000000000${position % 10}`, name: `Course ${position}`, region: 'Kent', sub_country: 'England', country: 'GB', thumbnail_image: `https://img.example/${position}.jpg`, rating });
const ten = Array.from({ length: 10 }, (_, i) => course(i + 1));
const identity = { displayName: 'Benjamin Holt', firstName: 'Benjamin', avatarUrl: null, handicapIndex: 1.9, rounds: 259, rated: 46 };
const card = (props: Partial<React.ComponentProps<typeof TopTenShareCard>> = {}) => render(<TopTenShareCard format="story" courses={ten} identity={identity} showHandicap photos={Array(10).fill(null)} {...props} />);
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Brief 35 share card', () => {
  it('story has the title, post has none', () => {
    expect(card().container.querySelector('[data-share-title]')).toHaveTextContent("Benjamin's top ten courses"); cleanup();
    expect(card({ format: 'post' }).container.querySelector('[data-share-title]')).toBeNull();
  });
  it('ten courses render ten tiles in position order; a 1,2,3,5 ten has empty cells at 4 and 6-10', () => {
    const { container } = card();
    expect([...container.querySelectorAll('[data-share-tile]')].map(e => e.getAttribute('data-share-tile'))).toEqual(['1','2','3','4','5','6','7','8','9','10']);
    cleanup();
    const gapped = card({ courses: [1, 2, 3, 5].map(p => course(p)) });
    expect([...gapped.container.querySelectorAll('[data-share-empty]')].map(e => e.getAttribute('data-share-tile'))).toEqual(['4','6','7','8','9','10']);
  });
  it('null score has no pill; 9.7 shows "9.7"', () => {
    const { container } = card({ courses: [course(1, 9.7), course(2, null), course(3)] });
    expect(container.querySelector('[data-share-tile="1"] [data-share-pill]')).toHaveTextContent('9.7');
    expect(container.querySelector('[data-share-tile="2"] [data-share-pill]')).toBeNull();
  });
  it('a present course without a photo draws the course fallback, never an empty panel', () => {
    const { container } = card();
    for (const tile of container.querySelectorAll<HTMLElement>('[data-share-tile]:not([data-share-empty])')) {
      expect(tile.querySelector('[data-share-fallback]')).not.toBeNull();
      expect(tile.style.backgroundColor).not.toBe('rgb(22, 22, 26)'); expect(tile.style.backgroundColor).not.toBe('rgb(0, 0, 0)');
    }
  });
  it('Show my handicap off removes the HCP part', () => {
    expect(card().container.querySelector('[data-share-stats]')?.textContent).toContain('HCP'); cleanup();
    const off = card({ showHandicap: false }).container.querySelector('[data-share-stats]')?.textContent ?? '';
    expect(off).not.toContain('HCP'); expect(off).toContain('rounds');
  });
});

describe('Brief 35 photo resolution', () => {
  it('a failed cors fetch calls the proxy with the course id', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:ok');
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError('cors')).mockResolvedValueOnce({ ok: true, blob: async () => ({ type: 'image/jpeg' }) });
    const c = course(4);
    expect(await resolveSharePhoto(c, fetchImpl as never)).toBe('blob:ok');
    expect(fetchImpl.mock.calls[1][0]).toBe(proxyUrlFor(c.course_id!));
  });
  it('a failed proxy returns null (fallback tile) and warns with position and host', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('cors'));
    expect(await resolveSharePhoto(course(2), fetchImpl as never)).toBeNull();
    expect(warn).toHaveBeenCalledWith('[top10-share] photo failed', { position: 2, host: 'img.example' });
  });
});

describe('Brief 35 course-image-proxy', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const req = () => new Request(`https://x/functions/v1/course-image-proxy?course_id=${id}`);
  it('404s a course with no thumbnail_image', async () => {
    const res = await handleProxy(req(), { lookupThumbnail: async () => null, fetchImpl: vi.fn() as never });
    expect(res.status).toBe(404); expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
  it('rejects a non-image content type', async () => {
    const res = await handleProxy(req(), { lookupThumbnail: async () => 'https://a/b', fetchImpl: (async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })) as never });
    expect(res.status).toBe(415);
  });
  it('serves the image with CORS * and a day of caching', async () => {
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } }));
    const res = await handleProxy(req(), { lookupThumbnail: async () => 'https://a/b.jpg', fetchImpl: fetchImpl as never });
    expect(res.status).toBe(200); expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Content-Type')).toBe('image/jpeg'); expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(fetchImpl).toHaveBeenCalledWith('https://a/b.jpg', expect.anything());
  });
  it('accepts no arbitrary url parameter and rejects a non-uuid', async () => {
    const res = await handleProxy(new Request('https://x/?url=https://evil'), { lookupThumbnail: async () => 'x', fetchImpl: vi.fn() as never });
    expect(res.status).toBe(400);
  });
});
