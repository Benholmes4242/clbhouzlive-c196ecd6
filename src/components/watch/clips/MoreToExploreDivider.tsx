import { memo } from 'react';

/**
 * Visual break between the Pro Shop editorial sections (above) and the
 * existing 2-col masonry feed (below). Slightly heavier top padding +
 * hairline border-top signals the section change.
 */
function MoreToExploreDividerInner() {
  return (
    <div
      style={{
        padding: '32px 16px 12px',
        borderTop: '1px solid rgba(15,23,42,0.06)',
        marginTop: 16,
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#0F172A',
          margin: 0,
        }}
      >
        More to explore
      </h2>
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'rgba(15,23,42,0.55)',
          margin: '4px 0 0',
          lineHeight: 1.35,
        }}
      >
        The full clips feed
      </p>
    </div>
  );
}

export const MoreToExploreDivider = memo(MoreToExploreDividerInner);
export default MoreToExploreDivider;
