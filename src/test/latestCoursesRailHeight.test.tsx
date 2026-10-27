import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LatestCourseMedia } from '@/components/courses/browse/LatestCoursesSection';

const f = vi.hoisted(() => ({ latest: [] as LatestCourseMedia[], rpc: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia', () => ({ useGalleryCourseMedia: () => ({ data: null, isError: false }) }));
vi.mock('@tanstack/react-query', async importOriginal => ({ ...await importOriginal<typeof import('@tanstack/react-query')>(), useInfiniteQuery: (options: unknown) => { f.rpc(options); return { data: { pages: [f.latest] }, isLoading: false, isError: false, hasNextPage: false, isFetching: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }; } }));

import { LATEST_COURSE_W, LATEST_COURSE_H, LATEST_COURSE_SMALL_H, LATEST_COURSE_BIG_W, LATEST_COURSE_SMALL_W, LatestCoursesSection } from '@/components/courses/browse/LatestCoursesSection';
import { LATEST_HOLE_W, LATEST_HOLE_H } from '@/components/courses/browse/LatestHolesSection';
import { LatestCourseSkeletonCard } from '@/components/courses/browse/sectionShells';

const tile = (n: number): LatestCourseMedia['tiles'][number] => ({ post_id: `p${n}`, media_id: `m${n}`, media_type: 'image', media_url: `/t${n}.jpg`, poster_url: null, stream_id: null, duration_seconds: null, created_at: '2026-10-24T12:00:00Z' });
const row = (i: number): LatestCourseMedia => ({ course_id: `course-${i}`, latest_at: '2026-10-24T12:00:00Z', course_name: `Course ${i}`, media_count: 3, contributor_count: 1, latest_member_name: 'Thomas Holmes', tiles: [tile(i * 3), tile(i * 3 + 1), tile(i * 3 + 2)] });

beforeEach(() => {
  vi.clearAllMocks();
  f.latest = [row(1), row(2), row(3)];
});
afterEach(cleanup);

function mount() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={cache}><LatestCoursesSection /></QueryClientProvider></MemoryRouter>);
}

describe('BRIEF latest-course tiles share the latest-holes tile height (Ben, 27 Oct 2026)', () => {
  it('the shared height is 293 and the derived small cell is (H - 2) / 2', () => {
    expect(LATEST_HOLE_H).toBe(293);
    expect(LATEST_COURSE_H).toBe(LATEST_HOLE_H);
    expect(LATEST_COURSE_SMALL_H).toBe((LATEST_HOLE_H - 2) / 2);
  });

  it('the latest-course tile is LATEST_HOLE_H tall and each small cell stacks to it', () => {
    const view = mount();
    const card = screen_getCard(view);
    expect(card.style.height).toBe(`${LATEST_HOLE_H}px`);
    expect(card.style.width).toBe(`${LATEST_COURSE_W}px`);
    expect(card.style.gridTemplateRows).toBe(`${LATEST_COURSE_SMALL_H}px ${LATEST_COURSE_SMALL_H}px`);
    expect(card.style.gridTemplateColumns).toBe('220px 110px');
  });

  it('the latest-course skeleton is LATEST_HOLE_H tall', () => {
    const view = render(<MemoryRouter><LatestCourseSkeletonCard /></MemoryRouter>);
    const bar = view.container.querySelector('.latest-course-skeleton-card') as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.style.height).toBe(`${LATEST_HOLE_H}px`);
  });

  it('the section source derives the small cells from the shared height without rounding', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/courses/browse/LatestCoursesSection.tsx'), 'utf8');
    expect(source).toContain('export const LATEST_COURSE_H = LATEST_HOLE_H;');
    expect(source).toContain('export const LATEST_COURSE_SMALL_H = (LATEST_COURSE_H - 2) / 2;');
    expect(source).not.toContain('LATEST_COURSE_H = 230');
  });
});

function screen_getCard(view: ReturnType<typeof mount>): HTMLElement {
  const button = view.container.querySelector('button[aria-label^="Open "]') as HTMLElement;
  expect(button).not.toBeNull();
  return button.parentElement as HTMLElement;
}
