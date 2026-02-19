/**
 * PredictionScorecardRow - OWGR-style row: PLAYER | ACTUAL | OFF LEAD
 * OFF LEAD = actualPosition - 1 (how far from the leader)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';
import type { TrackedPrediction } from './types';

interface PredictionScorecardRowProps {
  prediction: TrackedPrediction;
  index: number;
  isCompleted?: boolean;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatOrdinal(n: number): string {
  return `${n}${getOrdinalSuffix(n)}`;
}

function formatActual(prediction: TrackedPrediction, isCompleted?: boolean): string {
  if (prediction.performanceStatus === 'cut') return 'MC';
  if (prediction.performanceStatus === 'withdrawn') return 'WD';
  if (prediction.actualPosition === null) return '—';
  const prefix = prediction.actualPositionTied ? 'T' : '';
  return `${prefix}${prediction.actualPosition}`;
}

interface OffLeadDisplay {
  text: string | number;
  color: string;
  fontWeight?: number;
  isDownArrow?: boolean;
}

function formatScore(score: number | null): string {
  if (score === null) return 'E';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

function getOffLeadDisplay(prediction: TrackedPrediction, isCompleted?: boolean): OffLeadDisplay {
  if (prediction.performanceStatus === 'cut') {
    return { text: 'CUT', color: 'rgba(0,0,0,0.3)' };
  }
  if (prediction.performanceStatus === 'withdrawn') {
    return { text: 'WD', color: 'rgba(0,0,0,0.3)' };
  }
  if (prediction.actualPosition === null || prediction.performanceStatus === 'not-started') {
    return { text: '—', color: 'rgba(0,0,0,0.2)' };
  }

  const offLead = prediction.actualPosition - 1;

  if (offLead === 0) {
    // Leader — show their actual score in green
    return { text: formatScore(prediction.score), color: 'rgba(22,163,74,0.9)', fontWeight: 700 };
  }

  // Behind the leader — show ▼N in red
  return { text: offLead, color: 'rgba(220,38,38,0.75)', fontWeight: 600, isDownArrow: true };
}

export const PredictionScorecardRow: React.FC<PredictionScorecardRowProps> = ({
  prediction,
  index,
  isCompleted,
}) => {
  const offLead = getOffLeadDisplay(prediction, isCompleted);
  const isCut = prediction.performanceStatus === 'cut';
  const isWD = prediction.performanceStatus === 'withdrawn';
  const isDimmed = isCut || isWD;
  const avatarUrl = prediction.pgaTourId
    ? getPgaTourHeadshotUrl(prediction.pgaTourId)
    : null;

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
      style={{ opacity: isWD ? 0.5 : isCut ? 0.6 : 1, height: '68px' }}
    >
      {/* PLAYER — Avatar + Name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div
          className="overflow-hidden border border-border/50 flex-shrink-0"
          style={{ width: '40px', height: '40px', borderRadius: '13px' }}
        >
          {avatarUrl ? (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-muted" />
              <img
                src={avatarUrl}
                alt={prediction.playerName}
                className="relative z-10 w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold text-foreground truncate leading-tight"
            style={{ textDecoration: isCut ? 'line-through' : undefined }}
          >
            {prediction.playerName}
          </p>
          {/* Score line — only when player has posted a real score */}
          {prediction.actualPosition !== null && prediction.score !== null && (
            <p className="text-[11px] text-muted-foreground leading-tight" style={{ marginTop: '3px' }}>
              {prediction.score === 0 ? 'E' : prediction.score > 0 ? `+${prediction.score}` : prediction.score}
              {prediction.thru !== null && prediction.thru > 0 ? ` · thru ${prediction.thru}` : ''}
              {prediction.currentRound ? ` · R${prediction.currentRound}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* ACTUAL */}
      <div className="w-[52px] flex-shrink-0 text-center">
        <span className="text-sm font-semibold text-foreground">
          {formatActual(prediction, isCompleted)}
        </span>
      </div>

      {/* OFF LEAD */}
      <motion.div
        className="w-[56px] flex-shrink-0 text-right"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 + index * 0.05 }}
      >
        <span
          style={{ color: offLead.color, fontWeight: offLead.fontWeight ?? 600, fontSize: '13px' }}
        >
          {offLead.isDownArrow ? (
            <><span style={{ fontSize: '10px', marginRight: '1px' }}>▼</span>{offLead.text}</>
          ) : offLead.text}
        </span>
      </motion.div>
    </motion.div>
  );
};
