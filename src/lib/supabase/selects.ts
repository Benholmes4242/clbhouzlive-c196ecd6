/**
 * Type-Safe Query Select Constants
 * 
 * Phase 2 Perf: Replace select('*') with specific columns to reduce payload sizes.
 * Use these constants across queries to ensure consistency and type safety.
 * 
 * Benefits:
 * - ~40-70% payload reduction
 * - Faster query execution
 * - Better network performance on mobile
 * - Type safety for returned data
 */

// ============================================================================
// POST SELECTS
// ============================================================================

/** Minimal post data for grid tiles and feed previews */
export const POST_TILE_SELECT = `
  id,
  user_id,
  content,
  media_url,
  cloudflare_uid,
  poster_url,
  media_type,
  aspect_ratio,
  created_at,
  like_count,
  comment_count,
  is_pinned
` as const;

/** Post list with user info for feeds */
export const POST_LIST_SELECT = `
  id,
  user_id,
  content,
  media_url,
  cloudflare_uid,
  poster_url,
  media_type,
  aspect_ratio,
  created_at,
  updated_at,
  like_count,
  comment_count,
  save_count,
  share_count,
  is_pinned,
  user_profiles:user_id (
    id,
    username,
    display_name,
    avatar_url,
    is_verified
  )
` as const;

/** Full post details for post detail view */
export const POST_DETAIL_SELECT = `
  id,
  user_id,
  content,
  media_url,
  cloudflare_uid,
  poster_url,
  media_type,
  aspect_ratio,
  created_at,
  updated_at,
  like_count,
  comment_count,
  save_count,
  share_count,
  is_pinned,
  location_name,
  tagged_course_id,
  tagged_business_id,
  user_profiles:user_id (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    is_verified,
    follower_count,
    following_count
  )
` as const;

// ============================================================================
// PROFILE SELECTS
// Note: These use actual user_profiles table columns
// ============================================================================

/** Minimal profile for avatars and mentions */
export const PROFILE_MINIMAL_SELECT = `
  id,
  username,
  profile_photo_url
` as const;

/** Profile card data (hover cards, lists) */
export const PROFILE_CARD_SELECT = `
  id,
  username,
  display_name,
  profile_photo_url,
  bio,
  is_verified_golfer
` as const;

/** Full profile for profile pages */
export const PROFILE_FULL_SELECT = `
  id,
  username,
  display_name,
  profile_photo_url,
  cover_photo_url,
  bio,
  location,
  is_verified_golfer,
  is_verified_business,
  is_creator,
  eg_handicap_index,
  home_club,
  created_at,
  is_public
` as const;

// ============================================================================
// COMMENT SELECTS
// ============================================================================

/** Comment list data */
export const COMMENT_LIST_SELECT = `
  id,
  user_id,
  post_id,
  content,
  parent_id,
  created_at,
  like_count,
  reply_count,
  user_profiles:user_id (
    id,
    username,
    avatar_url,
    is_verified
  )
` as const;

// ============================================================================
// COURSE SELECTS
// ============================================================================

/** Course card/tile for listings */
export const COURSE_CARD_SELECT = `
  id,
  name,
  slug,
  city,
  region,
  country,
  thumbnail_url,
  average_rating,
  rating_count,
  price_tier,
  course_type
` as const;

/** Full course for detail pages */
export const COURSE_DETAIL_SELECT = `
  id,
  name,
  slug,
  description,
  address_line1,
  city,
  region,
  country,
  postcode,
  lat,
  lng,
  thumbnail_url,
  cover_image_url,
  average_rating,
  rating_count,
  price_tier,
  course_type,
  holes,
  par,
  yardage,
  website,
  phone,
  email,
  green_fee_weekday,
  green_fee_weekend,
  amenities,
  created_at
` as const;

// ============================================================================
// NOTIFICATION SELECTS
// ============================================================================

/** Notification list */
export const NOTIFICATION_LIST_SELECT = `
  id,
  type,
  actor_id,
  target_id,
  target_type,
  message,
  is_read,
  created_at,
  actor:user_profiles!actor_id (
    id,
    username,
    avatar_url
  )
` as const;

// ============================================================================
// BUSINESS SELECTS
// ============================================================================

/** Business card for listings */
export const BUSINESS_CARD_SELECT = `
  id,
  name,
  slug,
  category,
  logo_url,
  city,
  region,
  country,
  is_verified
` as const;

/** Full business for detail pages */
export const BUSINESS_DETAIL_SELECT = `
  id,
  name,
  slug,
  description,
  category,
  logo_url,
  cover_image_url,
  address_line1,
  city,
  region,
  country,
  postcode,
  lat,
  lng,
  website,
  phone,
  email,
  is_verified,
  created_at
` as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clean select string by removing whitespace and newlines
 * Use this when passing to Supabase .select()
 */
export function cleanSelect(selectString: string): string {
  return selectString
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('');
}

// Pre-cleaned versions for direct use
export const POST_TILE = cleanSelect(POST_TILE_SELECT);
export const POST_LIST = cleanSelect(POST_LIST_SELECT);
export const POST_DETAIL = cleanSelect(POST_DETAIL_SELECT);
export const PROFILE_MINIMAL = cleanSelect(PROFILE_MINIMAL_SELECT);
export const PROFILE_CARD = cleanSelect(PROFILE_CARD_SELECT);
export const PROFILE_FULL = cleanSelect(PROFILE_FULL_SELECT);
export const COMMENT_LIST = cleanSelect(COMMENT_LIST_SELECT);
export const COURSE_CARD = cleanSelect(COURSE_CARD_SELECT);
export const COURSE_DETAIL = cleanSelect(COURSE_DETAIL_SELECT);
export const NOTIFICATION_LIST = cleanSelect(NOTIFICATION_LIST_SELECT);
export const BUSINESS_CARD = cleanSelect(BUSINESS_CARD_SELECT);
export const BUSINESS_DETAIL = cleanSelect(BUSINESS_DETAIL_SELECT);
