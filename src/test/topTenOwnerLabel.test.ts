import { describe, it, expect } from 'vitest';
import { ownerScoreLabel } from '@/components/profile/hero/ProfileTopTenRail';

/**
 * BRIEF_TOP_TEN_OWNER_NAME_LABEL — the pure label helper only.
 * The render case lives in topTenOwnerLabelRender.test.tsx (JSX needs a .tsx file).
 */
describe('BRIEF_TOP_TEN_OWNER_NAME_LABEL ownerScoreLabel', () => {
  it('passes a short first name through untouched', () => {
    expect(ownerScoreLabel('Thomas')).toBe('Thomas');
  });

  it('clips a long name to eight characters plus an ellipsis', () => {
    expect(ownerScoreLabel('golfingwithellie')).toBe('golfingw\u2026');
  });

  it('treats whitespace as no name at all', () => {
    expect(ownerScoreLabel('  ')).toBeNull();
  });

  it('treats null as no name at all', () => {
    expect(ownerScoreLabel(null)).toBeNull();
  });

  it('keeps a name of exactly nine characters whole', () => {
    expect(ownerScoreLabel('Alexandra')).toBe('Alexandra');
  });
});
