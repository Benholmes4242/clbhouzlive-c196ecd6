import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ClubCourseAnalytics } from '@/features/business/clubAnalytics/types';

const d = vi.hoisted(() => ({ row: null as unknown }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { id: 'business', name: 'Sundridge Park Golf Club', club_id: 'club', is_verified: true, category: 'Golf Club' }, isLoading: false }) }));
vi.mock('@/features/business/clubAnalytics/useClubCourseLink', () => ({ useClubCourseLink: () => ({ data: { state: 'seed', courseId: 'east', courseName: 'East' }, isLoading: false }) }));
vi.mock('@/features/business/clubAnalytics/useClubCourseAnalytics', () => ({ useClubCourseAnalytics: () => ({ data: { state: 'ok', data: d.row }, isLoading: false }) }));
vi.mock('@/features/business/claimClub', () => ({ fetchGolfClub: async () => ({ name: 'Sundridge Park Golf Club' }) }));
vi.mock('@/components/business/RequestAnotherCourseSheet', () => ({ RequestAnotherCourseSheet: () => null }));
import ClubAnalyticsPage from '@/pages/ClubAnalyticsPage';
import * as sections from '@/features/business/clubAnalytics/sections';

d.row = {
  course_id: 'east', course_name: 'Sundridge Park Golf Club (East Course)', club_courses: [], rounds: 901, members: 21, complete_rounds: 817, hole_rows: 0,
  first_round: '2018-03-01', last_round: null, avg_gross: 81.7, holes: [],
  outcomes: { ace: 0, albatross: 0, eagle: 18, birdie: 962, par: 6210, bogey: 5122, double_plus: 1993 }, outcomes_total: 14305,
  months: [], weekdays: [], years: [], tees: [], handicap_bands: [], handicap_rounds: 0, competition: null, record_book: null,
} as unknown as ClubCourseAnalytics;
afterEach(cleanup);

describe('CB92 page placement', () => {
  it('old strip and What gets made here are gone; How it plays follows the sentence', () => {
    const view = render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ClubAnalyticsPage /></QueryClientProvider></MemoryRouter>);
    expect('VerdictStrip' in sections).toBe(false);
    expect('ScoringSection' in sections).toBe(false);
    expect(view.container.textContent).not.toMatch(/What gets made here|Mean gross score|Competition rounds/);
    const lead = view.container.querySelector('.club-course-lead')!;
    const card = screen.getByTestId('how-it-plays');
    expect(lead.nextElementSibling).toBe(card);
  });
});
