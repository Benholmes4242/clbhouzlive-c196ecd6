import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_MILESTONES, MILESTONE_TIER_META } from '@/config/achievements';
import { TIER_BY_ID } from '@/lib/top100Club';

describe('per-list Top 100 club ladder', () => {
  it('never rises above one list of 100', () => {
    for (const t of ACHIEVEMENT_MILESTONES) {
      expect(t <= 100, 'a list holds 100 courses — a per-list rung above 100 can never be reached').toBe(true);
    }
  });
  it('has exactly the six per-list rungs', () => {
    expect(MILESTONE_TIER_META).toHaveLength(6);
    expect(MILESTONE_TIER_META.map((m) => m.threshold)).toEqual([5, 10, 20, 30, 50, 100]);
  });
  it('resolves every rung by id and retires 200/300/400', () => {
    for (const m of MILESTONE_TIER_META) expect(TIER_BY_ID[m.tierId]).not.toBeNull();
    expect(TIER_BY_ID.elite).toBeNull();
    expect(TIER_BY_ID.legendary).toBeNull();
    expect(TIER_BY_ID.grandslam).toBeNull();
  });
});
