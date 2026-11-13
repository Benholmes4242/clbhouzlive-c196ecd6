/** BRIEF_FOLLOW_TILE_POSTED_AGE — every boundary of tilePostedLine with a fixed now. */
import { describe, expect, it } from 'vitest';
import { tilePostedLine } from '../followTileRules';

const NOW = new Date('2026-11-13T12:00:00Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe('tilePostedLine', () => {
  it('30s is just now', () => {
    expect(tilePostedLine(ago(30_000), NOW)).toEqual({ key: 'findPeople.active.postedJustNow', vars: {}, def: 'Posted just now' });
  });
  it('59m is minutes', () => {
    expect(tilePostedLine(ago(59 * MIN), NOW)).toEqual({ key: 'findPeople.active.postedMinutes', vars: { n: 59 }, def: 'Posted 59m ago' });
  });
  it('23h is hours', () => {
    expect(tilePostedLine(ago(23 * HOUR), NOW)).toEqual({ key: 'findPeople.active.postedHours', vars: { n: 23 }, def: 'Posted 23h ago' });
  });
  it('24h is yesterday', () => {
    expect(tilePostedLine(ago(24 * HOUR), NOW)).toEqual({ key: 'findPeople.active.postedYesterday', vars: {}, def: 'Posted yesterday' });
  });
  it('47h is yesterday', () => {
    expect(tilePostedLine(ago(47 * HOUR), NOW)).toEqual({ key: 'findPeople.active.postedYesterday', vars: {}, def: 'Posted yesterday' });
  });
  it('48h is 2 days', () => {
    expect(tilePostedLine(ago(48 * HOUR), NOW)).toEqual({ key: 'findPeople.tile.postedDays', vars: { count: 2 }, def: 'Posted 2 days ago' });
  });
  it('6d is 6 days', () => {
    expect(tilePostedLine(ago(6 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedDays', vars: { count: 6 }, def: 'Posted 6 days ago' });
  });
  it('7d is 1 week', () => {
    expect(tilePostedLine(ago(7 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedWeeks', vars: { count: 1 }, def: 'Posted 1 week ago' });
  });
  it('13d is 1 week', () => {
    expect(tilePostedLine(ago(13 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedWeeks', vars: { count: 1 }, def: 'Posted 1 week ago' });
  });
  it('14d is 2 weeks', () => {
    expect(tilePostedLine(ago(14 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedWeeks', vars: { count: 2 }, def: 'Posted 2 weeks ago' });
  });
  it('34d is 4 weeks', () => {
    expect(tilePostedLine(ago(34 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedWeeks', vars: { count: 4 }, def: 'Posted 4 weeks ago' });
  });
  it('35d is 1 month', () => {
    expect(tilePostedLine(ago(35 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedMonths', vars: { count: 1 }, def: 'Posted 1 month ago' });
  });
  it('364d is 12 months', () => {
    expect(tilePostedLine(ago(364 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedMonths', vars: { count: 12 }, def: 'Posted 12 months ago' });
  });
  it('365d is over a year', () => {
    expect(tilePostedLine(ago(365 * DAY), NOW)).toEqual({ key: 'findPeople.tile.postedOverYear', vars: {}, def: 'Posted over a year ago' });
  });
  it('a future postedAt is treated as just now', () => {
    expect(tilePostedLine(new Date(NOW.getTime() + 3 * DAY).toISOString(), NOW)).toEqual({ key: 'findPeople.active.postedJustNow', vars: {}, def: 'Posted just now' });
  });
});
