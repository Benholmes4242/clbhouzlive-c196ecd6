/**
 * Unified Course Card Data Model
 * 
 * This is the SINGLE SOURCE OF TRUTH for course card data shape.
 * All course cards in the app must use this type.
 * 
 * Explore is the reference implementation. All cards map to CourseCardModel
 * using toCourseCardModel() mapper.
 */
export interface CourseCardModel {
  id: string;
  name: string;
  locationText: string; // e.g. "California, USA"
  imageUrl?: string | null;

  // Community rating (shown with clubhouse logo)
  communityRating?: number | null;
  ratingCount?: number;

  // Official rankings
  ranks?: {
    global?: number | null;
    regional?: number | null;
    usa?: number | null;
    listLabel?: string; // e.g. "Global Top 100", "USA Top 100"
  };

  // Contextual information
  context?: {
    playedByCount?: number;
    friendsPlayedCount?: number;
    isPlayedByViewer?: boolean;
    lastPlayedAt?: string | null;
    userRating?: number | null;
  };

  // For mapper reference
  country?: string;

  // Display position within the currently sorted/filtered list (opt-in).
  // When provided, takes precedence over ranks.global for the ghost rank number.
  displayRank?: number;
}
