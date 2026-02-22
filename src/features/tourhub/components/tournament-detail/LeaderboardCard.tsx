/**
 * LeaderboardCard - Overview leaderboard preview (no card container)
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { TOUR_COLORS } from '../../constants/colors';

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
  if (score === null) return <span className={cn("text-muted-foreground/70", className)}>—</span>;
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  return (
    <span 
      className={cn("score-mono font-bold tabular-nums", className)}
      style={{ 
        color: score < 0 
          ? TOUR_COLORS.scoreUnderPar 
          : score > 0 
            ? 'hsl(var(--foreground))' 
            : 'hsl(var(--muted-foreground))' 
      }}
    >
      {formatted}
    </span>
  );
}

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
      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
      isTop3 ? podiumStyles[position] : "bg-muted text-muted-foreground"
    )}>
      {display}
    </div>
  );
}

function ThruDisplay({ thru }: { thru: number | null }) {
  if (thru === null) return null;
  if (thru >= 18) {
    return <span className="text-[10px] text-emerald-600 font-medium">F</span>;
  }
  return (
    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
      {thru}
    </span>
  );
}

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
          "flex items-center gap-3 py-3 transition-all duration-200",
          "hover:bg-muted/40 active:scale-[0.99] rounded-lg px-1",
          isMissedCut && "opacity-50"
        )}
      >
        <PositionBadge 
          position={entry.position} 
          tied={entry.position_tied} 
          isMissedCut={isMissedCut}
          status={entry.status}
        />
        
        <BatchPlayerAvatar
          playerId={entry.player?.id || ''}
          playerName={entry.player?.full_name || 'Unknown'}
          size="sm"
        />
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold truncate text-foreground",
            isTop3 ? "text-[15px]" : "text-[14px]"
          )}>
            {entry.player?.full_name || 'Unknown'}
          </p>
        </div>
        
        {/* Thru */}
        <div className="text-right shrink-0 w-10">
          <ThruDisplay thru={entry.thru} />
        </div>
        
        {/* Score to Par */}
        <div className="text-right shrink-0 w-14">
          <ScoreToPar score={entry.score} className={isTop3 ? "text-[17px]" : "text-[15px]"} />
        </div>
        
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
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
  const displayEntries = limit === 0 ? entries : entries.slice(0, limit);
  const hasMore = limit > 0 && entries.length > limit;
  
  return (
    <motion.div 
      className="py-6 border-t border-border"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
          </div>
          
          {onViewAll && hasMore && (
            <button 
              onClick={onViewAll}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-0.5 active:scale-[0.97] transition-transform"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      
      {/* Leaderboard rows */}
      <div className="divide-y divide-border/40">
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
          className="w-full py-3 mt-3 text-[14px] font-semibold text-foreground/60 rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-center gap-1 active:scale-[0.97] transition-transform"
        >
          View Full Leaderboard
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
