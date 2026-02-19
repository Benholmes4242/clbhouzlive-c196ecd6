/**
 * PredictionLeaderboard - Unified OWGR-style table
 * Top 3 picks + 1 dark horse row. OFF LEAD column.
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

  // Top 3 picks + 1 dark horse
  const mainPicks = allPicks.filter(p => !p.isDarkHorse).slice(0, 3);
  const darkHorses = allPicks.filter(p => p.isDarkHorse).slice(0, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="overflow-hidden"
    >
      {/* Column header row */}
      <div
        className="flex items-center px-4"
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(0,0,0,0.02)',
          borderRadius: '8px 8px 0 0',
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
        <div className="w-[56px] flex-shrink-0 text-right">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'rgba(0,0,0,0.35)' }}>
            OFF LEAD
          </span>
        </div>
      </div>

      {/* Main prediction rows */}
      {mainPicks.map((prediction, i) => (
        <div key={prediction.playerId}>
          <PredictionScorecardRow prediction={prediction} index={i} isCompleted={isCompleted} />
          {i < mainPicks.length - 1 && (
            <div className="border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }} />
          )}
        </div>
      ))}

      {/* Dark Horse Divider Row */}
      {darkHorses.length > 0 && (
        <>
          <div
            className="flex items-center gap-1.5 px-4 py-2.5 border-t border-b"
            style={{
              backgroundColor: 'rgba(255, 251, 235, 0.5)',
              borderColor: 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <span className="text-sm">⚡</span>
            <span className="text-xs font-semibold" style={{ color: '#b45309' }}>
              Dark Horse Watch
            </span>
          </div>

          {/* Dark horse rows */}
          {darkHorses.map((dh, i) => (
            <div key={dh.playerId}>
              <PredictionScorecardRow prediction={dh} index={mainPicks.length + i} isCompleted={isCompleted} />
              {i < darkHorses.length - 1 && (
                <div className="border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }} />
              )}
            </div>
          ))}
        </>
      )}
    </motion.div>
  );
};
