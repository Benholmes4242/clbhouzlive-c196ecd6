import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/* Every browse section is stubbed to a ready reporter wired to the real
   PageLoadGate context, so the gate reveals exactly when the remaining
   sections have reported — with no Highest rated section among them. */
const readySection = vi.hoisted(() => async (id: string) => {
  const { useSectionReady } = await import('@/components/courses/browse/PageLoadGate');
  return () => {
    useSectionReady(id, true);
    return null;
  };
});

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/components/courses/useStatBrowse', () => ({
  useCourseBrowseTruth: () => ({ data: null, isLoading: false, isFetched: true }),
  useStatBrowseList: () => ({ rows: [], isLoading: false }),
}));
vi.mock('@/components/courses/useBrowseReviews', () => ({ useBrowseReviews: () => ({ pool: [], isLoading: false, isPending: false }) }));
vi.mock('@/stores/reviewSheetStore', () => ({
  useReviewSheetStore: (sel?: (s: { open: () => void }) => unknown) => sel?.({ open: () => {} }),
}));
vi.mock('@/components/courses/CourseMasthead', () => ({ HERO_FIGURE_LABEL: {}, HERO_FIGURE_VALUE: {} }));
vi.mock('@/components/courses/StatBrowse', async () => ({ default: await readySection('list') }));
vi.mock('@/components/courses/browse/WhoPlayingSection', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/components/courses/browse/WhoPlayingSection')>()), WhoPlayingSection: await readySection('whoPlaying') }));
vi.mock('@/components/courses/browse/ByRegionSection', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/components/courses/browse/ByRegionSection')>()), ByRegionSection: await readySection('byRegion') }));
vi.mock('@/components/courses/browse/LatestCoursesSection', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/components/courses/browse/LatestCoursesSection')>()), LatestCoursesSection: await readySection('latestCourses') }));
vi.mock('@/components/courses/browse/StandoutRoundsSection', async () => ({ StandoutRoundsSection: await readySection('standoutRounds') }));
vi.mock('@/components/courses/browse/HardestSection', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/components/courses/browse/HardestSection')>()), HardestSection: await readySection('hardest') }));
vi.mock('@/components/courses/browse/LatestHolesSection', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/components/courses/browse/LatestHolesSection')>()), LatestHolesSection: await readySection('latestHoles') }));
vi.mock('@/components/courses/browse/LatestReviewsSection', () => ({ LatestReviewsSection: () => null }));

import CoursesBrowsePage from '@/components/courses/CoursesBrowsePage';

// The page's own reads (the reviews pool's author rounds) need a query client.
const mount = () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={cache}><CoursesBrowsePage onOpenDirectory={() => {}} /></QueryClientProvider>);
};

afterEach(cleanup);

describe('BRIEF_REMOVE_HIGHEST_RATED_SECTION', () => {
  it('the Courses page never renders "What members rate highest"', () => {
    const view = mount();
    // The list head's anchor now lives inside StatBrowse (BRIEF_COURSES_LIST_
    // PHOTO_CARDS §2) and this test stubs that component, so the anchor is
    // checked where it is built — src/test/coursesListPhotoCards.test.tsx.
    expect(screen.queryByText('What members rate highest')).toBeNull();
  });

  it("GATE_IDS does not contain 'highestRated' and the page no longer mounts the section", () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/courses/CoursesBrowsePage.tsx'), 'utf8');
    expect(source).not.toContain("'highestRated'");
    expect(source).not.toContain('HighestRatedSection');
  });

  it('the page gate opens once the remaining sections report ready', async () => {
    const view = mount();
    // The gate is revealed when nothing in the page is hidden any more and the
    // page's skeleton fallback has gone. The walk starts at the container
    // because the list-head anchor moved inside the stubbed StatBrowse
    // (BRIEF_COURSES_LIST_PHOTO_CARDS §2).
    await waitFor(() => {
      const hidden = Array.from(view.container.querySelectorAll<HTMLElement>('div'))
        .filter((el) => el.style.display === 'none');
      expect(hidden).toHaveLength(0);
      expect(view.container.querySelector('[data-courses-fallback]')).toBeNull();
    });
  });
});
