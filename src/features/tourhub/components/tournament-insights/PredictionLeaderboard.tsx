/**
 * PredictionLeaderboard - Unified OWGR-style table
 * Top 5 predictions → Dark Horse divider → Dark horse rows
 * All in a single card.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PredictionScorecardRow } from './PredictionScorecardRow';
import type { TrackedPrediction } from './types';

interface PredictionLeaderboardProps {
  allPicks: TrackedPrediction[];
}

export const PredictionLeaderboard: React.FC<PredictionLeaderboardProps> = ({
  allPicks,
}) => {
  if (allPicks.length === 0) return null;

  const mainPicks = allPicks.filter(p => !p.isDarkHorse).slice(0, 5);
  const darkHorses = allPicks.filter(p => p.isDarkHorse);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="overflow-hidden"
    >
      {/* Column header row */}
      <div
        className="flex items-center px-4 py-2.5 border-b"
        style={{ borderColor: 'rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(0, 0, 0, 0.015)' }}
      >
        <div className="w-8 flex-shrink-0 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">#</span>
        </div>
        <div className="flex-1 min-w-0 pl-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Player</span>
        </div>
        <div className="w-[60px] flex-shrink-0 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Pred</span>
        </div>
        <div className="w-[52px] flex-shrink-0 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Actual</span>
        </div>
        <div className="w-[48px] flex-shrink-0 text-right">
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">+/-</span>
        </div>
      </div>

      {/* Main prediction rows */}
      {mainPicks.map((prediction, i) => (
        <React.Fragment key={prediction.playerId}>
          <PredictionScorecardRow prediction={prediction} index={i} />
          {i < mainPicks.length - 1 && (
            <div className="border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }} />
          )}
        </React.Fragment>
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
            <React.Fragment key={dh.playerId}>
              <PredictionScorecardRow prediction={dh} index={mainPicks.length + i} />
              {i < darkHorses.length - 1 && (
                <div className="border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }} />
              )}
            </React.Fragment>
          ))}
        </>
      )}
    </motion.div>
  );
};
