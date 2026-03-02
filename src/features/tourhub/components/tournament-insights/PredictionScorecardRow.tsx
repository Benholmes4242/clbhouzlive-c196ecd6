/**
 * PredictionScorecardRow - Borderless player row with separator
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

import ActualPositionBadge from './components/ActualPositionBadge';
import LivePositionDisplay from './components/LivePositionDisplay';
import type { TrackedPrediction } from './types';

interface PredictionScorecardRowProps {
  prediction: TrackedPrediction;
  index: number;
  isCompleted?: boolean;
  isLast?: boolean;
}

function getAccuracyBorderColor(pos: number | null, status?: string) {
  if (status === 'cut' || status === 'withdrawn' || pos === null) return 'hsl(var(--border))';
  if (pos <= 3) return 'rgba(22,163,74,0.5)';
  if (pos <= 10) return 'rgba(217,119,6,0.5)';
  return 'rgba(220,38,38,0.2)';
}

export const PredictionScorecardRow: React.FC<PredictionScorecardRowProps> = ({
  prediction,
  index,
  isCompleted,
  isLast = false,
}) => {
  const isCut = prediction.performanceStatus === 'cut';
  const isWD = prediction.performanceStatus === 'withdrawn';
  const isWinner = prediction.actualPosition === 1;
  const isLeader = !isCompleted && prediction.actualPosition === 1;
  const avatarUrl = getPlayerHeadshotUrl(prediction.playerName, 'pga');
  const borderColor = getAccuracyBorderColor(prediction.actualPosition, prediction.performanceStatus);

  const offLead = prediction.actualPosition !== null ? prediction.actualPosition - 1 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
      className="relative"
      style={{
        padding: '16px 4px',
        opacity: isWD ? 0.5 : isCut ? 0.6 : 1,
        borderBottom: isLast ? 'none' : '1px solid hsl(var(--border) / 0.3)',
      }}
    >
      {/* Leader left accent */}
      {!isCompleted && isLeader && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: '#16A34A',
            borderRadius: '2px',
          }}
        />
      )}

      {/* Winner badge */}
      {isCompleted && isWinner && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'linear-gradient(135deg, #16A34A, #CA8A04)',
            color: 'white',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '3px 8px',
            borderRadius: 6,
            textTransform: 'uppercase',
          }}
        >
          WINNER
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {/* Avatar — squircle shape */}
        <div
          className="overflow-hidden flex-shrink-0 bg-muted"
          style={{
            width: 40,
            height: Math.round(40 * 1.05),
            borderRadius: '34%',
            border: `1.5px solid ${borderColor}`,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={prediction.playerName}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>

        {/* Player info */}
        <div className="min-w-0 flex-1">
          <p
            className="text-foreground truncate leading-tight"
            style={{
              fontSize: 15,
              fontWeight: isWinner || isLeader ? 700 : 600,
              textDecoration: isCut ? 'line-through' : undefined,
            }}
          >
            {prediction.playerName}
          </p>
          {prediction.score !== null && (
            <div className="flex items-center gap-1.5">
              <p
                className="text-muted-foreground leading-tight"
                style={{ fontSize: 13, marginTop: 3 }}
              >
                {prediction.score === 0 ? 'E' : prediction.score > 0 ? `+${prediction.score}` : prediction.score}
                {!isCompleted && prediction.thru !== null && prediction.thru > 0 ? ` · thru ${prediction.thru}` : ''}
                {!isCompleted && prediction.currentRound ? ` · R${prediction.currentRound}` : ''}
              </p>
              {/* Leader pulsing dot */}
              {!isCompleted && isLeader && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#16A34A',
                    animation: 'pulse 2s infinite',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Right section — position display */}
        <div className="flex-shrink-0 ml-auto">
          {isCompleted ? (
            <ActualPositionBadge
              position={prediction.actualPosition}
              isTied={prediction.actualPositionTied}
              performanceStatus={prediction.performanceStatus}
            />
          ) : (
            <LivePositionDisplay
              position={prediction.actualPosition}
              isTied={prediction.actualPositionTied}
              offLead={offLead}
              performanceStatus={prediction.performanceStatus}
              score={prediction.score}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};