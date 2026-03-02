/**
 * PredictionScorecardRow - Card-based player row for both Live and Results states
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import PickBadge from './components/PickBadge';
import ActualPositionBadge from './components/ActualPositionBadge';
import LivePositionDisplay from './components/LivePositionDisplay';
import type { TrackedPrediction } from './types';

interface PredictionScorecardRowProps {
  prediction: TrackedPrediction;
  index: number;
  isCompleted?: boolean;
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
}) => {
  const isCut = prediction.performanceStatus === 'cut';
  const isWD = prediction.performanceStatus === 'withdrawn';
  const isWinner = prediction.actualPosition === 1;
  const isLeader = !isCompleted && prediction.actualPosition === 1;
  const avatarUrl = getPlayerHeadshotUrl(prediction.playerName, 'pga');
  const borderColor = getAccuracyBorderColor(prediction.actualPosition, prediction.performanceStatus);

  const offLead = prediction.actualPosition !== null ? prediction.actualPosition - 1 : null;

  // Card backgrounds
  const getCardStyle = () => {
    if (isCompleted && isWinner) {
      return {
        background: 'linear-gradient(135deg, #F0FDF4 0%, #FEFCE8 100%)',
        border: '1.5px solid rgba(22, 163, 74, 0.25)',
      };
    }
    if (!isCompleted && isLeader) {
      return {
        background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
        border: '1.5px solid rgba(22, 163, 74, 0.2)',
      };
    }
    return {
      background: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
    };
  };

  const cardStyle = getCardStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
      className="relative overflow-hidden"
      style={{
        ...cardStyle,
        borderRadius: 16,
        padding: isWinner ? '16px' : '14px 16px',
        opacity: isWD ? 0.5 : isCut ? 0.6 : 1,
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
            borderRadius: '16px 0 0 16px',
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

      <div className="flex items-center gap-3">
        {/* Pick badge */}
        <PickBadge pickNumber={prediction.predictedRank} />

        {/* Avatar */}
        <div
          className="overflow-hidden flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: `2px solid ${borderColor}`,
          }}
        >
          {avatarUrl ? (
            <div className="relative w-full h-full bg-muted">
              <img
                src={avatarUrl}
                alt={prediction.playerName}
                className="relative z-10 w-full h-full object-cover"
                style={{ objectPosition: 'center 20%' }}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
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
