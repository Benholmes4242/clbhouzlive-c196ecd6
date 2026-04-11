/**
 * LeaderboardBottomSheet — Fixed peek sheet for live leaderboard
 * Peeks at 84px showing top 3, expands to 72dvh with full leaderboard + scorecard.
 * z-index 50: above hero (z-20), below bottom nav (z-100).
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpandedLeaderboardList, ExpandedLeaderboardSkeleton, ExpandedLeaderboardError, ExpandedLeaderboardEmpty } from './ExpandedLeaderboard';
import { PlayerScorecardCard } from '@/components/tourhub/PlayerScorecardCard';
import type { LeaderboardEntryWithPlayer } from './ExpandedLeaderboard';
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface LiveLeaderboardData {
  entries: LeaderboardEntryWithPlayer[];
  tourCode: string;
  tournamentId: string;
  tournamentName: string;
  courseName: string;
  currentRound: number;
}

interface LeaderboardBottomSheetProps extends LiveLeaderboardData {
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const PEEK_HEIGHT = 84;

function fmtScore(n: number | null): string {
  if (n == null) return '—';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}

export function LeaderboardBottomSheet({
  entries, tourCode, tournamentId, tournamentName, courseName,
  currentRound, isExpanded, onExpandChange,
}: LeaderboardBottomSheetProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const top3 = entries.slice(0, 3);

  const handleToggle = () => {
    onExpandChange(!isExpanded);
    if (isExpanded) setSelectedPlayer(null);
  };

  const handlePlayerTap = useCallback((player: PlayerInfo) => {
    setSelectedPlayer(player);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedPlayer(null);
    onExpandChange(false);
  }, [onExpandChange]);

  // Noop touch handlers for ExpandedLeaderboardList (sheet manages its own scroll)
  const noopTouch = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 50,
        height: isExpanded ? '72dvh' : PEEK_HEIGHT,
        transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
        pointerEvents: 'auto',
      }}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20, 29, 46, 0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '16px 16px 0 0',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Drag handle + toggle area */}
        <button
          onClick={handleToggle}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 16px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            width: '100%',
          }}
        >
          {/* Handle bar */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.25)',
            marginBottom: 10,
          }} />

          {/* Collapsed: top 3 preview */}
          {!isExpanded && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                {top3.map((p, i) => {
                  const lastName = p.player?.last_name
                    || p.player?.full_name?.split(' ').pop()
                    || '';
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: 'rgba(255,255,255,0.35)',
                        fontVariantNumeric: 'tabular-nums',
                        width: 14,
                      }}>
                        {i === 0 ? '1' : (p.position_tied ? `T${p.position}` : `${p.position}`)}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: 'rgba(255,255,255,0.85)',
                        whiteSpace: 'nowrap',
                      }}>
                        {lastName}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: (p.score ?? 0) < 0 ? '#ffffff'
                          : (p.score ?? 0) > 0 ? '#f87171'
                          : 'rgba(255,255,255,0.4)',
                      }}>
                        {fmtScore(p.score)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  +{Math.max(0, entries.length - 3)} more
                </span>
                <ChevronUp style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
              </div>
            </div>
          )}

          {/* Expanded: leaderboard header */}
          {isExpanded && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', paddingBottom: 6,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                Leaderboard · R{currentRound}
              </span>
              <ChevronDown style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
            </div>
          )}
        </button>

        {/* Expanded content: leaderboard or scorecard */}
        {isExpanded && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {selectedPlayer ? (
                <motion.div
                  key="scorecard"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                >
                  <PlayerScorecardCard
                    player={selectedPlayer}
                    tournamentId={tournamentId}
                    tournamentName={tournamentName}
                    courseName={courseName}
                    onBack={handleBack}
                    onClose={handleClose}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                >
                  {entries.length === 0 ? (
                    <ExpandedLeaderboardEmpty />
                  ) : (
                    <ExpandedLeaderboardList
                      entries={entries}
                      tourCode={tourCode}
                      onTouchStart={noopTouch}
                      onTouchMove={noopTouch}
                      onTouchEnd={noopTouch}
                      onPlayerTap={handlePlayerTap}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
