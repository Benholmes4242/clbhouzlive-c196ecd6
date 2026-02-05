/**
 * Echo Text Formatting Utilities
 * Sanitizes AI responses for clean display
 */

/**
 * Sanitize Echo text for markdown rendering
 * - Remove "As of YYYY-MM-DD" lines
 * - Clean up awkward bold/italic patterns
 * - Normalize whitespace
 */
export function sanitizeEchoText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove "As of YYYY-MM-DD" or "_As of YYYY-MM-DD_" lines
  cleaned = cleaned.replace(/[_*]*As of \d{4}-\d{2}-\d{2}[_*]*/gi, '');
  
  // Remove "Updated: YYYY-MM-DD" patterns
  cleaned = cleaned.replace(/Updated:?\s*\d{4}-\d{2}-\d{2}/gi, '');
  
  // Remove "Current as of" patterns  
  cleaned = cleaned.replace(/Current as of[:\s]*\d{4}-\d{2}-\d{2}/gi, '');
  
  // Fix awkward single-word bold (e.g., **word** at start of sentence that looks weird)
  // Only fix cases where it's just one word wrapped weirdly
  cleaned = cleaned.replace(/\*\*([A-Za-z]{1,12})\*\*(?=\s*[—–-])/g, '$1');
  
  // Fix underline patterns that shouldn't be there (e.g., ___text___)
  cleaned = cleaned.replace(/_{3,}([^_]+)_{3,}/g, '$1');
  
  // Fix double-emphasis combos (e.g., **_text_** or _**text**_)
  cleaned = cleaned.replace(/\*\*_([^_*]+)_\*\*/g, '**$1**');
  cleaned = cleaned.replace(/_\*\*([^_*]+)\*\*_/g, '**$1**');
  
  // Clean up excessive whitespace/newlines left behind
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Generate smart follow-up suggestions based on the last response
 */
export function generateFollowUps(lastResponse: string): string[] {
  const suggestions: string[] = [];
  
  const lowerResponse = lastResponse.toLowerCase();
  
  // FIX 18: Detect numbered list of courses (e.g., "1. **Royal County Down**")
  const courseListPattern = /\d+\.\s+\*\*(.+?)\*\*/g;
  const courseMatches = [...lastResponse.matchAll(courseListPattern)];
  
  if (courseMatches.length >= 2) {
    // Response contains a numbered list of courses
    suggestions.push('Compare the top 3 in more detail');
    suggestions.push('Which one is best for a weekend trip?');
    return suggestions.slice(0, 3);
  }
  
  // Single course mention
  const singleCoursePattern = /(?:Golf Club|Golf Course|Golf Links|Country Club)/i;
  if (singleCoursePattern.test(lastResponse) && courseMatches.length === 0) {
    suggestions.push('Best strategy for this course?');
    suggestions.push("What's the best time to visit?");
    return suggestions.slice(0, 3);
  }
  
  // Distance-related
  if (lowerResponse.includes('yard') || lowerResponse.includes('metre') || lowerResponse.includes('meter')) {
    suggestions.push('Convert to metres');
  }
  
  // Player mentions
  if (lowerResponse.includes('rory') || lowerResponse.includes('bryson') || lowerResponse.includes('scottie')) {
    suggestions.push('What about other pros?');
  }
  
  // Rules
  if (lowerResponse.includes('rule') || lowerResponse.includes('penalty') || lowerResponse.includes('relief')) {
    suggestions.push('Explain in simpler terms');
  }
  
  // Course tips
  if (lowerResponse.includes('course') || lowerResponse.includes('hole') || lowerResponse.includes('green')) {
    suggestions.push('Best strategy for this course?');
  }
  
  // General follow-ups if we don't have specific ones
  if (suggestions.length < 2) {
    suggestions.push('Tell me more');
    suggestions.push('Make it shorter');
  }
  
  return suggestions.slice(0, 3);
}

/**
 * Markdown allowlist for react-markdown
 */
export const ECHO_ALLOWED_ELEMENTS = [
  'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'span'
];

export const ECHO_DISALLOWED_ELEMENTS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 'pre', 'blockquote', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
];
