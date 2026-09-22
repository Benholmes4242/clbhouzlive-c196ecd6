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

function story(): StreamItem {
  return {
    ...round(),
    id: 'shape-story',
    kind: 'story',
    who: {
      user_id: 'author',
      display_name: 'A member',
      photo_url: null,
      is_viewer: false,
    },
    consequence: null,
    facts: {
      source: null,
      headline: 'A championship story',
      standfirst: 'The supporting detail follows beneath the title.',
      published_at: new Date().toISOString(),
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
  it('uses the Tour Overview hierarchy for photo-led news without member attribution', () => {
    const { container, getByText, queryByText } = render(
      <ExploreCard item={story()} size="lead" shape={null} onTap={() => undefined} />,
    );
    const meta = container.querySelector<HTMLElement>('[data-explore-story-meta="true"]');
    expect(meta).not.toBeNull();
    /* BRIEF_EXPLORE_STORY_TILE_MATCH_THE_TOUR_HERO §2.1 — ONE STRING, so the
       meta no longer has a left/right pair of child elements. */
    expect(meta?.firstElementChild).toBeNull();
    expect(meta?.textContent?.startsWith('Amateur News')).toBe(true);
    expect(getByText('A championship story')).toBeInTheDocument();
    expect(getByText('The supporting detail follows beneath the title.')).toBeInTheDocument();
    expect(queryByText('A member')).toBeNull();
    expect(container.querySelector('[data-explore-hero-kicker="true"]')).toBeNull();
    expect(container.querySelector('.explore-who-line')).toBeNull();
  });

  /* C5 §4.1/§4.2 — THE CHIPS ARE A STD/PAIR OBJECT NOW. The lead review prints
     its score as the 40px foot figure instead, so these geometries are asserted
     at the size that still draws them. */
  it('gates the stacked review tier word to Exceptional without an enrichment lane', () => {
    const { container, getByText } = render(
      <ExploreCard item={{ ...review(), facts: { ...review().facts, rating: 9.4 } }} size="std" shape={null} onTap={() => undefined} />,
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
      <ExploreCard item={{ ...review(), facts: { ...review().facts, rating: 7.1 } }} size="std" shape={null} onTap={() => undefined} />,
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

  it('C5 §3.3/§4 draws the four areas as a stat strip and no chips on a lead review', () => {
    const enriched = {
      ...review(),
      facts: {
        ...review().facts,
        rating: 9.4,
        photoCount: 3,
        breakdown: { design: 9.2, conditions: 8.7, clubhouse: 8.1, facilities: 7.9 },
      },
    };
    const { container } = render(
      <ExploreCard item={enriched} size="lead" shape={null} onTap={() => undefined} />,
    );
    const strip = container.querySelector<HTMLElement>('[data-review-stat-strip="true"]');
    expect(strip?.tagName).toBe('UL');
    expect(strip?.children).toHaveLength(4);
    expect(strip?.children[0]?.getAttribute('aria-label')).toContain('9.2');
    expect(strip?.children[0]?.getAttribute('aria-label')).toContain('outOfTen');
    expect(strip?.style.borderTop).toBe('1px solid rgba(255,255,255,0.20)');
    expect(strip?.style.marginTop).toBe('11px');
    /* The 9.0 threshold is courseSubScoreTone's; everything under it takes the
       on-photo light ink. */
    expect(container.querySelector<HTMLElement>('[data-review-stat-value="design"]')?.style.color).toBe('rgb(52, 211, 153)');
    expect(container.querySelector<HTMLElement>('[data-review-stat-value="conditions"]')?.style.color).toBe('rgba(255, 255, 255, 0.92)');
    expect(container.querySelector<HTMLElement>('[data-review-stat-value="design"]')?.textContent).toBe('9.2');
    /* §4 — no photo-count chip, no rating chip, no bars, no quote. */
    expect(container.querySelector('[data-review-photo-count="true"]')).toBeNull();
    expect(container.querySelector('[data-figure-chip="review-stacked"]')).toBeNull();
    expect(container.querySelector('[data-review-breakdown-rail="true"]')).toBeNull();
    expect(container.querySelector('[data-explore-headline="true"]')).toBeNull();
    /* §3.3 group one — the score and its verdict share the tier colour. */
    const score = container.querySelector<HTMLElement>('[data-review-score="true"]');
    const verdict = container.querySelector<HTMLElement>('[data-review-verdict="true"]');
    expect(score?.textContent).toBe('9.4');
    expect(score?.style.fontSize).toBe('40px');
    expect(verdict?.textContent).toBe('Exceptional');
    expect(verdict?.style.color).toBe(score?.style.color);
  });

  it('C5 §3.4 keeps the stat strip all-or-none and reserves nothing when it is absent', () => {
    for (const breakdown of [
      undefined,
      { design: 9, conditions: 8.5, clubhouse: null, facilities: 8 },
    ]) {
      const { container, unmount } = render(
        <ExploreCard item={{ ...review(), facts: { ...review().facts, breakdown } }} size="lead" shape={null} onTap={() => undefined} />,
      );
      expect(container.querySelector('[data-review-stat-strip="true"]')).toBeNull();
      expect(container.querySelector('[data-review-score="true"]')).not.toBeNull();
      unmount();
    }
  });

  it('renders a short review ON the photo at the lead minimum height with its reserved lanes', () => {
    const { container } = render(
      <ExploreCard item={review()} size="lead" shape={null} onTap={() => undefined} />,
    );

    const onPhoto = container.querySelector<HTMLElement>('[data-explore-hero="true"]');
    const topLine = container.querySelector<HTMLElement>('[data-review-top-line="true"]');
    const bottom = container.querySelector<HTMLElement>('[data-explore-hero-bottom-lane="true"]');

    expect(onPhoto?.style.minHeight).toBe('340px');
    expect(onPhoto?.style.flexDirection).toBe('column');
    /* C5 §3.2 — identity moves to the TOP of the frame and lives inside the
       unchanged 48px lane; §4.3 removed the quote. */
    expect(topLine).not.toBeNull();
    expect(topLine?.style.padding).toBe('12px 14px 0px');
    expect(container.querySelector('[data-explore-headline="true"]')).toBeNull();
    expect(container.querySelector('.explore-who-line')).toBeNull();
    expect(bottom?.style.height).toBe('16px');
    const chipLane = onPhoto?.firstElementChild as HTMLElement | null;
    expect(chipLane?.style.flex).toBe('0 0 48px');
    expect(chipLane?.contains(topLine!)).toBe(true);
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

  it('C5 §3.1 keeps a long review on the unchanged frame with no quote to grow', () => {
    const { container } = render(
      <ExploreCard item={longReview()} size="lead" shape={null} onTap={() => undefined} />,
    );
    const onPhoto = container.querySelector<HTMLElement>('[data-explore-hero="true"]');
    expect(onPhoto?.style.minHeight).toBe('340px');
    expect(onPhoto?.style.height).toBe('');
    expect(container.querySelector('[data-explore-headline="true"]')).toBeNull();
  });

  it('uses the ruled on-photo colors and shadows for a review', () => {
    const { container, getByText } = render(
      <ExploreCard item={review()} size="lead" shape={null} onTap={() => undefined} />,
    );

    const topLine = container.querySelector<HTMLElement>('[data-review-top-line="true"]');
    const name = getByText('danny.akers1');
    const date = container.querySelector<HTMLElement>('[data-review-date="true"]');

    expect(topLine).not.toBeNull();
    expect(container.querySelector('[data-explore-hero-kicker="true"]')).toBeNull();
    expect(name.style.color).toBe('rgb(255, 255, 255)');
    expect(name.style.fontSize).toBe('13px');
    expect(name.style.textShadow).toBe('0 1px 2px rgba(0,0,0,0.45)');
    expect(date?.style.marginLeft).toBe('auto');
    expect(date?.style.whiteSpace).toBe('nowrap');
  });

  it('keeps the viewer name amber on a review', () => {
    const { getByText } = render(
      <ExploreCard item={review(true)} size="lead" shape={null} onTap={() => undefined} />,
    );

    expect(getByText('You').style.color).not.toBe('rgb(255, 255, 255)');
  });

  it('C5 §3.2/§3.3 prints the member at the top and the course in the foot', () => {
    const { container } = render(
      <ExploreCard item={{ ...review(), ring: 'world' }} size="lead" shape={null} onTap={() => undefined} />,
    );
    const topLine = container.querySelector<HTMLElement>('[data-review-top-line="true"]');
    expect(topLine?.textContent).toContain('danny.akers1');
    expect(topLine?.textContent).not.toContain('The Addington Golf Club');
    expect(container.querySelector('[data-review-course-name="true"]')?.textContent).toBe('The Addington Golf Club');
    expect(container.querySelector('[data-review-region="true"]')?.textContent).toContain('Surrey');
  });

  it('C5 §3.3 truncates a long member name and a long course without wrapping', () => {
    const longCourse = {
      ...review(),
      who: { ...review().who!, display_name: 'A member with an exceptionally long display name' },
      subject: { ...review().subject!, course_name: "Prince's Golf Club (Shore, Dunes & Himalayas)" },
    };
    const { container } = render(
      <ExploreCard item={longCourse} size="lead" shape={null} onTap={() => undefined} />,
    );
    const member = container.querySelector<HTMLElement>('[data-review-member-name="true"]');
    const course = container.querySelector<HTMLElement>('[data-review-course-name="true"]');
    expect(course?.textContent).toContain("Prince's Golf Club");
    expect(course?.style.textOverflow).toBe('ellipsis');
    expect(course?.style.whiteSpace).toBe('nowrap');
    expect(member?.style.overflow).toBe('hidden');
    expect(member?.style.textOverflow).toBe('ellipsis');
  });

  it.each([1, 5])('C5 §4.2 never shows a photo-count chip on a lead review (%i)', (photoCount) => {
    const { container } = render(
      <ExploreCard item={{ ...review(), facts: { ...review().facts, photoCount } }} size="lead" shape={null} onTap={() => undefined} />,
    );
    expect(container.querySelector('[data-review-photo-count="true"]')).toBeNull();
  });

  it.each([1, 5])('keeps the photo-count chip on a std review (%i)', (photoCount) => {
    const { container } = render(
      <ExploreCard item={{ ...review(), facts: { ...review().facts, photoCount } }} size="std" shape={null} onTap={() => undefined} />,
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

  it('keeps pair cards on the shared canvas text treatment', () => {
    const item = round();
    const size = 'pair' as const;
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

  it('marks a record round with a callout panel and no score-restatement headline', () => {
    const { container } = render(
      <ExploreCard item={round()} size="std" shape={null} onTap={() => undefined} />,
    );
    const callout = container.querySelector<HTMLElement>('[data-explore-callout="record"]');
    const headline = container.querySelector<HTMLElement>('[data-explore-headline="true"]');

    expect(callout).not.toBeNull();
    expect(callout?.querySelector('[data-explore-achievement-tag="true"]')?.textContent).toBe('NEW');
    expect(callout?.querySelector('[data-explore-achievement-label="true"]')?.textContent).toBe('Course record');
    expect(headline).toBeNull();
  });

  it('shows You once on an own round and removes the YOUR ROUND kicker', () => {
    const { container, getByText } = render(
      <ExploreCard item={round(true)} size="std" shape={null} onTap={() => undefined} />,
    );
    const kicker = container.querySelector<HTMLElement>('[data-explore-kicker="true"]');
    const ownPart = container.querySelector<HTMLElement>('[data-explore-kicker-part="primary"]');

    expect(kicker).toBeNull();
    expect(ownPart).toBeNull();
    expect(getByText('You').style.color).not.toBe('rgb(255, 255, 255)');
    expect(container.textContent?.match(/You/g)).toHaveLength(1);
  });

  it('moves a round course and date into separate identity lines', () => {
    const item = {
      ...round(),
      ring: 'county' as const,
      consequence: null,
      facts: { ...round().facts, is_course_record: false },
    };
    const { container } = render(
      <ExploreCard item={item} size="std" shape={null} onTap={() => undefined} />,
    );
    expect(container.querySelector('[data-explore-kicker="true"]')).toBeNull();
    expect(container.querySelector('[data-round-identity-meta="true"]')).toBeNull();
    expect(container.querySelector('[data-round-identity-course="true"]')?.textContent).toBe('The Addington Golf Club');
    expect(container.querySelector('[data-round-identity-date="true"]')?.textContent).toBeTruthy();
  });

  it('renders no standalone kicker for club-ring and record rounds', () => {
    for (const item of [
      { ...round(), ring: 'club' as const, consequence: null, facts: { ...round().facts, is_course_record: false } },
      round(),
    ]) {
      const { container, unmount } = render(<ExploreCard item={item} size="std" shape={null} onTap={() => undefined} />);
      expect(container.querySelector('[data-explore-kicker-scope="true"]')).toBeNull();
      expect(container.querySelector('[data-explore-kicker-row="true"]')).toBeNull();
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
