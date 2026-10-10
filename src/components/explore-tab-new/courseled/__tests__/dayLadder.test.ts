import { describe, it, expect } from 'vitest';
import { dayLadder } from '../discoverWhen';

const t = (k: string) => k.split('.').pop()!;
/* Saturday 10 October 2026. */
const now = new Date(2026, 9, 10, 15);
const at = (iso: string) => dayLadder(iso, t, 'en-GB', now).label;

describe('day ladder', () => {
  it('today, yesterday, this week, last week, month, month year', () => {
    expect(at('2026-10-10')).toBe('today');
    expect(at('2026-10-09')).toBe('yesterday');
    expect(at('2026-10-07')).toBe('thisWeek');
    expect(at('2026-10-01')).toBe('lastWeek');
    expect(at('2026-08-31')).toBe('August');
    expect(at('2025-10-10')).toBe('October 2025');
  });
});
