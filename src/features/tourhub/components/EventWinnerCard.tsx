/**
 * EventWinnerCard - Display tournament winner with narrative
 */

import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  if (toPar === 0) return `${score} (E)`;
  if (toPar < 0) return `${score} (${toPar})`;
  return `${score} (+${toPar})`;
}

export function EventWinnerCard({ tournamentId, className }: EventWinnerCardProps) {
  const { data: winner, isLoading } = useEventWinner(tournamentId);
  
  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!winner || !winner.player) {
    return null;
  }
  
  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Champion
        </span>
      </div>
      
      <Link 
        to={`/tourhub/player/${winner.player.id}`}
        className="group block"
      >
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl border border-amber-500/20 transition-all group-hover:border-amber-500/40 group-hover:shadow-lg">
          {/* Avatar */}
          <PlayerAvatar
            playerId={winner.player.id}
            playerName={winner.player.full_name}
            fallbackPhotoUrl={winner.player.photo_url}
            size="lg"
            className="border-2 border-amber-500/30"
          />
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground group-hover:text-amber-600 transition-colors truncate">
              {winner.player.full_name}
            </h3>
            
            {winner.player.country && (
              <p className="text-sm text-muted-foreground truncate">
                {winner.player.country.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
              </p>
            )}
            
            {/* Score line */}
            <div className="flex items-center gap-3 mt-1.5 text-sm">
              <span className="font-semibold text-foreground">
                {formatScore(winner.winning_score, winner.score_to_par)}
              </span>
              
              {winner.margin && winner.margin > 0 && (
                <span className="text-muted-foreground">
                  Won by {winner.margin} {winner.margin === 1 ? 'shot' : 'shots'}
                </span>
              )}
              
              {winner.is_playoff && (
                <span className="px-2 py-0.5 bg-red-500/15 text-red-600 text-xs rounded-full font-medium">
                  Playoff
                </span>
              )}
            </div>
          </div>
          
          {/* Trophy indicator */}
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        
        {/* Headline / Narrative */}
        {winner.headline && (
          <p className="mt-3 text-sm text-muted-foreground italic">
            "{winner.headline}"
          </p>
        )}
      </Link>
    </div>
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
