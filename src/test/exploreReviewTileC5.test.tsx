import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import {
  countReviewPhotos,
  pickReviewCardMedia,
  type ReviewMediaRow,
} from '@/features/explore-magazine/useReviewPageEnrichment';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

/**
 * BRIEF_EXPLORE_REVIEW_TILE_C5 — THE REVIEW TILE IS AN INSTRUMENT SHOWING THE
 * MEMBER'S OWN MEDIA. §1 owns the order (video with a usable poster, then image,
 * then the course thumbnail) and §3/§6 own what the card draws on top of it.
 */

function row(over: Partial<ReviewMediaRow> & { id: string }): ReviewMediaRow {
  return {
    media_url: 'https://example.test/media.jpg',
    media_type: 'image',
    poster_url: null,
    stream_id: null,
    is_cover: false,
    status: 'attached',
    duration_seconds: null,
    ...over,
  };
}

function review(facts: Record<string, unknown> = {}): StreamItem {
  return {
    id: 'c5-review',
    kind: 'review',
    ring: 'own',
    lane: 'news',
    score: 1,
    consequence: null,
    subject: {
      course_id: 'addington',
      course_name: 'The Addington Golf Club',
      region: 'Surrey',
      sub_country: 'England',
      country: 'Britain & Ireland',
      image_url: 'https://example.test/course.jpg',
      pending: false,
    },
    who: { user_id: 'danny', display_name: 'danny.akers1', photo_url: null, is_viewer: false },
    facts: { rating: 8.8, play_date: '2026-09-15', ...facts },
    payload: {},
    seen: false,
  } as StreamItem;
}

describe('C5 §1 the media order', () => {
  it('takes the first attached video that has a poster, over any image', () => {
    const picked = pickReviewCardMedia([
      row({ id: 'img', media_type: 'image', is_cover: true }),
      row({ id: 'vid', media_type: 'video', poster_url: 'https://example.test/p.jpg', stream_id: 'st', duration_seconds: 42 }),
    ]);
    expect(picked).toEqual({
      mediaId: 'vid',
      kind: 'video',
      url: 'https://example.test/media.jpg',
      posterUrl: 'https://example.test/p.jpg',
      streamId: 'st',
      durationS: 42,
    });
  });

  it('§1.2 treats a poster-less video as absent and falls through to the image', () => {
    const picked = pickReviewCardMedia([
      row({ id: 'vid', media_type: 'video', poster_url: null }),
      row({ id: 'img', media_type: 'image' }),
    ]);
    expect(picked?.mediaId).toBe('img');
    expect(picked?.kind).toBe('image');
  });

  it('§1.2 falls all the way to the course photo when the only video has no poster', () => {
    expect(pickReviewCardMedia([row({ id: 'vid', media_type: 'video', poster_url: '' })])).toBeNull();
  });

  it('§1.1b prefers the cover image, and §1.4 never lets is_cover outrank a video', () => {
    expect(pickReviewCardMedia([
      row({ id: 'a' }),
      row({ id: 'b', is_cover: true }),
    ])?.mediaId).toBe('b');
    expect(pickReviewCardMedia([
      row({ id: 'b', is_cover: true }),
      row({ id: 'v', media_type: 'video', poster_url: 'https://example.test/p.jpg' }),
    ])?.mediaId).toBe('v');
  });

  it('§1.3 ignores anything that is not attached, for the pick and for the count', () => {
    const rows = [
      row({ id: 'pending', status: 'pending' }),
      row({ id: 'failed', media_type: 'video', poster_url: 'https://example.test/p.jpg', status: 'failed' }),
      row({ id: 'ok' }),
    ];
    expect(pickReviewCardMedia(rows)?.mediaId).toBe('ok');
    expect(countReviewPhotos(rows)).toBe(1);
  });

  it('counts attached IMAGES only', () => {
    expect(countReviewPhotos([
      row({ id: 'i1' }),
      row({ id: 'i2' }),
      row({ id: 'v', media_type: 'video', poster_url: 'https://example.test/p.jpg' }),
    ])).toBe(2);
  });
});

describe('C5 §1/§6 the card takes that one answer', () => {
  it('draws the course thumbnail only when the member attached nothing usable', () => {
    const { container } = render(
      <ExploreCard item={review()} size="lead" shape={null} onTap={() => undefined} />,
    );
    expect(container.innerHTML).toContain('example.test/course.jpg');
    expect(container.querySelector('[data-review-play="true"]')).toBeNull();
  });

  it("puts the member's own image on the ground instead of the course photo", () => {
    const item = review({
      reviewMedia: { mediaId: 'img', kind: 'image', url: 'https://example.test/mine.jpg', posterUrl: null, streamId: null, durationS: null },
    });
    const { container } = render(<ExploreCard item={item} size="lead" shape={null} onTap={() => undefined} />);
    expect(container.innerHTML).toContain('example.test/mine.jpg');
    expect(container.innerHTML).not.toContain('example.test/course.jpg');
    expect(container.querySelector('[data-review-play="true"]')).toBeNull();
  });

  it('§6 renders a video as its poster with a play affordance and a duration, and never autoplays', () => {
    const item = review({
      reviewMedia: { mediaId: 'vid', kind: 'video', url: 'https://example.test/v.m3u8', posterUrl: 'https://example.test/poster.jpg', streamId: 'st', durationS: 95 },
    });
    const { container } = render(<ExploreCard item={item} size="lead" shape={null} onTap={() => undefined} />);
    expect(container.innerHTML).toContain('example.test/poster.jpg');
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('[data-review-play="true"]')).not.toBeNull();
    expect(container.textContent).toContain('1:35');
  });

  it('draws none of the instrument on a std review', () => {
    const item = review({
      reviewMedia: { mediaId: 'img', kind: 'image', url: 'https://example.test/mine.jpg', posterUrl: null, streamId: null, durationS: null },
    });
    const { container } = render(<ExploreCard item={item} size="std" shape={null} onTap={() => undefined} />);
    expect(container.querySelector('[data-review-top-line="true"]')).toBeNull();
    expect(container.querySelector('[data-review-stat-strip="true"]')).toBeNull();
    expect(container.querySelector('[data-review-play="true"]')).toBeNull();
    /* The course photo stays the std review's ground: §1 is a LEAD rule. */
    expect(container.innerHTML).toContain('example.test/course.jpg');
  });
});
