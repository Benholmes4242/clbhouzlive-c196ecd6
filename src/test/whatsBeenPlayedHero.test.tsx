/** BRIEF_WHATS_BEEN_PLAYED_V2 §1 — the hero's course_record fact uses the
 *  course list card's record row when the holder's gross matches. */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const s = vi.hoisted(() => ({ fact: null as any, holders: new Map<string, any>() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/components/explore-tab-new/hooks/useExploreHero', () => ({ useExploreHero: () => ({ data: { course_id: 'course', course_name: 'Essex Links', location_primary: 'Britain & Ireland', location_secondary: 'Essex', hero_image_url: null, rating_avg: null, review_count: null, global_rank: null, why_ai: null, context_stats: null, filter_tier: null, list_rank: null, list_label: null }, isLoading: false }) }));
vi.mock('@/components/explore-tab-new/hooks/useExploreMood', () => ({ useExploreMood: () => ({ mood: 'all' }) }));
vi.mock('@/hooks/courses/useHeroCourseFact', () => ({ useHeroCourseFact: () => ({ data: s.fact }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/courses/useCourseRecordHolders', () => ({ useCourseRecordHolders: () => ({ map: s.holders, players: undefined, settled: true }) }));
import { CoursesPageHero } from '@/components/courses/CoursesPageHero';

const fact = (kind: string, gross: number | null) => ({ fact_kind: kind, rounds_tracked: 172, player_count: 8, record_gross: gross, record_holder: 'Alex', hole_no: 7, hole_par: 4, hole_over: 0.8, hole_plays: 40, avg_over_par: 6 });
const show = () => render(<MemoryRouter><CoursesPageHero /></MemoryRouter>);
beforeEach(() => { s.holders = new Map([['course', { courseId: 'course', recordGross: 68, holderId: 'u1', holderName: 'Alex Turner', photoUrl: null }]]); });

describe('hero record row', () => {
  it('shows the list card row: face, COURSE RECORD, name and gross', () => {
    s.fact = fact('course_record', 68);
    const { container } = show();
    const row = container.querySelector('[data-hero-record]') as HTMLElement;
    expect(row.className).toBe('course-list-record');
    expect(row.querySelector('.course-list-record-label')?.textContent).toBe('COURSE RECORD');
    expect(row.querySelector('.course-list-holder-name')?.textContent).toBe('Alex Turner');
    expect(row.querySelector('.course-list-gross')?.textContent).toBe('68');
    expect(row.querySelector('.course-list-gross-label')?.textContent).toBe('GROSS');
  });
  it('keeps the crown line when the holder gross differs or is missing', () => {
    s.fact = fact('course_record', 70);
    expect(show().container.querySelector('[data-hero-record]')).toBeNull();
    s.fact = fact('course_record', 68); s.holders = new Map();
    expect(show().container.querySelector('[data-hero-record]')).toBeNull();
  });
  it('hardest hole is unchanged: no record row', () => {
    s.fact = fact('hardest_hole', null);
    expect(show().container.querySelector('[data-hero-record]')).toBeNull();
  });
});
