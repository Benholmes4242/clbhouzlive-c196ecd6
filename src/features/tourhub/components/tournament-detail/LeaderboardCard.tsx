/**
 * LeaderboardCard - Dispatch table preview (no card container)
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BatchPlayerAvatar } from '../PlayerAvatar';

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
      {/* Section rule marker */}
      {showHeader && (
        <div style={{ padding: '0 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
              {title}
            </span>
            {onViewAll && (
              <button onClick={onViewAll} style={{ fontSize: '11px', fontWeight: 700, color: '#F7931E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                View all ›
              </button>
            )}
          </div>
        </div>
      )}

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
        <span style={{ width: '36px', fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>POS</span>
        <span style={{ flex: 1, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>PLAYER</span>
        <span style={{ width: '36px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>THRU</span>
        <span style={{ width: '44px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>SCORE</span>
      </div>

      {/* Rows */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
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
                to={`/tourhub/player/${entry.player?.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '10px 20px',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  borderLeft: entry.position === 1 ? '3px solid #F7931E' : '3px solid transparent',
                  background: entry.position === 1 ? 'rgba(247,147,30,0.025)' : 'transparent',
                  textDecoration: 'none',
                  opacity: isMissedCut ? 0.5 : 1,
                }}
                className="active:bg-black/[0.02] transition-colors"
              >
                {/* Position */}
                <span style={{ width: '36px', fontSize: '14px', fontWeight: 900, color: entry.position === 1 ? '#F7931E' : '#94A3B8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
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
          style={{ width: '100%', padding: '10px 0', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: 'transparent', border: 'none', borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer' }}
          className="active:opacity-70 transition-opacity"
        >
          Full Leaderboard ›
        </button>
      )}
    </motion.div>
  );
}
