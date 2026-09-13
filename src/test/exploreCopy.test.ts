import { describe, expect, it } from 'vitest';

import { headlineFor, kickerParts } from '@/features/explore-magazine/exploreCopy';
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
    expect(headlineFor(round({}), translate)).toBe('henryd3737 went round in 68, four under.');
    expect(headlineFor(round({ facts: { gross: 70, birdies: 6 } }), translate)).toBe(
      'six birdies in a round of 70.',
    );
    expect(headlineFor(round({ facts: { gross: 86 } }), translate)).toBe('henryd3737 went round in 86.');
  });

  it('measures a standing against the field, not as a coordinate', () => {
    const item = round({
      who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true },
      consequence: { kind: 'rank_hold', n: 7, of: 41 },
    });
    expect(headlineFor(item, translate)).toBe('Your 68 is still the 7th best round anyone has played here.');
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
      consequence: { kind: 'rank_hold', n: 7, of: 41 },
    });
    expect(headlineFor(item, translate, 'de')).toContain('the 7 best');
  });
});

describe('Explore round kicker ownership', () => {
  it('removes the record event category and leaves the course', () => {
    expect(kickerParts(round({ facts: { gross: 68, is_course_record: true } }), translate))
      .toEqual(["Prince's Golf Club (Shore, Dunes & Himalayas)"]);
  });

  it.each([
    ['own', { who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true } }, 'Your round'],
    ['list', { consequence: { kind: 'list_new_low' as const } }, 'On your list'],
    /* THE CLUB CARD WEARS ONLY ITS COURSE: "AT YOUR CLUB" was removed because
       the club's own name follows it. */
    ['club', { ring: 'club' as const }, "Prince's Golf Club (Shore, Dunes & Himalayas)"],
    ['county', { ring: 'county' as const }, 'Around Kent'],
    ['country', { ring: 'country' as const }, 'Around England'],
    ['world', { ring: 'world' as const }, 'Around the world'],
    ['backlog', { ring: null, lane: 'backlog' as const }, 'From September'],
  ])('keeps the %s reason before the course', (_label, overrides, expected) => {
    expect(kickerParts(round(overrides as Partial<StreamItem>), translate)[0]).toBe(expected);
  });
});
describe('Retired rank cards', () => {
  it('never prints the retired sentences for another member at a played course', () => {
    /* Both retired kinds are gone from the type, so the only thing to assert is
       that no surviving template produces their wording. */
    const item = round({ consequence: null, facts: { gross: 79 } });
    const headline = headlineFor(item, translate);
    expect(headline).not.toContain('which puts you');
    expect(headline).not.toContain('unchanged');
  });

  it('gives every surviving rank template an ordinal in English regional locales', () => {
    const viewer = { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true };
    const hold = round({ who: viewer, consequence: { kind: 'rank_hold', n: 8, of: 41 } });
    const up = round({ who: viewer, consequence: { kind: 'rank_up', n: 6, of: 41 } });
    expect(headlineFor(hold, translate, 'en-GB')).toContain('8th');
    expect(headlineFor(up, translate, 'en-GB')).toContain('6th');
    expect(headlineFor(hold, translate, 'en')).toContain('8th');
    expect(headlineFor(up, translate, 'en')).toContain('6th');
    expect(headlineFor(hold, translate, 'en-XA')).toContain('the 8 best');
  });
});
