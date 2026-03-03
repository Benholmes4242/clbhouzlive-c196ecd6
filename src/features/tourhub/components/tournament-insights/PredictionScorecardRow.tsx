/**
 * PredictionScorecardRow - Borderless player row with separator
 * 
 * Completed layout: [Position Badge] [Avatar] [Name + Flag] ... [Score (large)]
 * Live layout:      [Pick #] [Avatar] [Name + Score] ... [Position/Off Lead]
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import PickBadge from './components/PickBadge';
import ActualPositionBadge from './components/ActualPositionBadge';
import LivePositionDisplay from './components/LivePositionDisplay';
import CountryFlag from '@/components/ui/country-flag';
import type { TrackedPrediction } from './types';

interface PredictionScorecardRowProps {
  prediction: TrackedPrediction;
  index: number;
  isCompleted?: boolean;
  isLast?: boolean;
  isBestCall?: boolean;
}

function getAccuracyBorderColor() {
  return 'hsl(var(--border))';
}

function formatScore(score: number | null): string {
  if (score === null) return '—';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

export const PredictionScorecardRow: React.FC<PredictionScorecardRowProps> = ({
  prediction,
  index,
  isCompleted,
  isLast = false,
  isBestCall = false,
}) => {
  const isCut = prediction.performanceStatus === 'cut';
  const isWD = prediction.performanceStatus === 'withdrawn';
  const isWinner = prediction.actualPosition === 1;
  const isLeader = !isCompleted && prediction.actualPosition === 1;
  const avatarUrl = getPlayerHeadshotUrl(prediction.playerName, 'pga');
  const borderColor = getAccuracyBorderColor();

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
      {/* Leader left accent (live only) */}
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

      <div className="flex items-center gap-3">
        {/* LEFT SECTION — differs between completed and live */}
        {isCompleted ? (
          /* Completed: Position badge on the left */
          <ActualPositionBadge
            position={prediction.actualPosition}
            isTied={prediction.actualPositionTied}
            performanceStatus={prediction.performanceStatus}
          />
        ) : (
          /* Live: Pick number badge on the left */
          <PickBadge pickNumber={prediction.predictedRank} />
        )}

        {/* Avatar — squircle shape */}
        <div className="relative flex-shrink-0">
          <div
            className="overflow-hidden bg-muted"
            style={{
              width: 44,
              height: Math.round(44 * 1.05),
              borderRadius: '34%',
              border: `2px solid ${borderColor}`,
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
          {/* Best call gold star */}
          {isBestCall && (
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#CA8A04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px hsl(var(--background))',
                fontSize: 10,
                lineHeight: 1,
              }}
            >
              ★
            </div>
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

          {isCompleted ? (
            /* Completed: Country flag under name */
            <div className="flex items-center" style={{ marginTop: 3 }}>
              <CountryFlag country={prediction.country} size="sm" />
            </div>
          ) : (
            /* Live: Score + thru info under name */
            prediction.score !== null && (
              <div className="flex items-center gap-1.5">
                <p
                  className="text-muted-foreground leading-tight"
                  style={{ fontSize: 13, marginTop: 3 }}
                >
                  {formatScore(prediction.score)}
                  {prediction.thru !== null && prediction.thru > 0 ? ` · thru ${prediction.thru}` : ''}
                  {prediction.currentRound ? ` · R${prediction.currentRound}` : ''}
                </p>
                {/* Leader pulsing dot */}
                {isLeader && (
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
            )
          )}
        </div>

        {/* RIGHT SECTION — differs between completed and live */}
        <div className="flex-shrink-0 ml-auto">
          {isCompleted ? (
            /* Completed: Large score on the right */
            <span
              className="text-foreground"
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.2px',
              }}
            >
              {isCut ? 'MC' : isWD ? 'WD' : formatScore(prediction.score)}
            </span>
          ) : (
            /* Live: Position display on the right */
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
