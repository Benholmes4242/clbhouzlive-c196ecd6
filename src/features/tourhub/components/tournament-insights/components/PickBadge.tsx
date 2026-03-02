/**
 * PickBadge - Small "#N" rank indicator pill
 */

import React from 'react';

interface PickBadgeProps {
  pickNumber: number;
}

const PickBadge: React.FC<PickBadgeProps> = ({ pickNumber }) => (
  <span
    className="bg-muted text-muted-foreground inline-flex items-center"
    style={{
      padding: '3px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
    }}
  >
    <span style={{ fontSize: 9, opacity: 0.6 }}>#</span>
    {pickNumber}
  </span>
);

export default PickBadge;
