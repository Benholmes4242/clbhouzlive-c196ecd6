import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { OverviewNews } from '@/features/tourhub/overview/sections/OverviewNews';
import { FeatureStory, GUTTER, HeroStory, WorkhorseRow } from '@/features/tourhub/news/StoryShapes';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'viewer' } }),
}));

function story(id: string, image = true): TourStory {
  return {
    id,
    slug: id,
    kicker: 'PGA TOUR',
    headline: `${id} headline long enough to exercise the shared clamp without changing its dimensions`,
    standfirst: `${id} standfirst`,
    body_blocks: [],
    image_url: image ? `${id}.jpg` : null,
    image_credit: null,
    tour_slug: 'pga',
    tournament_id: null,
    published_at: '2026-09-08T12:00:00Z',
  };
}

describe('Tour Overview N1 shared story composition', () => {
  it('renders six shared story shapes without engagement', () => {
    const { container } = render(<MemoryRouter><OverviewNews stories={Array.from({ length: 6 }, (_, index) => story(`story-${index + 1}`))} /></MemoryRouter>);
    expect(screen.getAllByRole('button', { name: /^Read / })).toHaveLength(6);
    expect(container.querySelectorAll('[aria-hidden="true"] svg')).toHaveLength(0);
    expect(container.querySelector('[aria-label="Featured stories"]')?.children).toHaveLength(2);
    expect(container.querySelector('[aria-label="More stories"]')?.children).toHaveLength(3);
  });

  it('collapses missing photographs in every shared shape without placeholders', () => {
    const { container } = render(<MemoryRouter><OverviewNews stories={Array.from({ length: 6 }, (_, index) => story(`story-${index + 1}`, false))} /></MemoryRouter>);
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getAllByRole('button', { name: /^Read / })).toHaveLength(6);
  });

  it('keeps News-tab defaults at 14px with engagement visible', () => {
    const hero = render(<MemoryRouter><HeroStory story={story('hero')} onOpen={() => {}} /></MemoryRouter>);
    expect((hero.container.querySelector('article > div:nth-of-type(2)') as HTMLElement).style.left).toBe(`${GUTTER}px`);
    expect(hero.container.querySelector('svg')).not.toBeNull();
    hero.unmount();

    const feature = render(<MemoryRouter><FeatureStory story={story('feature')} onOpen={() => {}} /></MemoryRouter>);
    expect(feature.container.querySelector('svg')).not.toBeNull();
    feature.unmount();

    const row = render(<MemoryRouter><WorkhorseRow story={story('row')} onOpen={() => {}} /></MemoryRouter>);
    expect(row.container.querySelector('svg')).not.toBeNull();
  });
});