export const VALID_CONTINENTS = [
  'Africa', 'Antarctica', 'Asia', 'Europe',
  'North America', 'Oceania', 'South America',
] as const;

export type Continent = typeof VALID_CONTINENTS[number];

// Order matches the public.course_type enum labels. Both selects lower-case the
// label before saving, so every entry here must have an exact enum twin —
// guarded by lib/courseTypes.test.ts.
export const COURSE_TYPES = [
  'Links', 'Parkland', 'Heathland', 'Coastal', 'Desert', 'Mountain', 'Resort', 'Mixed',
] as const;
