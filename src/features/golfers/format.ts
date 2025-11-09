/**
 * Format distance for display (no space before unit)
 * Shows meters if < 950m, otherwise km
 */
export const formatDistance = (m?: number) => {
  if (m == null) return "";
  if (m < 950) return `${Math.round(m)}m`;
  const km = m / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)}km`;
};

/**
 * Format distance and handicap on one line
 * Returns: "300m • HCP 9.0" or "1.4km • HCP 2.0"
 */
export const formatDistanceHcp = (meters?: number, hcp?: number | null) => {
  const d = formatDistance(meters);
  const h = (hcp ?? hcp === 0) ? `HCP ${Number(hcp).toFixed(1)}` : null;
  return [d, h].filter(Boolean).join(" • ");
};
