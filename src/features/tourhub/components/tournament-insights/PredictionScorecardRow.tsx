/**
 * PredictionScorecardRow - Dispatch-style flat ruled player row
 * 
 * Completed layout: [Position Badge] [Avatar] [Name + Flag] ... [Score]
 * Live layout:      [Avatar] [Name + Score] ... [Position/Off Lead]
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

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
  leaderScore?: number | null;
  tourSlug?: string;
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
  leaderScore,
  tourSlug,
}) => {
  const isCut = prediction.performanceStatus === 'cut';
  const isWD = prediction.performanceStatus === 'withdrawn';
  const isWinner = prediction.actualPosition === 1;
  const isLeader = !isCompleted && prediction.actualPosition === 1;
  const avatarUrl = getPlayerHeadshotUrl(prediction.playerName, tourSlug ?? 'pga');

  const offLead = (prediction.score !== null && leaderScore !== null && leaderScore !== undefined)
    ? prediction.score - leaderScore
    : null;

  // Live state: allow expand to show pick reasons (top 3)
  const bullets = !isCompleted ? (prediction.reasons ?? []).slice(0, 3) : [];
  const canExpand = !isCompleted && bullets.length > 0;
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
      style={{
        opacity: isWD ? 0.5 : isCut ? 0.6 : 1,
        borderBottom: isLast ? 'none' : '0.5px solid rgba(15,23,42,0.07)',
        borderLeft: (!isCompleted && isLeader) ? '3px solid #F7931E' : '3px solid transparent',
        background: (!isCompleted && isLeader) ? 'rgba(247,147,30,0.03)' : 'transparent',
        transition: 'background-color 100ms ease',
      }}
    >
      <div
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onClick={canExpand ? () => setOpen(o => !o) : undefined}
        onKeyDown={canExpand ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(o => !o);
          }
        } : undefined}
        style={{
          padding: '12px 16px',
          cursor: canExpand ? 'pointer' : 'pointer',
          position: 'relative',
        }}
        onPointerDown={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = 'hsl(var(--muted) / 0.3)';
        }}
        onPointerUp={(e) => {
          const el = e.currentTarget;
          setTimeout(() => { el.style.backgroundColor = 'transparent'; }, 100);
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
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
        {/* LEFT SECTION — position badge for completed state only */}
        {isCompleted && (
          <ActualPositionBadge
            position={prediction.actualPosition}
            isTied={prediction.actualPositionTied}
            performanceStatus={prediction.performanceStatus}
          />
        )}

        {/* Avatar — squircle */}
        <div className="relative flex-shrink-0">
          <div
            className="overflow-hidden bg-muted"
            style={{
              width: 40,
              height: 42,
              borderRadius: '34%',
              border: '2px solid rgba(15,23,42,0.07)',
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
           {/* Best call green star */}
          {isBestCall && (
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px hsl(var(--background))',
                fontSize: 10,
                lineHeight: 1,
                color: 'white',
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
              fontSize: 16,
              fontWeight: 700,
              textDecoration: isCut ? 'line-through' : undefined,
            }}
          >
            {prediction.playerName}
          </p>

          {isCompleted ? (
            <div className="flex items-center" style={{ marginTop: 3 }}>
              <CountryFlag country={prediction.country} size="sm" />
            </div>
          ) : (
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
                {isLeader && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#22C55E',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            )
          )}
        </div>

        {/* RIGHT SECTION */}
        <div className="flex-shrink-0 ml-auto flex items-center gap-2">
          {isCompleted ? (
            <span
              className={prediction.score !== null && prediction.score < 0 ? 'text-foreground' : 'text-muted-foreground'}
              style={{
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: '-0.2px',
              }}
            >
              {isCut ? 'MC' : isWD ? 'WD' : formatScore(prediction.score)}
            </span>
          ) : (
            <LivePositionDisplay
              position={prediction.actualPosition}
              isTied={prediction.actualPositionTied}
              offLead={offLead}
              performanceStatus={prediction.performanceStatus}
              score={prediction.score}
            />
          )}
          {canExpand && (
            <span
              aria-hidden="true"
              style={{
                fontSize: 14,
                color: '#CBD5E1',
                transform: open ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s',
                display: 'inline-block',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ›
            </span>
          )}
        </div>
      </div>
      </div>

      {/* Expanded reasons — live state only */}
      {canExpand && open && (
        <div style={{ background: 'rgba(15,23,42,0.01)', borderTop: '0.5px solid rgba(15,23,42,0.05)' }}>
          {bullets.map((b, bi) => (
            <div
              key={bi}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 16px 7px 19px',
                borderBottom: bi < bullets.length - 1 ? '0.5px solid rgba(15,23,42,0.05)' : 'none',
              }}
            >
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{b}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
