/**
 * Profile routing utilities
 * 
 * Centralized logic for resolving profile URLs based on user state (creator_only, etc.)
 * This ensures consistent routing across the entire app.
 */

export interface ProfileRouteUser {
  id: string;
  username?: string | null;
  creator_only?: boolean | null;
}

/**
 * Get the public-facing profile path for a user.
 * 
 * If creator_only is true, returns the creator page path.
 * Otherwise returns the standard profile path.
 * 
 * @param user - User object with id, optional username, and optional creator_only flag
 * @returns The appropriate profile path (e.g., '/profile/username' or '/creator/userId')
 */
export function getPublicProfilePath(user: ProfileRouteUser): string {
  // Use username if available, otherwise fall back to id
  const key = user.username ?? user.id;

  if (user.creator_only) {
    // Creator-only users always link to their creator page
    return `/creator/${user.id}`;
  }

  return `/profile/${key}`;
}

/**
 * Get the profile path using just an ID (for cases where full profile isn't loaded)
 * 
 * @param userId - The user's ID
 * @param creatorOnly - Whether the user has creator_only mode enabled
 * @param username - Optional username for prettier URLs
 * @returns The appropriate profile path
 */
export function getProfilePathById(
  userId: string,
  creatorOnly?: boolean | null,
  username?: string | null
): string {
  if (creatorOnly) {
    return `/creator/${userId}`;
  }

  return `/profile/${username ?? userId}`;
}
