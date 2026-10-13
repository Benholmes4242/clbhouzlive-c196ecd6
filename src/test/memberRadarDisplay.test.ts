import { describe, expect, it } from 'vitest';
import { radarDuration, londonTime, londonSessionDay, radarQueryUser } from '@/features/admin/lib/memberRadarDisplay';

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
  it('labels the last session day in Europe/London', () => {
    const now = '2026-10-13T07:48:00Z';
    expect(londonSessionDay('2026-10-12T23:30:00Z', now)).toBe('today');
    expect(londonSessionDay('2026-10-12T12:00:00Z', now)).toBe('yesterday');
    expect(londonSessionDay('2026-10-05T12:00:00Z', now)).toBe('Mon 5 Oct');
  });
});
