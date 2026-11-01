import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { SCRIM_STANDOUT, SCRIM_STANDOUT_TOP } from '@/styles/photoScrim';
import type { StatBrowseRow } from '@/components/courses/useStatBrowse';
import type { LatestHoleMedia } from '@/components/courses/browse/LatestHolesSection';
import type { LatestCourseMedia } from '@/components/courses/browse/LatestCoursesSection';

const f = vi.hoisted(() => ({ holes: [] as LatestHoleMedia[], courses: [] as LatestCourseMedia[], stats: [] as StatBrowseRow[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('@/components/courses/useStatBrowse', () => ({ useStatBrowseList: () => ({ rows: f.stats, isLoading: false }) }));
vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback', () => ({ CourseImageFallback: ({ children }: { children: React.ReactNode }) => <div data-photo="">{children}</div> }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia', () => ({ useGalleryCourseMedia: () => ({ data: undefined, isError: false }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@tanstack/react-query', async original => ({ ...await original<typeof import('@tanstack/react-query')>(), useInfiniteQuery: (options: { queryKey: string[] }) => ({ data: { pages: [options.queryKey[1] === 'get_latest_hole_media' ? f.holes : f.courses] }, isLoading: false, isError: false, hasNextPage: false, isFetching: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }) }));

import { PhotoFigureCard } from '@/components/courses/browse/PhotoFigureCard';
import { HardestSection } from '@/components/courses/browse/HardestSection';
import { LatestCoursesSection } from '@/components/courses/browse/LatestCoursesSection';
import { LatestHolesSection } from '@/components/courses/browse/LatestHolesSection';

const source = (name: string) => readFileSync(`src/components/courses/browse/${name}.tsx`, 'utf8');
const mount = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);

beforeEach(() => {
  f.stats = [{ course_id: 'course', name: 'Bright course', image_url: '/sky.jpg', avg_to_par: 20.5 } as StatBrowseRow];
  f.holes = ['first', 'second', 'third'].map(id => ({ id, course_id: id, course_name: `Course ${id}`, hole_no: 3, media_type: 'image', media_url: '/sky.jpg', poster_url: null, stream_id: null, duration_seconds: null, exif_captured_at: null, added_at: '2026-04-03T12:00:00Z', created_at: '2026-04-03T12:00:00Z', member_id: 'member', member_name: 'Andrew Yetzes', member_avatar_url: null, par: 3, yards: 194 }));
  f.courses = ['a', 'b', 'c'].map(id => ({ course_id: id, latest_at: '2026-04-03T12:00:00Z', course_name: `Course ${id}`, media_count: 14, contributor_count: 1, latest_member_name: 'Andrew Yetzes', tiles: [{ post_id: id, media_id: id, media_type: 'image', media_url: '/sky.jpg', poster_url: null, stream_id: null, duration_seconds: null, created_at: '2026-04-03T12:00:00Z' }] }));
});

describe('Courses photo top scrims', () => {
  it('exports the exact 180-degree 40-percent top recipe', () => {
    expect(SCRIM_STANDOUT_TOP).toBe('linear-gradient(180deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 40%)');
  });
  it('preserves the canonical 32-percent bottom recipe', () => {
    expect(SCRIM_STANDOUT).toBe('linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 32%)');
  });
  it.each(['PhotoFigureCard', 'HardestSection', 'LatestCoursesSection', 'LatestHolesSection'])('%s mounts its top layer before its figure and keeps the bottom', name => {
    if (name === 'PhotoFigureCard') mount(<PhotoFigureCard row={f.stats[0]} figure={941} figureLabel="Rounds tracked" />);
    else if (name === 'HardestSection') mount(<HardestSection />);
    else if (name === 'LatestCoursesSection') mount(<LatestCoursesSection />);
    else mount(<LatestHolesSection />);
    const card = screen.getAllByRole('button')[0];
    const photo = card.querySelector('[data-photo]') ?? card;
    const children = Array.from(photo.children) as HTMLElement[];
    const layers = children.filter(child => child.style.position === 'absolute' && child.style.inset === '0' || child.classList.contains('latest-hole-scrim'));
    expect(layers).toHaveLength(2);
    const top = layers[1];
    expect(top.nextElementSibling).not.toBeNull();
    expect(top.nextElementSibling?.textContent).toMatch(/941|20\.5|14|194/);
    expect(source(name)).toContain('background: SCRIM_STANDOUT_TOP');
    if (name === 'LatestCoursesSection') expect(source(name)).toContain("background: 'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 45%)'");
    else expect(source(name)).toContain('background: SCRIM_STANDOUT }');
  });
  it('an eleven-second video retains course and member/date text beside its shared player', () => {
    f.holes[0] = { ...f.holes[0], course_name: 'Tralee Golf Club', media_type: 'video', duration_seconds: 11, poster_url: '/sky.jpg' };
    mount(<LatestHolesSection />);
    const card = screen.getByRole('button', { name: 'Hole 3, Tralee Golf Club' });
    expect(within(card).getByText('Tralee Golf Club')).toBeInTheDocument();
    expect(within(card).getByText('Andrew Yetzes · Apr 2026')).toBeInTheDocument();
    expect(within(card).getByText('0:11')).toHaveClass('glass-chip');
    expect(card.querySelector('.latest-hole-name')).not.toBeNull();
  });
});