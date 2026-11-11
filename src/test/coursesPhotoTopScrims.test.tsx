import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
vi.mock('@tanstack/react-query', async original => ({ ...await original<typeof import('@tanstack/react-query')>(), useInfiniteQuery: (options: { queryKey: string[] }) => ({ data: { pages: [options.queryKey[1] === 'get_latest_hole_media' ? f.holes : f.courses] }, isLoading: false, isFetched: true, isError: false, hasNextPage: false, isFetching: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }) }));

import { PhotoFigureCard } from '@/components/courses/browse/PhotoFigureCard';
import { HardestSection } from '@/components/courses/browse/HardestSection';
import { LatestCoursesSection } from '@/components/courses/browse/LatestCoursesSection';
import { LatestHolesSection } from '@/components/courses/browse/LatestHolesSection';

const source = (name: string) => readFileSync(`src/components/courses/browse/${name}.tsx`, 'utf8');
const mount = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);

// jsdom 20 discards gradients. Preserve assigned background values locally so
// the authorised inline-gradient selector inspects React's actual assignments.
const background = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'background');
afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  const gradients = new WeakMap<CSSStyleDeclaration, string>();
  vi.spyOn(CSSStyleDeclaration.prototype, 'background', 'set').mockImplementation(function (this: CSSStyleDeclaration, value: string) {
    if (value.includes('linear-gradient')) gradients.set(this, value);
    else gradients.delete(this);
    background?.set?.call(this, value);
  });
  vi.spyOn(CSSStyleDeclaration.prototype, 'background', 'get').mockImplementation(function (this: CSSStyleDeclaration) {
    return gradients.get(this) ?? background?.get?.call(this) ?? '';
  });
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
    const layers = children.filter(child => child.style.background.includes('linear-gradient'));
    expect(layers).toHaveLength(2);
    const top = layers[1];
    expect(top.nextElementSibling).not.toBeNull();
    expect(top.nextElementSibling?.textContent).toMatch(/941|20\.5|14|194/);
    expect(source(name)).toContain('background: SCRIM_STANDOUT_TOP');
    if (name === 'LatestCoursesSection') expect(source(name)).toContain("background: 'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 45%)'");
    else expect(source(name)).toContain('background: SCRIM_STANDOUT');
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
  it.each(['video', 'image'] as const)('Latest holes %s uses an isolated media-0 scrim-1 text-2 stack', media_type => {
    f.holes[0] = { ...f.holes[0], media_type, duration_seconds: 11, poster_url: '/sky.jpg' };
    mount(<LatestHolesSection />);
    const card = screen.getAllByRole('button')[0];
    expect(card.style.isolation).toBe('isolate');
    const media = card.querySelector<HTMLElement>('.latest-hole-media');
    expect(media?.style.zIndex).toBe('0');
    expect(media?.style.position).toBe('absolute');
    const layers = Array.from(card.children).filter(child => (child as HTMLElement).style.background.includes('linear-gradient')) as HTMLElement[];
    expect(layers.map(layer => layer.style.zIndex)).toEqual(['1', '1']);
    for (const selector of ['.latest-hole-figure', '.latest-hole-name', ...(media_type === 'video' ? ['.latest-hole-video'] : [])]) {
      expect(card.querySelector<HTMLElement>(selector)?.style.zIndex).toBe('2');
    }
    expect(media?.querySelector('img')).not.toBeNull();
  });
  it('Latest courses large video and small posters keep overlays above isolated media', () => {
    const row = f.courses[0];
    const tile = row.tiles[0];
    row.tiles = [tile, { ...tile, media_id: 'small' }, { ...tile, media_id: 'last' }].map(item => ({ ...item, media_type: 'video', poster_url: '/sky.jpg', duration_seconds: 11 }));
    mount(<LatestCoursesSection />);
    const big = screen.getByRole('button', { name: 'Open Course a shot 1 of 14' });
    expect(big.style.isolation).toBe('isolate');
    expect((big.firstElementChild as HTMLElement).style.zIndex).toBe('0');
    const gradients = Array.from(big.children).filter(child => (child as HTMLElement).style.background.includes('linear-gradient')) as HTMLElement[];
    expect(gradients.map(layer => layer.style.zIndex)).toEqual(['1', '1']);
    expect((within(big).getByText('14').parentElement as HTMLElement).style.zIndex).toBe('2');
    expect((within(big).getByText('Course a').parentElement as HTMLElement).style.zIndex).toBe('2');
    for (const number of [2, 3]) {
      const small = screen.getByRole('button', { name: `Open Course a shot ${number} of 14` });
      expect(small.style.isolation).toBe('isolate');
      expect(small.querySelector('img')?.style.zIndex).toBe('0');
      expect(small.querySelector<HTMLElement>('.glass-chip')?.style.zIndex).toBe('2');
    }
  });
});