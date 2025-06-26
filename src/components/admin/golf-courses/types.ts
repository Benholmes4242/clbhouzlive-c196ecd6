
export interface GolfCourse {
  id: string;
  name: string;
  country: string;
  sub_country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  country_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  description: string | null;
  thumbnail_image: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CourseRating {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  user_id: string;
  user_profile?: {
    username: string | null;
    display_name: string | null;
  } | null;
}

export interface GolfCourseEditorProps {
  course: GolfCourse | null;
  isCreating: boolean;
  onClose: () => void;
}

export type RegionKey = 'all' | 'usa' | 'britain-ireland' | 'europe' | 'worldwide';

export const regionMapping: Record<RegionKey, string> = {
  all: 'All Regions',
  usa: 'USA',
  'britain-ireland': 'Britain & Ireland',
  europe: 'Continental Europe',
  worldwide: 'Worldwide'
};

// Primary country/region options
export const countryOptions = [
  'USA',
  'Britain & Ireland',
  'Continental Europe',
  'Worldwide'
];

// Sub-country options based on primary country selection
export const subCountryOptions: Record<string, string[]> = {
  'USA': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ],
  'Britain & Ireland': [
    'England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland'
  ],
  'Continental Europe': [
    'France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Belgium',
    'Switzerland', 'Austria', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Czech Republic',
    'Poland', 'Hungary', 'Slovenia', 'Croatia', 'Greece', 'Turkey', 'Russia'
  ],
  'Worldwide': [
    'Australia', 'New Zealand', 'South Africa', 'Japan', 'South Korea', 'China',
    'Thailand', 'Singapore', 'Malaysia', 'Philippines', 'India', 'UAE', 'Canada',
    'Mexico', 'Brazil', 'Argentina', 'Chile', 'Morocco', 'Egypt', 'Kenya'
  ]
};

// Continent options
export const continentOptions = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Africa',
  'Oceania'
];
