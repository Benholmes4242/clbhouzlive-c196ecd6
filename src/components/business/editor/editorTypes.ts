export const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Day = typeof DAYS_ORDER[number];

export interface OpeningHoursEntry {
  open: string;
  close: string;
  closed: boolean;
}
export type OpeningHours = Record<string, OpeningHoursEntry>;

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  Mon: { open: '08:00', close: '18:00', closed: false },
  Tue: { open: '08:00', close: '18:00', closed: false },
  Wed: { open: '08:00', close: '18:00', closed: false },
  Thu: { open: '08:00', close: '18:00', closed: false },
  Fri: { open: '08:00', close: '18:00', closed: false },
  Sat: { open: '08:00', close: '18:00', closed: false },
  Sun: { open: '08:00', close: '18:00', closed: true },
};

export const SOCIAL_PLATFORMS = [
  { field: 'instagram', label: 'Instagram', placeholder: '@yourhandle', kind: 'handle' as const },
  { field: 'tiktok',    label: 'TikTok',    placeholder: '@yourhandle', kind: 'handle' as const },
  { field: 'twitter',   label: 'X / Twitter', placeholder: '@yourhandle', kind: 'handle' as const },
  { field: 'youtube',   label: 'YouTube',   placeholder: 'youtube.com/c/...', kind: 'url' as const },
  { field: 'facebook',  label: 'Facebook',  placeholder: 'facebook.com/...', kind: 'url' as const },
] as const;

export interface SocialFields {
  instagram: string;
  tiktok: string;
  twitter: string;
  facebook: string;
  youtube: string;
}

export interface ImageState {
  url: string | null;
  pendingFile: File | null;
  pendingRemove: boolean;
  localPreview: string | null;
}

export const emptyImage: ImageState = {
  url: null,
  pendingFile: null,
  pendingRemove: false,
  localPreview: null,
};

/* ── Primary action ─────────────────────────────────── */
export const PRIMARY_ACTION_OPTIONS = [
  { key: 'book',       label: 'Book' },
  { key: 'call',       label: 'Call' },
  { key: 'email',      label: 'Email' },
  { key: 'website',    label: 'Website' },
  { key: 'directions', label: 'Directions' },
] as const;
export type PrimaryActionKey = typeof PRIMARY_ACTION_OPTIONS[number]['key'];

/* ── Facilities / amenities (category-aware) ────────── */
const DEFAULT_TAGS = ['Parking', 'Cafe / bar', 'Pro shop', 'Lessons', 'Custom fitting', 'Online store'];

const FACILITIES_BY_CATEGORY: Record<string, string[]> = {
  'Golf Club': [
    '18 holes', '9 holes', 'Driving range', 'Putting green', 'Pro shop',
    'Cafe / bar', 'Restaurant', 'Buggy hire', 'Club hire', 'Lessons',
    'Changing rooms', 'Parking',
  ],
  'Golf Academy': [
    'Indoor bays', 'Launch monitors', 'Video analysis', 'Putting studio',
    'Short-game area', 'Custom fitting', 'Junior coaching', 'Group clinics',
  ],
  'Coach': [
    'Indoor bays', 'Launch monitors', 'Video analysis', 'Putting studio',
    'Short-game area', 'Custom fitting', 'Junior coaching', 'Group clinics',
  ],
  'Instructor': [
    'Indoor bays', 'Launch monitors', 'Video analysis', 'Putting studio',
    'Short-game area', 'Custom fitting', 'Junior coaching', 'Group clinics',
  ],
  'Retailer': [
    'Custom fitting', 'Launch monitors', 'Trade-in', 'Repairs',
    'Online store', 'Big brands', 'Parking',
  ],
  'Pro Shop': [
    'Custom fitting', 'Launch monitors', 'Trade-in', 'Repairs',
    'Online store', 'Big brands', 'Parking',
  ],
  'Club Fitter': [
    'Custom fitting', 'Launch monitors', 'Trade-in', 'Repairs',
    'Online store', 'Big brands', 'Parking',
  ],
  'Resort': [
    'On-site accommodation', 'Multiple courses', 'Driving range', 'Pro shop',
    'Restaurant', 'Spa', 'Buggy hire', 'Lessons',
  ],
  'Hotel / Accommodation': ['Parking', 'Restaurant', 'Bar', 'Spa', 'Gym', 'Golf packages', 'Club storage', 'EV charging'],
  'Restaurant / Cafe': ['Parking', 'Outdoor seating', 'Takeaway', 'Reservations', 'Vegetarian options', 'Family friendly'],
  'Bar / Pub': ['Parking', 'Outdoor seating', 'Live sport on TV', 'Food served', 'Dog friendly', 'Beer garden'],
};

export function getFacilitiesForCategory(category: string): string[] {
  if (!category) return [];
  if (FACILITIES_BY_CATEGORY[category]) return FACILITIES_BY_CATEGORY[category];
  const lower = category.toLowerCase();
  for (const key of Object.keys(FACILITIES_BY_CATEGORY)) {
    if (lower.includes(key.toLowerCase())) return FACILITIES_BY_CATEGORY[key];
  }
  return DEFAULT_TAGS;
}
