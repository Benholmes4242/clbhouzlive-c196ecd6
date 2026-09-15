import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

/**
 * BRIEF_EXPLORE_TWO_SHAPES §2 — SHAPE IS DECIDED BY KIND, NOTHING ELSE.
 * A REVIEW is text ON the photograph at every position; a ROUND is text UNDER it
 * at every position. There is no cardTreatment prop any more and position 0 is
 * not special, so these tests assert the shape from the KIND alone.
 */

function round(isViewer = false): StreamItem {
  return {
    id: 'shape-round',
    kind: 'round',
    ring: 'own',
    lane: 'news',
    score: 1,
    consequence: { kind: 'record_taken' },
    subject: {
      course_id: 'addington',
      course_name: 'The Addington Golf Club',
      region: 'Surrey',
      sub_country: 'England',
      country: 'Britain & Ireland',
      image_url: 'https://example.test/bright-sky.jpg',
      pending: false,
    },
    who: {
      user_id: isViewer ? 'viewer' : 'danny',
      display_name: isViewer ? 'Viewer Name' : 'danny.akers1',
      photo_url: null,
      is_viewer: isViewer,
    },
    facts: {
      gross: 70,
      to_par: -2,
      play_date: '2026-09-15',
      is_course_record: true,
    },
    payload: {},
    seen: false,
  };
}

function review(isViewer = false): StreamItem {
  return {
    ...round(isViewer),
    id: 'shape-review',
    kind: 'review',
    consequence: null,
    facts: { rating: 8.8, first_sentence: 'A thoughtful review.', play_date: '2026-09-15' },
  };
}

function longReview(): StreamItem {
  return {
    ...review(),
    id: 'shape-review-long',
    facts: {
      rating: 9.2,
      first_sentence:
        'The walk from the sixth to the seventh is the finest stretch of inland golf in the county, and the ' +
        'green complex that follows asks a question no other course near London asks of a mid-handicapper.',
      play_date: '2026-09-15',
    },
  };
}

function textSlots(container: HTMLElement, name: string) {
  const kicker = container.querySelector<HTMLElement>('[data-explore-kicker="true"]');
  const person = Array.from(container.querySelectorAll<HTMLElement>('.explore-who-line span'))
    .find((node) => node.textContent === name);
  const date = Array.from(container.querySelectorAll<HTMLElement>('.explore-who-line span'))
    .find((node) => node.textContent?.includes('·'));
  return { kicker, person, date };
}

