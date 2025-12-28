// Category suggestion engine for Create Moment
// Scores categories based on caption text, course context, and media types

import { MOMENT_CATEGORIES, isCoreCategory, type MomentCategoryDef } from '@/components/post/create-moment/categoryDefinitions';

export interface SuggestionParams {
  caption: string;
  hasCourse: boolean;
  mediaTypes: ('video' | 'photo')[];
}

interface ScoredCategory {
  id: string;
  score: number;
  isCore: boolean;
}

/**
 * Suggests up to 3 categories based on caption content, course selection, and media types
 * 
 * Scoring rules:
 * - +3 per keyword match (case-insensitive, whole word or phrase)
 * - +2 if category.courseBoost && hasCourse
 * - +1 if category.mediaBoost includes any of the mediaTypes
 * 
 * Returns category IDs sorted by score (tie-break: core categories first)
 */
export function suggestCategories(params: SuggestionParams): string[] {
  const { caption, hasCourse, mediaTypes } = params;
  const captionLower = caption.toLowerCase();
  
  // Skip if caption is too short
  if (captionLower.trim().length < 3) {
    return [];
  }

  const scoredCategories: ScoredCategory[] = [];

  for (const category of MOMENT_CATEGORIES) {
    // Skip 'other' - never suggest it
    if (category.id === 'other') continue;

    let score = 0;

    // Keyword matching: +3 per match
    if (category.keywords && category.keywords.length > 0) {
      for (const keyword of category.keywords) {
        // Use word boundary matching for single words, substring for phrases
        const isPhrase = keyword.includes(' ');
        if (isPhrase) {
          // Phrase matching - just check if it's in the caption
          if (captionLower.includes(keyword.toLowerCase())) {
            score += 3;
          }
        } else {
          // Word matching - use word boundaries
          const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
          if (regex.test(captionLower)) {
            score += 3;
          }
        }
      }
    }

    // Course boost: +2 if category benefits from course tagging
    if (category.courseBoost && hasCourse) {
      score += 2;
    }

    // Media boost: +1 if category benefits from the media type
    if (category.mediaBoost && category.mediaBoost.length > 0) {
      const hasMatchingMedia = mediaTypes.some(mt => category.mediaBoost!.includes(mt));
      if (hasMatchingMedia) {
        score += 1;
      }
    }

    if (score > 0) {
      scoredCategories.push({
        id: category.id,
        score,
        isCore: isCoreCategory(category.id),
      });
    }
  }

  // Sort by score descending, then by core status (core first), then alphabetically
  scoredCategories.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  // Return top 3
  return scoredCategories.slice(0, 3).map(c => c.id);
}

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
