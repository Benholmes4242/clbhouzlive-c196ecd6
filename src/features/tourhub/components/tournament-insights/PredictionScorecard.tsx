/**
 * PredictionScorecard - OWGR-style leaderboard table for predicted players
 * Columns: # | PLAYER | PREDICTED | ACTUAL | +/-
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PredictionScorecardRow } from './PredictionScorecardRow';
import type { TrackedPrediction } from './types';

interface PredictionScorecardProps {
  predictions: TrackedPrediction[];
}

export const PredictionScorecard: React.FC<PredictionScorecardProps> = ({
  predictions,
}) => {
  const visible = predictions.slice(0, 5);
  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="rounded-2xl bg-card border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      {/* Column header row — OWGR style */}
      <div
        className="flex items-center px-4 py-2.5 border-b"
        style={{ borderColor: 'rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(0, 0, 0, 0.015)' }}
      >
        <div className="w-8 flex-shrink-0 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">#</span>
        </div>
        <div className="flex-1 min-w-0 pl-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Player</span>
        </div>
        <div className="w-[60px] flex-shrink-0 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pred</span>
        </div>
        <div className="w-[52px] flex-shrink-0 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Actual</span>
        </div>
        <div className="w-[48px] flex-shrink-0 text-right">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">+/-</span>
        </div>
      </div>

      {/* Player rows */}
      {visible.map((prediction, i) => (
        <React.Fragment key={prediction.playerId}>
          <PredictionScorecardRow prediction={prediction} index={i} />
          {i < visible.length - 1 && (
            <div className="border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }} />
          )}
        </React.Fragment>
      ))}
    </motion.div>
  );
};
