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

  const sorted = [...allPicks].slice(0, 3).sort((a, b) => {
    const aPos = a.actualPosition ?? 999;
    const bPos = b.actualPosition ?? 999;
    return aPos - bPos;
  });

  const leaderScore: number | null = tournamentLeaderScore ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: isCompleted ? 0.9 : 0.1 }}
      style={{ paddingTop: 24, paddingBottom: 24 }}
    >
      {/* Live header — dispatch style */}
      {!isCompleted && (
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', flex: 1 }}>
              TOURNAMENT PICKS · LIVE POSITIONS
            </span>
            <span style={{ fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em' }}>
              POS / OFF LEAD
            </span>
          </div>
        </div>
      )}

      {/* Live status bar */}
      {!isCompleted && <LiveStatusBar allPicks={allPicks} />}

      {/* Player rows */}
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
