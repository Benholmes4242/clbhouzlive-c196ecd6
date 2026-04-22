import { memo } from 'react';

/**
 * Visual break between the Pro Shop editorial sections (above) and the
 * full vertical videos feed (below). Mirrors the Clips MoreToExploreDivider
 * but with copy tuned for the lean-back long-form surface.
 */
function MoreToWatchDividerInner() {
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
        More to watch
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
        The full videos feed
      </p>
    </div>
  );
}

export const MoreToWatchDivider = memo(MoreToWatchDividerInner);
export default MoreToWatchDivider;
