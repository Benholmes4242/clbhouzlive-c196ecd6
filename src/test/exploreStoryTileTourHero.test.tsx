import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { PHOTO_REVIEW_LABEL } from '@/styles/photoScrim';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

/**
 * BRIEF_EXPLORE_STORY_TILE_MATCH_THE_TOUR_HERO — the story tile keeps its
 * rounded frame and takes the tour overview hero's internals. Reversed by
 * BRIEF_EXPLORE_AMATEUR_NEWS_TILE: the meta row is now a two-part split (fixed
 * "Amateur News" label hard left, age hard right), the story's own source
 * became a white eyebrow above the headline, and the standfirst is gone from
 * this card entirely (NOTE 1 — the surfaces diverge on purpose).
 */

const IMAGE = 'https://example.test/links.jpg';

function base(): StreamItem {
  return {
    id: 'story-1',
    kind: 'story',
    ring: 'world',
    lane: 'news',
    score: 1,
    consequence: null,
    subject: {
      course_id: 'fort-william',
      course_name: 'Fort William Golf Club',
      region: 'Highland',
      sub_country: 'Scotland',
      country: 'Britain & Ireland',
      image_url: IMAGE,
      pending: false,
    },
    who: { user_id: 'author', display_name: 'A member', photo_url: null, is_viewer: false },
    facts: {
      source: 'Bunkered',
      headline: 'A championship story',
      standfirst: 'The supporting detail follows beneath the title.',
      published_at: new Date().toISOString(),
    },
    payload: {},
    seen: false,
  };
}

function review(): StreamItem {
  return {
    ...base(),
    id: 'review-1',
    kind: 'review',
    facts: { rating: 8.8, first_sentence: 'A thoughtful review.', play_date: '2026-09-15' },
  };
}

function story(facts: Record<string, unknown> = {}, over: Partial<StreamItem> = {}): StreamItem {
  const b = base();
  return { ...b, ...over, facts: { ...b.facts, ...facts } } as StreamItem;
}

function draw(item: StreamItem, size: 'lead' | 'std' = 'lead') {
  return render(<ExploreCard item={item} size={size} shape={null} onTap={() => undefined} />).container;
}

