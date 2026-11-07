import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import english from '../../public/locales/en/courses.json';
import type { ExploreHeroRow } from '@/components/explore-tab-new/hooks/useExploreHero';
import type { HeroCourseFactRow } from '@/hooks/courses/useHeroCourseFact';

const state = vi.hoisted(() => ({ hero: null as ExploreHeroRow | null, fact: null as HeroCourseFactRow | null }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/components/explore-tab-new/hooks/useExploreHero', () => ({ useExploreHero: () => ({ data: state.hero, isLoading: false }) }));
vi.mock('@/components/explore-tab-new/hooks/useExploreMood', () => ({ useExploreMood: () => ({ mood: 'all' }) }));
vi.mock('@/hooks/courses/useHeroCourseFact', () => ({ useHeroCourseFact: () => ({ data: state.fact }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { CoursesPageHero } from '@/components/courses/CoursesPageHero';
import { CourseMasthead, MASTHEAD_PLACE } from '@/components/courses/CourseMasthead';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SCRIM_HERO_TALL, SCRIM_STANDOUT } from '@/styles/photoScrim';
import { HERO_CANON_WASH } from '@/features/tourhub/_shared/heroGradient';

const language = createInstance();
void language.init({ lng: 'en', fallbackLng: 'en', initAsync: false, resources: { en: { courses: english } } });
const showHero = () => render(<MemoryRouter><I18nextProvider i18n={language}><CoursesPageHero /></I18nextProvider></MemoryRouter>);

beforeEach(() => {
  state.hero = {
    course_id: 'course', course_name: 'Essex Links', location_primary: 'Britain & Ireland',
    location_secondary: 'Essex', hero_image_url: null, rating_avg: null, review_count: null,
    global_rank: null, why_ai: 'A course blurb.', context_stats: null, filter_tier: null,
    list_rank: null, list_label: null,
  };
  state.fact = { fact_kind: 'course_record', rounds_tracked: 172, player_count: 8, record_gross: 68,
    record_holder: 'Alex', hole_no: null, hole_par: null, hole_over: null, hole_plays: null, avg_over_par: null };
});

describe('Courses-only place line', () => {
  it('puts the full location and round tail under the name with no kicker', () => {
    showHero();
    const name = screen.getByText('Essex Links');
    expect(name.nextElementSibling?.textContent).toBe('Britain & Ireland, Essex · 172 rounds');
    expect(name.parentElement?.parentElement?.previousElementSibling).toBeNull();
  });
  it('retains list order and rating formatting in preference to rounds', () => {
    if (!state.hero) throw new Error('Missing fixture');
    state.hero.list_label = 'Top 100'; state.hero.rating_avg = 8.4;
    showHero();
    expect(screen.getByText('Essex Links').nextElementSibling?.textContent).toBe('Britain & Ireland, Essex · Top 100 · 8.4');
  });
  it.each([
    [null, 'Essex', 'Essex · 172 rounds'],
    ['Britain & Ireland', null, 'Britain & Ireland · 172 rounds'],
    [null, null, '172 rounds'],
  ])('drops absent location parts (%s, %s)', (primary, secondary, expected) => {
    if (!state.hero) throw new Error('Missing fixture');
    state.hero.location_primary = primary; state.hero.location_secondary = secondary;
    showHero();
    expect(screen.getByText('Essex Links').nextElementSibling?.textContent).toBe(expected);
  });
  it('starts with the list when both locations are absent', () => {
    if (!state.hero) throw new Error('Missing fixture');
    state.hero.location_primary = null; state.hero.location_secondary = null; state.hero.list_label = 'Top 100';
    showHero();
    expect(screen.getByText('Essex Links').nextElementSibling?.textContent).toBe('Top 100 · 172 rounds');
  });
  it('keeps the existing one-line place style, with amber and no uppercase or tracking', () => {
    showHero();
    const line = screen.getByText('Essex Links').nextElementSibling as HTMLElement;
    const probe = document.createElement('div'); probe.style.color = A.AMBER;
    expect(line.style.color).toBe(probe.style.color);
    expect(line.style.fontSize).toBe('12.5px'); expect(line.style.fontWeight).toBe('600');
    expect(line.style.whiteSpace).toBe('nowrap'); expect(line.style.textOverflow).toBe('ellipsis');
    expect(line.style.textTransform).toBe(''); expect(line.style.letterSpacing).toBe('');
  });
  it('preserves default detail place ink and detail callers do not opt in', () => {
    render(<CourseMasthead name="Detail" kicker="Region" place="Country" />);
    const probe = document.createElement('div'); probe.style.color = String(MASTHEAD_PLACE.color);
    expect((screen.getByText('Country') as HTMLElement).style.color).toBe(probe.style.color);
    expect(readFileSync(resolve('src/components/golf-club/GolfClubView.tsx'), 'utf8')).not.toContain('placeColor=');
  });
  it('layers the shared photo-band fade beneath the text', () => {
    showHero();
    const hero = screen.getByRole('link', { name: 'View Essex Links' });
    const layers = Array.from(hero.children) as HTMLElement[];
    expect(layers[0].hasAttribute('data-photo-band-fade')).toBe(true);
    // jsdom may omit var() backgrounds; the canonical material is source-owned.
    expect(readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial.tsx', 'utf8')).toContain("background: 'var(--th-overview-photo-fade)'");
    expect(layers[0].style.position).toBe('absolute'); expect(layers[0].style.inset).toBe('0');
    expect(layers[1].style.zIndex).toBe('1'); expect(layers[1].contains(screen.getByText('Essex Links'))).toBe(true);
  });
  it('extends only the new token to 60%, preserving the standout recipe exactly', () => {
    expect(SCRIM_STANDOUT).toBe('linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 32%)');
    expect(SCRIM_HERO_TALL).toBe(SCRIM_STANDOUT.replace('32%', '60%'));
  });
});