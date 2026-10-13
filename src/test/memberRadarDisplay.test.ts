import { describe, expect, it } from 'vitest';
import { radarDuration, londonTime, weeklySessionCounts, radarQueryUser } from '@/features/admin/lib/memberRadarDisplay';
import type { MemberSessionSummary } from '@/features/admin/hooks/useMembersRadar';

describe('Member radar server presentation', () => {
  it('formats server seconds without deriving elapsed time', () => {
    expect(radarDuration(24000)).toBe('6h 40m');
    expect(radarDuration(414)).toBe('6m 54s');
    expect(radarDuration(0)).toBe('0s');
    expect(radarDuration(null)).toBe('—');
  });
  it('uses Europe/London through summer and winter', () => {
    expect(londonTime('2026-10-13T07:48:00Z')).toBe('08:48');
    expect(londonTime('2026-12-13T07:48:00Z')).toBe('07:48');
  });
  it('does not request restricted panels for a limited admin or unopened Behaviour', () => {
    expect(radarQueryUser('member', false)).toBeNull();
    expect(radarQueryUser('member', true, false)).toBeNull();
    expect(radarQueryUser('member', true, true)).toBe('member');
  });
  it('counts eight London weeks oldest first without duplicate sessions', () => {
    const row = (id: string, at: string): MemberSessionSummary => ({ session_id: id, started_at: at, ended_at: null, seconds: 552, screens: 3, events: 2, errors: 0, client: 'App' });
    expect(weeklySessionCounts([
      row('old', '2026-08-23T12:00:00Z'),
      row('first', '2026-08-24T12:00:00Z'),
      row('sunday-london-monday', '2026-10-11T23:30:00Z'),
      row('today', '2026-10-13T07:48:00Z'),
      row('today', '2026-10-13T07:48:00Z'),
    ], '2026-10-13T10:00:00Z')).toEqual([1, 0, 0, 0, 0, 0, 0, 2]);
  });
});