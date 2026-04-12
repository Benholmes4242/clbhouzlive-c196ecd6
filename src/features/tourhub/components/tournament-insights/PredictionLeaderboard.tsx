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
  tournamentLeaderScore?: number | null;
  tourSlug?: string;
}

export const PredictionLeaderboard: React.FC<PredictionLeaderboardProps> = ({
  allPicks,
  isCompleted,
  bestCallPlayerId,
  tournamentLeaderScore,
  tourSlug,
}) => {
  if (allPicks.length === 0) return null;

  // Sort by actual position (best first) for both live and completed
  const sorted = [...allPicks].slice(0, 3).sort((a, b) => {
    const aPos = a.actualPosition ?? 999;
    const bPos = b.actualPosition ?? 999;
    return aPos - bPos;
  });

  // Use actual tournament leader score (from full leaderboard), NOT picks subset
  const leaderScore: number | null = tournamentLeaderScore ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: isCompleted ? 0.9 : 0.1 }}
      style={{ marginBottom: 32 }}
    >
      {/* Live-only header */}
      {!isCompleted && (
        <div className="px-1 flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Tournament Picks · Live Positions
            </span>
          </div>
          <span
            style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}
          >
            POS / OFF LEAD
          </span>
        </div>
      )}

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
              leaderScore={leaderScore}
              tourSlug={tourSlug}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
