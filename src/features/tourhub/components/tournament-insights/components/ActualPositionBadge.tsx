/**
 * ActualPositionBadge - Accuracy-tinted position badge for completed state
 */

import React from 'react';

interface ActualPositionBadgeProps {
  position: number | null;
  isTied?: boolean;
  performanceStatus?: string;
}

function getAccuracyTier(position: number | null) {
  if (position !== null && position <= 10) {
    return { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' };
  }
  return { color: 'hsl(var(--muted-foreground))', bg: 'transparent' };
}

const ActualPositionBadge: React.FC<ActualPositionBadgeProps> = ({
  position,
  isTied,
  performanceStatus,
}) => {
  if (performanceStatus === 'cut') {
    return (
      <span
        className="text-muted-foreground"
        style={{ fontSize: 13, fontWeight: 600, opacity: 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44 }}
      >
        MC
      </span>
    );
  }
  if (performanceStatus === 'withdrawn') {
    return (
      <span
        className="text-muted-foreground"
        style={{ fontSize: 13, fontWeight: 600, opacity: 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44 }}
      >
        WD
      </span>
    );
  }
  if (position === null) {
    return (
      <span className="text-muted-foreground" style={{ fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44 }}>—</span>
    );
  }

  const tier = getAccuracyTier(position);
  const prefix = isTied ? 'T' : '';

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        fontSize: 15,
        fontWeight: 700,
        color: tier.color,
      }}
    >
      {prefix}{position}
    </span>
  );
};

export default ActualPositionBadge;
