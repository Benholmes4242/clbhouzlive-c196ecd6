import { describe, expect, it } from 'vitest';
import tourhubEn from '../../public/locales/en/tourhub.json';

/**
 * CB54 regression guard: the four HOW WE PICK steps and the COURSE
 * DIFFICULTY label were deleted once by a bulk locale rewrite, leaving the
 * sheet printing raw keys. If a future rewrite drops them again, this test
 * fails instead of the screen.
 */
describe('CB54 picks sheet copy keys', () => {
  const picksSheet = (tourhubEn as any).overview.picksSheet;

  it.each([1, 2, 3, 4] as const)('step%i Lead and Body keys exist and are non-empty', (n) => {
    expect(typeof picksSheet[`step${n}Lead`]).toBe('string');
    expect(picksSheet[`step${n}Lead`].length).toBeGreaterThan(0);
    expect(typeof picksSheet[`step${n}Body`]).toBe('string');
    expect(picksSheet[`step${n}Body`].length).toBeGreaterThan(0);
  });

  it('figDifficulty labels the course difficulty figure', () => {
    expect(picksSheet.figDifficulty).toBe('COURSE DIFFICULTY');
  });
});
