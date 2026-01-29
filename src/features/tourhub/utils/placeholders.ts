/**
 * TourHub Placeholder Image Utilities
 * Provides consistent fallback images for players and courses
 */

const COURSE_IMAGES = [
  '/placeholders/courses/course-aerial-1.jpg',
  '/placeholders/courses/course-aerial-2.jpg',
  '/placeholders/courses/course-aerial-3.jpg',
  '/placeholders/courses/course-aerial-4.jpg',
];

const PLAYER_SILHOUETTES = [
  '/placeholders/players/golfer-silhouette-1.jpg',
  '/placeholders/players/golfer-silhouette-2.jpg',
  '/placeholders/players/golfer-silhouette-3.jpg',
  '/placeholders/players/golfer-gradient-dark.jpg',
];

/**
 * Get a course image, falling back to placeholder if not available
 */
export const getCourseImage = (tournament?: {
  heroImage?: string | null;
  courseImage?: string | null;
  venueImage?: string | null;
  id?: string;
  sr_id?: string;
}): string => {
  if (tournament?.heroImage) return tournament.heroImage;
  if (tournament?.courseImage) return tournament.courseImage;
  if (tournament?.venueImage) return tournament.venueImage;
  
  // Rotate through course images based on tournament ID
  const id = tournament?.id || tournament?.sr_id || '';
  const index = id ? id.charCodeAt(0) % COURSE_IMAGES.length : 0;
  return COURSE_IMAGES[index];
};

/**
 * Get a player image, falling back to silhouette if not available
 */
export const getPlayerImage = (player?: {
  photoUrl?: string | null;
  headshotUrl?: string | null;
  photo_url?: string | null;
  headshot_url?: string | null;
  id?: string;
  sr_id?: string;
}): string => {
  if (player?.photoUrl) return player.photoUrl;
  if (player?.headshotUrl) return player.headshotUrl;
  if (player?.photo_url) return player.photo_url;
  if (player?.headshot_url) return player.headshot_url;
  
  // Generate consistent placeholder based on player ID
  const id = player?.id || player?.sr_id || '';
  if (!id) return PLAYER_SILHOUETTES[0];
  
  // Use last 2 characters of ID for index
  const lastChars = id.slice(-2);
  const index = parseInt(lastChars, 16) % PLAYER_SILHOUETTES.length;
  return PLAYER_SILHOUETTES[isNaN(index) ? 0 : index];
};

/**
 * Get the default course placeholder
 */
export const getDefaultCourseImage = (): string => COURSE_IMAGES[0];

/**
 * Get the default player placeholder
 */
export const getDefaultPlayerImage = (): string => PLAYER_SILHOUETTES[0];

/**
 * Format score relative to par
 */
export const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '--';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
};

/**
 * Format purse amount (e.g., "$25M")
 */
export const formatPurse = (purse: number | null | undefined): string => {
  if (!purse) return '--';
  if (purse >= 1000000) {
    return `$${(purse / 1000000).toFixed(purse % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (purse >= 1000) {
    return `$${(purse / 1000).toFixed(0)}K`;
  }
  return `$${purse.toLocaleString()}`;
};

/**
 * Format yardage with comma separator
 */
export const formatYardage = (yardage: number | null | undefined): string => {
  if (!yardage) return '--';
  return `${yardage.toLocaleString()} yds`;
};

/**
 * Get score color class based on value
 */
export const getScoreColorClass = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'text-white/70';
  if (score < 0) return 'th-score-birdie';
  if (score > 0) return 'th-score-bogey';
  return 'th-score-par';
};

/**
 * Get rank badge class based on position
 */
export const getRankBadgeClass = (rank: number): string => {
  if (rank === 1) return 'th-rank-gold';
  if (rank === 2) return 'th-rank-silver';
  if (rank === 3) return 'th-rank-bronze';
  return 'bg-white/10 backdrop-blur-sm border border-white/20';
};
