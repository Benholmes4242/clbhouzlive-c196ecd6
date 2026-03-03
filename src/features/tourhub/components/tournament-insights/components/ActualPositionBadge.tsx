/**
 * ActualPositionBadge - Accuracy-tinted position badge for completed state
 * Outer div is always width: 48px, flexShrink: 0 so avatars align perfectly.
 */

import React from 'react';

interface ActualPositionBadgeProps {
  position: number | null;
  isTied?: boolean;
  performanceStatus?: string;
}

const CONTAINER_STYLE: React.CSSProperties = {
  width: 48,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function getAccuracyTier(position: number | null) {
  if (position !== null && position <= 10) {
    return '#16A34A';
  }
  return 'hsl(var(--muted-foreground))';
}

const ActualPositionBadge: React.FC<ActualPositionBadgeProps> = ({
  position,
  isTied,
  performanceStatus,
}) => {
  if (performanceStatus === 'cut') {
    return (
      <div style={CONTAINER_STYLE}>
        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.5, color: 'hsl(var(--muted-foreground))' }}>
          MC
        </span>
      </div>
    );
  }
  if (performanceStatus === 'withdrawn') {
    return (
      <div style={CONTAINER_STYLE}>
        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.5, color: 'hsl(var(--muted-foreground))' }}>
          WD
        </span>
      </div>
    );
  }
  if (position === null) {
    return (
      <div style={CONTAINER_STYLE}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>—</span>
      </div>
    );
  }

  const color = getAccuracyTier(position);
  const prefix = isTied ? 'T' : '';

  return (
    <div style={CONTAINER_STYLE}>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>
        {prefix}{position}
      </span>
    </div>
  );
};

export default ActualPositionBadge;
