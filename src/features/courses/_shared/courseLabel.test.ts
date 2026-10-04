import { describe, expect, it } from 'vitest';
import { shortCourseName } from './courseLabel';

describe('shortCourseName', () => {
  it.each([
    ['Monte Rei Golf and Country Club (North)', 'Monte Rei (North)'],
    ['Hanbury Manor Golf & Country Club', 'Hanbury Manor'],
    ['Sundridge Park Golf Club (East Course)', 'Sundridge Park (East Course)'],
    ['Royal Lytham & St Annes Golf Club', 'Royal Lytham & St Annes'],
    ['Trump Turnberry Resort - Ailsa', 'Trump Turnberry Resort - Ailsa'],
    ['Hollinwell', 'Hollinwell'],
  ])('%s -> %s', (input, expected) => {
    expect(shortCourseName(input)).toBe(expected);
  });
});
