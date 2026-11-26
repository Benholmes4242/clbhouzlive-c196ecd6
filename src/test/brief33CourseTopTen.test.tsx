import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import {
  courseTenMovementCopy,
  courseTenNumberOnesCopy,
  courseTenRecordCopy,
  courseTenSheetLine,
  type CourseTopTenChart,
  type CourseTopTenMember,
  type CourseTopTenStanding,
} from '@/components/courses/course-detail/courseTopTenRules';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/courses/browse/ClbhouzTenSheet', () => ({
  ClbhouzTenSheet: ({ open, cohort, highlightCourseId }: { open: boolean; cohort: string; highlightCourseId?: string }) => open
    ? <div data-testid="everyone-chart" data-cohort={cohort} data-highlight={highlightCourseId} />
    : null,
}));

import { CourseTopTenStandingCard } from '@/components/courses/course-detail/CourseTopTenStandingCard';
import { CourseTopTenMembersSheet } from '@/components/courses/course-detail/CourseTopTenMembersSheet';

const members: CourseTopTenMember[] = [
  { user_id: 'u1', display_name: 'Thomas Muchmore', first_name: 'Thomas', username: 'thomas', avatar_url: null, is_pro: true, pronoun: 'his', position: 1, is_pinned: true },
  { user_id: 'u2', display_name: 'Magnus Nylander', first_name: 'Magnus', username: 'magnus', avatar_url: null, is_pro: false, pronoun: 'his', position: 1, is_pinned: true },
  { user_id: 'u3', display_name: 'Grant Neal', first_name: 'Grant', username: 'grant', avatar_url: null, is_pro: true, pronoun: 'his', position: 2, is_pinned: true },
  { user_id: 'u4', display_name: 'Benjamin Holmes', first_name: 'Benjamin', username: 'ben', avatar_url: null, is_pro: false, pronoun: 'his', position: 3, is_pinned: false },
  { user_id: 'u5', display_name: 'Mason Essam', first_name: 'Mason', username: 'mason', avatar_url: null, is_pro: true, pronoun: 'their', position: 4, is_pinned: true },
];
const chart: CourseTopTenChart = { rank: 2, movement: 'down', delta: -1, weeks_at_one: 6, weeks_on_chart: 9, best_rank: 1, points: 42, week_start: '2026-11-23' };
function standing(patch: Partial<CourseTopTenStanding> = {}): CourseTopTenStanding {
  return { course_id: 'course-1', in_tens: 5, number_ones: 2, chart, members, ...patch };
}
function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

beforeEach(cleanup);

describe('Brief 33 course clbhouz Ten standing', () => {
  it('renders no card, sheet or gap for a null RPC result', () => {
    const { container } = render(<MemoryRouter><CourseTopTenStandingCard courseId="course-1" courseName="Royal County Down" standing={null} /></MemoryRouter>);
    expect(container.firstChild).toBeNull();
  });

  it('maps all six movement states and binds the two signed-off colours', () => {
    expect(courseTenMovementCopy({ ...chart, movement: 'up', delta: 3 })).toBe('▲3 this week');
    expect(courseTenMovementCopy({ ...chart, movement: 'down', delta: -2 })).toBe('▼2 this week');
    expect(courseTenMovementCopy({ ...chart, movement: 'same', delta: 0 })).toBe('No change this week');
    expect(courseTenMovementCopy({ ...chart, movement: 'new', delta: null })).toBe('New this week');
    expect(courseTenMovementCopy({ ...chart, movement: 're', delta: null })).toBe('Back this week');
    expect(courseTenMovementCopy({ ...chart, movement: null, delta: null })).toBeNull();
    const view = render(<MemoryRouter><CourseTopTenStandingCard courseId="course-1" courseName="Royal County Down" standing={standing({ chart: { ...chart, movement: 'up', delta: 3 } })} /></MemoryRouter>);
    expect(view.container.querySelector('[data-movement=up]')).toHaveTextContent('▲3 this week');
    view.rerender(<MemoryRouter><CourseTopTenStandingCard courseId="course-1" courseName="Royal County Down" standing={standing()} /></MemoryRouter>);
    expect(view.container.querySelector('[data-movement=down]')).toHaveTextContent('▼1 this week');
    const css = readFileSync('src/components/courses/course-detail/courseTopTenStanding.css', 'utf8');
    expect(css).toContain('--course-ten-up:#2FA35A');
    expect(css).toContain('--course-ten-down:#E5484D');
  });

  it('prefers weeks at number one, then uses the singular chart record', () => {
    expect(courseTenRecordCopy(chart)).toBe('6 weeks at #1');
    expect(courseTenRecordCopy({ ...chart, weeks_at_one: 0, weeks_on_chart: 1 })).toBe('1 week on the chart');
  });

  it('announces a Monday chart join without a rank', () => {
    const { container } = render(<MemoryRouter><CourseTopTenStandingCard courseId="course-1" courseName="Royal County Down" standing={standing({ chart: null })} /></MemoryRouter>);
    expect(screen.getByText('Joins the clbhouz ten on Monday')).toBeInTheDocument();
    expect(container.querySelector('.course-ten-rank')).toBeNull();
  });

  it('joins one, two and four first-place names with local count wording', () => {
    expect(courseTenNumberOnesCopy(members.slice(0, 1))).toBe('Thomas');
    expect(courseTenNumberOnesCopy(members.slice(0, 2))).toBe('Thomas and Magnus');
    const four = [members[0], members[1], { ...members[2], position: 1 }, { ...members[3], position: 1 }];
    expect(courseTenNumberOnesCopy(four)).toBe('Thomas, Magnus and 2 others');
  });

  it('prints the exact sheet sentence and picked versus ratings sub-lines', () => {
    expect(courseTenSheetLine('Royal County Down', 5, 2)).toBe('Royal County Down is in 5 public top tens, #1 in two.');
    const data = standing({ members: [{ ...members[0] }, { ...members[3], is_pinned: false, pronoun: 'her' }] });
    render(<MemoryRouter><CourseTopTenMembersSheet open courseId="course-1" courseName="Royal County Down" standing={data} onOpenChange={() => {}} /></MemoryRouter>);
    expect(screen.getByText('Royal County Down is in 5 public top tens, #1 in two.')).toBeInTheDocument();
    expect(screen.getByText('Picked')).toBeInTheDocument();
    expect(screen.getByText('From her ratings')).toBeInTheDocument();
  });

  it('opens the member profile courses tab with this course selected', () => {
    render(<MemoryRouter><CourseTopTenMembersSheet open courseId="course-1" courseName="Royal County Down" standing={standing()} onOpenChange={() => {}} /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Thomas Muchmore/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/profile/thomas?tab=courses&course=course-1');
  });

  it('opens the Brief 32 Everyone chart highlighted on this course', () => {
    render(<MemoryRouter><CourseTopTenStandingCard courseId="course-1" courseName="Royal County Down" standing={standing()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'See chart ›' }));
    expect(screen.getByTestId('everyone-chart')).toHaveAttribute('data-cohort', 'everyone');
    expect(screen.getByTestId('everyone-chart')).toHaveAttribute('data-highlight', 'course-1');
  });

  it('opens the members sheet from the whole members row', async () => {
    render(<MemoryRouter><CourseTopTenStandingCard courseId="course-1" courseName="Royal County Down" standing={standing()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /In 5 members' tens/ }));
    expect(await screen.findByText('Royal County Down is in 5 public top tens, #1 in two.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Their ten/ })).toHaveLength(5);
  });
});
