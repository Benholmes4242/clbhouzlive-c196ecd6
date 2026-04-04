import { supabase } from '@/integrations/supabase/client';
import type { 
  RawPostData, 
  HydrationContext, 
  UserProfile, 
  BusinessAccount, 
  GolfCourseData 
} from '../types';
import { collectCourseIds } from '@/utils/resolveGolfCourse';

/**
 * Batch fetch user profiles by IDs
 * Follows soft-failure pattern: logs errors but returns empty map
 */
export async function batchFetchUserProfiles(
  userIds: string[]
): Promise<Map<string, UserProfile>> {
  if (userIds.length === 0) return new Map();
  
  const uniqueIds = [...new Set(userIds)];
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index, show_handicap')
    .in('id', uniqueIds);
  
  if (error) {
    console.warn('[postHydration] Error fetching user profiles (continuing with placeholders):', error);
    return new Map();
  }
  
  return new Map((data || []).map(p => [p.id, p]));
}

/**
 * Batch fetch business accounts by IDs
 * Follows soft-failure pattern: logs errors but returns empty map
 */
export async function batchFetchBusinessAccounts(
  businessIds: string[]
): Promise<Map<string, BusinessAccount>> {
  if (businessIds.length === 0) return new Map();
  
  const uniqueIds = [...new Set(businessIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('business_accounts')
    .select('id, name, logo_url, is_verified, category, location')
    .in('id', uniqueIds);
  
  if (error) {
    console.error('[postHydration] Error fetching business accounts:', error);
    return new Map();
  }
  
  return new Map((data || []).map(b => [b.id, b]));
}

/**
 * Batch fetch golf courses by IDs
 * Follows soft-failure pattern: logs errors but returns empty map
 */
export async function batchFetchGolfCourses(
  courseIds: string[]
): Promise<Map<string, GolfCourseData>> {
  if (courseIds.length === 0) return new Map();
  
  const uniqueIds = [...new Set(courseIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('golf_courses')
    .select('id, name, country, sub_country, region')
    .in('id', uniqueIds);
  
  if (error) {
    console.error('[postHydration] Error fetching golf courses:', error);
    return new Map();
  }
  
  return new Map((data || []).map(c => [c.id, c]));
}

/**
 * Batch fetch ratings and review text for review posts
 */
export async function batchFetchRatings(
  reviewIds: string[]
): Promise<{ ratings: Map<string, number>; reviewTexts: Map<string, string> }> {
  if (reviewIds.length === 0) return { ratings: new Map(), reviewTexts: new Map() };
  
  const uniqueIds = [...new Set(reviewIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { ratings: new Map(), reviewTexts: new Map() };
  
  const { data, error } = await supabase
    .from('course_ratings')
    .select('id, rating, review')
    .in('id', uniqueIds);
  
  if (error) {
    console.error('[postHydration] Error fetching ratings:', error);
    return { ratings: new Map(), reviewTexts: new Map() };
  }
  
  const ratings = new Map((data || []).map(r => [r.id, r.rating]));
  const reviewTexts = new Map(
    (data || []).filter(r => r.review).map(r => [r.id, r.review as string])
  );
  return { ratings, reviewTexts };
}
}

/**
 * Build complete hydration context for a batch of posts
 * Runs all fetches in parallel for efficiency
 */
export async function buildHydrationContext(
  posts: RawPostData[]
): Promise<HydrationContext> {
  // Extract IDs for batch fetching
  const personalPosts = posts.filter(p => !p.actor_type || p.actor_type === 'personal');
  const businessPosts = posts.filter(p => p.actor_type === 'business');
  
  const userIds = [...new Set(personalPosts.map(p => p.user_id))];
  const businessIds = [...new Set(businessPosts.map(p => p.actor_id).filter(Boolean))] as string[];
  const courseIds = collectCourseIds(posts);
  const reviewIds = posts
    .filter(p => p.source_review_id)
    .map(p => p.source_review_id)
    .filter(Boolean) as string[];
  
  // Parallel fetch all hydration data
  const [userProfiles, businessAccounts, golfCourses, ratings] = await Promise.all([
    batchFetchUserProfiles(userIds),
    batchFetchBusinessAccounts(businessIds),
    batchFetchGolfCourses(courseIds),
    batchFetchRatings(reviewIds),
  ]);
  
  return { userProfiles, businessAccounts, golfCourses, ratings };
}

/**
 * Extract user IDs for personal posts
 */
export function extractUserIds(posts: RawPostData[]): string[] {
  return posts
    .filter(p => !p.actor_type || p.actor_type === 'personal')
    .map(p => p.user_id);
}

/**
 * Extract business IDs for business posts
 */
export function extractBusinessIds(posts: RawPostData[]): string[] {
  return posts
    .filter(p => p.actor_type === 'business')
    .map(p => p.actor_id)
    .filter(Boolean) as string[];
}
