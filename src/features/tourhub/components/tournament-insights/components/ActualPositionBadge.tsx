/**
 * ActualPositionBadge - Accuracy-tinted position badge for completed state
 */

import React from 'react';

interface ActualPositionBadgeProps {
  position: number | null;
  isTied?: boolean;
  performanceStatus?: string;
}

function getAccuracyTier() {
  return { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' };
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
        style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}
      >
        MC
      </span>
    );
  }
  if (performanceStatus === 'withdrawn') {
    return (
      <span
        className="text-muted-foreground"
        style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}
      >
        WD
      </span>
    );
  }
  if (position === null) {
    return (
      <span className="text-muted-foreground" style={{ fontSize: 13, fontWeight: 600 }}>—</span>
    );
  }

  const tier = getAccuracyTier();
  const prefix = isTied ? 'T' : '';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 36,
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 700,
        color: tier.color,
        background: tier.bg,
      }}
    >
      {prefix}{position}
    </span>
  );
};

export default ActualPositionBadge;
