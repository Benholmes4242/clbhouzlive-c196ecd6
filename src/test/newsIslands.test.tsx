import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ count }: { count?: number }) => <span><b>{count} new</b> since your last visit</span>,
  useTranslation: () => ({
    t: (k: string, o?: { defaultValue?: string; count?: number; n?: number; query?: string }) => {
      if (k === 'news.page.searchEmpty') return `No stories match "${o?.query}".`;
      if (k === 'news.page.searchPlaceholder') return 'Search stories';
      if (k === 'news.page.showOlder') return 'Show older stories';
      if (k === 'news.page.read') return '✓ Read';
      if (k === 'news.minRead') return `${o?.n} min read`;
      if (o?.count != null) {
        if (k.includes('searchResults')) return `${o.count} ${o.count === 1 ? 'STORY' : 'STORIES'}`;
        if (k.includes('yourPlayersCount')) return `${o.count} ${o.count === 1 ? 'story' : 'stories'}`;
      }
      return o?.defaultValue ?? '';
    },
  }),
}));

const h = vi.hoisted(() => ({
  stories: [] as import('@/features/tourhub/news/useTourStories').TourStory[],
  search: { debounced: '', active: false, results: [] as unknown[], isLoading: false, settled: false },
}));

vi.mock('@/features/tourhub/news/useTourStories', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/tourhub/news/useTourStories')>();
  return { ...orig, useTourStories: () => ({ stories: h.stories, isLoading: false, latestAt: null }) };
});
vi.mock('@/features/stories/useStoryEngagement', () => ({
  useStoryEngagement: () => ({ engagementFor: () => ({ likeCount: 0, commentCount: 0, viewerLiked: false }) }),
}));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set<string>() }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => false }));
vi.mock('@/features/tourhub/hooks/useTourLensFromPicker', () => ({ useTourLensFromPicker: () => {} }));
vi.mock('@/features/tourhub/hooks/useTourSelection', () => ({ readStoredTour: () => null }));
vi.mock('@/features/tourhub/overview/sections/useOverviewNewsData', () => ({ useOverviewNewsData: () => new Map() }));
vi.mock('@/features/tourhub/news/newsPageData', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/tourhub/news/newsPageData')>();
  return {
    ...orig,
    useNewsEventNames: () => ({ data: new Map() }),
    useNewsSearch: () => h.search,
    useNewsEventBoard: () => ({ data: undefined }),
  };
});
vi.mock('@/features/tourhub/hooks/useTourHubData', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/features/tourhub/hooks/useTourHubData')>();
  return { ...orig, useTourTournament: () => ({ data: null, isPending: false }) };
});
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));

import { NewsTab } from '@/features/tourhub/news/NewsTab';
import { NEWS_LAST_SEEN } from '@/features/tourhub/news/newsVisit';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

function story(id: string, overrides: Partial<TourStory> = {}): TourStory {
  return {
    id, slug: id, kicker: `Kicker ${id}`, headline: `Headline ${id}`, standfirst: `Standfirst ${id}`,
    body_blocks: [], image_url: `/img/${id}.jpg`, image_credit: null,
    tour_slug: 'pga', tournament_id: null, published_at: new Date(Date.now() - 3600e3).toISOString(),
    ...overrides,
  };
}

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function mount(islands = false) {
  return render(
    <MemoryRouter initialEntries={['/tourhub?tab=news']}>
      <NewsTab immersiveHero={false} islands={islands} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  // Stories publish an hour ago; last visit a day ago → the fresh line shows.
  localStorage.setItem(NEWS_LAST_SEEN, String(Date.now() - 24 * 3600e3));
  h.stories = [story('lead'), story('second'), story('third')];
  h.search = { debounced: '', active: false, results: [], isLoading: false, settled: false };
});

describe('News tab on the shared islands — hub wiring', () => {
  const main = source('src/features/tourhub/pages/TourHubMainPage.tsx');

  it('the hub no longer renders TourPageShell for any tab', () => {
    expect(main).not.toContain('<TourPageShell');
    expect(main).not.toContain("import { TourPageShell }");
    expect(main).not.toContain('--tour-header-h');
    expect(main).not.toContain('SubTabTourControl');
    expect(main).toContain('{renderTab()}');
  });

  it('the news tab renders with the islands prop', () => {
    expect(main).toContain('<NewsTab immersiveHero={false} islands />');
  });
});

