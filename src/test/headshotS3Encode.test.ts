import { describe, expect, it } from 'vitest';
import { objectPath, s3Encode } from '../../supabase/functions/manage-player-headshot/s3Encode';

describe('BRIEF_HEADSHOT_UPLOAD_FIX s3Encode/objectPath', () => {
  it("s3Encode percent-encodes the apostrophe in Timothy O'Neal", () => {
    expect(s3Encode("Timothy O'Neal")).toBe('Timothy%20O%27Neal');
  });

  it('s3Encode percent-encodes every byte outside the SigV4 unreserved set', () => {
    expect(s3Encode('A (B)!*')).toBe('A%20%28B%29%21%2A');
  });

  it("objectPath builds the canonical R2 key for PGA Tour / Timothy O'Neal", () => {
    expect(objectPath('player-headshots', 'PGA Tour', "Timothy O'Neal"))
      .toBe('/player-headshots/PGA%20Tour/Timothy%20O%27Neal.webp');
  });

  it('the Champions folder uses underscores for spaces in the object name', () => {
    expect(objectPath('player-headshots', 'PGA Champions', 'Bernhard Langer'))
      .toBe('/player-headshots/PGA%20Champions/Bernhard_Langer.webp');
  });
});
