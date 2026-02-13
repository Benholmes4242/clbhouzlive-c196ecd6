/**
 * DarkHorseTracker - Dark horse predictions with amber-tinted styling
 * Same OWGR-style column layout as the main PredictionScorecard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PredictionScorecardRow } from './PredictionScorecardRow';
import type { TrackedPrediction } from './types';

interface DarkHorseTrackerProps {
  darkHorses: TrackedPrediction[];
}

export const DarkHorseTracker: React.FC<DarkHorseTrackerProps> = ({
  darkHorses,
}) => {
  if (darkHorses.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    >
      {/* Section header */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">⚡</span>
        <span className="text-xs font-semibold" style={{ color: '#b45309' }}>
          Dark Horse Watch
        </span>
      </div>

      {/* Card with amber tint */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: '#FFFBEB',
          borderColor: 'rgba(180, 83, 9, 0.15)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Column header row */}
        <div
          className="flex items-center px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(180, 83, 9, 0.1)', backgroundColor: 'rgba(180, 83, 9, 0.03)' }}
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

        {darkHorses.map((dh, i) => (
          <React.Fragment key={dh.playerId}>
            <PredictionScorecardRow prediction={dh} index={i} />
            {i < darkHorses.length - 1 && (
              <div className="border-b" style={{ borderColor: 'rgba(180, 83, 9, 0.08)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
};
