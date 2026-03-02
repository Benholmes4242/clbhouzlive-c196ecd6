/**
 * PredictionLeaderboard - Borderless row layout for both Live and Results states
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PredictionScorecardRow } from './PredictionScorecardRow';
import LiveStatusBar from './components/LiveStatusBar';
import type { TrackedPrediction } from './types';

interface PredictionLeaderboardProps {
  allPicks: TrackedPrediction[];
  isCompleted?: boolean;
}

export const PredictionLeaderboard: React.FC<PredictionLeaderboardProps> = ({
  allPicks,
  isCompleted,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (allPicks.length === 0) return null;

  // Sort by actual position (best first) for both live and completed
  const sorted = [...allPicks].slice(0, 5).sort((a, b) => {
    const aPos = a.actualPosition ?? 999;
    const bPos = b.actualPosition ?? 999;
    return aPos - bPos;
  });

  const visibleCards = isCompleted ? sorted.slice(0, 3) : sorted;
  const totalVisible = showAll ? sorted.length : visibleCards.length;
  const hasMore = isCompleted && sorted.length > 3 && !showAll;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      style={{ marginBottom: 32 }}
    >
      {/* Header */}
      <div className="flex items-center justify-center px-1" style={{ marginBottom: 12 }}>
        <span
          className="text-muted-foreground uppercase"
          style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em' }}
        >
          {isCompleted ? 'OUR PICKS · BEST FINISHERS FIRST' : 'OUR PICKS · LIVE POSITIONS'}
        </span>
      </div>

      {/* Live status bar */}
      {!isCompleted && <LiveStatusBar allPicks={allPicks} />}

      {/* Player rows */}
      <div>
        {visibleCards.map((prediction, i) => (
          <PredictionScorecardRow
            key={prediction.playerId}
            prediction={prediction}
            index={i}
            isCompleted={isCompleted}
            isLast={!showAll && i === visibleCards.length - 1 && !hasMore}
          />
        ))}

        {/* Show more rows with animation */}
        <AnimatePresence>
          {isCompleted && showAll && sorted.slice(3).map((prediction, i) => (
            <motion.div
              key={prediction.playerId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <PredictionScorecardRow
                prediction={prediction}
                index={3 + i}
                isCompleted={isCompleted}
                isLast={i === sorted.length - 4}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show all button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full bg-muted text-muted-foreground hover:bg-border transition-colors"
          style={{
            padding: 12,
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          Show all {sorted.length} picks
        </button>
      )}
    </motion.div>
  );
};