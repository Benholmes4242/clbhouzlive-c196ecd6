/**
 * Course Reviews Mock Data Configuration
 * 
 * Controls visibility of seed/mock reviews in Course Details pages.
 * 
 * Set to true:  Show ALL reviews (real + mock)
 * Set to false: Show ONLY real user reviews (is_mock = false)
 * 
 * HOW IT WORKS:
 * - All reviews have an `is_mock` field in the database
 * - Seed/test reviews have `is_mock = true`
 * - Real user-submitted reviews have `is_mock = false`
 * - When SHOW_MOCK_REVIEWS = false, queries filter to only show is_mock = false
 * - When SHOW_MOCK_REVIEWS = true, all reviews are shown regardless of is_mock value
 * 
 * This flag affects:
 * - Community Score card (rating counts and averages)
 * - Reviews tab (individual review cards)
 * - All review-related UI across Course Details pages
 * 
 * Similar pattern to: isMockNearby in src/features/nearby/config.ts
 */
export const SHOW_MOCK_REVIEWS = false;

/**
 * Mock Top 100 Reviews Configuration
 * 
 * Enables mock review data specifically for Cypress Point Golf Club
 * to test the rating distribution bars (all 5 tiers visible).
 * 
 * Set to true:  Show mock distribution data for Cypress Point
 * Set to false: Use real data only
 */
export const ENABLE_MOCK_TOP100_REVIEWS = false;

// Cypress Point Golf Club identifier (kept for reference)
export const CYPRESS_POINT_COURSE_ID = 'e69aee30-744d-4089-a127-285a62216e2c';

/**
 * Mock review distribution data for testing rating bars
 * Equal spread ensures every tier bar is visible for visual testing
 * NOTE: Only used when ENABLE_MOCK_TOP100_REVIEWS = true
 */
export const MOCK_CYPRESS_POINT_REVIEWS = {
  totalReviews: 100,
  averageRating: 8.2,
  distribution: {
    exceptional: 20,
    excellent: 20,
    good: 20,
    fair: 20,
    poor: 20,
  },
  categoryAverages: {
    design: 8.5,
    condition: 7.8,
    clubhouse: 8.0,
    facilities: 7.5,
  },
};