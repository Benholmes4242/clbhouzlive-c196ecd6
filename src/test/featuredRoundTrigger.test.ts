import { describe, expect, it } from 'vitest';
import { featuredTriggerFor, decideFeatured } from '@/components/feed/featuredRoundTrigger';
import type { CourseRecordSignal } from '@/features/explore-magazine/useCourseRecordSignal';

const post = { id: 'p1', userId: 'u1', courseId: 'c1' } as never;
const round = (o: Record<string, unknown> = {}) => ({
  whsScoreId: 's1', grossScore: 68, coursePar: 72, playDate: '2026-10-01',
  albatrosses: 0, holesInOne: 0, eagles: 0, birdies: 3, longestBirdieRun: 2, ...o,
}) as never;
const records = (runnerUp: number | null): CourseRecordSignal => ({
  holders: new Map([['c1', { course_id: 'c1', user_id: 'u1', value: 68, runner_up_value: runnerUp, attained_on: '2026-10-01' }]]),
  lostToViewer: new Set(), isFetched: true,
});

describe('featured round triggers', () => {
  it('albatross', () => expect(featuredTriggerFor(post, round({ albatrosses: 1 }), null)?.reason).toBe('feed_albatross'));
  it('hole in one', () => expect(featuredTriggerFor(post, round({ holesInOne: 1 }), null)?.reason).toBe('hole_in_one'));
  it('birdie run of 5', () => expect(featuredTriggerFor(post, round({ longestBirdieRun: 5 }), null)?.reason).toBe('birdie_run'));
  it('birdie run of 4 does not qualify', () => expect(featuredTriggerFor(post, round({ longestBirdieRun: 4 }), null)).toBeNull());
  it('two eagles', () => expect(featuredTriggerFor(post, round({ eagles: 2 }), null)?.reason).toBe('eagle_brace'));
  it('contested course record', () => expect(featuredTriggerFor(post, round(), records(70))?.reason).toBe('course_record'));
  it('uncontested record (no runner-up) renders the ordinary card', () =>
    expect(featuredTriggerFor(post, round(), records(null))).toBeNull());
  it('none of the five renders the ordinary card', () =>
    expect(featuredTriggerFor(post, round({ eagles: 1, birdies: 6 }), null)).toBeNull());
  it('ace plus course record headlines the ace', () =>
    expect(featuredTriggerFor(post, round({ holesInOne: 1 }), records(70))?.reason).toBe('hole_in_one'));
  it('albatross beats an ace', () =>
    expect(featuredTriggerFor(post, round({ holesInOne: 1, albatrosses: 1 }), null)?.reason).toBe('feed_albatross'));
  it("the week's pick renders the ordinary card inline (the rail owns its hero)", () => {
    expect(decideFeatured(new Map(), post, round({ holesInOne: 1 }), records(70), false, 's1')).toBeNull();
    expect(decideFeatured(new Map(), post, round({ holesInOne: 1 }), records(70), false, 'other')?.reason).toBe('hole_in_one');
  });
  it('a post painted ordinary stays ordinary when sources arrive later', () => {
    const d = new Map();
    expect(decideFeatured(d, post, round(), null, false, null)).toBeNull();
    expect(decideFeatured(d, post, round(), records(70), false, null)).toBeNull();
  });
  it('pending course meta or an unknown week pick decides ordinary', () => {
    expect(decideFeatured(new Map(), post, round({ holesInOne: 1 }), records(70), true, null)).toBeNull();
    expect(decideFeatured(new Map(), post, round({ holesInOne: 1 }), records(70), false, undefined)).toBeNull();
  });
  it('a cleared map (feed reset) decides afresh', () => {
    const d = new Map();
    decideFeatured(d, post, round(), null, false, null);
    d.clear();
    expect(decideFeatured(d, post, round(), records(70), false, null)?.reason).toBe('course_record');
  });
});
