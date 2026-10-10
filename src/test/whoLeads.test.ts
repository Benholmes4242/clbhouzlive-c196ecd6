import { describe, expect, it } from 'vitest';
import { whoLeadsPlaceholderHeight, whoLeadsTileHeight, whoLeadsYou } from '@/features/explore-magazine/whoLeads';

const row = (pos: number, user_id: string, is_tie = false, is_viewer = false) => ({ pos, user_id, is_tie, is_viewer });
const field = [row(1, 'a'), row(2, 'b'), row(3, 'me', true, true), row(3, 'c', true), row(5, 'd')];

describe('who leads what — you line', () => {
  it('mid-field reads the position with its ordinal', () => {
    expect(whoLeadsYou([row(1, 'a'), row(2, 'me', false, true)], 'me', 'en-GB')).toEqual({ kind: 'on', pos: '2nd' });
  });
  it('a tie carries the T prefix', () => {
    expect(whoLeadsYou(field, 'me', 'en')).toEqual({ kind: 'on', pos: 'T3rd' });
  });
  it('leading is the viewer being the tile leader', () => {
    expect(whoLeadsYou([row(1, 'me', false, true), row(2, 'a')], 'me', 'en')).toEqual({ kind: 'lead' });
  });
  it('tied first but not the shown leader is not "lead"', () => {
    expect(whoLeadsYou([row(1, 'a', true), row(1, 'me', true, true)], 'me', 'en')).toEqual({ kind: 'on', pos: 'T1st' });
  });
  it('absent from the board', () => {
    expect(whoLeadsYou([row(1, 'a')], 'me', 'en')).toEqual({ kind: 'absent' });
  });
});

describe('who leads what — reserved height', () => {
  it('tile is 173 signed in, 135 signed out', () => {
    expect(whoLeadsTileHeight(true)).toBe(173);
    expect(whoLeadsTileHeight(false)).toBe(135);
  });
  it('placeholder is 280 signed in, 242 signed out', () => {
    expect(whoLeadsPlaceholderHeight(true)).toBe(280);
    expect(whoLeadsPlaceholderHeight(false)).toBe(242);
  });
});
