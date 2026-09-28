import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { clubRowToSelected, clubInsertFields, courseCountSuffix, type GolfClubRow } from '../claimClub';

const SUNDRIDGE: GolfClubRow = {
  id: 'club-sundridge',
  name: 'Sundridge Park Golf Club',
  club_key: 'sundridgepark',
  country: 'Britain & Ireland',
  sub_country: 'England',
  region: 'Kent',
  latitude: 51.41,
  longitude: 0.03,
};

describe('claimed club is named after its club', () => {
  it('claiming from East Course names the business after the CLUB', () => {
    const fields = clubInsertFields(clubRowToSelected(SUNDRIDGE));
    expect(fields.name).toBe('Sundridge Park Golf Club');
    expect(fields.club_name).toBe('Sundridge Park Golf Club');
    expect(fields.name).not.toContain('East');
  });

  it('prefill carries real geography and club_key, not nulls', () => {
    const sel = clubRowToSelected(SUNDRIDGE);
    expect(sel.club_key).toBe('sundridgepark');
    const f = clubInsertFields(sel);
    expect(f).toMatchObject({ lat: 51.41, lng: 0.03, country: 'Britain & Ireland' });
  });

  it('course count appears only above one', () => {
    expect(courseCountSuffix(0)).toBeNull();
    expect(courseCountSuffix(1)).toBeNull();
    expect(courseCountSuffix(2)).toBe('2 courses');
  });

  it('no component reads a clubName URL param', () => {
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((f) => {
        const p = join(d, f);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
      });
    const offenders = walk(join(process.cwd(), 'src')).filter((f) =>
      /get\(['"]clubName['"]\)|\{[^}]*\bclubName\b[^}]*\}\s*\)\s*;?\s*$|URLSearchParams\(\{[^}]*clubName/m.test(
        readFileSync(f, 'utf8').split('\n').filter((l) => /URLSearchParams|searchParams\.get/.test(l)).join('\n'),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
