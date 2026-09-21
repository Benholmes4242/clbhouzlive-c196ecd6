import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoryBand } from '@/features/tourhub/overview/sections/StoryBand';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

const story = (over: Partial<TourStory> = {}) =>
  ({
    id: 's1',
    slug: 'a-slug',
    headline: 'A headline',
    standfirst: null,
    kicker: 'DP World Tour',
    tour_slug: 'dp-world-tour',
    image_url: 'https://example.test/a.jpg',
    published_at: new Date().toISOString(),
    tournament_id: null,
    ...over,
  }) as unknown as TourStory;

describe('StoryBand renders the hero', () => {
  it('is 340 tall with no standfirst', () => {
    const { container } = render(<MemoryRouter><StoryBand story={story()} /></MemoryRouter>);
    const article = container.querySelector('[data-overview-story-band] article') as HTMLElement;
    expect(article.style.height).toBe('340px');
    expect(container.querySelector('p')).toBeNull();
    expect(container.textContent).toContain('DP WORLD TOUR');
  });

  it('renders nothing once the image fails', () => {
    const { container } = render(<MemoryRouter><StoryBand story={story()} /></MemoryRouter>);
    fireEvent.error(container.querySelector('img') as HTMLElement);
    expect(container.querySelector('[data-overview-story-band]')).toBeNull();
    expect(container.innerHTML).toBe('');
  });
});
