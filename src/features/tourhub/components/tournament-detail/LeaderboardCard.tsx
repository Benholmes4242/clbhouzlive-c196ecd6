/**
 * LeaderboardCard - Premium leaderboard display (overview compact mode)
 * 
 * Features:
 * - Glass card treatment
 * - Podium-style top 3 with metallic accents
 * - Clean row design with position badges
 * - Score to par color coding (PGA convention)
 * - Player avatars with linking
 * - Section entrance animation (whileInView)
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

// Score to par display with PGA convention colors
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
            ? TOUR_COLORS.scoreOverPar 
            : TOUR_COLORS.scoreEven 
      }}
    >
      {formatted}
    </span>
  );
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
      isTop3 ? podiumStyles[position] : "bg-muted text-muted-foreground"
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
          "hover:bg-muted active:scale-[0.99]",
          isTop3 && "bg-muted/50",
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
            "font-semibold truncate text-foreground",
            isTop3 ? "text-[15px]" : "text-[14px]"
          )}>
            {entry.player?.full_name || 'Unknown'}
          </p>
        </div>
        
        {/* Score to Par */}
        <div className="text-right shrink-0 w-14">
          <ScoreToPar score={entry.score} className={isTop3 ? "text-[17px]" : "text-[15px]"} />
        </div>
        
        {/* Thru (if in progress) */}
        {entry.thru !== null && entry.thru < 18 && (
          <div className="text-right shrink-0 w-12 hidden sm:block">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
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
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      </Link>
    </motion.div>
  );
}

const cardClass = "rounded-2xl overflow-hidden border border-border/40 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]";

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
      className={cardClass}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          </div>
          
          {onViewAll && hasMore && (
            <button 
              onClick={onViewAll}
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 active:scale-[0.97] transition-transform"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      
      {/* Leaderboard rows */}
      <div className="divide-y divide-border/20">
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
          className="w-full py-3 text-[13px] font-semibold text-primary bg-primary/5 border-t border-border/30 rounded-b-2xl hover:bg-primary/10 transition-colors flex items-center justify-center gap-1 active:scale-[0.97] transition-transform"
        >
          View Full Leaderboard
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}