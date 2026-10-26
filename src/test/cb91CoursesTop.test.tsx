import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ClubCourseAnalytics } from '@/features/business/clubAnalytics/types';

const f = vi.hoisted(() => ({ link: 'seed', loading: false, selectedLoading: false, rows: {} as Record<string, ClubCourseAnalytics>, businessName: 'Sundridge Park Golf Club', sections: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { id: 'business', name: f.businessName, club_id: 'club', is_verified: true, category: 'Golf Club' }, isLoading: f.loading }) }));
vi.mock('@/features/business/clubAnalytics/useClubCourseLink', () => ({ useClubCourseLink: () => ({ data: { state: f.link, courseId: 'east', courseName: 'East' }, isLoading: false }) }));
vi.mock('@/features/business/clubAnalytics/useClubCourseAnalytics', () => ({ useClubCourseAnalytics: (id?: string) => ({ data: id && f.rows[id] ? { state: 'ok', data: f.rows[id] } : undefined, isLoading: id === 'west' && f.selectedLoading }) }));
vi.mock('@/features/business/claimClub', () => ({ fetchGolfClub: async () => ({ name: 'Sundridge Park Golf Club' }) }));
vi.mock('@/components/business/RequestAnotherCourseSheet', () => ({ RequestAnotherCourseSheet: () => null }));
vi.mock('@/features/business/clubAnalytics/sections', () => {
  const section = (name: string) => ({ data }: { data: ClubCourseAnalytics }) => { f.sections(name, data.course_id); return <div data-section={name}>{name}</div>; };
  return Object.fromEntries(['HowItPlaysSection', 'HoleBySection', 'IndexDisagreesSection', 'TeeSheetSection', 'WhoPlaysSection', 'TeesSection', 'RecordBookSection', 'SampleSection'].map(name => [name, section(name)]));
});
import ClubAnalyticsPage from '@/pages/ClubAnalyticsPage';

function data(id: string, rounds: number, avg: number): ClubCourseAnalytics {
  return { course_id: id, course_name: `Sundridge Park Golf Club (${id === 'east' ? 'East' : 'West'} Course)`, club_courses: [{ course_id: 'east', course_name: 'Sundridge Park Golf Club (East Course)', rounds: 901 }, { course_id: 'west', course_name: 'Sundridge Park Golf Club (West Course)', rounds: 863 }], rounds, members: 21, complete_rounds: rounds, hole_rows: 0, first_round: '2018-03-01', last_round: null, avg_gross: avg, holes: [], outcomes: { double_plus: 0, bogey: 0, par: 0, birdie: 0, eagle: 0, albatross: 0, ace: 0 }, outcomes_total: 0, months: [], weekdays: [], years: [], tees: [], handicap_bands: [], handicap_rounds: 0, competition: null, record_book: null };
}
let clients: QueryClient[];
function mount() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(cache);
  return render(<MemoryRouter><QueryClientProvider client={cache}><ClubAnalyticsPage /></QueryClientProvider></MemoryRouter>);
}
beforeEach(() => { vi.clearAllMocks(); clients = []; f.link = 'seed'; f.loading = false; f.selectedLoading = false; f.businessName = 'Sundridge Park Golf Club'; f.rows = { east: data('east', 901, 81.7), west: data('west', 863, 79.4) }; });
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); });
describe('CB91 Your courses top', () => {
  it('loaded header gains the business subtitle and no intro paragraph', () => {
    const view = mount();
    expect(view.container.querySelector('.manage-header-subtitle')).toHaveTextContent('Sundridge Park Golf Club');
    expect(screen.getByRole('heading', { name: 'Your courses' })).toBeInTheDocument();
    expect(view.container.textContent).not.toContain('Your club has');
  });
  it('request panel follows the entire course block and precedes privacy', () => {
    const view = mount();
    const last = view.container.querySelector('[data-section="SampleSection"]');
    const request = screen.getByText('Missing a course?');
    const privacy = screen.getByText(/Everything on this page is an aggregate/);
    if (!last) throw new Error('Missing final course section');
    expect(last.compareDocumentPosition(request) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(request.compareDocumentPosition(privacy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('unclaimed retains its notice and top request panel without a loaded subtitle', () => {
    f.link = 'unclaimed'; const view = mount();
    expect(screen.getByText('Your claim is not yet attached to a course')).toBeInTheDocument();
    expect(screen.getByText('Missing a course?')).toBeInTheDocument();
    expect(view.container.querySelector('.club-course-lead')).toBeNull();
    expect(view.container.querySelector('.manage-header-subtitle')).toBeNull();
  });
  it('unchanged chips switch the selected lead and all existing lower sections in order', () => {
    const view = mount();
    expect(screen.getByRole('tab', { name: /East Course/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: /West Course/ }));
    expect(view.container.querySelector('.club-course-lead-headline')).toHaveTextContent('Golfers on clbhouz go round the West Course in 79.4.');
    expect(view.container.querySelector('.club-course-lead-line')).toHaveTextContent('From 863 rounds');
    expect(Array.from(view.container.querySelectorAll('[data-section]')).map(el => el.getAttribute('data-section'))).toEqual(['HowItPlaysSection', 'HoleBySection', 'IndexDisagreesSection', 'TeeSheetSection', 'WhoPlaysSection', 'TeesSection', 'RecordBookSection', 'SampleSection']);
    for (const name of ['HowItPlaysSection', 'HoleBySection', 'IndexDisagreesSection', 'TeeSheetSection', 'WhoPlaysSection', 'TeesSection', 'RecordBookSection', 'SampleSection']) expect(f.sections).toHaveBeenCalledWith(name, 'west');
  });
  it('one course has a singular header, no chips and a business-name lead', () => {
    f.rows.east.club_courses = []; f.businessName = 'Hartwell Heath Golf Club'; const view = mount();
    expect(screen.getByRole('heading', { name: 'Your course' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(view.container.querySelector('.club-course-lead-headline')).toHaveTextContent('Golfers on clbhouz go round Hartwell Heath in 81.7.');
  });
  it('switching to an unsettled course draws no stale sentence', () => {
    const view = mount(); f.selectedLoading = true;
    fireEvent.click(screen.getByRole('tab', { name: /West Course/ }));
    expect(view.container.querySelector('.club-course-lead')).toBeNull();
    expect(view.container.querySelector('[data-section]')).toBeNull();
  });
});