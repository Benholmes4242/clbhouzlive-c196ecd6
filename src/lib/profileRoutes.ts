/**
 * Profile routing utilities
 * 
 * Centralized logic for resolving profile URLs based on user state.
 * Note: creator_only flag is deprecated - all users now use standard profile routes.
 */

export interface ProfileRouteUser {
  id: string;
  username?: string | null;
  creator_only?: boolean | null; // Deprecated - kept for backwards compatibility
}

/**
 * Get the public-facing profile path for a user.
 * 
 * @param user - User object with id and optional username
 * @returns The profile path (e.g., '/profile/username' or '/profile/userId')
 */
export function getPublicProfilePath(user: ProfileRouteUser): string {
  // Use username if available, otherwise fall back to id
  const key = user.username ?? user.id;
  return `/profile/${key}`;
}

/**
 * Get the profile path using just an ID (for cases where full profile isn't loaded)
 * 
 * @param userId - The user's ID
 * @param _creatorOnly - Deprecated parameter, kept for backwards compatibility
 * @param username - Optional username for prettier URLs
 * @returns The appropriate profile path
 */
export function getProfilePathById(
  userId: string,
  _creatorOnly?: boolean | null,
  username?: string | null
): string {
  return `/profile/${username ?? userId}`;
}
