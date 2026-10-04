import { describe, expect, it } from 'vitest';
import { shortCourseName } from './courseLabel';

describe('shortCourseName', () => {
  it.each([
    ['Monte Rei Golf and Country Club (North)', 'Monte Rei (North)'],
    ['Hanbury Manor Golf & Country Club', 'Hanbury Manor'],
    ['Sundridge Park Golf Club (East Course)', 'Sundridge Park (East Course)'],
    ['Royal Lytham & St Annes Golf Club', 'Royal Lytham & St Annes'],
    ['Hollinwell', 'Hollinwell'],
  ])('%s -> %s', (input, expected) => {
    expect(shortCourseName(input)).toBe(expected);
  });

  // 30 characters: over the default 26-char stem clip, which is separate from
  // the suffix strip. With room, no suffix or connective is removed.
  it('leaves a suffixless name alone (clip aside)', () => {
    expect(shortCourseName('Trump Turnberry Resort - Ailsa', 40)).toBe('Trump Turnberry Resort - Ailsa');
    expect(shortCourseName('Trump Turnberry Resort - Ailsa')).toBe('Trump Turnberry Resort -\u2026');
  });
});
