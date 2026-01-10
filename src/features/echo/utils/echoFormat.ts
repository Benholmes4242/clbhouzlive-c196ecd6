/**
 * Echo Text Formatting Utilities
 * Sanitizes AI responses for clean display
 */

/**
 * Remove "As of YYYY-MM-DD" lines and other noise from Echo responses
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
 * Simple markdown-safe rendering config
 * Only allows: paragraphs, bullets, bold, italics
 */
export const ECHO_MARKDOWN_CONFIG = {
  allowedElements: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'br'],
  disallowedElements: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 'code', 'pre', 'blockquote'],
};
