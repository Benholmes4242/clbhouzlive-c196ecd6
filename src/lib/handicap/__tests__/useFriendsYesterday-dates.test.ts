import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toLocalDateKey, getYesterdayKey } from '../useFriendsYesterday';

describe('useFriendsYesterday date helpers', () => {
  describe('toLocalDateKey', () => {
    it('returns null for null input', () => {
      expect(toLocalDateKey(null)).toBeNull();
    });

    it('returns null for invalid string input', () => {
      expect(toLocalDateKey('not-a-date')).toBeNull();
    });

    it('handles date-only strings as local-midnight, not UTC-midnight', () => {
      expect(toLocalDateKey('2026-05-03')).toBe('2026-05-03');
    });

    it('handles ISO datetime strings correctly', () => {
      const result = toLocalDateKey('2026-05-03T18:30:00Z');
      expect(result).toMatch(/^2026-05-03$/);
    });

    it('handles Date instance input', () => {
      const d = new Date(2026, 4, 3);
      expect(toLocalDateKey(d)).toBe('2026-05-03');
    });
  });

  describe('getYesterdayKey', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns the previous calendar day', () => {
      vi.setSystemTime(new Date(2026, 4, 4, 12, 0, 0));
      expect(getYesterdayKey()).toBe('2026-05-03');
    });

    it('handles month boundary correctly', () => {
      vi.setSystemTime(new Date(2026, 5, 1, 8, 0, 0));
      expect(getYesterdayKey()).toBe('2026-05-31');
    });

    it('handles year boundary correctly', () => {
      vi.setSystemTime(new Date(2027, 0, 1, 0, 30, 0));
      expect(getYesterdayKey()).toBe('2026-12-31');
    });

    it('handles spring DST forward (UK March 2026)', () => {
      vi.setSystemTime(new Date(2026, 2, 30, 8, 0, 0));
      expect(getYesterdayKey()).toBe('2026-03-29');
    });

    it('handles autumn DST back (UK October 2026)', () => {
      vi.setSystemTime(new Date(2026, 9, 26, 8, 0, 0));
      expect(getYesterdayKey()).toBe('2026-10-25');
    });
  });
});
