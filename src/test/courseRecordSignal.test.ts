import { describe, expect, it } from 'vitest';

import { recordHoldersFromRows } from '@/features/explore-magazine/useCourseRecordSignal';

describe('course record holder reduction', () => {
  it('keeps rank 1 and carries rank 2 as the beaten value regardless of member', () => {
    const holders = recordHoldersFromRows([
      { course_id: 'c1', user_id: 'new', value: '66', attained_at: '2026-09-20T10:00:00Z', rank: 1 },
      { course_id: 'c1', user_id: 'old', value: 68, attained_at: '2026-08-12T10:00:00Z', rank: 2 },
    ]);
    expect(holders.get('c1')).toEqual({
      course_id: 'c1', user_id: 'new', value: 66, runner_up_value: 68, attained_on: '2026-09-20',
    });
  });

  it('returns a null runner-up when nobody else has played', () => {
    expect(recordHoldersFromRows([
      { course_id: 'c1', user_id: 'only', value: 66, attained_at: '2026-09-20T10:00:00Z', rank: 1 },
    ]).get('c1')?.runner_up_value).toBeNull();
  });

  it('keeps rejecting an ambiguous rank-1 board', () => {
    expect(recordHoldersFromRows([
      { course_id: 'c1', user_id: 'a', value: 66, attained_at: '2026-09-20T10:00:00Z', rank: 1 },
      { course_id: 'c1', user_id: 'b', value: 66, attained_at: '2026-09-20T11:00:00Z', rank: 1 },
      { course_id: 'c1', user_id: 'c', value: 68, attained_at: '2026-08-12T10:00:00Z', rank: 2 },
    ]).has('c1')).toBe(false);
  });
});