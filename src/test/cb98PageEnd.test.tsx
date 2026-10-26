import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({ link: 'seed', sheet: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { id: 'business', name: 'Sundridge Park Golf Club', club_id: 'club', is_verified: true, category: 'Golf Club' }, isLoading: false }) }));
vi.mock('@/features/business/clubAnalytics/useClubCourseLink', () => ({ useClubCourseLink: () => ({ data: { state: f.link, courseId: 'east', courseName: 'East' }, isLoading: false }) }));
const row = { course_id: 'east', course_name: 'Sundridge Park Golf Club (East Course)', club_courses: [], rounds: 901, members: 21, complete_rounds: 738, hole_rows: 0, first_round: '2018-03-01', last_round: null, avg_gross: 81.7, holes: [], outcomes: { double_plus: 0, bogey: 0, par: 0, birdie: 0, eagle: 0, albatross: 0, ace: 0 }, outcomes_total: 0, months: [], weekdays: [], years: [], tees: [], handicap_bands: [], handicap_rounds: 0, competition: null, record_book: null };
vi.mock('@/features/business/clubAnalytics/useClubCourseAnalytics', () => ({ useClubCourseAnalytics: (id?: string) => ({ data: id ? { state: 'ok', data: row } : undefined, isLoading: false }) }));
vi.mock('@/features/business/claimClub', () => ({ fetchGolfClub: async () => ({ name: 'Sundridge Park Golf Club' }) }));
vi.mock('@/components/business/RequestAnotherCourseSheet', () => ({ RequestAnotherCourseSheet: (p: { open: boolean }) => { f.sheet(p); return p.open ? <div data-testid="request-sheet" /> : null; } }));
vi.mock('@/features/business/clubAnalytics/sections', () => {
  const section = (name: string) => () => <div data-section={name}>{name}</div>;
  return Object.fromEntries(['HowItPlaysSection', 'SampleSection', 'HoleBySection', 'IndexDisagreesSection', 'RecordBookSection', 'TeesSection', 'TeeSheetSection', 'WhoPlaysSection'].map(n => [n, section(n)]));
});
import ClubAnalyticsPage from '@/pages/ClubAnalyticsPage';

const Where = () => { const l = useLocation(); return <div data-testid="where">{l.pathname + l.search}</div>; };
function mount() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter initialEntries={['/manage/business/business/analytics']}><QueryClientProvider client={qc}>
    <Routes><Route path="/manage/business/:id/analytics" element={<ClubAnalyticsPage />} /><Route path="*" element={<Where />} /></Routes>
  </QueryClientProvider></MemoryRouter>);
}
beforeEach(() => { f.link = 'seed'; f.sheet.mockClear(); });
afterEach(cleanup);

describe('CB98 page order and foot', () => {
  it('sections render in the CB98 order without year-on-year or competition', () => {
    const v = mount();
    expect(Array.from(v.container.querySelectorAll('[data-section]')).map(e => e.getAttribute('data-section'))).toEqual(['HowItPlaysSection', 'HoleBySection', 'IndexDisagreesSection', 'TeeSheetSection', 'WhoPlaysSection', 'TeesSection', 'RecordBookSection', 'SampleSection']);
  });
  it('the Missing a course row opens the request sheet', () => {
    mount();
    expect(screen.queryByTestId('request-sheet')).toBeNull();
    fireEvent.click(screen.getByTestId('missing-course-row'));
    expect(screen.getByTestId('request-sheet')).toBeInTheDocument();
    expect(f.sheet).toHaveBeenLastCalledWith(expect.objectContaining({ businessId: 'business', clubId: 'club', existingCourses: [{ course_id: 'east', course_name: 'Sundridge Park Golf Club (East Course)' }] }));
  });
  it('unclaimed keeps its panel', () => {
    f.link = 'unclaimed'; mount();
    expect(screen.queryByTestId('missing-course-row')).toBeNull();
    expect(screen.getByRole('button', { name: /Request another course/ })).toBeInTheDocument();
  });
  it('See profile insights navigates as before', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: /See profile insights/ }));
    expect(screen.getByTestId('where').textContent).toBe('/business/business/insights');
  });
  it('Contact support uses the existing route', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: /Something else\? Contact support/ }));
    expect(screen.getByTestId('where').textContent).toBe(`/manage/contact?category=other&subject=${encodeURIComponent('Course question — Sundridge Park Golf Club')}`);
  });
});
