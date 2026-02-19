/**
 * PredictionLeaderboard - Unified OWGR-style table
 * 4 picks, all identical styling. OFF LEAD column.
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

  // All 4 picks in one flat list — no dark horse separation
  const rows = allPicks.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="overflow-hidden"
    >
      {/* Column header row — no background */}
      <div
        className="flex items-center px-4"
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex-1 min-w-0">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'rgba(0,0,0,0.35)' }}>
            PLAYER
          </span>
        </div>
        <div className="w-[52px] flex-shrink-0 text-center">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'rgba(0,0,0,0.35)' }}>
            ACTUAL
          </span>
        </div>
        <div className="w-[75px] flex-shrink-0 text-center">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'rgba(0,0,0,0.35)', whiteSpace: 'nowrap' }}>
            OFF LEAD
          </span>
        </div>
      </div>

      {/* All 4 rows — identical styling */}
      {rows.map((prediction, i) => (
        <div key={prediction.playerId}>
          <PredictionScorecardRow
            prediction={prediction}
            index={i}
            isCompleted={isCompleted}
          />
          {i < rows.length - 1 && (
            <div className="border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }} />
          )}
        </div>
      ))}
    </motion.div>
  );
};