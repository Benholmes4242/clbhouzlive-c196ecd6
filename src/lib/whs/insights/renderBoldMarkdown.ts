import React from 'react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

/**
 * Render **bold** markdown inline as bold spans.
 * Uses `currentColor` so the bold text inherits the parent's colour —
 * works on both light and dark surfaces without surface-specific styling.
 */
export const renderBoldMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return React.createElement(
        'strong',
        {
          key: i,
          style: {
            color: 'currentColor',
            fontWeight: 800,
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums lining-nums',
          },
        },
        p.slice(2, -2),
      );
    }
    return React.createElement(React.Fragment, { key: i }, p);
  });
};
