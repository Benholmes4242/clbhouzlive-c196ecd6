/**
 * PremiumLeaderboardTab - Apple-grade leaderboard with podium
 * Top 3 showcase with podium styling, full leaderboard below
 */

import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard, RankBadge } from '../premium';
import { BatchPlayerAvatar } from '../PlayerAvatar';

interface LeaderboardEntry {
  id: string;
  position: number;
  position_tied?: boolean;
  player?: {
    id: string;
    full_name: string;
    country?: string;
    photo_url?: string;
  };
  score: number | null;
  strokes: number | null;
  thru: number | null;
  today?: number | null;
  money: number | null;
  status?: string;
}

interface PremiumLeaderboardTabProps {
  leaderboard: LeaderboardEntry[];
  cutLine?: number;
  headshotMap?: Map<string, string>;
}

// Format score with color
function formatScore(score: number | null) {
  if (score === null) return '—';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

// Podium card for top 3
function PodiumCard({ 
  entry, 
  rank,
  headshotMap,
}: { 
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  headshotMap?: Map<string, string>;
}) {
  const player = entry.player;
  if (!player) return null;

  const podiumColors = {
    1: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
    2: 'from-slate-400/20 to-slate-500/10 border-slate-400/30',
    3: 'from-orange-600/20 to-amber-600/10 border-orange-600/30',
  };

  const scoreColor = (entry.score || 0) < 0 
    ? 'text-[hsl(var(--th-accent-birdie))]' 
    : (entry.score || 0) > 0 
    ? 'text-[hsl(var(--th-accent-bogey))]' 
    : 'text-white';

  return (
    <Link to={`/tourhub/player/${player.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (rank - 1) * 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <GlassCard 
          className={cn(
            "p-4 relative overflow-hidden",
            `bg-gradient-to-b ${podiumColors[rank]}`
          )}
        >
          {/* Rank Badge */}
          <div className="absolute top-3 right-3">
            <RankBadge rank={rank} size="md" />
          </div>

          {/* Player */}
          <div className="flex items-center gap-3 mb-3">
            <BatchPlayerAvatar
              playerId={player.id}
              playerName={player.full_name}
              fallbackPhotoUrl={player.photo_url}
              headshotMap={headshotMap}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="th-title-2 text-white truncate">
                {player.full_name}
              </p>
              {player.country && (
                <p className="th-caption-1 text-white/50">
                  {player.country}
                </p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("th-display-m font-mono", scoreColor)}>
                {formatScore(entry.score)}
              </p>
            </div>
            <div className="text-right">
              {entry.thru !== null && entry.thru < 18 && (
                <p className="th-caption-1 text-white/50">Thru {entry.thru}</p>
              )}
              {entry.thru === 18 && (
                <p className="th-caption-1 text-white/50">F</p>
              )}
              {entry.today !== undefined && entry.today !== null && (
                <p className={cn(
                  "th-caption-1",
                  entry.today < 0 ? "text-[hsl(var(--th-accent-birdie))]" :
                  entry.today > 0 ? "text-[hsl(var(--th-accent-bogey))]" :
                  "text-white/50"
                )}>
                  Today {formatScore(entry.today)}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  );
}

// Regular leaderboard row
function LeaderboardRow({ 
  entry, 
  headshotMap,
}: { 
  entry: LeaderboardEntry;
  headshotMap?: Map<string, string>;
}) {
  const player = entry.player;
  if (!player) return null;

  const isMissedCut = entry.status === 'MC' || entry.status === 'CUT';
  const positionDisplay = entry.position_tied 
    ? `T${entry.position}` 
    : String(entry.position);

  const scoreColor = (entry.score || 0) < 0 
    ? 'text-[hsl(var(--th-accent-birdie))]' 
    : (entry.score || 0) > 0 
    ? 'text-[hsl(var(--th-accent-bogey))]' 
    : 'text-white';

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "flex items-center gap-3 py-3 px-3 rounded-lg transition-colors",
        "hover:bg-white/5",
        isMissedCut && "opacity-50"
      )}
    >
      {/* Position */}
      <div className="w-10 shrink-0 text-center">
        <span className="th-body font-semibold text-white/60">
          {isMissedCut ? 'MC' : positionDisplay}
        </span>
      </div>

      {/* Avatar */}
      <BatchPlayerAvatar
        playerId={player.id}
        playerName={player.full_name}
        fallbackPhotoUrl={player.photo_url}
        headshotMap={headshotMap}
        size="sm"
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="th-body text-white truncate">
          {player.full_name}
        </p>
      </div>

      {/* Score */}
      <div className="w-12 text-right shrink-0">
        <span className={cn("th-body font-semibold font-mono", scoreColor)}>
          {formatScore(entry.score)}
        </span>
      </div>

      {/* Thru */}
      <div className="w-12 text-right shrink-0 hidden sm:block">
        <span className="th-caption-1 text-white/50">
          {entry.thru === 18 ? 'F' : entry.thru !== null ? `Thru ${entry.thru}` : '—'}
        </span>
      </div>

      {/* Strokes */}
      {entry.strokes && (
        <div className="w-10 text-right shrink-0 hidden md:block">
          <span className="th-body-small text-white/40">
            {entry.strokes}
          </span>
        </div>
      )}
    </Link>
  );
}

export function PremiumLeaderboardTab({ 
  leaderboard, 
  cutLine,
  headshotMap,
}: PremiumLeaderboardTabProps) {
  if (leaderboard.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Trophy className="w-7 h-7 text-white/40" />
        </div>
        <h3 className="th-title-2 text-white mb-1">Leaderboard Coming Soon</h3>
        <p className="th-body-small text-white/50">
          Leaderboard data will appear once the tournament begins.
        </p>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div>
        <h3 className="th-caption-2 text-white/50 mb-3">TOP 3 PODIUM</h3>
        <div className="space-y-3">
          {top3.map((entry, index) => (
            <PodiumCard
              key={entry.id}
              entry={entry}
              rank={(index + 1) as 1 | 2 | 3}
              headshotMap={headshotMap}
            />
          ))}
        </div>
      </div>

      {/* Cut Line (if applicable) */}
      {cutLine !== undefined && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-red-500/30" />
          <span className="th-caption-2 text-red-400">
            CUT LINE: {formatScore(cutLine)}
          </span>
          <div className="flex-1 h-px bg-red-500/30" />
        </div>
      )}

      {/* Full Leaderboard */}
      {remaining.length > 0 && (
        <div>
          <h3 className="th-caption-2 text-white/50 mb-3">FULL LEADERBOARD</h3>
          
          {/* Header */}
          <div className="flex items-center gap-3 py-2 px-3 text-xs font-medium text-white/40 uppercase tracking-wide">
            <div className="w-10 shrink-0 text-center">Pos</div>
            <div className="w-8 shrink-0"></div>
            <div className="flex-1">Player</div>
            <div className="w-12 text-right shrink-0">To Par</div>
            <div className="w-12 text-right shrink-0 hidden sm:block">Thru</div>
            <div className="w-10 text-right shrink-0 hidden md:block">Total</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {remaining.map(entry => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                headshotMap={headshotMap}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
