import { describe, it, expect } from 'vitest';
import { circleRungSkippable } from '../useAmateurBoardState';

describe('circle rung skip (2.4, opportunistic)', () => {
  it('skips on a settled zero', () => {
    expect(circleRungSkippable({ isSuccess: true, data: 0 })).toBe(true);
  });
  it('runs on an unresolved count', () => {
    expect(circleRungSkippable({ isSuccess: false, data: undefined })).toBe(false);
  });
  it('runs on a failed read', () => {
    expect(circleRungSkippable({ isSuccess: false, isError: true, data: undefined })).toBe(false);
  });
});
