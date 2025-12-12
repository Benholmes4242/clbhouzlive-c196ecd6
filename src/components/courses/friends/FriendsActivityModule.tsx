import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { Trophy, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlayerEntry {
  id: string;
  name: string;
  avatarUrl?: string | null;
  rounds: number;
  lastPlayedAt?: string | null;
  rank: number;
}

interface FriendsActivityModuleProps {
  title?: string;
  subtitle?: string;
  timeframeLabel: string;
  players: PlayerEntry[];
  onTimeframeChange?: (v: string) => void;
  onViewAll?: () => void;
}

const FriendsActivityModule: React.FC<FriendsActivityModuleProps> = ({
  title = 'Friends activity',
  subtitle = 'Top players this period',
  timeframeLabel,
  players,
  onTimeframeChange,
  onViewAll,
}) => {
  const navigate = useNavigate();

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-[2px] text-xs font-semibold text-amber-700">
          #{rank}
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-[2px] text-xs font-semibold text-slate-700">
          #{rank}
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-[2px] text-xs font-semibold text-orange-600">
          #{rank}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-border/40 bg-background/40 px-2 py-[2px] text-xs font-medium text-muted-foreground">
        #{rank}
      </span>
    );
  };

  if (players.length === 0) {
    return null;
  }

  return (
    <div className="rounded-sq-md bg-card/50 border border-border/20 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-50 border border-amber-200">
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {onTimeframeChange ? (
          <Select value={timeframeLabel} onValueChange={onTimeframeChange}>
            <SelectTrigger className="h-7 px-3 rounded-full border border-border/40 bg-background/60 backdrop-blur-sm text-xs font-medium w-auto gap-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="Top 5">Top 5</SelectItem>
              <SelectItem value="Top 10">Top 10</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="h-7 px-3 rounded-full border border-border/40 bg-background/60 backdrop-blur-sm text-xs font-medium flex items-center">
            {timeframeLabel}
          </span>
        )}
      </div>

      {/* List rows */}
      <div>
        {players.map((player, idx) => (
          <div
            key={player.id}
            onClick={() => navigate(`/user/${player.name}`)}
            className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer border-t border-border/15"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Squircle width={40} height={40} className="shrink-0">
                <img
                  src={player.avatarUrl || '/placeholder.svg'}
                  alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </Squircle>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {player.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.rounds} round{player.rounds !== 1 ? 's' : ''}
                  {player.lastPlayedAt && (
                    <>
                      {' '}
                      · Last played{' '}
                      {formatDistanceToNow(new Date(player.lastPlayedAt), {
                        addSuffix: true,
                      })}
                    </>
                  )}
                </p>
              </div>
            </div>

            {getRankBadge(player.rank)}
          </div>
        ))}
      </div>

      {/* View all CTA row */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border-t border-border/15 transition-colors"
        >
          View all players
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FriendsActivityModule;
