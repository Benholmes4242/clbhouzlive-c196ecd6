import React from 'react';
import { highlightSegments } from '../utils/highlight';

interface HighlightedTextProps {
  text: string;
  query?: string;
  announceCount?: boolean;
  truncate?: number;
  className?: string;
}

export const HighlightedText = React.memo(HighlightedTextImpl);

function HighlightedTextImpl({
  text,
  query,
  announceCount = false,
  truncate,
  className = '',
}: HighlightedTextProps) {
  if (!query?.trim()) {
    const displayText = truncate && text.length > truncate 
      ? text.slice(0, truncate) + '...' 
      : text;
    return <span className={className}>{displayText}</span>;
  }

  const displayText = truncate && text.length > truncate 
    ? text.slice(0, truncate) + '...' 
    : text;

  const segments = highlightSegments(displayText, query);
  const matchCount = segments.filter(s => s.match).length;

  return (
    <span className={className}>
      {announceCount && matchCount > 0 && (
        <span className="sr-only" aria-live="polite">
          {matchCount} {matchCount === 1 ? 'match' : 'matches'}
        </span>
      )}
      {segments.map((seg, i) => 
        seg.match ? (
          <mark key={i} className="hl-match" aria-hidden="true">
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </span>
  );
}
