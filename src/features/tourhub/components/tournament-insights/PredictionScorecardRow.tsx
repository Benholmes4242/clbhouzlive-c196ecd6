/**
 * PredictionScorecardRow - Individual player row showing predicted vs actual position
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';
import type { TrackedPrediction } from './types';

interface PredictionScorecardRowProps {
  prediction: TrackedPrediction;
  index: number;
}

function formatPosition(pos: number | null, tied: boolean): string {
  if (pos === null) return '—';
  return tied ? `T${pos}` : `${pos}${getOrdinalSuffix(pos)}`;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatPredictedRank(rank: number): string {
  return `${rank}${getOrdinalSuffix(rank)}`;
}

function getDeltaDisplay(prediction: TrackedPrediction): {
  icon: string;
  text: string;
  color: string;
} {
  switch (prediction.performanceStatus) {
    case 'outperforming':
      return {
        icon: '🟢',
        text: `↑${Math.abs(prediction.positionDelta!)}`,
        color: '#059669',
      };
    case 'matching':
      return { icon: '⚪', text: '—', color: '#9ca3af' };
    case 'underperforming':
      return {
        icon: '🔴',
        text: `↓${Math.abs(prediction.positionDelta!)}`,
        color: '#ef4444',
      };
    case 'cut':
      return { icon: '🔴', text: 'CUT', color: '#ef4444' };
    case 'withdrawn':
      return { icon: '⚪', text: 'WD', color: '#9ca3af' };
    case 'not-started':
    default:
      return { icon: '⚪', text: '—', color: '#d1d5db' };
  }
}

function getScoreLine(prediction: TrackedPrediction): string {
  if (prediction.score === null) return '';
  const scoreStr = prediction.score === 0 ? 'E' : prediction.score > 0 ? `+${prediction.score}` : `${prediction.score}`;
  const parts = [scoreStr];
  if (prediction.thru !== null && prediction.thru > 0) {
    parts.push(`thru ${prediction.thru}`);
  }
  if (prediction.currentRound) {
    parts.push(`R${prediction.currentRound}`);
  }
  return parts.join(' · ');
}

export const PredictionScorecardRow: React.FC<PredictionScorecardRowProps> = ({
  prediction,
  index,
}) => {
  const delta = getDeltaDisplay(prediction);
  const isCut = prediction.performanceStatus === 'cut';
  const avatarUrl = prediction.pgaTourId
    ? getPgaTourHeadshotUrl(prediction.pgaTourId)
    : null;
  const scoreLine = getScoreLine(prediction);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
      className="flex items-center gap-3 px-4 py-3"
      style={{ opacity: isCut ? 0.6 : 1 }}
    >
      {/* Avatar */}
      <div className="flex-none w-10 h-10 rounded-full overflow-hidden bg-muted">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={prediction.playerName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {prediction.playerName.charAt(0)}
          </div>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold text-foreground truncate"
          style={{ textDecoration: isCut ? 'line-through' : undefined }}
        >
          {prediction.playerName}
        </p>
        <p className="text-xs text-muted-foreground">
          Predicted: {formatPredictedRank(prediction.predictedRank)} → Actual:{' '}
          <span style={{ textDecoration: isCut ? 'line-through' : undefined }}>
            {prediction.performanceStatus === 'cut'
              ? 'MC'
              : formatPosition(prediction.actualPosition, prediction.actualPositionTied)}
          </span>
        </p>
        {scoreLine && (
          <p className="text-xs text-muted-foreground">{scoreLine}</p>
        )}
      </div>

      {/* Delta indicator */}
      <motion.div
        className="flex-none flex items-center gap-1"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 + index * 0.05 }}
      >
        <span className="text-sm">{delta.icon}</span>
        <span
          className="text-xs font-semibold"
          style={{ color: delta.color }}
        >
          {delta.text}
        </span>
      </motion.div>
    </motion.div>
  );
};