describe('Explore story tile matches the tour hero', () => {
  it('§1 carries ONE scrim across the whole tile and none on the copy block', () => {
    const c = draw(story());
    const scrim = c.querySelector<HTMLElement>('[data-explore-story-scrim="true"]');
    expect(scrim?.style.position).toBe('absolute');
    expect(scrim?.style.inset).toBe('0');
    expect(scrim?.style.zIndex).toBe('1');
    /* Two scrims stacked would double-darken the foot. jsdom drops gradient
       values, so the copy scrim is asserted by its presence, not its fill. */
    expect(c.querySelector('[data-explore-copy-scrim="true"]')).toBeNull();
  });

  it('§2 renders a two-part meta row in the unchanged 48px lane: label left, age pinned right', () => {
    const c = draw(story());
    const hero = c.querySelector<HTMLElement>('[data-explore-hero="true"]');
    const lane = hero?.firstElementChild as HTMLElement | null;
    const meta = c.querySelector<HTMLElement>('[data-explore-story-meta="true"]');
    expect(lane?.style.flex).toBe('0 0 48px');
    expect(meta?.parentElement).toBe(lane);
    /* TWO PARTS ON ONE LINE: the label takes the space, the age never shrinks. */
    expect(meta?.style.display).toBe('flex');
    expect(meta?.style.alignItems).toBe('baseline');
    expect(meta?.style.gap).toBe('10px');
    expect(meta?.style.minWidth).toBe('0px');
    expect(meta?.style.padding).toBe('13px 16px 0px');
    expect(meta?.style.fontSize).toBe('9px');
    expect(meta?.style.fontWeight).toBe('700');
    expect(meta?.style.letterSpacing).toBe('0.16em');
    expect(meta?.style.lineHeight).toBe('1.2');
    expect(meta?.style.textTransform).toBe('uppercase');
    expect(meta?.style.color).toBe('rgba(248, 250, 252, 0.82)');
    /* THE SECTION LABEL IS FIXED — it names the section, never the story. */
    const section = meta?.querySelector<HTMLElement>('[data-explore-story-section="true"]');
    expect(section?.textContent).toBe('Amateur News');
    expect(section?.style.flex).toBe('1 1 auto');
    expect(section?.style.whiteSpace).toBe('nowrap');
    expect(section?.style.textOverflow).toBe('ellipsis');
    const age = meta?.querySelector<HTMLElement>('[data-explore-story-age="true"]');
    expect(age?.style.flex).toBe('0 0 auto');
    expect(age?.style.whiteSpace).toBe('nowrap');
    expect(age?.textContent).not.toBe('');
    /* The " · " separator is gone; the gap does that job. */
    expect(meta?.textContent).not.toContain('·');
    /* §2.3 the story meta does NOT read the review token. */
    expect(meta?.style.color).not.toBe(PHOTO_REVIEW_LABEL);
    expect(PHOTO_REVIEW_LABEL).toBe('rgba(255,255,255,0.62)');
  });

  it('§2.1 a story with no source keeps the fixed label, renders no eyebrow, and stays 340', () => {
    const c = draw(story({ source: null, published_at: null, arrived_at: null }));
    const meta = c.querySelector<HTMLElement>('[data-explore-story-meta="true"]');
    expect(meta?.querySelector('[data-explore-story-section="true"]')?.textContent).toBe('Amateur News');
    /* Absent renders NOTHING — no empty line, no reserved space. */
    expect(c.querySelector('[data-explore-story-eyebrow="true"]')).toBeNull();
    expect(c.querySelector<HTMLElement>('[data-explore-hero="true"]')?.style.minHeight).toBe('340px');
  });

  it('§3/§4 clamps the headline at four and carries NO standfirst', () => {
    const c = draw(story({
      headline: 'A very long amateur headline that runs on and on across the whole tile at 390px',
    }));
    const headline = c.querySelector<HTMLElement>('[data-explore-headline="true"]');
    expect(headline?.dataset.exploreLineClamp).toBe('4');
    expect(c.querySelector('[data-explore-standfirst="true"]')).toBeNull();
  });

  it('§4 the eyebrow is white caps above the headline, one truncating line, kicker still suppressed', () => {
    const c = draw(story());
    const copy = c.querySelector<HTMLElement>('[data-explore-hero-copy="true"]');
    const eyebrow = c.querySelector<HTMLElement>('[data-explore-story-eyebrow="true"]');
    expect(eyebrow?.textContent).toBe('Bunkered');
    expect(eyebrow?.style.color).toBe('#FFFFFF');
    expect(eyebrow?.style.textTransform).toBe('uppercase');
    expect(eyebrow?.style.letterSpacing).toBe('0.19em');
    expect(eyebrow?.style.lineHeight).toBe('1.2');
    expect(eyebrow?.style.whiteSpace).toBe('nowrap');
    expect(eyebrow?.style.overflow).toBe('hidden');
    expect(eyebrow?.style.textOverflow).toBe('ellipsis');
    /* It sits in the copy block, directly above the headline. */
    expect(eyebrow?.parentElement).toBe(copy);
    const siblings = Array.from(copy?.children ?? []);
    const eyebrowAt = siblings.findIndex((s) => s === eyebrow);
    const headlineAt = siblings.findIndex((s) => s.getAttribute('data-explore-headline') === 'true');
    expect(eyebrowAt).toBe(headlineAt - 1);
    /* kickerParts describes a ROUND — the story branch never renders it. */
    expect(c.querySelector('[data-explore-hero-kicker="true"]')).toBeNull();
  });

  it('§5 keeps the rounded frame and the 16px bottom lane', () => {
    const c = draw(story());
    expect(c.querySelector<HTMLElement>('button > span > div')?.style.borderRadius).toBe('18px');
    expect(c.querySelector<HTMLElement>('[data-explore-hero-bottom-lane="true"]')?.style.height).toBe('16px');
  });

  /* BRIEF_EXPLORE_REVIEW_TILE_C5 §3.1/§5 — the review keeps its own copy scrim
     and does NOT take the story's; it adds a separate top-of-frame ramp because
     the instrument now prints identity at the top. The words are gone, so there
     is no headline to clamp. */
  it('§6 leaves the review card on its copy-anchored scrim, never the story scrim', () => {
    const c = draw(review());
    expect(c.querySelector('[data-explore-story-scrim="true"]')).toBeNull();
    const copyScrim = c.querySelector<HTMLElement>('[data-explore-copy-scrim="true"]');
    expect(copyScrim?.style.inset).toBe('0');
    expect(c.querySelector('[data-explore-review-scrim="true"]')).not.toBeNull();
    expect(c.querySelector('[data-explore-headline="true"]')).toBeNull();
    expect(c.querySelector('[data-review-top-line="true"]')).not.toBeNull();
  });

  it('§6 a story with no image still renders below-photo at std', () => {
    const c = draw(story({}, { subject: { ...base().subject!, image_url: null } }), 'std');
    expect(c.querySelector('[data-explore-hero="true"]')).toBeNull();
    expect(c.querySelector('[data-explore-story-scrim="true"]')).toBeNull();
  });
});
