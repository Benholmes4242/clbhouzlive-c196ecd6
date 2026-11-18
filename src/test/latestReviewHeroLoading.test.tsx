import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const state = vi.hoisted(() => ({ settled: false }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/components/explore-tab-new/hooks/useExploreHero', () => ({ useExploreHero: () => ({ data: { course_id: 'c', course_name: 'Course' }, isLoading: false }) }));
vi.mock('@/components/explore-tab-new/hooks/useExploreMood', () => ({ useExploreMood: () => ({ mood: 'all' }) }));
vi.mock('@/hooks/courses/useHeroCourseFact', () => ({ useHeroCourseFact: () => ({ data: { fact_kind: 'course_record', record_gross: 69, record_holder: 'Member' } }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/courses/useCourseRecordHolders', () => ({ useCourseRecordHolders: () => ({ map: new Map([['c', { holderId: 'm', holderName: 'Member', recordGross: 69, photoUrl: null }]]), settled: state.settled }) }));
import { CoursesPageHero } from '@/components/courses/CoursesPageHero';
afterEach(cleanup);
describe('Latest reviews hero record waiting', () => {
  it('shows only the record-shaped placeholder until settled, even with cached matching data', () => {
    state.settled = false;
    const { container, rerender } = render(<MemoryRouter><CoursesPageHero /></MemoryRouter>);
    expect(container.querySelector('[data-hero-record-loading]')).not.toBeNull();
    expect(container.querySelector('[data-hero-record]')).toBeNull();
    expect(container.querySelector('.lucide-crown')).toBeNull();
    state.settled = true;
    rerender(<MemoryRouter><CoursesPageHero /></MemoryRouter>);
    expect(container.querySelector('[data-hero-record-loading]')).toBeNull();
    expect(container.querySelector('[data-hero-record]')).not.toBeNull();
  });
});