export interface ExtractedGolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

/**
 * Extracts golf course information from post content
 * Looks for patterns like "📍 Played at [Course Name], [Country]"
 */
export const extractGolfCourseFromContent = (content: string | null): ExtractedGolfCourse | null => {
  if (!content) return null;
  
  // Pattern to match "📍 Played at [Course Name], [Country]"
  const golfCoursePattern = /📍\s*Played\s+at\s+([^,]+),\s*([^,\n]+)/i;
  const match = content.match(golfCoursePattern);
  
  if (match) {
    const courseName = match[1].trim();
    const country = match[2].trim();
    
    return {
      id: `extracted-${courseName.toLowerCase().replace(/\s+/g, '-')}`,
      name: courseName,
      country: country
    };
  }
  
  return null;
};

/**
 * Removes golf course tag from post content for display
 */
export const removeGolfCourseFromContent = (content: string | null): string => {
  if (!content) return '';
  
  // Remove the golf course pattern from content
  const golfCoursePattern = /\n*📍\s*Played\s+at\s+[^,]+,\s*[^,\n]+\n*/gi;
  return content.replace(golfCoursePattern, '').trim();
};