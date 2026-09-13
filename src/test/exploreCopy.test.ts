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
  it('keeps the long course and player out of a record-loss gap headline', () => {
    const item = round({ consequence: { kind: 'record_lost', delta: 3 } });
    const headline = headlineFor(item, translate);
    expect(headline).toBe('Took your course record with a 68. Your best is 3 behind.');
    expect(headline).not.toContain("Prince's");
    expect(headline).not.toContain('henryd3737');
  });

  it('keeps course and player out of ordinary and birdie headlines', () => {
    expect(headlineFor(round({}), translate)).toBe('Went round in 68, −4.');
    expect(headlineFor(round({ facts: { gross: 70, birdies: 6 } }), translate)).toBe('Made 6 birdies.');
  });

  it('keeps own-standing copy local to the course without repeating its name', () => {
    const item = round({
      who: { user_id: 'viewer', display_name: 'Viewer', photo_url: null, is_viewer: true },
      consequence: { kind: 'rank_hold', n: 7, of: 41 },
    });
    expect(headlineFor(item, translate)).toBe('Your 68 holds 7th of 41 here.');
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
    ['club', { ring: 'club' as const }, 'At your club'],
    ['county', { ring: 'county' as const }, 'Around Kent'],
    ['country', { ring: 'country' as const }, 'Around England'],
    ['world', { ring: 'world' as const }, 'Around the world'],
    ['backlog', { ring: null, lane: 'backlog' as const }, 'From September'],
  ])('keeps the %s reason before the course', (_label, overrides, expected) => {
    expect(kickerParts(round(overrides as Partial<StreamItem>), translate)[0]).toBe(expected);
  });
});