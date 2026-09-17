import { describe, expect, it } from 'vitest';

import { headlineFor, kickerParts } from '@/features/explore-magazine/exploreCopy';
import { indefiniteArticleForScore } from '@/features/explore-magazine/ordinal';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

const translate = (_key: string, fallback = '', vars: Record<string, unknown> = {}) =>
  Object.entries(vars).reduce((copy, [key, value]) => copy.split(`{{${key}}}`).join(String(value)), fallback);

function round(overrides: Partial<StreamItem>): StreamItem {
  return {
    id: 'round',
    kind: 'round',
    ring: 'world',
    lane: 'news',
    score: 1,
    consequence: null,
    subject: {
      course_id: 'course',
      course_name: "Prince's Golf Club (Shore, Dunes & Himalayas)",
      region: 'Kent',
      sub_country: 'England',
      image_url: null,
      pending: false,
    },
    who: { user_id: 'member', display_name: 'henryd3737', photo_url: null, is_viewer: false },
    facts: { gross: 68, to_par: -4, play_date: '2026-09-12' },
    payload: {},
    seen: false,
    ...overrides,
  };
}

describe('Explore round headline ownership', () => {
  it('names the viewer best and the month it stood when both are known', () => {
    const item = round({ consequence: { kind: 'record_lost', delta: 3 } });
    const headline = headlineFor(item, translate, 'en', { viewerBest: 71, viewerBestSince: 'June 2025' });
    expect(headline).toBe('henryd3737 took your course record with a 68. Your 71 had stood since June 2025.');
    expect(headline).not.toContain("Prince's");
  });

  it('drops the comparison rather than inventing one', () => {
    expect(headlineFor(round({ consequence: { kind: 'record_lost' } }), translate)).toBe(
      'henryd3737 took your course record with a 68.',
    );
  });

  it('speaks the to-par and keeps the course out of the sentence', () => {
    expect(headlineFor(round({}), translate)).toBe('henryd3737 shot a 68, four under par.');
    expect(headlineFor(round({ facts: { gross: 70, birdies: 6 } }), translate)).toBe(
      'Six birdies in a round of 70.',
    );
    expect(headlineFor(round({ facts: { gross: 86 } }), translate)).toBe('henryd3737 shot an 86.');
  });

  /* BRIEF_EXPLORE_SECOND_PASS §4. A word-start headline is capitalised, a
     name-start headline keeps the member's own casing, and every feat sentence
     carries the spoken to-par where the round has one. */
  it('capitalises a word-start feat headline and carries the to-par', () => {
    expect(headlineFor(round({ facts: { gross: 68, to_par: -3, birdies: 6 } }), translate)).toBe(
      'Six birdies in a round of 68, three under par.',
    );
    expect(headlineFor(round({ facts: { gross: 71, to_par: 2, eagles: 1 } }), translate)).toBe(
      'An eagle, in a round of 71, two over par.',
    );
    expect(headlineFor(round({ facts: { gross: 72, to_par: 0, albatrosses: 1 } }), translate)).toBe(
      'An albatross, in a round of 72, level par.',
    );
    expect(headlineFor(round({ facts: { gross: 74, to_par: 3, holes_in_one: 1 } }), translate)).toBe(
      'A hole in one, in a round of 74, three over par.',
    );
  });

  it('never capitalises a username', () => {
    const item = round({
      who: { user_id: 'member', display_name: 'danny.akers1', photo_url: null, is_viewer: false },
      facts: { gross: 104 },
    });
    expect(headlineFor(item, translate)).toBe('danny.akers1 shot a 104.');
  });


  it('measures a standing against the field, not as a coordinate', () => {
    const item = round({
      who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true },
      consequence: { kind: 'rank_up', n: 7, of: 41, delta: 2 },
    });
    expect(headlineFor(item, translate)).toBe('Your 68 is the 7th best round played here, up 2 places.');
  });

  /* A STANDING CLAIM REQUIRES A CHANGE: the retired rank_hold sentence must not
     come back under any locale tag, and an unmoved own round reads plainly. */
  it('states no rank when the rank did not move', () => {
    const item = round({
      who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true },
      consequence: { kind: 'played_nochange', n: 7, of: 41 },
    });
    expect(headlineFor(item, translate, 'en-GB')).toBe('You shot a 68.');
    expect(headlineFor(item, translate, 'en-GB')).not.toContain('still');
  });

  it('gives the ordinal suffix on a regional English tag', () => {
    const item = round({
      who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true },
      consequence: { kind: 'rank_up', n: 8, of: 41 },
    });
    expect(headlineFor(item, translate, 'en-GB')).toContain('the 8th best');
    expect(headlineFor(item, translate, 'en-US')).toContain('the 8th best');
  });

  it('names the hole of a single notable score only when hole rows say which', () => {
    const holes = [
      { holeNo: 5, par: 4, strokes: 4 },
      { holeNo: 12, par: 5, strokes: 3 },
    ];
    const eagle = round({ facts: { gross: 70, eagles: 1 } });
    expect(headlineFor(eagle, translate, 'en', { holes })).toBe('An eagle on the 12th, in a round of 70.');
    expect(headlineFor(eagle, translate)).toBe('An eagle, in a round of 70.');
  });

  it('never claims a first hole in one', () => {
    const ace = round({ facts: { gross: 74, holes_in_one: 1 } });
    expect(headlineFor(ace, translate)).toBe('A hole in one.');
    expect(headlineFor(ace, translate)).not.toContain('first');
  });

  it('gives non-English locales the plain figure', () => {
    const item = round({
      who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true },
      consequence: { kind: 'rank_up', n: 7, of: 41 },
    });
    expect(headlineFor(item, translate, 'de')).toContain('the 7 best');
    expect(headlineFor(item, translate, 'en-XA')).toContain('the 7 best');
  });
});

