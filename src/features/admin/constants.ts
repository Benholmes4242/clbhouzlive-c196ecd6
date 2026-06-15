export const VALID_CONTINENTS = [
  'Africa', 'Antarctica', 'Asia', 'Europe',
  'North America', 'Oceania', 'South America',
] as const;

export type Continent = typeof VALID_CONTINENTS[number];

export const COURSE_TYPES = [
  'Links', 'Parkland', 'Heathland', 'Desert', 'Mountain', 'Resort',
] as const;
