/**
 * LeaderboardCard - Dispatch table preview (no card container)
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { playerRoute } from '../../routes';
import { INK_TINT_07, SCORE_UNDER_PAR_LIGHT, SCORE_OVER_PAR_LIGHT, INK_FAINT, INK_MUTE, LEADER_GOLD_TINT_10, AMBER } from '../../_shared/tokens';

function abbrevName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}`;
}

interface LeaderboardEntry {
  id: string;
  position: number;
  position_tied?: boolean;
  score: number | null;
  strokes: number | null;
  thru: number | null;
  money: number | null;
  status?: string;
  player?: {
    id: string;
    full_name: string;
    photo_url?: string | null;
  };
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  headshotMap?: Map<string, string>;
  onViewAll?: () => void;
  limit?: number;
  showHeader?: boolean;
  title?: string;
  tournamentName?: string;
}

function ScoreToPar({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <span className={cn("", className)} style={{ color: '#94A3B8' }}>—</span>;
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  return (
    <span
      className={cn("font-bold", className)}
      style={{
        fontVariantNumeric: 'tabular-nums',
        color: score < 0 ? '#F7931E' : score > 0 ? '#EF4444' : '#94A3B8',
      }}
    >
      {formatted}
    </span>
  );
}

function ThruDisplay({ thru }: { thru: number | null }) {
  if (thru === null || thru === 0) return null;
  if (thru >= 18) {
    return <span style={{ fontSize: '10px', fontWeight: 600, color: '#F7931E' }}>F</span>;
  }
  return (
    <span style={{ fontSize: '10px', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
      Thru {thru}
    </span>
  );
}

export function LeaderboardCard({
  entries,
  headshotMap,
  onViewAll,
  limit = 10,
  showHeader = true,
  title = "Leaderboard",
  tournamentName,
}: LeaderboardCardProps) {
  const displayEntries = limit === 0 ? entries : entries.slice(0, limit);
  const hasMore = limit > 0 && entries.length > limit;

  return (
    <motion.div
      style={{ marginTop: 0 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      {/* Section header */}
      {showHeader && (
        <div style={{ padding: '0 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B', letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
              {title}
            </span>
            {onViewAll && (
              <button onClick={onViewAll} style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '-0.005em', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                View all
                <ChevronRight size={14} strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `0.5px solid ${INK_TINT_07}` }}>
        <span style={{ width: '36px', fontSize: '9px', fontWeight: 800, color: '#64748B', letterSpacing: '0.14em', flexShrink: 0 }}>POS</span>
        <span style={{ flex: 1, fontSize: '9px', fontWeight: 800, color: '#64748B', letterSpacing: '0.14em' }}>PLAYER</span>
        <span style={{ width: '36px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: '#64748B', letterSpacing: '0.14em', flexShrink: 0 }}>THRU</span>
        <span style={{ width: '44px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: '#64748B', letterSpacing: '0.14em', flexShrink: 0 }}>SCORE</span>
      </div>

      {/* Rows */}
      <div style={{ background: '#ffffff', borderBottom: `1px solid ${INK_TINT_07}` }}>
        {displayEntries.map((entry, index) => {
          const isMissedCut = entry.status === 'MC' || entry.status === 'CUT';

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
            >
              <Link
                {...playerRoute(entry.player?.id ?? '', tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '10px 20px',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  borderLeft: entry.position === 1 ? '3px solid #F7931E' : '3px solid transparent',
                  background: entry.position === 1 ? 'rgba(247,147,30,0.025)' : 'transparent',
                  textDecoration: 'none',
                  opacity: isMissedCut ? 0.5 : 1,
                }}
                className="active:bg-black/[0.02] transition-colors"
              >
                {/* Position */}
                <span style={{ width: '36px', fontSize: '14px', fontWeight: 800, color: entry.position === 1 ? '#F7931E' : '#94A3B8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {isMissedCut ? 'MC' : entry.status === 'WD' ? 'WD' : entry.position_tied ? `T${entry.position}` : String(entry.position)}
                </span>

                {/* Avatar + name */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <BatchPlayerAvatar playerId={entry.player?.id || ''} playerName={entry.player?.full_name || 'Unknown'} size="sm" />
                  <p style={{ fontSize: '14px', fontWeight: entry.position === 1 ? 800 : 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {entry.player?.full_name}
                  </p>
                </div>

                {/* Thru */}
                <div style={{ width: '36px', textAlign: 'center' as const, flexShrink: 0 }}>
                  <ThruDisplay thru={entry.thru} />
                </div>

                {/* Score to par */}
                <div style={{ width: '44px', textAlign: 'center' as const, flexShrink: 0 }}>
                  <ScoreToPar score={entry.score} className="text-[14px]" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* View All button */}
      {onViewAll && hasMore && (
        <button
          onClick={onViewAll}
          style={{ width: '100%', padding: '12px 0', fontSize: '11px', fontWeight: 800, color: '#0F172A', background: 'transparent', border: 'none', borderTop: `0.5px solid ${INK_TINT_07}`, cursor: 'pointer', letterSpacing: '-0.005em', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}
          className="active:opacity-70 transition-opacity"
        >
          Full Leaderboard
          <ChevronRight size={14} strokeWidth={2.25} />
        </button>
      )}
    </motion.div>
  );
}
