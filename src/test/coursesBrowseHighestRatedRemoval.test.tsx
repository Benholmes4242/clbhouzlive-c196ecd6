import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

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

vi.mock('@/components/courses/useStatBrowse', () => ({
  useCourseBrowseTruth: () => ({ data: null, isLoading: false }),
  useStatBrowseList: () => ({ rows: [], isLoading: false }),
}));
vi.mock('@/components/courses/useBrowseReviews', () => ({ useBrowseReviews: () => ({ pool: [], isLoading: false }) }));
vi.mock('@/stores/reviewSheetStore', () => ({
  useReviewSheetStore: (sel?: (s: { open: () => void }) => unknown) => sel?.({ open: () => {} }),
}));
vi.mock('@/components/courses/CourseMasthead', () => ({ HERO_FIGURE_LABEL: {}, HERO_FIGURE_VALUE: {} }));
vi.mock('@/components/courses/StatBrowse', () => ({ default: () => null }));
vi.mock('@/components/courses/browse/WhoPlayingSection', async () => ({ WhoPlayingSection: await readySection('whoPlaying') }));
vi.mock('@/components/courses/browse/ByRegionSection', async () => ({ ByRegionSection: await readySection('byRegion'), ALL_COURSES_ANCHOR: 'all-courses' }));
vi.mock('@/components/courses/browse/LatestCoursesSection', async () => ({ LatestCoursesSection: await readySection('latestCourses') }));
vi.mock('@/components/courses/browse/MostPlayedSection', async () => ({ MostPlayedSection: await readySection('mostPlayed') }));
vi.mock('@/components/courses/browse/HardestSection', async () => ({ HardestSection: await readySection('hardest') }));
vi.mock('@/components/courses/browse/LatestHolesSection', async () => ({ LatestHolesSection: await readySection('latestHoles') }));
vi.mock('@/components/courses/browse/LatestReviewsSection', () => ({ LatestReviewsSection: () => null }));

import CoursesBrowsePage from '@/components/courses/CoursesBrowsePage';

const mount = () => render(<CoursesBrowsePage onOpenDirectory={() => {}} />);

afterEach(cleanup);

describe('BRIEF_REMOVE_HIGHEST_RATED_SECTION', () => {
  it('the Courses page never renders "What members rate highest"', () => {
    const view = mount();
    expect(view.container.querySelector('#all-courses')).not.toBeNull();
    expect(screen.queryByText('What members rate highest')).toBeNull();
  });

  it("GATE_IDS does not contain 'highestRated' and the page no longer mounts the section", () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/courses/CoursesBrowsePage.tsx'), 'utf8');
    expect(source).not.toContain("'highestRated'");
    expect(source).not.toContain('HighestRatedSection');
  });

  it('the page gate opens once the remaining sections report ready', async () => {
    const view = mount();
    const gateDiv = (view.container.firstElementChild as HTMLElement).children[1].firstElementChild as HTMLElement;
    // RTL flushes effects before render returns, so the gate is expected to
    // already be revealed — every remaining section reported ready at mount.
    await waitFor(() => expect(gateDiv.style.display).toBe(''));
  });
});
