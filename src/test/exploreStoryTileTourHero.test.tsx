import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { PHOTO_REVIEW_LABEL } from '@/styles/photoScrim';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

/**
 * BRIEF_EXPLORE_STORY_TILE_MATCH_THE_TOUR_HERO — the story tile keeps its
 * rounded frame and takes the tour overview hero's internals: one meta line at
 * the top of the frame, a four-line headline, a three-line standfirst, and ONE
 * scrim across the whole tile. The review card is untouched in every respect,
 * and several values below are shared with it.
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

  it('§2 renders one meta line inside the unchanged 48px lane, at the tour hero type', () => {
    const c = draw(story());
    const hero = c.querySelector<HTMLElement>('[data-explore-hero="true"]');
    const lane = hero?.firstElementChild as HTMLElement | null;
    const meta = c.querySelector<HTMLElement>('[data-explore-story-meta="true"]');
    expect(lane?.style.flex).toBe('0 0 48px');
    expect(meta?.parentElement).toBe(lane);
    expect(meta?.textContent).toMatch(/^Bunkered · /);
    expect(meta?.style.padding).toBe('13px 16px 0px');
    expect(meta?.style.fontSize).toBe('9px');
    expect(meta?.style.fontWeight).toBe('700');
    expect(meta?.style.letterSpacing).toBe('0.16em');
    expect(meta?.style.lineHeight).toBe('1.2');
    expect(meta?.style.textTransform).toBe('uppercase');
    expect(meta?.style.color).toBe('rgba(248, 250, 252, 0.82)');
    /* ONE LINE, ALWAYS: it truncates, it never wraps. */
    expect(meta?.style.whiteSpace).toBe('nowrap');
    expect(meta?.style.overflow).toBe('hidden');
    expect(meta?.style.textOverflow).toBe('ellipsis');
    /* §2.3 the story meta does NOT read the review token. */
    expect(meta?.style.color).not.toBe(PHOTO_REVIEW_LABEL);
    expect(PHOTO_REVIEW_LABEL).toBe('rgba(255,255,255,0.62)');
  });

  it('§2.1 drops the separator when there is no age, and keeps the source fallback', () => {
    const c = draw(story({ source: null, published_at: null, arrived_at: null }));
    const meta = c.querySelector<HTMLElement>('[data-explore-story-meta="true"]');
    expect(meta?.textContent).toBe('Amateur News');
  });

  it('§3/§4 clamps the headline at four and the standfirst at three', () => {
    const c = draw(story({
      headline: 'A very long amateur headline that runs on and on across the whole tile at 390px',
    }));
    const headline = c.querySelector<HTMLElement>('[data-explore-headline="true"]');
    const standfirst = c.querySelector<HTMLElement>('[data-explore-standfirst="true"]');
    expect(headline?.dataset.exploreLineClamp).toBe('4');
    expect(standfirst?.dataset.exploreStandfirstClamp).toBe('3');
    expect(standfirst?.style.color).toBe('rgba(248, 250, 252, 0.8)');
    expect(standfirst?.style.fontWeight).toBe('');
  });

  it('§4 an absent standfirst renders nothing and the tile stays 340', () => {
    const c = draw(story({ standfirst: null }));
    expect(c.querySelector('[data-explore-standfirst="true"]')).toBeNull();
    expect(c.querySelector<HTMLElement>('[data-explore-hero="true"]')?.style.minHeight).toBe('340px');
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
