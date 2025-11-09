/**
 * Radius filter options for nearby golfers search
 */
export const RADIUS_OPTIONS_KM = [
  { label: '500m', valueKm: 0.5 },
  { label: '1km', valueKm: 1 },
  { label: '3km', valueKm: 3 },
] as const;

/**
 * Visibility filter options for golfers
 */
export const GOLFERS_VISIBILITY_FILTERS = [
  { value: 'all' as const, label: 'All Golfers' },
  { value: 'friends' as const, label: 'Friends' },
] as const;
