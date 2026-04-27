/**
 * LEGACY_ALUMNI_IDS — editorial allow-list for the College Franchise
 * "Legacy" tier (4-tier alumni model).
 *
 * Inclusion rule: ≥1 major championship win AND inactive this season
 * (events_played === 0 in current season).
 *
 * Data-layer reality: sr_players has no career_major_wins field. Until that
 * column is ingested (follow-up queue), Legacy is editorially curated.
 *
 * Seed (Phase 1, capped at 10–15, under-seed rather than mis-tier):
 *   - Justin Leonard      (Texas)         · 1998 Open Championship
 *   - Tiger Woods         (Stanford)      · 15 majors
 *   - Phil Mickelson      (Arizona State) · 6 majors
 *   - Fred Couples        (Houston)       · 1992 Masters
 *   - Jim Furyk           (Arizona)       · 2003 U.S. Open
 *   - Stewart Cink        (Georgia Tech)  · 2009 Open Championship
 *   - Bubba Watson        (Georgia)       · 2012 + 2014 Masters
 *   - Lucas Glover        (Clemson)       · 2009 U.S. Open
 *   - Webb Simpson        (Wake Forest)   · 2012 U.S. Open
 *
 * David Toms (LSU, 2001 PGA) was found in sr_players but with NULL college
 * — omitted until college_normalized is back-filled.
 */

export const LEGACY_ALUMNI_IDS: ReadonlySet<string> = new Set<string>([
  '37a427ec-ccee-4af7-b775-2a2cafad6c93', // Justin Leonard — Texas
  'c607a363-8f2a-49fb-a7e6-0eabe80cf3a5', // Tiger Woods — Stanford
  '73a387f0-ca7c-4ab2-8d1c-a0f8d5f58fd3', // Phil Mickelson — Arizona State
  '1fedb355-4c4f-484f-8601-a0a0e6610cd2', // Fred Couples — Houston
  '97897aab-e127-4da6-b3ed-906e989e8aad', // Jim Furyk — Arizona
  'a16e7085-3706-4df3-b863-9a08c27656ae', // Stewart Cink — Georgia Tech
  '80665af9-146b-4b45-8c35-b34a3dc2a173', // Bubba Watson — Georgia
  'ae55e67f-49e7-4a50-83b3-dc4c9d24c7db', // Lucas Glover — Clemson
  '1d6e8d10-f0e4-4c0e-ad6f-cba7e692429a', // Webb Simpson — Wake Forest
]);

/**
 * Optional editorial context line per legacy alumnus, rendered under the name.
 * Falls back to "Major champion · Program history" when not specified.
 */
export const LEGACY_ALUMNI_CONTEXT: Readonly<Record<string, string>> = {
  '37a427ec-ccee-4af7-b775-2a2cafad6c93': '1998 Open Champion',
  'c607a363-8f2a-49fb-a7e6-0eabe80cf3a5': '15× major champion',
  '73a387f0-ca7c-4ab2-8d1c-a0f8d5f58fd3': '6× major champion',
  '1fedb355-4c4f-484f-8601-a0a0e6610cd2': '1992 Masters Champion',
  '97897aab-e127-4da6-b3ed-906e989e8aad': '2003 U.S. Open Champion',
  'a16e7085-3706-4df3-b863-9a08c27656ae': '2009 Open Champion',
  '80665af9-146b-4b45-8c35-b34a3dc2a173': '2× Masters Champion',
  'ae55e67f-49e7-4a50-83b3-dc4c9d24c7db': '2009 U.S. Open Champion',
  '1d6e8d10-f0e4-4c0e-ad6f-cba7e692429a': '2012 U.S. Open Champion',
};

export const TIER_SUBTITLES = {
  stars: 'Top OWGR or recent winners',
  regulars: 'Consistent tour performers',
  rising: 'Outside top 200, building career',
  legacy: 'Major winners · program history',
} as const;