describe('Explore round kicker ownership', () => {
  it('removes the record event category and leaves the course', () => {
    expect(kickerParts(round({ facts: { gross: 68, is_course_record: true } }), translate))
      .toEqual({ scope: null, course: "Prince's Golf Club (Shore, Dunes & Himalayas)" });
  });

  it.each([
    ['own', { who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true } }, 'Your round'],
    ['list', { consequence: { kind: 'list_new_low' as const } }, 'On your list'],
    /* THE CLUB CARD WEARS ONLY ITS COURSE: "AT YOUR CLUB" was removed because
       the club's own name follows it. */
    ['club', { ring: 'club' as const }, null],
    ['county', { ring: 'county' as const }, 'Kent'],
    ['country', { ring: 'country' as const }, 'England'],
    ['world', { ring: 'world' as const }, 'World'],
    ['backlog', { ring: null, lane: 'backlog' as const }, 'From September'],
  ])('keeps the %s reason before the course', (_label, overrides, expected) => {
    expect(kickerParts(round(overrides as Partial<StreamItem>), translate).scope).toBe(expected);
  });

  it('returns the course separately from its scope', () => {
    expect(kickerParts(round({ ring: 'county' }), translate)).toEqual({
      scope: 'Kent',
      course: "Prince's Golf Club (Shore, Dunes & Himalayas)",
    });
  });
});
/* BRIEF_ROUND_HEADLINES §1. The article follows the SPOKEN score. */
describe('the indefinite article for a score', () => {
  it.each([
    [8, 'an'],
    [11, 'an'],
    [18, 'an'],
    [68, 'a'],
    [71, 'a'],
    [75, 'a'],
    [79, 'a'],
    [80, 'an'],
    [83, 'an'],
    [89, 'an'],
    [90, 'a'],
    [91, 'a'],
    [100, 'a'],
    [108, 'a'],
  ])('gives %i the article "%s"', (score, expected) => {
    expect(indefiniteArticleForScore(score as number)).toBe(expected);
  });
});

describe('golf language in the round headline', () => {
  it('speaks over, under and level par', () => {
    expect(headlineFor(round({ facts: { gross: 75, to_par: 1 } }), translate)).toBe(
      'henryd3737 shot a 75, one over par.',
    );
    expect(headlineFor(round({ facts: { gross: 69, to_par: -2 } }), translate)).toBe(
      'henryd3737 shot a 69, two under par.',
    );
    expect(headlineFor(round({ facts: { gross: 71, to_par: 0 } }), translate)).toBe(
      'henryd3737 shot a 71, level par.',
    );
    expect(headlineFor(round({ facts: { gross: 83, to_par: 13 } }), translate)).toBe(
      'henryd3737 shot an 83, thirteen over par.',
    );
  });

  it('says "You shot" for the viewer and keeps a username lowercase', () => {
    const own = round({
      who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true },
      facts: { gross: 75, to_par: 1 },
    });
    /* An own round with no consequence keeps its established shortest form (the
       chip already carries the to-par); with a callout it speaks the to-par. */
    expect(headlineFor(own, translate)).toBe('You shot a 75.');
    expect(headlineFor(own, translate, 'en', { plainRound: true })).toBe('You shot a 75, one over par.');
    expect(headlineFor(round({ facts: { gross: 71, to_par: 0 } }), translate)).toMatch(/^henryd3737 /);
  });

  it('uses the shot headline when a callout renders', () => {
    const item = round({
      consequence: { kind: 'record_taken' },
      facts: { gross: 69, to_par: -2 },
      who: { user_id: 'member', display_name: 'Danny Robinson', photo_url: null, is_viewer: false },
    });
    expect(headlineFor(item, translate, 'en', { plainRound: true })).toBe(
      'Danny Robinson shot a 69, two under par.',
    );
  });
});
