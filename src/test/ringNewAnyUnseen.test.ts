import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isNewRing, readSeen, writeSeen, seenKey } from '@/components/courses/browse/playedRings';
import { groupActivity } from '@/components/courses/browse/WhoPlayingSection';

const round = (id: string, play_date: string) => ({ whs_score_id: id, course_id: 'c', user_id: 'u', play_date, gross_score: 80, display_name: 'A', profile_photo_url: null }) as never;
const post = (id: string, created_at: string) => ({ id, course_id: 'c', tagged_course_ids: [], user_id: 'u', actor_type: 'user', created_at }) as never;

describe('FIX_RING_NEW_ANY_UNSEEN', () => {
  beforeEach(() => window.localStorage.clear());
  it('newest seen but an older-dated unseen round reads new', () => {
    const [g] = groupActivity([round('old', '2026-11-01')], [post('p', '2026-11-16T10:00:00Z')]);
    expect(g.latestKey).toBe('post:p');
    expect(isNewRing(g, { c: ['post:p'] })).toBe(true);
  });
  it('a same-day round after a seen post reads new', () => {
    const [g] = groupActivity([round('r', '2026-11-16')], [post('p', '2026-11-16T09:00:00Z')]);
    expect(isNewRing(g, { c: ['post:p'] })).toBe(true);
  });
  it('the full stored set reads seen', () => {
    const [g] = groupActivity([round('r', '2026-11-16')], [post('p', '2026-11-16T09:00:00Z')]);
    writeSeen('me', { c: g.keys! });
    expect(isNewRing(g, readSeen('me'))).toBe(false);
  });
  it('an aged-out stored key does not make a ring new', () => {
    const [g] = groupActivity([round('r', '2026-11-16')]);
    expect(isNewRing(g, { c: ['round:r', 'round:gone'] })).toBe(false);
  });
  it('old single-string values migrate to a one-key set', () => {
    window.localStorage.setItem(seenKey('me'), JSON.stringify({ c: 'round:r' }));
    expect(readSeen('me')).toEqual({ c: ['round:r'] });
    const [g] = groupActivity([round('r', '2026-11-16')]);
    expect(isNewRing(g, readSeen('me'))).toBe(false);
  });
  it('storage failure reads new', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('x'); });
    const [g] = groupActivity([round('r', '2026-11-16')]);
    expect(isNewRing(g, readSeen('me'))).toBe(true);
    spy.mockRestore();
  });
});
