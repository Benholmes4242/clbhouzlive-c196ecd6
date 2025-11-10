/**
 * highlight - Safe search query highlighting utility
 * Returns ReactNode with <mark> tags around matched substrings
 * Case-insensitive, XSS-safe (no dangerouslySetInnerHTML)
 */

import React from 'react';

export function highlight(text: string | null | undefined, query: string | null | undefined): React.ReactNode {
  // Guard against null/undefined
  if (!text || !query) return text || '';

  const trimmedQuery = query.trim();
  if (!trimmedQuery) return text;

  // Split on multiple spaces to handle multi-word queries
  const queryParts = trimmedQuery.toLowerCase().split(/\s+/);
  
  // Build a regex that matches any of the query parts
  const escapedParts = queryParts.map(part => 
    part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escapedParts.join('|')})`, 'gi');

  // Split text by matches
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        // Check if this part matches any query term (case-insensitive)
        const isMatch = queryParts.some(q => part.toLowerCase() === q);
        
        return isMatch ? (
          <mark key={i}>{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </>
  );
}
