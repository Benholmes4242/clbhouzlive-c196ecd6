import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { fullWidthCardSize } from '@/features/explore-magazine/ExploreMagazine';
import { rendersOnPhoto } from '@/features/explore-magazine/cardTreatment';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

function story(opts: { image?: boolean; standfirst?: string | null } = {}): StreamItem {
  const image = opts.image !== false;
  return {
    id: 'story:1',
    kind: 'story',
    ring: null,
    lane: 'news',
    score: 0,
    consequence: null,
    subject: image
      ? { course_id: null, course_name: null, region: null, sub_country: null, image_url: 'https://example.test/a.jpg', pending: false }
      : null,
    who: null,
    facts: {
      headline: 'Rory holds on at Wentworth',
      standfirst: opts.standfirst === undefined ? 'A two-shot lead became one on the last.' : opts.standfirst,
      story_slug: 'rory',
      source: 'DP World Tour',
      published_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
      arrived_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    },
    payload: {},
    seen: null,
  } as unknown as StreamItem;
}

describe('story cards on photo', () => {
  it('an illustrated story is on-photo at lead', () => {
    expect(rendersOnPhoto(story(), 'lead')).toBe(true);
    expect(fullWidthCardSize(story())).toBe('lead');
    const { container } = render(<ExploreCard item={story()} size="lead" onTap={() => {}} />);
    expect(container.querySelector('[data-explore-hero]')).not.toBeNull();
    expect(container.querySelector('[data-explore-standfirst]')?.textContent).toBe('A two-shot lead became one on the last.');
  });

  it('an image-less story stays below-photo at std', () => {
    expect(rendersOnPhoto(story({ image: false }), 'lead')).toBe(false);
    expect(fullWidthCardSize(story({ image: false }))).toBe('std');
    const { container } = render(<ExploreCard item={story({ image: false })} size="std" onTap={() => {}} />);
    expect(container.querySelector('[data-explore-hero]')).toBeNull();
    expect(container.querySelector('[data-explore-headline]')).not.toBeNull();
  });

  it('no standfirst renders nothing', () => {
    const { container } = render(<ExploreCard item={story({ standfirst: null })} size="lead" onTap={() => {}} />);
    expect(container.querySelector('[data-explore-standfirst]')).toBeNull();
  });

  it('a pair story is never on-photo', () => {
    expect(rendersOnPhoto(story(), 'pair')).toBe(false);
  });

  it('the byline is the time alone', () => {
    const { container } = render(<ExploreCard item={story()} size="lead" onTap={() => {}} />);
    const row = container.querySelector('.explore-who-line');
    expect(row).not.toBeNull();
    expect(row!.textContent).toBe('3H AGO');
    expect(row!.textContent).not.toContain('member');
    expect(row!.textContent).not.toContain('·');
  });

  it('moment and course items carry no byline name either', () => {
    const moment = { ...story(), id: 'm', kind: 'moment', facts: { arrived_at: null } } as unknown as StreamItem;
    const { container } = render(<ExploreCard item={moment} size="std" onTap={() => {}} />);
    const row = container.querySelector('.explore-who-line');
    expect(row?.textContent ?? '').not.toContain('member');
  });
});
