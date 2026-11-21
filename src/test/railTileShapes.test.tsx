/** Stored-size rail geometry; no existing cases are replaced. */
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ result: [] as Record<string, unknown>[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useCourseMediaCounts', () => ({ useCourseMediaCounts: () => ({ data: { photos: 0, videos: 0 } }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@/components/course-media-tab/HoleInlineVideo', () => ({ HoleInlineVideo: () => <span data-video /> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: () => Promise.resolve({ data: f.result, error: null }) } }));
import { railTileWidth } from '@/components/courses/browse/railTileHeights';
import { RegionRails } from '@/components/courses/browse/RegionRails';
import { PlayedTile } from '@/components/courses/browse/PlayedTile';
import { galleryCourseMediaQuery } from '@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia';
import type { PlayedCourse } from '@/components/courses/browse/usePlayedRounds';
import type { CourseGroup } from '@/components/courses/browse/WhoPlayingSection';
import type { RailPlan } from '@/components/courses/browse/playedRings';
import type { usePlayedTile } from '@/components/courses/browse/usePlayedTile';
const course = { id: 'course', name: 'St Andrews Links (Jubilee Course)', imageUrl: 'https://photo/fallback.jpg', region: 'Fife', subCountry: 'Scotland', country: 'Britain & Ireland', continent: 'Europe', lat: null, lng: null } satisfies PlayedCourse;
const group = { courseId: 'course', activity: 3, rows: [{ whs_score_id: 'round', course_id: 'course', course_name: course.name, user_id: 'member', display_name: 'Member', profile_photo_url: null, gross_score: 70, course_par: 72, play_date: '2026-11-20', total_count: 1 }], reviews: [], posts: 0, faces: [], best: null, latestAt: '2026-11-20' } as CourseGroup;
const rail = { key: 'home', kind: 'home', nations: ['Scotland'], kicker: 'ACROSS SCOTLAND', title: 'Played lately', courseIds: ['course'], playedTotal: 1, activity: 3 } as RailPlan;
function wrap(ui: React.ReactNode) { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>); }
const mountRail = () => wrap(<RegionRails rails={[rail]} groups={[group]} courseMap={new Map([['course', course]])} onOpen={vi.fn()} />);
function card(container: HTMLElement) { const el = container.querySelector<HTMLElement>('[data-rail-card]'); if (!el) throw new Error('rail card absent'); return el; }
class IO { constructor(private cb: IntersectionObserverCallback) {} observe(target: Element) { this.cb([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver); } disconnect() {} unobserve() {} takeRecords() { return []; } }
beforeEach(() => { f.result = []; vi.stubGlobal('IntersectionObserver', IO); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it.each([
  [4032, 3024, 252], [1000, 1000, 252], [1080, 1920, 156], [950, 1000, 252], [940, 1000, 156],
  [null, 1000, 156], [1000, null, 156], [0, 1000, 156], [1000, 0, 156], [NaN, 1000, 156], [1000, NaN, 156], [Infinity, 1000, 156], [1000, Infinity, 156],
])('railTileWidth(%s, %s) returns %s', (w, h, result) => { expect(railTileWidth(w, h)).toBe(result); });
it.each([[4032, 3024, 252], [1080, 1920, 156], [null, null, 156]])('region member media %s x %s uses %s by 216', async (width, height, expected) => {
  f.result = [{ media_url: 'https://photo/member.jpg', media_type: 'image', width, height }];
  const v = mountRail();
  await waitFor(() => expect(v.container.querySelector('[data-rail-media]')).not.toBeNull());
  expect(card(v.container).style.width).toBe(`${expected}px`); expect(card(v.container).style.height).toBe('216px');
});
it('region fallback without member media stays 156 by 216', async () => {
  const v = mountRail(); await waitFor(() => expect(card(v.container).style.width).toBe('156px'));
  expect(card(v.container).style.height).toBe('216px'); expect(v.container.querySelector('[data-rail-media]')).toBeNull();
});
it('region card widens once on deferred media settlement and never on image load', async () => {
  f.result = [{ media_url: 'https://photo/member.jpg', media_type: 'image', width: 4032, height: 3024 }];
  const v = mountRail(); expect(card(v.container).style.width).toBe('156px');
  await waitFor(() => expect(card(v.container).style.width).toBe('252px'));
  const img = v.container.querySelector('[data-rail-media] img'); if (!img) throw new Error('member image absent');
  fireEvent.load(img); expect(card(v.container).style.width).toBe('252px');
  expect(v.container.querySelector('[data-rail-count]')).not.toBeNull(); expect(card(v.container)).toHaveTextContent(course.name);
  expect(v.container.querySelector('[data-best-gross]')).toHaveTextContent('70');
});
it('region video width uses the media row geometry, not its poster', async () => {
  f.result = [{ media_url: 'https://video/manifest.m3u8', media_type: 'video', poster_url: 'https://portrait/poster.jpg', width: 1920, height: 1080 }];
  const v = mountRail(); await waitFor(() => expect(v.container.querySelector('[data-video]')).not.toBeNull()); expect(card(v.container).style.width).toBe('252px');
});
const tile: ReturnType<typeof usePlayedTile> = { ready: true, hardestHole: null, coursePosts: [], holes: [
  { kind: 'hole', key: 'h', width: 4032, height: 3024, holeNo: 3, addedAt: '', imageUrl: 'https://photo/hole.jpg', par: 4, yards: 400, memberName: 'Member', memberId: 'm', memberPhoto: null, sourcePostId: null },
], photos: [
  { kind: 'course', key: 'land', width: 1920, height: 1080, createdAt: '', imageUrl: 'https://photo/course.jpg', caption: 'Course', memberName: null, memberId: null, memberPhoto: null },
  { kind: 'course', key: 'port', width: 1080, height: 1920, createdAt: '', imageUrl: 'https://photo/portrait.jpg', caption: 'Portrait', memberName: null, memberId: null, memberPhoto: null },
] };
it('PlayedTile landscape hole and course photos are 252 and portrait is 156, all 216 tall', () => {
  const v = wrap(<PlayedTile group={group} course={course} tile={tile} />);
  const photos = [...v.container.querySelectorAll<HTMLElement>('[data-tile-photo]')];
  expect(photos.map(p => p.style.width)).toEqual(['252px', '252px', '156px']); expect(photos.map(p => p.style.height)).toEqual(['216px', '216px', '216px']);
});
it('PlayedTile pending bars stay 156 and do not render photos before ready', () => {
  const v = wrap(<PlayedTile group={group} course={course} tile={{ ...tile, ready: false }} />);
  expect([...v.container.querySelectorAll<HTMLElement>('[data-tile-pending]')].map(p => p.style.width)).toEqual(['156px', '156px']); expect(v.container.querySelector('[data-tile-photo]')).toBeNull();
});
it('gallery mapping carries raw dimensions while retaining viewer fallbacks for unknown sizes', async () => {
  f.result = [{ post_id: 'p1', media_id: 'm1', media_type: 'image', media_url: 'https://photo/a.jpg', post_created_at: '2026-11-20', width: 4032, height: 3024 }, { post_id: 'p2', media_id: 'm2', media_type: 'image', media_url: 'https://photo/b.jpg', post_created_at: '2026-11-19', width: null, height: null }];
  const posts = await galleryCourseMediaQuery('course', 'member', undefined, undefined).queryFn();
  expect(posts[0].mediaItems[0]).toMatchObject({ storedWidth: 4032, storedHeight: 3024, width: 4032, height: 3024 });
  expect(posts[1].mediaItems[0]).toMatchObject({ storedWidth: null, storedHeight: null, width: 1080, height: 1920 });
});
