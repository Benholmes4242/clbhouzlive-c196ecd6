import { describe, expect, it } from 'vitest';
import { formatAgo } from '@/features/admin/lib/formatAgo';

const now = Date.UTC(2026, 9, 13, 12, 0, 0);
const before = (s: number) => new Date(now - s * 1000).toISOString();

describe('formatAgo (BRIEF_MEMBERS_RADAR 2.2)', () => {
  it('reads "now" under two minutes', () => expect(formatAgo(before(119), { now })).toBe('now'));
  it('reads minutes', () => expect(formatAgo(before(9 * 60), { now })).toBe('9 min'));
  it('reads hours', () => expect(formatAgo(before(5 * 3600), { now })).toBe('5 h'));
  it('reads days', () => expect(formatAgo(before(25 * 86400), { now })).toBe('25 d'));
  it('reads months', () => expect(formatAgo(before(95 * 86400), { now })).toBe('3 mo'));
  it('reads years', () => expect(formatAgo(before(400 * 86400), { now })).toBe('1 y'));
  it('is never uppercase', () => expect(formatAgo(before(5 * 3600), { now })).toBe(formatAgo(before(5 * 3600), { now }).toLowerCase()));
});
