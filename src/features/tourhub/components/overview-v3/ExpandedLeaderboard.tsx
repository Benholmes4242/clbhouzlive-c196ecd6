/**
 * ExpandedLeaderboard — Full-field leaderboard rendered inside the hero glass card
 * Dark-glass aesthetic with sticky column headers and internal scrolling.
 */

import React, { useState, useCallback } from 'react';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import type { Database } from '@/integrations/supabase/types';

// Derive types from the actual Supabase schema
type SrLeaderboardRow = Database['public']['Tables']['sr_leaderboards']['Row'];
type SrPlayerRow = Database['public']['Tables']['sr_players']['Row'];

export interface LeaderboardEntryWithPlayer extends SrLeaderboardRow {
  player: SrPlayerRow | null;
}

// Match mini leaderboard: all scores are white
function getScoreColor(_toPar: number | null): string {
  return '#FFFFFF';
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
    <div className="expanded-lb-scroll" style={{ flex: 1, padding: '0 16px' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 rounded" style={{ background: 'rgba(255,255,255,0.08)', animation: 'shimmer 1.8s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
            <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="w-24 h-3 rounded" style={{ background: 'rgba(255,255,255,0.08)', animation: 'shimmer 1.8s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-3 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="w-5 h-3 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>
      ))}
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
      <span style={{ width: 56, textAlign: 'right', flexShrink: 0 }}>TO PAR</span>
      <span style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>THRU</span>
    </div>
  );
});

// Single player row
const ExpandedLeaderboardRow = React.memo(function ExpandedLeaderboardRow({ entry, tourCode }: { entry: LeaderboardEntryWithPlayer; tourCode: string }) {
  const player = entry.player;
  if (!player) return null;

  const firstName = player.first_name || '';
  const lastName = player.last_name || '';
  const displayName = firstName && firstName[0]
    ? `${firstName[0]}. ${lastName}`
    : lastName || 'Unknown';
  const fullName = player.full_name || `${firstName} ${lastName}`.trim();
  const photoUrl = getPlayerHeadshotUrl(fullName, tourCode);
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  const posDisplay = entry.position_tied ? `T${entry.position}` : `${entry.position ?? '-'}`;
  const thruDisplay = formatThru(entry);
  const isCut = entry.status === 'cut' || entry.status === 'wd' || entry.status === 'dq';
  const isLeader = entry.position === 1;
  const isChaser = !isLeader;

  return (
    <div
      role="listitem"
      className="flex items-center"
      style={{
        padding: isLeader ? '10px 16px' : '10px 16px',
        borderBottom: isLeader ? 'none' : '1px solid rgba(255,255,255,0.06)',
        opacity: isCut ? 0.4 : 1,
        ...(isLeader ? {
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          margin: '0 8px',
          padding: '10px 8px',
        } : {}),
      }}
    >
      {/* Position — matches .leaderboard-position / chaser dimming */}
      <span style={{
        width: 22,
        textAlign: 'center',
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 600,
        color: isChaser ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {posDisplay}
      </span>

      {/* Avatar + Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: 4 }}>
        <div
          className="overflow-hidden flex-shrink-0"
          style={{ width: 32, height: 33, borderRadius: '34%', border: '1.5px solid #F8FAFC', background: '#F8FAFC' }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#F8FAFC', fontSize: 8, fontWeight: 600, color: '#64748B' }}>{initials}</div>
          )}
        </div>
        <span className="truncate" style={{
          fontSize: 14,
          fontWeight: isLeader ? 700 : 500,
          color: isChaser ? 'rgba(255,255,255,0.85)' : '#FFFFFF',
        }}>
          {displayName}
        </span>
      </div>

      {/* To Par — matches .leaderboard-score sizing */}
      <span style={{
        width: 56,
        textAlign: 'right',
        flexShrink: 0,
        fontFamily: "'JetBrains Mono','SF Mono','Courier New',monospace",
        fontSize: isLeader ? 22 : 16,
        fontWeight: isLeader ? 800 : 700,
        color: '#FFFFFF',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatScore(entry.score ?? null)}
      </span>

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
    </div>
  );
});
interface ExpandedLeaderboardListProps {
  entries: LeaderboardEntryWithPlayer[];
  tourCode: string;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function ExpandedLeaderboardList({ entries, tourCode, onTouchStart, onTouchMove, onTouchEnd }: ExpandedLeaderboardListProps) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setVisibleCount(prev => Math.min(prev + 30, entries.length));
    }
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 10);
  }, [entries.length]);

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
          paddingTop: 8,
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
          />
        ))}
      </div>
      {/* Bottom fade gradient */}
      {!isAtBottom && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.45))',
            borderRadius: '0 0 16px 16px',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
}
