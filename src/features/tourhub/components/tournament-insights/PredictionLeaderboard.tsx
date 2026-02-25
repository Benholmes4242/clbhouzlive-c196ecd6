/**
 * PredictionLeaderboard - OWGR-style table with theme-aware headers
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PredictionScorecardRow } from './PredictionScorecardRow';
import type { TrackedPrediction } from './types';

interface PredictionLeaderboardProps {
  allPicks: TrackedPrediction[];
  isCompleted?: boolean;
}

export const PredictionLeaderboard: React.FC<PredictionLeaderboardProps> = ({
  allPicks,
  isCompleted,
}) => {
  if (allPicks.length === 0) return null;

  const rows = allPicks.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="overflow-hidden"
    >
      {/* Column header row */}
      <div
        className="flex items-center px-4"
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        <div className="flex-1 min-w-0">
          <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const }}>
            OUR TOP 5
          </span>
        </div>
        <div className="w-[52px] flex-shrink-0 text-center">
          <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>
            ACTUAL
          </span>
        </div>
        <div className="w-[75px] flex-shrink-0 text-center">
          <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
            OFF LEAD
          </span>
        </div>
      </div>

      {/* Rows */}
      {rows.map((prediction, i) => (
        <div key={prediction.playerId}>
          <PredictionScorecardRow
            prediction={prediction}
            index={i}
            isCompleted={isCompleted}
          />
          {i < rows.length - 1 && (
            <div className="border-b border-border/20" />
          )}
        </div>
      ))}
    </motion.div>
  );
};
