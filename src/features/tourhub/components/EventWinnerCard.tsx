/**
 * EventWinnerCard - Display tournament winner with premium styling
 * 
 * Features:
 * - Glass card treatment
 * - Tap feedback on Link wrapper
 * - Semantic token compliance (no hardcoded slates)
 * - Section entrance animation (whileInView)
 */

import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEventWinner } from '../hooks/useEventWinner';
import { PlayerAvatar } from './PlayerAvatar';

interface EventWinnerCardProps {
  tournamentId: string;
  className?: string;
}

function formatScore(score: number | null, toPar: number | null): string {
  if (score === null) return '—';
  if (toPar === null) return String(score);
  const parDisplay = toPar === 0 ? 'E' : toPar < 0 ? String(toPar) : `+${toPar}`;
  return `${score} (${parDisplay})`;
}

function formatEarnings(money: number | null | undefined): string {
  if (!money) return '';
  if (money >= 1_000_000) {
    return `$${(money / 1_000_000).toFixed(2)}M`;
  }
  return `$${money.toLocaleString()}`;
}

const sectionEntrance = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' as const },
  transition: { duration: 0.35 },
};

export function EventWinnerCard({ tournamentId, className }: EventWinnerCardProps) {
  const { data: winner, isLoading } = useEventWinner(tournamentId);
  
  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-xl">
          <div className="w-20 h-20 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  // Premium pending state when no winner data yet
  if (!winner) {
    return (
      <motion.div className={cn("", className)} {...sectionEntrance}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Champion
          </span>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-foreground/50 to-foreground/30 rounded-xl border border-foreground/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-foreground/30 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-500/60" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white/80">Champion unlocking soon</h3>
              <p className="text-sm text-white/50 mt-0.5">
                Official results will appear once the event concludes
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Winner exists but no player linked (pending data)
  if (!winner.player) {
    return (
      <motion.div className={cn("", className)} {...sectionEntrance}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Champion
          </span>
        </div>
        
        <div className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{winner.headline || 'Champion crowned'}</h3>
              {winner.narrative && (
                <p className="text-sm text-muted-foreground mt-0.5">{winner.narrative}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Full winner display with player linked
  return (
    <motion.div className={cn("", className)} {...sectionEntrance}>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Champion
        </span>
      </div>
      
      <Link 
        to={`/tourhub/player/${winner.player.id}`}
        className="group block active:scale-[0.98] transition-transform"
      >
        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-amber-600/5 rounded-xl border-2 border-amber-500/30 transition-all group-hover:border-amber-500/50 group-hover:shadow-lg group-hover:shadow-amber-500/10">
          {/* Subtle gold shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="relative flex items-center gap-5">
            {/* Large Avatar with gold ring */}
            <div className="relative">
              <PlayerAvatar
                playerId={winner.player.id}
                playerName={winner.player.full_name}
                fallbackPhotoUrl={winner.player.photo_url}
                size="xl"
                className="ring-4 ring-amber-500/40 ring-offset-2 ring-offset-background"
              />
              {/* Trophy badge overlay */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl text-foreground group-hover:text-amber-600 transition-colors truncate">
                {winner.player.full_name}
              </h3>
              
              {winner.player.country && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {winner.player.country.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                </p>
              )}
              
              {/* Score line */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-lg font-bold text-foreground">
                  {formatScore(winner.winning_score, winner.score_to_par)}
                </span>
                
                {winner.margin && winner.margin > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Won by {winner.margin} {winner.margin === 1 ? 'stroke' : 'strokes'}
                  </span>
                )}
                
                {winner.is_playoff && (
                  <span className="px-2 py-0.5 bg-red-500/15 text-red-600 text-xs rounded-full font-semibold">
                    Playoff
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Headline / Narrative */}
          {winner.headline && !winner.headline.includes('Champion crowned') && (
            <p className="mt-4 pt-4 border-t border-amber-500/20 text-sm text-muted-foreground italic">
              "{winner.headline}"
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * Compact winner display for list views
 */
interface CompactWinnerProps {
  winner: {
    player_id: string;
    player?: {
      id: string;
      full_name: string;
      country: string | null;
      photo_url: string | null;
    };
    winning_score: number | null;
    score_to_par: number | null;
    is_playoff: boolean;
  };
  className?: string;
}

export function CompactWinner({ winner, className }: CompactWinnerProps) {
  if (!winner.player) return null;
  
  return (
    <Link 
      to={`/tourhub/player/${winner.player.id}`}
      className={cn(
        "flex items-center gap-2 text-sm hover:text-primary transition-colors",
        className
      )}
    >
      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span className="font-medium text-foreground truncate">
        {winner.player.full_name}
      </span>
      {winner.is_playoff && (
        <span className="text-[10px] text-red-500 font-medium shrink-0">(P)</span>
      )}
    </Link>
  );
}