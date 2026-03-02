/**
 * LiveStatusBar - Round in progress indicator with leader info
 */

import React from 'react';
import type { TrackedPrediction } from '../types';

interface LiveStatusBarProps {
  allPicks: TrackedPrediction[];
}

const LiveStatusBar: React.FC<LiveStatusBarProps> = ({ allPicks }) => {
  // Find current round from picks
  const currentRound = allPicks.find(p => p.currentRound)?.currentRound ?? null;
  // Find leader among our picks
  const leader = allPicks.find(p => p.actualPosition === 1);
  const leaderName = leader?.playerName;
  const leaderScore = leader?.score;

  const formatScore = (s: number | null) => {
    if (s === null || s === 0) return 'E';
    return s > 0 ? `+${s}` : `${s}`;
  };

  return (
    <div
      className="flex items-center gap-2.5 bg-background border border-border"
      style={{
        padding: '12px 16px',
        borderRadius: 16,
      }}
    >
      {/* Pulsing red dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: 'hsl(var(--destructive))',
          boxShadow: '0 0 0 3px hsl(var(--destructive) / 0.2)',
          animation: 'pulse 2s infinite',
          flexShrink: 0,
        }}
      />

      {/* Round info */}
      <span className="text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
        {currentRound ? `Round ${currentRound} in progress` : 'Live'}
      </span>

      {/* Leader info */}
      {leaderName && (
        <span
          className="ml-auto"
          style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}
        >
          {leaderName} leads at {formatScore(leaderScore ?? null)}
        </span>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default LiveStatusBar;
