import React from 'react';

/**
 * Highlights matched query substring in text
 * Only highlights if query length >= 2
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2 || !text) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <span 
        className="bg-amber-500/[0.18] px-1 rounded-md"
        style={{ borderRadius: '6px' }}
      >
        {match}
      </span>
      {after}
    </>
  );
}
