
export interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  description: string | null;
  thumbnail_image: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const regionMapping = {
  'all': 'All Regions',
  'britain-ireland': 'Britain & Ireland',
  'europe': 'Europe',
  'usa': 'USA',
  'worldwide': 'Worldwide'
} as const;

export type RegionKey = keyof typeof regionMapping;
