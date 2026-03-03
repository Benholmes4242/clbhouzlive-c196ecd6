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
  bestCallPlayerId?: string;
}

export const PredictionLeaderboard: React.FC<PredictionLeaderboardProps> = ({
  allPicks,
  isCompleted,
  bestCallPlayerId,
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
  const hasMore = isCompleted && sorted.length > 3 && !showAll;

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
        className="flex items-center justify-between px-1"
        style={{ marginBottom: 16 }}
      >
        <span
          className="text-muted-foreground uppercase"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}
        >
          {isCompleted ? 'Our Picks' : 'OUR PICKS · LIVE POSITIONS'}
        </span>
        {!isCompleted && (
          <span
            className="text-muted-foreground uppercase"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em' }}
          >
            POS / OFF LEAD
          </span>
        )}
      </motion.div>

      {/* Live status bar */}
      {!isCompleted && <LiveStatusBar allPicks={allPicks} />}

      {/* Player rows */}
      <div>
        {visibleCards.map((prediction, i) => (
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
              isLast={!showAll && i === visibleCards.length - 1 && !hasMore}
              isBestCall={isCompleted && prediction.playerId === bestCallPlayerId}
            />
          </motion.div>
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
                isBestCall={isCompleted && prediction.playerId === bestCallPlayerId}
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
