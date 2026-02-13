/**
 * PredictionScorecard - List of predicted players with live comparison
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
  if (predictions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="rounded-2xl bg-card border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      {predictions.map((prediction, i) => (
        <React.Fragment key={prediction.playerId}>
          <PredictionScorecardRow prediction={prediction} index={i} />
          {i < predictions.length - 1 && (
            <div className="mx-4 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }} />
          )}
        </React.Fragment>
      ))}
    </motion.div>
  );
};
