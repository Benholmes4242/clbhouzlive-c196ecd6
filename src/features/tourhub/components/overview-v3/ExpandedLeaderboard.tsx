/**
 * ExpandedLeaderboard — Full-field leaderboard rendered inside the hero glass card
 * Dark-glass aesthetic with sticky column headers and internal scrolling.
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import type { Database } from '@/integrations/supabase/types';
import type { PlayerInfo } from '@/components/tourhub/PlayerScorecardCard';

// Derive types from the actual Supabase schema
type SrLeaderboardRow = Database['public']['Tables']['sr_leaderboards']['Row'];
type SrPlayerRow = Database['public']['Tables']['sr_players']['Row'];

export interface LeaderboardEntryWithPlayer extends SrLeaderboardRow {
  player: SrPlayerRow | null;
}

function getScoreColor(toPar: number | null): string {
  if (toPar === null || toPar === undefined) return 'rgba(255,255,255,0.45)';
  if (toPar < 0) return '#ffffff';
  if (toPar === 0) return 'rgba(255,255,255,0.45)';
  return '#f87171';
}

function getTodayScoreColor(toPar: number | null): string {
  if (toPar === null || toPar === undefined) return 'rgba(255,255,255,0.45)';
  if (toPar < 0) return '#4ade80';
  if (toPar === 0) return 'rgba(255,255,255,0.45)';
  return '#f87171';
}

function formatScore(toPar: number | null): string {
  if (toPar === null || toPar === undefined) return '-';
  if (toPar === 0) return 'E';
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
}

function formatThru(entry: LeaderboardEntryWithPlayer): string {
  if (entry.status === 'cut') return 'CUT';
  if (entry.status === 'wd') return 'WD';
  if (entry.status === 'dq') return 'DQ';
  if (entry.thru === null || entry.thru === undefined) return '-';
  if (entry.thru === 18) return 'F';
  if (entry.thru === 0) return '-';
  return `${entry.thru}`;
}

// Skeleton for loading state
export function ExpandedLeaderboardSkeleton() {
  return (
    <div style={{ flex: 1, padding: '0 16px' }}>
      {/* Leader strip skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: 36, height: 38, borderRadius: '34%', background: 'rgba(255,255,255,0.08)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
          <div>
            <div style={{ height: 13, width: 100, borderRadius: 5, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }} />
            <div style={{ height: 9, width: 50, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
        <div style={{ height: 24, width: 36, borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Stat strip skeleton */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 38, borderRadius: 8, background: 'rgba(255,255,255,0.03)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }} />
        ))}
      </div>

      {/* Separator skeleton */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />

      {/* Row skeletons */}
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between" style={{ padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: 22, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ width: 32, height: 33, borderRadius: '34%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ width: 96, height: 11, borderRadius: 5, background: 'rgba(255,255,255,0.06)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)' }} />
            </div>
            <div className="flex items-center gap-4">
              <div style={{ width: 32, height: 11, borderRadius: 5, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ width: 20, height: 11, borderRadius: 5, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error state
export function ExpandedLeaderboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Unable to load leaderboard</span>
      <button
        onClick={onRetry}
        style={{
          fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
          padding: '8px 16px', borderRadius: 8,
          background: 'rgba(255,255,255,0.12)', border: 'none',
        }}
      >
        Tap to retry
      </button>
    </div>
  );
}

// Empty state
export function ExpandedLeaderboardEmpty() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Leaderboard data unavailable</span>
    </div>
  );
}

// Column headers
const ColumnHeaders = React.memo(function ColumnHeaders() {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className="expanded-lb-col-headers"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: 'rgba(255,255,255,0.5)',
      }}
    >
      <span style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>POS</span>
      <span style={{ flex: 1, paddingLeft: 8 }}>PLAYER</span>
      <span style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>TOTAL</span>
      <span style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>TODAY</span>
      <span style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>THRU</span>
    </div>
  );
});

