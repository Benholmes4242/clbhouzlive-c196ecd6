/**
 * Course Reviews Mock Data Configuration
 * 
 * Controls visibility of seed/mock reviews in Course Details pages.
 * 
 * Set to true:  Show all reviews from the database (current seed/mock data)
 * Set to false: Hide all reviews, treat as empty state (preparing for real reviews only)
 * 
 * Usage:
 * 1. To test with mock reviews during development: export const SHOW_MOCK_REVIEWS = true;
 * 2. To prepare for production with real reviews only: export const SHOW_MOCK_REVIEWS = false;
 * 
 * This flag affects:
 * - Community Score card (rating counts and averages)
 * - Reviews tab (individual review cards)
 * - All review-related UI across Course Details pages
 * 
 * Similar pattern to: isMockNearby in src/features/nearby/config.ts
 */
export const SHOW_MOCK_REVIEWS = true;

