/**
 * LivePositionDisplay - Position + off-lead display for live state
 */

import React from 'react';

interface LivePositionDisplayProps {
  position: number | null;
  isTied?: boolean;
  offLead: number | null;
  performanceStatus?: string;
  score?: number | null;
}

function formatScore(score: number | null): string {
  if (score === null || score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

const LivePositionDisplay: React.FC<LivePositionDisplayProps> = ({
  position,
  isTied,
  offLead,
  performanceStatus,
  score,
}) => {
  if (performanceStatus === 'cut' || performanceStatus === 'withdrawn') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground" style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}>
          {performanceStatus === 'cut' ? 'MC' : 'WD'}
        </span>
      </div>
    );
  }

  if (position === null) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground" style={{ fontSize: 17, fontWeight: 700 }}>—</span>
      </div>
    );
  }

  const isLeading = offLead === 0 || position === 1;
  const prefix = isTied ? 'T' : '';

  return (
    <div className="flex items-center gap-3">
      {/* Position */}
      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: isLeading ? '#16A34A' : 'hsl(var(--foreground))',
          minWidth: 36,
          textAlign: 'center',
        }}
      >
        {prefix}{position}
      </span>
      {/* Off Lead */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          minWidth: 32,
          textAlign: 'right',
          color: isLeading
            ? '#16A34A'
            : (offLead !== null && offLead > 10)
              ? 'hsl(var(--destructive))'
              : 'hsl(var(--muted-foreground))',
        }}
      >
        {isLeading ? 'LEAD' : offLead !== null ? `-${offLead}` : '—'}
      </span>
    </div>
  );
};

export default LivePositionDisplay;
