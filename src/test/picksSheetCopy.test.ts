import { describe, expect, it } from 'vitest';
import tourhubEn from '../../public/locales/en/tourhub.json';

/**
 * Build 2 explicitly retires the old four steps in favour of four method
 * paragraphs. Guard their keys and the new difficulty label.
 */
describe('CB54 picks sheet copy keys', () => {
  const picksSheet = (tourhubEn as any).overview.picksSheet;

  it.each(['independent', 'combine', 'check', 'lock'] as const)('%s method Lead and Body keys exist and are non-empty', (key) => {
    expect(typeof picksSheet.method[`${key}Lead`]).toBe('string');
    expect(picksSheet.method[`${key}Lead`].length).toBeGreaterThan(0);
    expect(typeof picksSheet.method[`${key}Body`]).toBe('string');
    expect(picksSheet.method[`${key}Body`].length).toBeGreaterThan(0);
  });

  it('figDifficulty labels the course difficulty figure', () => {
    expect(picksSheet.figDifficulty).toBe('DIFFICULTY');
  });
});
