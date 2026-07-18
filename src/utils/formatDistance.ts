/**
 * Format a distance in kilometers as either "{m} m" (< 1 km) or "{k.k} km".
 * Shared between nearby-hospitality surfaces (course detail + business profile).
 */
export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
