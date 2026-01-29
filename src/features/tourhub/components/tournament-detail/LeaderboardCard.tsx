/**
 * LeaderboardCard - Premium glassmorphic leaderboard display
 * 
 * Features:
 * - Podium-style top 3 with metallic accents
 * - Clean row design with position badges
 * - Score to par color coding
 * - Player avatars with linking
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
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

// Score to par display with color coding
function ScoreToPar({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <span className={cn("text-slate-400", className)}>—</span>;
  
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  const colorClass = score < 0 
    ? 'text-red-600' 
    : score > 0 
      ? 'text-blue-600' 
      : 'text-slate-700';
  
  return <span className={cn(colorClass, "font-bold tabular-nums", className)}>{formatted}</span>;
}

// Position badge with podium styling
function PositionBadge({ position, tied, isMissedCut, status }: { 
  position: number; 
  tied?: boolean; 
  isMissedCut?: boolean;
  status?: string;
}) {
  const isTop3 = position <= 3 && !isMissedCut;
  const display = isMissedCut ? 'MC' : status === 'WD' ? 'WD' : tied ? `T${position}` : String(position);
  
  const podiumStyles: Record<number, string> = {
    1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow-md shadow-amber-500/30',
    2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-md shadow-slate-400/30',
    3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 shadow-md shadow-orange-500/30',
  };
  
  return (
    <div className={cn(
      "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
      isTop3 ? podiumStyles[position] : "bg-slate-100 text-slate-600"
    )}>
      {display}
    </div>
  );
}

// Individual leaderboard row
function LeaderboardRow({ 
  entry, 
  index,
  headshotMap,
}: { 
  entry: LeaderboardEntry; 
  index: number;
  headshotMap?: Map<string, string>;
}) {
  const isMissedCut = entry.status === 'MC' || entry.status === 'CUT';
  const isTop3 = entry.position <= 3 && !isMissedCut;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        to={`/tourhub/player/${entry.player?.id}`}
        className={cn(
          "flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-200",
          "hover:bg-slate-50 active:scale-[0.99]",
          isTop3 && "bg-slate-50/50",
          isMissedCut && "opacity-50"
        )}
      >
        {/* Position */}
        <PositionBadge 
          position={entry.position} 
          tied={entry.position_tied} 
          isMissedCut={isMissedCut}
          status={entry.status}
        />
        
        {/* Avatar */}
        <BatchPlayerAvatar
          playerId={entry.player?.id || ''}
          playerName={entry.player?.full_name || 'Unknown'}
          fallbackPhotoUrl={entry.player?.photo_url}
          headshotMap={headshotMap}
          size="sm"
        />
        
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold truncate text-slate-900",
            isTop3 ? "text-base" : "text-sm"
          )}>
            {entry.player?.full_name || 'Unknown'}
          </p>
        </div>
        
        {/* Score to Par */}
        <div className="text-right shrink-0 w-14">
          <ScoreToPar score={entry.score} className={isTop3 ? "text-lg" : "text-base"} />
        </div>
        
        {/* Thru (if in progress) */}
        {entry.thru !== null && entry.thru < 18 && (
          <div className="text-right shrink-0 w-12 hidden sm:block">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Thru {entry.thru}
            </span>
          </div>
        )}
        
        {/* Earnings */}
        {entry.money && entry.money > 0 && (
          <div className="text-right shrink-0 w-20 hidden md:block">
            <span className="text-xs font-medium text-emerald-600">
              ${(entry.money / 1000).toFixed(0)}K
            </span>
          </div>
        )}
        
        {/* Chevron */}
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </Link>
    </motion.div>
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
  const displayEntries = entries.slice(0, limit);
  const hasMore = entries.length > limit;
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
          </div>
          
          {onViewAll && hasMore && (
            <button 
              onClick={onViewAll}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      
      {/* Leaderboard rows */}
      <div className="divide-y divide-slate-100/50">
        {displayEntries.map((entry, index) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            index={index}
            headshotMap={headshotMap}
          />
        ))}
      </div>
      
      {/* Footer action */}
      {onViewAll && hasMore && (
        <button 
          onClick={onViewAll}
          className="w-full py-3 text-sm font-semibold text-emerald-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-100"
        >
          View Full Leaderboard
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