describe('News tab on the shared islands — lead bleed', () => {
  it('the lead is the first element and contains the head and search button', () => {
    const { container } = mount(true);
    const root = container.querySelector('.tour-news--islands')!;
    const lead = root.querySelector('[data-testid="tour-news-lead"]')!;
    expect(root.firstElementChild).toBe(lead);
    const head = lead.querySelector('.tour-news-head')!;
    expect(head.querySelector('h1')!.textContent).toBe('Tour News');
    expect(head.querySelector('[aria-label="Search stories"]')).not.toBeNull();
    // jsdom drops var() declarations from inline styles; pin the top in source.
    expect(source('src/features/tourhub/news/NewsTab.tsx')).toContain('top: CHROME_CLEARANCE');
  });

  it('the lead is 500 tall with the top shade ahead of the shared wash', () => {
    const css = source('src/index.css');
    expect(css).toContain('.tour-news--islands .tour-news-lead { height:500px; }');
    expect(css).toContain('.tour-news--islands .tour-news-lead::after { background:linear-gradient(180deg, rgba(10,10,12,0.40) 0%, rgba(10,10,12,0) 30%), var(--news-hero-wash); }');
    // The shared rule is untouched.
    expect(css).toContain('.tour-news-lead { position:relative; display:block; width:100%; height:440px;');
  });

  it('tapping the search button opens search and does not open the story', () => {
    const { container } = mount(true);
    const lead = container.querySelector('[data-testid="tour-news-lead"]')!;
    fireEvent.click(lead.querySelector('[aria-label="Search stories"]')!);
    expect(container.querySelector('[data-testid="tour-news-searchbar"]')).not.toBeNull();
    // The story did not open: still on the hub URL, lead hidden while searching.
    expect(container.querySelector('[data-testid="tour-news-lead"]')).toBeNull();
  });

  it('Enter on the overlaid search button opens search and never opens the story', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/tourhub?tab=news']}>
        <NewsTab immersiveHero={false} islands />
        <LocationProbe />
      </MemoryRouter>,
    );
    const lead = container.querySelector('[data-testid="tour-news-lead"]')!;
    fireEvent.keyDown(lead.querySelector('[aria-label="Search stories"]')!, { key: 'Enter' });
    expect(container.querySelector('[data-testid="tour-news-searchbar"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="loc"]')!.textContent).toBe('/tourhub');
  });

  it('Enter on the lead itself opens the story', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/tourhub?tab=news']}>
        <NewsTab immersiveHero={false} islands />
        <LocationProbe />
      </MemoryRouter>,
    );
    fireEvent.keyDown(container.querySelector('[data-testid="tour-news-lead"]')!, { key: 'Enter' });
    expect(container.querySelector('[data-testid="loc"]')!.textContent).toBe('/tour/news/lead');
  });

  it('the fresh line renders directly below the lead', () => {
    const { container } = mount(true);
    const lead = container.querySelector('[data-testid="tour-news-lead"]')!;
    const fresh = container.querySelector('.tour-news-fresh');
    expect(fresh).not.toBeNull();
    expect(lead.compareDocumentPosition(fresh!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lead.nextElementSibling).toBe(fresh);
  });

  it('with search open, the search bar starts under the islands', () => {
    const { container } = mount(true);
    fireEvent.click(container.querySelector('[aria-label="Search stories"]')!);
    const bar = container.querySelector('[data-testid="tour-news-searchbar"]')!;
    // jsdom drops var() declarations from inline styles; pin the clearance in source.
    const tab = source('src/features/tourhub/news/NewsTab.tsx');
    expect(tab).toContain('paddingTop: CHROME_CLEARANCE');
    expect(bar).not.toBeNull();
  });

  it('renders the scroll-to-top control the shell used to supply', () => {
    expect(source('src/features/tourhub/news/NewsTab.tsx')).toContain('<ScrollToTopGlass />');
  });
});

describe('News tab without islands — unchanged', () => {
  it('the head renders above the lead and the lead stays a button', () => {
    const { container } = mount(false);
    const root = container.querySelector('.tour-news')!;
    expect(root.classList.contains('tour-news--islands')).toBe(false);
    const head = root.querySelector('.tour-news-head')!;
    const lead = root.querySelector('[data-testid="tour-news-lead"]')!;
    expect(lead.tagName).toBe('BUTTON');
    expect(lead.contains(head)).toBe(false);
    expect(head.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The fresh line still leads the content above the lead.
    const fresh = root.querySelector('.tour-news-fresh');
    if (fresh) {
      expect(fresh.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
