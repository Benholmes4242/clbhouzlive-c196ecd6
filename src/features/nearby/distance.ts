/**
 * Calculate distance between two points using the Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 * Shows miles if < 1.6km, otherwise km
 */
export function formatDistance(distanceMeters: number): string {
  const distanceKm = distanceMeters / 1000;
  
  if (distanceKm < 1.6) {
    // Show in miles
    const miles = distanceKm * 0.621371;
    return `${miles.toFixed(1)}mi`;
  } else {
    // Show in km
    return `${distanceKm.toFixed(1)}km`;
  }
}
