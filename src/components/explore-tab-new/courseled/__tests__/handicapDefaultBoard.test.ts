import { describe, expect, it } from 'vitest';

import { boardForIndex } from '../hooks/useHandicapDefaultBoard';

/** H1.1 / H1.5 — one boundary, 5.0 exactly, and 5.0 gets net. */
describe('boardForIndex', () => {
  it('lands an index under 5 on the gross board', () => {
    expect(boardForIndex(-1.4)).toBe('topar');
    expect(boardForIndex(0)).toBe('topar');
    expect(boardForIndex(4.9)).toBe('topar');
  });

  it('lands 5.0 exactly, and everything above it, on net', () => {
    expect(boardForIndex(5)).toBe('net');
    expect(boardForIndex(5.1)).toBe('net');
    expect(boardForIndex(24)).toBe('net');
  });

  it('lands a missing or unusable index on the gross board', () => {
    expect(boardForIndex(null)).toBe('topar');
    expect(boardForIndex(undefined)).toBe('topar');
    expect(boardForIndex(Number.NaN)).toBe('topar');
  });
});
