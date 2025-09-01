
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

// Scope filter type (merged All Courses + Regions, no Worldwide)
export type ScopeKey = 'all' | 'usa' | 'britain-ireland' | 'europe';

export const scopeMapping: Record<ScopeKey, string> = {
  all: 'All Courses',
  usa: 'USA',
  'britain-ireland': 'Britain & Ireland',
  europe: 'Continental Europe'
};

// Filter state interface for cascading dropdowns
export interface RegionalFilter {
  scope: ScopeKey;
  subCountry: string | null;
  county: string | null;
  top100List: Top100ListKey | null;
  sortBy: SortOptionKey | null;
}

// Top 100 List filter type (no 'all' option, null means none selected)
export type Top100ListKey = 'worldwide' | 'usa' | 'britain-ireland' | 'europe';

export const top100ListMapping: Record<Top100ListKey, string> = {
  worldwide: 'Top 100 Worldwide',
  usa: 'Top 100 USA',
  'britain-ireland': 'Top 100 Great Britain & Ireland',
  europe: 'Top 100 Continental Europe'
};

// Sort options type
export type SortOptionKey = 'name-asc' | 'name-desc' | 'recent-added';

export const sortOptionMapping: Record<SortOptionKey, string> = {
  'name-asc': 'Name: A to Z',
  'name-desc': 'Name: Z to A',
  'recent-added': 'Most Recently Added'
};

// Country/Sub-country mapping for Britain & Ireland
export const britainIrelandCountries = [
  'England',
  'Scotland', 
  'Wales',
  'Ireland',
  'Northern Ireland'
];

// Sample counties for Britain & Ireland countries
export const britainIrelandCounties: Record<string, string[]> = {
  'England': [
    'Bedfordshire', 'Berkshire', 'Buckinghamshire', 'Cambridgeshire', 'Cheshire',
    'Cornwall', 'Cumbria', 'Derbyshire', 'Devon', 'Dorset', 'Durham', 'Essex',
    'Gloucestershire', 'Greater London', 'Hampshire', 'Herefordshire', 'Hertfordshire',
    'Kent', 'Lancashire', 'Leicestershire & Rutland', 'Lincolnshire', 'Norfolk',
    'Northamptonshire', 'Northumberland', 'Nottinghamshire', 'Oxfordshire',
    'Shropshire', 'Somerset', 'Staffordshire', 'Suffolk', 'Surrey', 'Sussex',
    'Warwickshire', 'West Midlands', 'Wiltshire', 'Worcestershire', 'Yorkshire'
  ],
  'Scotland': [
    'Aberdeen', 'Angus', 'Argyll and Bute', 'Ayrshire', 'Borders',
    'Dumfries and Galloway', 'Dundee', 'Edinburgh', 'Fife', 'Glasgow',
    'Highland', 'Lanarkshire', 'Moray', 'Perth and Kinross', 'Stirling'
  ],
  'Wales': [
    'Anglesey', 'Cardiff', 'Carmarthenshire', 'Ceredigion', 'Conwy',
    'Denbighshire', 'Flintshire', 'Glamorgan', 'Gwynedd', 'Monmouthshire',
    'Pembrokeshire', 'Powys', 'Rhondda Cynon Taf', 'Swansea', 'Wrexham'
  ],
  'Ireland': [
    'Dublin', 'Cork', 'Galway', 'Kerry', 'Kildare', 'Kilkenny',
    'Limerick', 'Mayo', 'Meath', 'Tipperary', 'Waterford', 'Wexford'
  ],
  'Northern Ireland': [
    'Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone'
  ]
};

// US States
export const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// Continental Europe countries
export const continentalEuropeCountries = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia',
  'Lithuania', 'Luxembourg', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Slovenia',
  'Slovakia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Russia'
];

// Worldwide countries
export const worldwideCountries = [
  'Australia', 'New Zealand', 'South Africa', 'Japan', 'South Korea', 'China',
  'Thailand', 'Singapore', 'Malaysia', 'Philippines', 'India', 'UAE', 'Canada',
  'Mexico', 'Brazil', 'Argentina', 'Chile', 'Morocco', 'Egypt', 'Kenya'
];
