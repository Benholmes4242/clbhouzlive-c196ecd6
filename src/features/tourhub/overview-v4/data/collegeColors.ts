/**
 * collegeColors - curated brand-color map for the College Franchise section.
 *
 * Keys use the SAME normalized form carried on college_season_stats rows
 * (see src/lib/utils/normalizeCollege.ts: lowercased, punctuation/whitespace
 * stripped, aliases collapsed - e.g. USC -> "southerncalifornia",
 * LSU -> "louisianastate", "Ole Miss" -> "mississippi", "Texas A&M" -> "texasam").
 */

const COLLEGE_COLORS: Record<string, string> = {
  texas: '#BF5700',
  oklahomastate: '#FF7300',
  alabama: '#9E1B32',
  floridastate: '#782F40',
  wakeforest: '#9E7E38',
  stanford: '#8C1515',
  georgiatech: '#B3A369',
  arizonastate: '#8C1D40',
  vanderbilt: '#866D4B',
  georgia: '#BA0C2F',
  florida: '#0021A5',
  louisianastate: '#461D7C',
  auburn: '#E87722',
  mississippi: '#CE1126',
  texastech: '#CC0000',
  oklahoma: '#841617',
  duke: '#003087',
  northcarolina: '#7BAFD4',
  clemson: '#F56600',
  arkansas: '#9D2235',
  texasam: '#500000',
  southerncalifornia: '#990000',
  ucla: '#2774AE',
  pepperdine: '#00205C',
  sandiegostate: '#A6192E',
  illinois: '#E84A27',
  northwestern: '#4E2A84',
  washington: '#4B2E83',
  california: '#003262',
  colorado: '#CFB87C',
};

/** Ink fallback matches V4.ink for unmapped schools - never breaks layout. */
export const COLLEGE_INK_FALLBACK = '#1F2428';

export function getCollegeColor(normalizedName: string | null | undefined): string {
  if (!normalizedName) return COLLEGE_INK_FALLBACK;
  return COLLEGE_COLORS[normalizedName] ?? COLLEGE_INK_FALLBACK;
}
