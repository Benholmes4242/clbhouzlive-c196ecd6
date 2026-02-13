/**
 * DarkHorseTracker - Dark horse predictions with amber-tinted styling
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
        {darkHorses.map((dh, i) => (
          <React.Fragment key={dh.playerId}>
            <PredictionScorecardRow prediction={dh} index={i} />
            {i < darkHorses.length - 1 && (
              <div className="mx-4 border-b" style={{ borderColor: 'rgba(180, 83, 9, 0.1)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
};
