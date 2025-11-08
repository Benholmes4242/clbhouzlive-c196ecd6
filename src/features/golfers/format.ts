/**
 * Format distance for display
 * Shows meters if < 950m, otherwise km
 */
export const formatDistance = (m?: number) => {
  if (m == null) return "";
  if (m < 950) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
};

/**
 * Format distance and handicap on one line
 * Returns: "300 m • HCP 9.0" or "1.4 km • HCP 2.0"
 */
export const formatDistanceHcp = (meters?: number, hcp?: number | null) => {
  const d = formatDistance(meters);
  const h = (hcp ?? hcp === 0) ? `HCP ${Number(hcp).toFixed(1)}` : null;
  return [d, h].filter(Boolean).join(" • ");
};
