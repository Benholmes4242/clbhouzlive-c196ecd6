import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { PhotoBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand';
import { AboutSection } from '@/components/courses/course-detail/about/AboutSection';
import { Section } from '@/features/explore-magazine/Section';
import { FieldChampions } from '@/components/profile/handicap/whs/sections/course-legends/flat/FieldChampions';
import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';
import { Sec } from '@/components/courses/course-detail/you/many/manyBits';

afterEach(cleanup);

function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
}

function colour(container: HTMLElement, selector: string) {
  const element = container.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing representative kicker: ${selector}`);
  return getComputedStyle(element).color;
}

describe('Brief 7 eyebrow colour canon', () => {
  it('Tour overview photo kicker computes to ink', () => {
    const { container } = mount(<PhotoBand title="Event" venueName={null} datesString={null} venueImageUrl={null} state={{ kind: 'live', round: 3, totalRounds: 4 }} tourLabel="Tour" leader={null} countdown={[]} startDay={null} />);
    expect(colour(container, '[data-overview-photo-kicker-row] > span')).toBe('rgb(248, 250, 252)');
  });

  it('Courses public verdict kicker computes to ink', () => {
    const { container } = mount(<AboutSection kicker="Field verdict" title="Course"><div /></AboutSection>);
    expect(colour(container, 'section > div > div > span')).toBe('rgb(248, 250, 252)');
  });

  it('Explore public competition eyebrow computes to ink', () => {
    const { container } = mount(<Section contest eyebrow="Boards" title="Standings"><div /></Section>);
    expect(colour(container, 'section > div')).toBe('rgb(248, 250, 252)');
  });

  it('Profile course-wide cabinet kicker computes to ink', () => {
    const { container } = mount(<FieldChampions categories={[]} grouped={new Map()} courseName="Course" activeKey="lowest_gross_all_time" onSelect={vi.fn()} legendWindow="all_time" onWindowChange={vi.fn()} onConnect={vi.fn()} onOpenFull={vi.fn()} par={71} fieldOverPar={null} rounds={null} />);
    expect(colour(container, '.champions-empty-kicker')).toBe('rgb(248, 250, 252)');
  });

  it('Business place kicker computes to ink', () => {
    const { container } = mount(<ClubProfileHero name="Club" placeLine="Golf club · Kent" onShare={vi.fn()} renderMore={trigger => trigger} team={null} isFollowing={false} onFollowToggle={vi.fn()} onBookTeeTime={vi.fn()} onMessage={vi.fn()} />);
    expect(colour(container, '[data-club-place]')).toBe('rgb(248, 250, 252)');
  });

  it('B: viewer-owned course verdict kicker still computes to amber', () => {
    const { container } = mount(<Sec kicker="Your verdict" title="Your golf"><div /></Sec>);
    expect(colour(container, 'section > div')).toBe('rgb(247, 147, 30)');
  });
});