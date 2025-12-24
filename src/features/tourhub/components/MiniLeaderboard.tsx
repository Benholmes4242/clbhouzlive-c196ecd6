import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PremiumEmptyState } from './PremiumEmptyState';

interface LeaderboardEntry {
  position: string;
  athleteId?: string;
  playerName: string;
  score: string;
  today?: string;
  thru?: string;
}

interface MiniLeaderboardProps {
  leaders: LeaderboardEntry[];
  limit?: number;
  className?: string;
  emptyMessage?: string;
}

export function MiniLeaderboard({ 
  leaders, 
  limit = 5, 
  className,
  emptyMessage = "Leaderboard will appear when play begins."
}: MiniLeaderboardProps) {
  if (!leaders || leaders.length === 0) {
    return (
      <div className={cn("bg-surface-alt border border-border-subtle rounded-sq-md p-4", className)}>
        <p className="text-body-sm text-text-tertiary text-center">{emptyMessage}</p>
      </div>
    );
  }
  
  const displayLeaders = leaders.slice(0, limit);
  
  return (
    <div className={cn("bg-surface-alt border border-border-subtle rounded-sq-md overflow-hidden", className)}>
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_60px_50px_50px] gap-2 px-3 py-2 text-meta text-text-tertiary uppercase tracking-wide border-b border-border-subtle">
        <span>Pos</span>
        <span>Player</span>
        <span className="text-right">Score</span>
        <span className="text-right">Today</span>
        <span className="text-right">Thru</span>
      </div>
      
      {/* Rows */}
      {displayLeaders.map((entry, idx) => (
        <div
          key={`${entry.position}-${entry.playerName}-${idx}`}
          className={cn(
            "grid grid-cols-[40px_1fr_60px_50px_50px] gap-2 px-3 py-2.5 text-body-sm",
            idx % 2 === 0 ? "bg-surface-card" : "bg-surface-alt"
          )}
        >
          <span className="font-semibold text-text-primary">{entry.position}</span>
          {entry.athleteId ? (
            <Link 
              to={`/tourhub/player/${entry.athleteId}`}
              className="text-text-primary hover:text-primary-accent truncate font-medium transition-colors"
            >
              {entry.playerName}
            </Link>
          ) : (
            <span className="text-text-primary truncate">{entry.playerName}</span>
          )}
          <span className="text-right font-semibold text-text-primary">{entry.score}</span>
          <span className="text-right text-text-secondary">{entry.today || '-'}</span>
          <span className="text-right text-text-tertiary">{entry.thru || '-'}</span>
        </div>
      ))}
    </div>
  );
}
