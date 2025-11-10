/**
 * Search Result Highlighting Utility
 * Highlights matched query terms in text
 */

import React from 'react';

/**
 * Highlight search query matches in text
 * Returns an array of React elements with <mark> tags for matches
 */
export function highlight(text: string, query: string | undefined): React.ReactNode {
  if (!query?.trim()) return text;
  
  // Escape special regex characters
  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Split query into words and create regex
  const words = escapedQuery.split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;
  
  const regex = new RegExp(`(${words.join('|')})`, 'ig');
  
  // Split text by matches
  const parts = text.split(regex);
  
  // Map parts to React elements
  return parts.map((part, i) => {
    const isMatch = regex.test(part);
    // Reset regex lastIndex for next test
    regex.lastIndex = 0;
    
    if (isMatch) {
      return React.createElement('mark', { key: i, 'aria-hidden': 'true' }, part);
    }
    return React.createElement('span', { key: i }, part);
  });
}
