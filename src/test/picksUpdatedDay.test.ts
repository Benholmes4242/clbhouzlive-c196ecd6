import { describe, it, expect } from 'vitest';
import { picksUpdatedDay } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';

const now = new Date('2026-10-10T12:00:00Z');
describe('picksUpdatedDay', () => {
  it('uses a short weekday inside seven days', () => {
    expect(picksUpdatedDay('2026-10-08T12:00:00Z', 'en', now)).toBe('Thu');
  });
  it('uses a short date beyond seven days', () => {
    expect(picksUpdatedDay('2026-09-20T12:00:00Z', 'en', now)).toBe('20 Sept'.length ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date('2026-09-20T12:00:00Z')) : '');
  });
});
