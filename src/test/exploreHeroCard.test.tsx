import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { fullWidthCardSize } from '@/features/explore-magazine/ExploreMagazine';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

/**
 * BRIEF_EXPLORE_TWO_SHAPES §2 — SHAPE IS DECIDED BY KIND, NOTHING ELSE.
 * A REVIEW is lead-sized text ON the photograph at every position; a ROUND is
 * std-sized text UNDER it at every position. There is no cardTreatment prop any
 * more and position 0 is not special, so these tests assert the shape and size
 * from the KIND alone.
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
  const date = container.querySelector<HTMLElement>('[data-explore-kicker-date="true"]');
  return { kicker, person, date };
}

describe('Explore card shapes', () => {
  it('gates the stacked review tier word to Exceptional without an enrichment lane', () => {
    const { container, getByText } = render(
      <ExploreCard item={{ ...review(), facts: { ...review().facts, rating: 9.4 } }} size="lead" shape={null} onTap={() => undefined} />,
    );
    expect(getByText('Exceptional')).toBeInTheDocument();
    const chip = container.querySelector<HTMLElement>('[data-figure-chip="review-stacked"]');
    const figure = chip?.querySelector<HTMLElement>('[data-figure-chip-figure="true"]');
    const unit = chip?.querySelector<HTMLElement>('[data-figure-chip-unit="true"]');
    expect(chip?.style.flexDirection).toBe('column');
    expect(chip?.style.alignItems).toBe('center');
    expect(chip?.style.gap).toBe('1px');
    expect(chip?.style.padding).toBe('5px 9px');
    expect(figure?.style.fontSize).toBe('19px');
    expect(unit?.style.fontSize).toBe('8.5px');
    expect(unit?.style.fontWeight).toBe('800');
    expect(unit?.style.letterSpacing).toBe('0.12em');
    expect(unit?.style.textTransform).toBe('uppercase');
    expect(unit?.style.color).toBe(figure?.style.color);
    expect(unit?.style.textShadow).toBe(figure?.style.textShadow);
    expect(container.querySelector('[data-review-enrichment-lane="true"]')).toBeNull();
  });

  it('renders a below-Exceptional review as a stacked white figure with no unit', () => {
    const { container } = render(
      <ExploreCard item={{ ...review(), facts: { ...review().facts, rating: 7.1 } }} size="lead" shape={null} onTap={() => undefined} />,
    );
    const chip = container.querySelector<HTMLElement>('[data-figure-chip="review-stacked"]');
    expect(chip?.textContent).toBe('7.1');
    expect(chip?.querySelector('[data-figure-chip-unit="true"]')).toBeNull();
    expect(chip?.querySelector<HTMLElement>('[data-figure-chip-figure="true"]')?.style.color).toBe('rgb(255, 255, 255)');
  });

  it('keeps every non-review FigureChip on the unchanged inline geometry', () => {
    const { container } = render(
      <ExploreCard item={round()} size="std" shape={null} onTap={() => undefined} />,
    );
    const chip = container.querySelector<HTMLElement>('[data-figure-chip="inline"]');
    expect(chip?.style.flexDirection).toBe('row');
    expect(chip?.style.alignItems).toBe('baseline');
    expect(chip?.style.gap).toBe('4px');
    expect(chip?.style.padding).toBe('4px 8px');
    expect(chip?.style.minHeight).toBe('28px');
    expect(chip?.style.borderRadius).toBe('8px');
    expect(chip?.querySelector<HTMLElement>('[data-figure-chip-figure="true"]')?.style.fontSize).toBe('15px');
    expect(chip?.querySelector<HTMLElement>('[data-figure-chip-unit="true"]')?.style.fontSize).toBe('10px');
  });

  it('moves a multiple-photo count into the top-right glass chip and renders all four breakdowns', () => {
    const enriched = {
      ...review(),
      facts: {
        ...review().facts,
        photoCount: 3,
        breakdown: { design: 9.2, conditions: 8.7, clubhouse: 8.1, facilities: 7.9 },
      },
    };
    const { container } = render(
      <ExploreCard item={enriched} size="lead" shape={null} onTap={() => undefined} />,
    );
    const rail = container.querySelector<HTMLElement>('[data-review-breakdown-rail="true"]');
    const photoChip = container.querySelector<HTMLElement>('[data-review-photo-count="true"]');
    expect(rail?.tagName).toBe('UL');
    expect(rail?.children).toHaveLength(4);
    expect(rail?.children[0]?.getAttribute('aria-label')).toContain('9.2');
    expect(rail?.children[0]?.getAttribute('aria-label')).toContain('outOfTen');
    expect(container.querySelector<HTMLElement>('[data-review-breakdown-fill="design"]')?.style.width).toBe('92%');
    expect(photoChip?.textContent).toBe('3 photos');
    expect(photoChip?.style.right).toBe('8px');
    expect(photoChip?.style.whiteSpace).toBe('nowrap');
  });

  it('renders the breakdown rail all-or-none without reserving a gap', () => {
    for (const breakdown of [
      undefined,
      { design: 9, conditions: 8.5, clubhouse: null, facilities: 8 },
    ]) {
      const { container, unmount } = render(
        <ExploreCard item={{ ...review(), facts: { ...review().facts, breakdown } }} size="lead" shape={null} onTap={() => undefined} />,
      );
      expect(container.querySelector('[data-review-breakdown-rail="true"]')).toBeNull();
      expect(container.querySelector<HTMLElement>('[data-explore-hero-copy="true"]')?.style.gap).toBe('12px');
      unmount();
    }
  });

  it('renders a short review ON the photo at the lead minimum height with its reserved lanes', () => {
    const { container } = render(
      <ExploreCard item={review()} size="lead" shape={null} onTap={() => undefined} />,
    );

    const onPhoto = container.querySelector<HTMLElement>('[data-explore-hero="true"]');
    const identity = container.querySelector<HTMLElement>('[data-review-identity="true"]');
    const headline = container.querySelector<HTMLElement>('[data-explore-headline="true"]');
    const bottom = container.querySelector<HTMLElement>('[data-explore-hero-bottom-lane="true"]');
    const chip = container.querySelector<HTMLElement>('.standout-figure-chip');

    expect(onPhoto?.style.minHeight).toBe('340px');
    expect(onPhoto?.style.flexDirection).toBe('column');
    expect(identity).not.toBeNull();
    expect(headline?.style.fontSize).toBe('20px');
    expect(headline?.style.lineHeight).toBe('1.12');
    expect(headline?.style.letterSpacing).toBe('-0.02em');
    expect(headline?.dataset.exploreLineClamp).toBe('2');
    expect(headline?.style.fontStyle).toBe('italic');
    expect(bottom?.style.height).toBe('16px');
    expect(chip?.style.top).toBe('8px');
    expect(chip?.style.minHeight).toBe('28px');
    expect(chip?.style.whiteSpace).toBe('nowrap');
    /* 8px top + 28px chip + 12px clearance = the reserved 48px lane. */
    const chipLane = onPhoto?.firstElementChild as HTMLElement | null;
    expect(chipLane?.style.flex).toBe('0 0 48px');
  });

  it.each([0, 5])('renders a review at position %i through the lead path', (position) => {
    const item = { ...review(), id: `review-${position}` };
    const size = fullWidthCardSize(item);
    const { container } = render(<ExploreCard item={item} size={size} shape={null} onTap={() => undefined} />);
    const hero = container.querySelector<HTMLElement>('[data-explore-hero="true"]');
    const image = container.querySelector<HTMLElement>('button > span > div');
    expect(size).toBe('lead');
    expect(hero?.style.minHeight).toBe('340px');
    expect(image?.style.borderRadius).toBe('18px');
  });

  it('keeps a full-width round on the std path', () => {
    expect(fullWidthCardSize(round())).toBe('std');
  });

  it('grows a long review quote while the photo keeps its minimum height', () => {
    const { container } = render(
      <ExploreCard item={longReview()} size="lead" shape={null} onTap={() => undefined} />,
    );
    const onPhoto = container.querySelector<HTMLElement>('[data-explore-hero="true"]');
    const headline = container.querySelector<HTMLElement>('[data-explore-headline="true"]');
    expect(onPhoto?.style.minHeight).toBe('340px');
    expect(onPhoto?.style.height).toBe('');
    expect(headline?.dataset.exploreLineClamp).toBe('2');
  });

  it('uses the ruled on-photo colors and shadows for a review', () => {
    const { container, getByText } = render(
      <ExploreCard item={review()} size="lead" shape={null} onTap={() => undefined} />,
    );

    const identity = container.querySelector<HTMLElement>('[data-review-identity="true"]');
    const name = getByText('danny.akers1');
    const right = container.querySelector<HTMLElement>('[data-review-identity-right="true"]');

    expect(identity).not.toBeNull();
    expect(container.querySelector('[data-explore-hero-kicker="true"]')).toBeNull();
    expect(name.style.color).toBe('rgb(255, 255, 255)');
    expect(name.style.textShadow).toBe('0 1px 2px rgba(0,0,0,0.45)');
    expect(right?.style.flex).toBe('0 0 auto');
    expect(right?.style.whiteSpace).toBe('nowrap');
  });

  it('keeps the viewer name amber on a review', () => {
    const { getByText } = render(
      <ExploreCard item={review(true)} size="lead" shape={null} onTap={() => undefined} />,
    );

    expect(getByText('You').style.color).not.toBe('rgb(255, 255, 255)');
  });

  it('puts the member and course first with the scope and date pushed right', () => {
    const { container } = render(
      <ExploreCard item={{ ...review(), ring: 'world' }} size="lead" shape={null} onTap={() => undefined} />,
    );
    const identity = container.querySelector<HTMLElement>('[data-review-identity="true"]');
    expect(identity?.textContent).toContain('danny.akers1·The Addington Golf Club');
    expect(container.querySelector('[data-review-identity-right="true"]')?.textContent).toContain('World ·');
  });

  it('keeps review course and right group while the member name yields first', () => {
    for (const item of [review(), { ...review(), ring: 'club' as const }]) {
      const longCourse = {
        ...item,
        who: { ...item.who, display_name: 'A member with an exceptionally long display name' },
        subject: { ...item.subject, course_name: "Prince's Golf Club (Shore, Dunes & Himalayas)" },
        facts: { ...item.facts, play_date: '2026-09-03' },
      };
      const { container, unmount } = render(
        <ExploreCard item={longCourse} size="lead" shape={null} onTap={() => undefined} />,
      );
      const member = container.querySelector<HTMLElement>('[data-review-member-name="true"]');
      const course = container.querySelector<HTMLElement>('[data-review-course-name="true"]');
      const right = container.querySelector<HTMLElement>('[data-review-identity-right="true"]');
      expect(course?.textContent).toContain("Prince's Golf Club");
      expect(course?.style.flex).toBe('1 1 auto');
      expect(course?.style.textOverflow).toBe('ellipsis');
      expect(member?.style.overflow).toBe('hidden');
      expect(member?.style.textOverflow).toBe('ellipsis');
      expect(member?.style.maxWidth).toBe('28%');
      expect(right?.style.flex).toBe('0 0 auto');
      expect(right?.style.whiteSpace).toBe('nowrap');
      if (item.ring === 'club') expect(right?.textContent).not.toContain('·');
      unmount();
    }
  });

  it.each([1, 5])('shows the review photo chip only above one photo (%i)', (photoCount) => {
    const { container } = render(
      <ExploreCard item={{ ...review(), facts: { ...review().facts, photoCount } }} size="lead" shape={null} onTap={() => undefined} />,
    );
    expect(container.querySelector('[data-review-photo-count="true"]') != null).toBe(photoCount > 1);
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
    expect(date?.style.color).toBe('rgb(255, 255, 255)');
    expect(date?.style.textShadow).toBe('');
    expect(container.querySelector('.explore-who-line')?.textContent).not.toContain(date?.textContent ?? 'Sep');
  });

  it('marks a record round with a callout panel and a plain headline', () => {
    const { container } = render(
      <ExploreCard item={round()} size="std" shape={null} onTap={() => undefined} />,
    );
    const callout = container.querySelector<HTMLElement>('[data-explore-callout="record"]');
    const headline = container.querySelector<HTMLElement>('[data-explore-headline="true"]');

    expect(callout).not.toBeNull();
    expect(callout?.querySelector('[data-explore-achievement-tag="true"]')?.textContent).toBe('NEW');
    expect(callout?.querySelector('[data-explore-achievement-label="true"]')?.textContent).toBe('Course record');
    /* §6 THE HEADLINE STATES THE ROUND, not the achievement, whenever a callout renders. */
    expect(headline?.textContent ?? '').toContain('shot a 70');
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

    expect(ownPart?.textContent).toBe('Surrey');
    expect(ownPart?.style.color).toBe('rgba(248, 250, 252, 0.62)');
    expect(ownPart?.closest<HTMLElement>('[data-explore-kicker="true"]')?.style.color).toBe('rgb(255, 255, 255)');
  });

  it('renders no scope element or gap for club-ring and record rounds', () => {
    for (const item of [
      { ...round(), ring: 'club' as const, consequence: null, facts: { ...round().facts, is_course_record: false } },
      round(),
    ]) {
      const { container, unmount } = render(<ExploreCard item={item} size="std" shape={null} onTap={() => undefined} />);
      expect(container.querySelector('[data-explore-kicker-scope="true"]')).toBeNull();
      expect(container.querySelector<HTMLElement>('[data-explore-kicker-row="true"]')?.style.marginTop).toBe('0px');
      unmount();
    }
  });

  it('keeps pair cards to one course-and-date line', () => {
    const item = { ...round(), ring: 'county' as const, consequence: null, facts: { ...round().facts, is_course_record: false } };
    const { container } = render(<ExploreCard item={item} size="pair" shape={null} onTap={() => undefined} />);
    expect(container.querySelector('[data-explore-kicker-scope="true"]')).toBeNull();
    expect(container.querySelector('[data-explore-kicker-row="true"]')).not.toBeNull();
    expect(container.querySelector('[data-explore-kicker-course="true"]')?.textContent).toBe('The Addington Golf Club');
    expect(container.querySelector<HTMLElement>('[data-explore-kicker-row="true"]')?.style.marginTop).toBe('0px');
  });
});
