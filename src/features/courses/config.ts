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
export const SHOW_MOCK_REVIEWS = true;

