/**
 * PredictionLeaderboard - Borderless row layout for both Live and Results states
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PredictionScorecardRow } from './PredictionScorecardRow';
import LiveStatusBar from './components/LiveStatusBar';
import type { TrackedPrediction } from './types';

interface PredictionLeaderboardProps {
  allPicks: TrackedPrediction[];
  isCompleted?: boolean;
  bestCallPlayerId?: string;
}

export const PredictionLeaderboard: React.FC<PredictionLeaderboardProps> = ({
  allPicks,
  isCompleted,
  bestCallPlayerId,
}) => {
  if (allPicks.length === 0) return null;

  // Sort by actual position (best first) for both live and completed
  const sorted = [...allPicks].slice(0, 5).sort((a, b) => {
    const aPos = a.actualPosition ?? 999;
    const bPos = b.actualPosition ?? 999;
    return aPos - bPos;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: isCompleted ? 0.9 : 0.1 }}
      style={{ marginBottom: 32 }}
    >
      {/* Header */}
      <motion.div
        initial={isCompleted ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: isCompleted ? 0.9 : 0 }}
        className="px-1"
        style={{ marginBottom: 16 }}
      >
        {isCompleted ? (
          <div>
            <span
              className="text-foreground"
              style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}
            >
              Our Picks
            </span>
            <div style={{ height: 1, background: 'hsl(var(--border) / 0.15)', marginTop: 8 }} />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span
              className="text-muted-foreground uppercase"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}
            >
              OUR PICKS · LIVE POSITIONS
            </span>
            <span
              className="text-muted-foreground uppercase"
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em' }}
            >
              POS / OFF LEAD
            </span>
          </div>
        )}
      </motion.div>

      {/* Live status bar */}
      {!isCompleted && <LiveStatusBar allPicks={allPicks} />}

      {/* Player rows — always show all */}
      <div>
        {sorted.map((prediction, i) => (
          <motion.div
            key={prediction.playerId}
            initial={isCompleted ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={isCompleted ? {
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
              delay: 1.0 + i * 0.06,
            } : undefined}
          >
            <PredictionScorecardRow
              prediction={prediction}
              index={i}
              isCompleted={isCompleted}
              isLast={i === sorted.length - 1}
              isBestCall={isCompleted && prediction.playerId === bestCallPlayerId}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