describe('Explore card shapes', () => {
  it('renders a review ON the photo with lanes, a minimum height and a 16px no-trace bottom lane', () => {
    const { container } = render(
      <ExploreCard item={review()} size="std" shape={null} onTap={() => undefined} />,
    );

    const onPhoto = container.querySelector<HTMLElement>('[data-explore-hero="true"]');
    const kicker = container.querySelector<HTMLElement>('[data-explore-hero-kicker="true"]');
    const bottom = container.querySelector<HTMLElement>('[data-explore-hero-bottom-lane="true"]');
    const chip = container.querySelector<HTMLElement>('.standout-figure-chip');

    expect(onPhoto?.style.minHeight).toBe('210px');
    expect(onPhoto?.style.flexDirection).toBe('column');
    expect(kicker).not.toBeNull();
    expect(bottom?.style.height).toBe('16px');
    expect(chip?.style.top).toBe('8px');
    expect(chip?.style.minHeight).toBe('28px');
    expect(chip?.style.whiteSpace).toBe('nowrap');
  });

  it('renders a review on the photo at the first position too', () => {
    const { container } = render(
      <ExploreCard item={review()} size="std" shape={null} onTap={() => undefined} />,
    );
    expect(container.querySelector('[data-explore-hero="true"]')).not.toBeNull();
  });

  it('grows a long review quote while the photo keeps its minimum height', () => {
    const { container } = render(
      <ExploreCard item={longReview()} size="std" shape={null} onTap={() => undefined} />,
    );
    const onPhoto = container.querySelector<HTMLElement>('[data-explore-hero="true"]');
    expect(onPhoto?.style.minHeight).toBe('210px');
    expect(onPhoto?.style.height).toBe('');
  });

  it('uses the ruled on-photo colors and shadows for a review', () => {
    const { container, getByText } = render(
      <ExploreCard item={review()} size="std" shape={null} onTap={() => undefined} />,
    );

    const kicker = container.querySelector<HTMLElement>('[data-explore-hero-kicker="true"] > div');
    const name = getByText('danny.akers1');
    const date = Array.from(container.querySelectorAll<HTMLElement>('.explore-who-line span'))
      .find((node) => node.textContent?.includes('·'));

    expect(kicker?.style.color).toBe('rgb(255, 255, 255)');
    expect(kicker?.style.textShadow).toBe('0 1px 2px rgba(0,0,0,0.45)');
    expect(name.style.color).toBe('rgb(255, 255, 255)');
    expect(name.style.textShadow).toBe('0 1px 2px rgba(0,0,0,0.45)');
    expect(date?.style.color).toBe('rgba(255, 255, 255, 0.85)');
    expect(date?.style.textShadow).toBe('0 1px 2px rgba(0,0,0,0.45)');
  });

  it('keeps the viewer name amber on a review', () => {
    const { getByText } = render(
      <ExploreCard item={review(true)} size="std" shape={null} onTap={() => undefined} />,
    );

    expect(getByText('You').style.color).not.toBe('rgb(255, 255, 255)');
  });

  it('gives a review no REVIEW kicker prefix', () => {
    const { container } = render(
      <ExploreCard item={review()} size="std" shape={null} onTap={() => undefined} />,
    );
    const kicker = container.querySelector<HTMLElement>('[data-explore-hero-kicker="true"]');
    expect(kicker?.textContent ?? '').not.toMatch(/review/i);
    expect(kicker?.textContent ?? '').toContain('The Addington Golf Club');
  });

  it('renders a round UNDER the photo at every position', () => {
    const { container } = render(
      <ExploreCard item={round()} size="std" shape={null} onTap={() => undefined} />,
    );

    expect(container.querySelector('[data-explore-hero="true"]')).toBeNull();
    const image = container.querySelector<HTMLDivElement>('button > span > div');
    expect(image?.style.height).toBe('210px');
    expect(image?.style.minHeight).toBe('');
  });

  it.each([
    ['round', round(), 'std'],
    ['pair', round(), 'pair'],
  ] as const)('uses the shared canvas palette without a shadow on a %s', (_label, item, size) => {
    const { container } = render(
      <ExploreCard item={item} size={size} shape={null} onTap={() => undefined} />,
    );
    const { kicker, person, date } = textSlots(container, 'danny.akers1');

    expect(kicker?.style.color).toBe('rgb(255, 255, 255)');
    expect(kicker?.style.textShadow).toBe('');
    expect(person?.style.color).toBe('rgb(255, 255, 255)');
    expect(person?.style.textShadow).toBe('');
    expect(date?.style.color).toBe('rgba(255, 255, 255, 0.85)');
    expect(date?.style.textShadow).toBe('');
  });

  it('marks a record round with a callout panel and a plain headline', () => {
    const { container } = render(
      <ExploreCard item={round()} size="std" shape={null} onTap={() => undefined} />,
    );
    const callout = container.querySelector<HTMLElement>('[data-explore-callout="record"]');
    const headline = container.querySelector<HTMLElement>('[data-explore-headline="true"]');

    expect(callout).not.toBeNull();
    expect(callout?.textContent).toContain('Course record');
    /* §6 THE HEADLINE STATES THE ROUND, not the achievement, whenever a callout renders. */
    expect(headline?.textContent ?? '').toContain('went round in 70');
    expect(headline?.textContent ?? '').not.toMatch(/record/i);
  });

  it('keeps only the YOUR ROUND kicker part and viewer name amber on canvas', () => {
    const { container, getByText } = render(
      <ExploreCard item={round(true)} size="std" shape={null} onTap={() => undefined} />,
    );
    const kicker = container.querySelector<HTMLElement>('[data-explore-kicker="true"]');
    const ownPart = container.querySelector<HTMLElement>('[data-explore-kicker-part="primary"]');

    expect(kicker?.style.color).toBe('rgb(255, 255, 255)');
    expect(ownPart?.style.color).not.toBe('rgb(255, 255, 255)');
    expect(getByText('You').style.color).not.toBe('rgb(255, 255, 255)');
  });

  it('renders a ring kicker white on canvas', () => {
    const item = {
      ...round(),
      ring: 'county' as const,
      consequence: null,
      facts: { ...round().facts, is_course_record: false },
    };
    const { container } = render(
      <ExploreCard item={item} size="std" shape={null} onTap={() => undefined} />,
    );
    const ownPart = container.querySelector<HTMLElement>('[data-explore-kicker-part="primary"]');

    expect(ownPart?.textContent).toContain('Around Surrey');
    expect(ownPart?.style.color).toBe('');
    expect(ownPart?.parentElement?.style.color).toBe('rgb(255, 255, 255)');
  });
});
