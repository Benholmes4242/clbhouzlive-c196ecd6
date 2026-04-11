/**
 * LeaderboardBottomSheet — Fixed peek sheet for live leaderboard
 * Sits at z-50: above hero content (z-20), below bottom nav (z-100)
 * Collapsed: 84px showing top 3 players
 * Expanded: ~72vh with full scrollable leaderboard + scorecard
 */

import { useState, useCallback } from 'react';
import type { LeaderboardEntryWithPlayer } from './ExpandedLeaderboard';
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';
import { ExpandedLeaderboardList, ExpandedLeaderboardSkeleton, ExpandedLeaderboardError, ExpandedLeaderboardEmpty } from './ExpandedLeaderboard';
import { PlayerScorecardCard } from '@/components/tourhub/PlayerScorecardCard';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const PEEK_HEIGHT = 84;

interface LeaderboardBottomSheetProps {
  entries: LeaderboardEntryWithPlayer[];
  tourCode: string;
  tournamentId: string;
  tournamentName: string;
  courseName: string;
  currentRound: number;
  isVisible: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function fmtScore(n: number | null): string {
  if (n == null) return '—';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}

export function LeaderboardBottomSheet({
  entries, tourCode, tournamentId, tournamentName, courseName, currentRound,
  isVisible, isLoading, isError, onRetry,
}: LeaderboardBottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);

  const handlePlayerTap = useCallback((player: PlayerInfo) => {
    setSelectedPlayer(player);
  }, []);

  const handleBackToLeaderboard = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedPlayer(null);
    setExpanded(false);
  }, []);

  // Touch isolation — prevent sheet touches from propagating to hero swipe
  const handleSheetTouch = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  const top3 = entries.slice(0, 3);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: PEEK_HEIGHT }}
      animate={{ y: 0 }}
      exit={{ y: PEEK_HEIGHT + 20, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      onTouchStart={handleSheetTouch}
      onTouchMove={handleSheetTouch}
      onTouchEnd={handleSheetTouch}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'var(--bottom-nav-height, 88px)',
        zIndex: 50,
        height: expanded ? '72dvh' : PEEK_HEIGHT,
        background: '#141d2e',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderRadius: expanded ? '16px 16px 0 0' : '12px 12px 0 0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle + toggle */}
      <button
        type="button"
        onClick={() => { setExpanded(e => !e); setSelectedPlayer(null); }}
        style={{
          padding: '10px 16px 0',
          cursor: 'pointer',
          userSelect: 'none',
          background: 'none',
          border: 'none',
          width: '100%',
          flexShrink: 0,
        }}
      >
        {/* Pill handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.20)',
          }} />
        </div>

        {/* Collapsed: top 3 preview */}
        {!expanded && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8,
          }}>
            {top3.map((p, i) => {
              const lastName = p.player?.last_name || p.player?.full_name?.split(' ').pop() || '';
              const score = p.score ?? null;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  flex: 1, minWidth: 0,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: i === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                  }}>
                    {i === 0 ? '1' : (p.position_tied ? `T${p.position}` : `${p.position}`)}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {lastName}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 700, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                    color: score !== null && score < 0 ? '#ffffff' : score !== null && score > 0 ? '#f87171' : 'rgba(255,255,255,0.4)',
                  }}>
                    {fmtScore(score)}
                  </span>
                </div>
              );
            })}
            <div style={{ flexShrink: 0 }}>
              <span style={{
                fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500,
              }}>
                +{Math.max(0, entries.length - 3)} more ↑
              </span>
            </div>
          </div>
        )}

        {/* Expanded: header */}
        {expanded && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
              }}>
                Leaderboard · R{currentRound}
              </span>
            </div>
            <ChevronDown style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.4)' }} />
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
            paddingTop: 8,
          }}
        >
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
                  onBack={handleBackToLeaderboard}
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
                {isLoading ? (
                  <ExpandedLeaderboardSkeleton />
                ) : isError ? (
                  <ExpandedLeaderboardError onRetry={() => onRetry?.()} />
                ) : entries.length === 0 ? (
                  <ExpandedLeaderboardEmpty />
                ) : (
                  <ExpandedLeaderboardList
                    entries={entries}
                    tourCode={tourCode}
                    onTouchStart={handleSheetTouch}
                    onTouchMove={handleSheetTouch}
                    onTouchEnd={handleSheetTouch}
                    onPlayerTap={handlePlayerTap}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
