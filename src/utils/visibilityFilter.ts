/**
 * Visibility filter utilities for posts.
 * Ensures private posts are only visible to their owner.
 * 
 * Visibility rules:
 * - 'anyone': visible to all users
 * - 'followers': visible to followers (currently treated as 'anyone' until follower graph is wired)
 * - 'private': visible only to the post owner (user_id)
 */

/**
 * Builds a Supabase .or() filter string for visibility enforcement.
 * 
 * @param currentUserId - The ID of the currently logged-in user (null if not logged in)
 * @returns Filter string for Supabase .or() method
 * 
 * Logic:
 * - Show posts where visibility = 'anyone' OR 'followers' (treated same for now)
 * - Show private posts only if current user is the owner (user_id match)
 */
export function buildVisibilityFilter(currentUserId: string | null): string {
  // If no user is logged in, only show public posts (anyone/followers)
  if (!currentUserId) {
    return `visibility.eq.anyone,visibility.eq.followers,visibility.is.null`;
  }
  
  // For logged-in users:
  // - Show 'anyone' and 'followers' posts (followers = anyone for now)
  // - Show 'private' posts only if user owns them
  // - Handle null visibility (legacy posts) as 'anyone'
  return `visibility.eq.anyone,visibility.eq.followers,visibility.is.null,and(visibility.eq.private,user_id.eq.${currentUserId})`;
}

/**
 * Combines visibility filter with existing OR conditions.
 * Use this when you already have .or() filters and need to AND visibility.
 * 
 * @param existingOrFilter - Existing OR filter string
 * @param currentUserId - The ID of the currently logged-in user
 * @returns Combined filter with visibility enforcement
 */
export function combineWithVisibilityFilter(existingOrFilter: string, currentUserId: string | null): string {
  const visibilityFilter = buildVisibilityFilter(currentUserId);
  // Wrap existing filter and AND with visibility
  return `and(${existingOrFilter}),${visibilityFilter}`;
}
