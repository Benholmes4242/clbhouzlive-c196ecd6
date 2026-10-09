import { describe, it, expect } from 'vitest';
import { entryBoardFor } from '../useAmateurBoardState';
describe('entryBoardFor', () => {
  it('opens Standings on Most recent for every member', () => {
    expect(entryBoardFor()).toBe('recent');
  });
});
