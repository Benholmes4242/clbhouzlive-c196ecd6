/**
 * PredictionScorecardRow - OWGR-style row with columns: # | PLAYER | PREDICTED | ACTUAL | +/-
 * Matches WorldRankingsModule row density and styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';
import type { TrackedPrediction } from './types';

interface PredictionScorecardRowProps {
  prediction: TrackedPrediction;
  index: number;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatOrdinal(n: number): string {
  return `${n}${getOrdinalSuffix(n)}`;
}

function formatActual(prediction: TrackedPrediction): string {
  if (prediction.performanceStatus === 'cut') return 'MC';
  if (prediction.performanceStatus === 'withdrawn') return 'WD';
  if (prediction.actualPosition === null) return '—';
  return prediction.actualPositionTied ? `T${prediction.actualPosition}` : formatOrdinal(prediction.actualPosition);
}

function getDeltaDisplay(prediction: TrackedPrediction): {
  text: string;
  color: string;
  arrow?: string;
} {
  switch (prediction.performanceStatus) {
    case 'outperforming':
      return { text: `${Math.abs(prediction.positionDelta!)}`, color: '#059669', arrow: '↑' };
    case 'matching':
      return { text: '—', color: '#9ca3af' };
    case 'underperforming':
      return { text: `${Math.abs(prediction.positionDelta!)}`, color: '#ef4444', arrow: '↓' };
    case 'cut':
      return { text: 'MC', color: '#ef4444' };
    case 'withdrawn':
      return { text: 'WD', color: '#9ca3af' };
    case 'not-started':
    default:
      return { text: '—', color: '#d1d5db' };
  }
}

export const PredictionScorecardRow: React.FC<PredictionScorecardRowProps> = ({
  prediction,
  index,
}) => {
  const delta = getDeltaDisplay(prediction);
  const isCut = prediction.performanceStatus === 'cut';
  const isWD = prediction.performanceStatus === 'withdrawn';
  const isDimmed = isCut || isWD;
  const avatarUrl = prediction.pgaTourId
    ? getPgaTourHeadshotUrl(prediction.pgaTourId)
    : null;
  const initials = prediction.playerName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
      className="flex items-center px-4"
      style={{ opacity: isDimmed ? 0.6 : 1, height: '68px' }}
    >
      {/* # — Rank number */}
      <div className="w-8 flex-shrink-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground leading-none">
          {prediction.predictedRank}
        </span>
        {/* Movement arrow below rank (OWGR style) */}
        {delta.arrow && (
          <span className="text-[10px] font-semibold leading-none mt-0.5" style={{ color: delta.color }}>
            {delta.arrow}
          </span>
        )}
      </div>

      {/* PLAYER — Avatar + Name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0 pl-2">
        <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-muted">
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground z-0">
            {initials}
          </div>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={prediction.playerName}
              className="absolute inset-0 w-full h-full object-cover z-10"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold text-foreground truncate leading-tight"
            style={{ textDecoration: isCut ? 'line-through' : undefined }}
          >
            {prediction.playerName}
          </p>
          {/* Score line — compact */}
          {prediction.score !== null && (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {prediction.score === 0 ? 'E' : prediction.score > 0 ? `+${prediction.score}` : prediction.score}
              {prediction.thru !== null && prediction.thru > 0 ? ` · thru ${prediction.thru}` : ''}
              {prediction.currentRound ? ` · R${prediction.currentRound}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* PREDICTED */}
      <div className="w-[60px] flex-shrink-0 text-center">
        <span className="text-sm text-muted-foreground">
          {formatOrdinal(prediction.predictedRank)}
        </span>
      </div>

      {/* ACTUAL */}
      <div className="w-[52px] flex-shrink-0 text-center">
        <span className="text-sm font-semibold text-foreground">
          {formatActual(prediction)}
        </span>
      </div>

      {/* +/- Delta */}
      <motion.div
        className="w-[48px] flex-shrink-0 text-right"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 + index * 0.05 }}
      >
        <span className="text-xs font-semibold" style={{ color: delta.color }}>
          {delta.arrow ? `${delta.arrow}${delta.text}` : delta.text}
        </span>
      </motion.div>
    </motion.div>
  );
};
