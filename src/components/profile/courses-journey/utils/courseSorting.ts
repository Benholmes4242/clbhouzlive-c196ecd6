// Utility functions for course sorting

// Helper function to get the best ranking for sorting
export const getCourseRanking = (course: any): number => {
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999;
};

// Regional sorting function - sorts by regional rank only (ascending order: #1, #2, #3...)
export const getRegionalSortedCourses = <T extends { golf_courses?: { regional_rank?: number | null } }>(
  userCourses: T[]
): T[] => {
  return [...userCourses].sort((a, b) => {
    const aRegionalRank = a.golf_courses?.regional_rank || 9999;
    const bRegionalRank = b.golf_courses?.regional_rank || 9999;
    
    // Sort by regional rank ascending (lowest number first)
    return aRegionalRank - bRegionalRank;
  });
};

// Custom sorting function for user courses with different sort options
export const getSortedUserCourses = <T extends {
  rating?: number | null;
  played_date?: string | null;
  created_at?: string | null;
  golf_courses?: {
    regional_rank?: number | null;
    global_rank?: number | null;
  };
}>(
  userCourses: T[],
  sortBy: string
): T[] => {
  const sortedCourses = [...userCourses].sort((a, b) => {
    switch (sortBy) {
      case 'rank-desc':
      case 'rating-high-low':
        // Sort by rating descending (10, 9, 8, ...)
        const aRating = a.rating;
        const bRating = b.rating;
        
        if (aRating !== null && aRating !== undefined && bRating !== null && bRating !== undefined) {
          return bRating - aRating;
        }
        if (aRating !== null && aRating !== undefined) return -1;
        if (bRating !== null && bRating !== undefined) return 1;
        
        // If neither has a rating, sort by official ranking
        const aRank = getCourseRanking(a.golf_courses);
        const bRank = getCourseRanking(b.golf_courses);
        return aRank - bRank;
        
      case 'rank-asc':
      case 'rating-low-high':
        // Sort by rating ascending (0.5, 1, 2, ...)
        const aRatingLow = a.rating;
        const bRatingLow = b.rating;
        
        if (aRatingLow !== null && aRatingLow !== undefined && bRatingLow !== null && bRatingLow !== undefined) {
          return aRatingLow - bRatingLow;
        }
        if (aRatingLow !== null && aRatingLow !== undefined) return -1;
        if (bRatingLow !== null && bRatingLow !== undefined) return 1;
        
        // If neither has a rating, sort by official ranking
        const aRankLow = getCourseRanking(a.golf_courses);
        const bRankLow = getCourseRanking(b.golf_courses);
        return aRankLow - bRankLow;
        
      case 'recent':
      case 'recently-played':
      default:
        // Sort by most recent date (played_date or created_at for ratings)
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
    }
  });
  
  return sortedCourses;
};
