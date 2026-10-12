import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { FeedPost } from '@/components/media-system/types/media';
import type { TourStory } from '@/features/tourhub/news/useTourStories';
import type { StoryBlock } from '@/features/tourhub/news/blocks';
import { injectWireStories } from '@/components/feed/injectWireStories';
import { readingTimeLabel } from '@/features/tourhub/news/readingTime';
import { joinDateline } from '@/features/tourhub/news/storyTime';

vi.mock('react-i18next', async (orig) => ({
  ...(await orig<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (k: string, o?: unknown) => {
      const map: Record<string, string> = { 'news.fromWire': 'TOUR NEWS', 'news.amateurNews': 'AMATEUR NEWS', 'news.readStory': 'READ THE STORY' };
      if (map[k]) return map[k];
      if (typeof o === 'string') return o;
      return (o as { defaultValue?: string })?.defaultValue ?? k;
    },
  }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({
  default: () => ({ stateFor: () => ({ count: 2, mine: false }), toggle: vi.fn(), unavailable: false, viewerId: 'u1' }),
}));
vi.mock('@/features/stories/useStoryEngagement', () => ({
  useStoryEngagement: () => ({ engagementFor: () => ({ commentCount: 0 }) }),
}));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));

import { WireFeedSlide } from '@/features/tourhub/news/WireFeedSlide';

const NOW = new Date('2026-10-12T11:00:00Z').getTime();
const para = (n: number): StoryBlock => ({ type: 'paragraph', text: Array.from({ length: n }, () => 'word').join(' ') });
const story = (id: string, o: Partial<TourStory> = {}): TourStory => ({
  id, slug: id, kicker: 'K', headline: `Headline ${id}`, standfirst: 'Dek', body_blocks: [para(400)],
  image_url: `${id}.jpg`, image_credit: 'Getty', tour_slug: null, tournament_id: null,
  published_at: new Date(NOW - 3600_000).toISOString(), ...o,
});
const posts = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` } as FeedPost));
const wrap = (el: React.ReactElement) => render(<MemoryRouter>{el}</MemoryRouter>);

describe('news card masthead', () => {
  it('reads Tour News on a tour story, Amateur News on an amateur one, no tag pill or age', () => {
    const a = wrap(<WireFeedSlide story={story('t')} beat="tour" />);
    const strip = a.container.querySelector('[data-wire-strip]')!;
    expect(strip.textContent).toBe('TOUR NEWS');
    expect(strip.children).toHaveLength(1);
    a.unmount();
    const b = wrap(<WireFeedSlide story={story('a')} beat="amateur" />);
    expect(b.container.querySelector('[data-wire-strip]')!.textContent).toBe('AMATEUR NEWS');
  });

  it('no user-facing string in src or the English locale says "from the wire"', () => {
    const en = readFileSync(join(process.cwd(), 'public/locales/en/tourhub.json'), 'utf8');
    expect(/from the wire/i.test(en)).toBe(false);
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) { if (f !== 'test' && f !== '__tests__') walk(p); continue; }
        if (!/\.tsx?$/.test(f) || /\.test\./.test(f)) continue;
        const src = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        if (/['"`>]\s*from the wire/i.test(src)) hits.push(p);
      }
    };
    walk(join(process.cwd(), 'src'));
    expect(hits).toEqual([]);
  });
});

describe('dateline', () => {
  it('drops absent clauses without a stray separator', () => {
    expect(joinDateline(['Fri 10 Oct', '2 min read', null])).toBe('Fri 10 Oct · 2 min read');
    expect(joinDateline(['', '2 min read', 'Photo Getty'])).toBe('2 min read · Photo Getty');
    const r = wrap(<WireFeedSlide story={story('t', { image_credit: null })} />);
    const text = r.container.querySelector('[data-wire-dateline]')!.textContent!;
    expect(text.split(' · ')).toHaveLength(2);
    expect(text.endsWith('·')).toBe(false);
  });
});

describe('reading time', () => {
  it('400 words reads 2 min, empty reads 1 min, non-text blocks add nothing', () => {
    expect(readingTimeLabel([para(400)])).toBe('2 min read');
    expect(readingTimeLabel([])).toBe('1 min read');
    expect(readingTimeLabel([
      para(400),
      { type: 'image', url: 'x', caption: Array(500).fill('w').join(' ') },
      { type: 'leaderboard', tournament_id: 't' },
      { type: 'player', player_id: 'p' },
      { type: 'stat', player_id: 'p' },
      { type: 'round', player_id: 'p', tournament_id: 't' },
    ])).toBe('2 min read');
  });
});

describe('briefing', () => {
  const slides = (n: number) =>
    injectWireStories(posts(6), Array.from({ length: n }, (_, i) => story(`t${i}`)), [], NOW)
      .filter((x) => x.kind === 'wire') as Array<Extract<ReturnType<typeof injectWireStories>[number], { kind: 'wire' }>>;

  it('shows two rows with three+, one with two, no label with only the lead', () => {
    for (const [n, rows] of [[4, 2], [2, 1], [1, 0]] as const) {
      const s = slides(n)[0];
      const r = wrap(<WireFeedSlide story={s.story} beat={s.beat} more={s.more} />);
      expect(r.container.querySelectorAll('[data-wire-briefing-row]')).toHaveLength(rows);
      expect(!!r.container.querySelector('[data-wire-briefing]')).toBe(rows > 0);
      r.unmount();
    }
  });

  it('advances the queue by three, so consecutive slides of a beat share no story', () => {
    const merged = injectWireStories(posts(24), Array.from({ length: 9 }, (_, i) => story(`t${i}`)), [], NOW)
      .filter((x) => x.kind === 'wire') as Array<Extract<ReturnType<typeof injectWireStories>[number], { kind: 'wire' }>>;
    const shown = merged.map((s) => [s.story.id, ...s.more.map((m) => m.id)]);
    expect(shown[0]).toEqual(['t0', 't1', 't2']);
    expect(shown[1]).toEqual(['t3', 't4', 't5']);
    expect(new Set(shown.flat()).size).toBe(shown.flat().length);
  });

  it('never pads across beats', () => {
    const merged = injectWireStories(posts(12), [story('t0')], [story('a0'), story('a1')], NOW)
      .filter((x) => x.kind === 'wire') as Array<Extract<ReturnType<typeof injectWireStories>[number], { kind: 'wire' }>>;
    expect(merged[0].more).toEqual([]);
    expect(merged[1].more.map((m) => m.id)).toEqual(['a1']);
  });
});

describe('engagement row', () => {
  it('renders as the last part of the card with like, comment and send', () => {
    const r = wrap(<WireFeedSlide story={story('t')} />);
    const article = r.container.querySelector('article')!;
    const eng = article.querySelector('[data-wire-engagement]')!;
    const blocks = Array.from(article.children);
    expect(blocks[blocks.length - 1]).toBe(eng);
    expect(eng.querySelectorAll('button').length).toBe(3);
    expect(eng.querySelector('[aria-label="Send"]')).not.toBeNull();
    expect(r.container.querySelector('[data-wire-strip]')!.textContent).not.toMatch(/AGO|JUST NOW|YESTERDAY/);
  });
});