// Single player row
const ExpandedLeaderboardRow = React.memo(function ExpandedLeaderboardRow({
  entry,
  tourCode,
  onPlayerTap,
}: {
  entry: LeaderboardEntryWithPlayer;
  tourCode: string;
  onPlayerTap?: (player: PlayerInfo) => void;
}) {
  const player = entry.player;
  const [imgError, setImgError] = useState(false);
  if (!player) return null;

  const firstName = player.first_name || '';
  const lastName = player.last_name || '';
  const displayName = firstName && firstName[0]
    ? `${firstName[0]}. ${lastName}`
    : lastName || 'Unknown';
  const fullName = player.full_name || `${firstName} ${lastName}`.trim();
  const effectiveTourCode = player.tour_codes?.[0] ?? tourCode;
  const photoUrl = getPlayerHeadshotUrl(fullName, effectiveTourCode, player.headshot_override);
  const posDisplay = entry.position_tied ? `T${entry.position}` : `${entry.position ?? '-'}`;
  const thruDisplay = formatThru(entry);
  const isCut = entry.status === 'cut' || entry.status === 'wd' || entry.status === 'dq';

  // Derive current active round (one ahead of last completed)
  const lastCompletedRound = entry.round_4 != null ? 4 : entry.round_3 != null ? 3 : entry.round_2 != null ? 2 : entry.round_1 != null ? 1 : 0;
  const currentRound = Math.min(lastCompletedRound + 1, 4);

  const handleTap = onPlayerTap
    ? () => {
        onPlayerTap({
          id: player.id,
          srId: player.sr_id || '',
          name: fullName,
          firstName,
          lastName,
          photoUrl: getPlayerHeadshotUrl(
            player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            effectiveTourCode,
            player.headshot_override
          ) || player.photo_url || undefined,
          countryCode: player.country_code || player.country || undefined,
          position: posDisplay,
          totalScore: entry.score ?? 0,
          thru: thruDisplay,
          currentRound,
        });
      }
    : undefined;

  return (
    <button
      type="button"
      aria-label={`${displayName}, position ${posDisplay}, ${formatScore(entry.score ?? null)} to par, thru ${thruDisplay}`}
      onClick={handleTap}
      className="flex items-center w-full text-left"
      style={{
        padding: '9px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        opacity: isCut ? 0.4 : 1,
        background: 'none',
        borderRadius: 0,
        border: 'none',
        cursor: onPlayerTap ? 'pointer' : 'default',
      }}
    >
      {/* Position */}
      <span style={{
        width: 22,
        textAlign: 'center',
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.35)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {posDisplay}
      </span>

      {/* Avatar + Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: 4 }}>
        <div
          className="overflow-hidden flex-shrink-0"
          style={{ width: 32, height: 33, borderRadius: '34%', border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.12)' }}
        >
          {photoUrl && !imgError ? (
            <img
              src={photoUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          ) : (
            <PlayerSilhouette size={20} />
          )}
        </div>
        <span className="truncate" style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.85)',
        }}>
          {displayName}
        </span>
      </div>

      {/* Total (to par) */}
      <span style={{
        width: 46,
        textAlign: 'right',
        flexShrink: 0,
        fontSize: 15,
        fontWeight: 700,
        color: getScoreColor(entry.score ?? null),
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatScore(entry.score ?? null)}
      </span>

      {/* Today (current round score-to-par) */}
      {(() => {
        const isActivelyPlaying = entry.thru != null && entry.thru >= 1 && entry.thru < 18
          && entry.status !== 'wd' && entry.status !== 'dq' && entry.status !== 'cut';
        const todayToPar = (() => {
          if (!isActivelyPlaying) return null;
          const completedTotal = [1, 2, 3, 4]
            .filter(r => r < currentRound)
            .reduce((sum, r) => {
              const s = entry[`round_${r}` as keyof typeof entry] as number | null;
              return s != null ? sum + s : sum;
            }, 0);
          return entry.score != null ? entry.score - completedTotal : null;
        })();
        return (
          <span style={{
            width: 46,
            textAlign: 'right',
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 600,
            color: getTodayScoreColor(todayToPar),
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatScore(todayToPar)}
          </span>
        );
      })()}

      {/* Thru */}
      <span style={{
        width: 40,
        textAlign: 'right',
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 500,
        color: thruDisplay === 'F' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {thruDisplay}
      </span>
    </button>
  );
});

interface ExpandedLeaderboardListProps {
  entries: LeaderboardEntryWithPlayer[];
  tourCode: string;
  tournamentId?: string;
  defendingChampion?: string | null;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onPlayerTap?: (player: PlayerInfo) => void;
}

export function ExpandedLeaderboardList({ entries, tourCode, tournamentId, defendingChampion, onTouchStart, onTouchMove, onTouchEnd, onPlayerTap }: ExpandedLeaderboardListProps) {
  const [visibleCount, setVisibleCount] = useState(30);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setVisibleCount(prev => Math.min(prev + 30, entries.length));
    }
  }, [entries.length]);

  return (
    <>
      {/* Column headers */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 16px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 2,
      }}>
        <span style={{ width: 22, fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}></span>
        <span style={{ flex: 1, fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, paddingLeft: 44 }}>PLAYER</span>
        <span style={{ width: 46, fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'right' }}>TOTAL</span>
        <span style={{ width: 46, fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'right' }}>TODAY</span>
        <span style={{ width: 40, fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'right' }}>THRU</span>
      </div>
      <div
        role="list"
        aria-label="Tournament leaderboard"
        className="expanded-lb-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          paddingTop: 4,
        }}
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {entries.slice(0, visibleCount).map((entry) => (
          <ExpandedLeaderboardRow
            key={entry.id}
            entry={entry}
            tourCode={tourCode}
            onPlayerTap={onPlayerTap}
          />
        ))}
      </div>

      {/* Explore below hint with bouncing arrow */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 12, paddingBottom: 6, opacity: 0.45 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          Tour Overview
        </span>
        <ChevronDown
          style={{
            width: 18, height: 18, color: 'rgba(255,255,255,0.5)',
            animation: 'heroChevronBounce 1.8s ease-in-out infinite',
          }}
        />
      </div>
    </>
  );
}
