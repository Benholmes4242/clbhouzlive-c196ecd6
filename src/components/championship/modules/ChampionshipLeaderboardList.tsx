import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MedalBadge, RankMovementIndicator, ZoneIndicator, StatusRing } from '../primitives';
import type { ChampionshipLeaderboardEntry } from '@/types/championship';

interface ChampionshipLeaderboardListProps {
  entries: ChampionshipLeaderboardEntry[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

/**
 * ChampionshipLeaderboardList - Renders the leaderboard rows.
 */
export function ChampionshipLeaderboardList({
  entries,
  isLoading,
  hasNextPage,
  onLoadMore,
  className,
}: ChampionshipLeaderboardListProps) {
  if (isLoading && entries.length === 0) {
    return (
      <div className={cn('px-4', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="py-3 animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="w-11 h-11 rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('px-4 py-12 text-center', className)}>
        <p className="text-muted-foreground">No players found</p>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {entries.map((entry) => (
        <LeaderboardRow key={entry.user_id} entry={entry} />
      ))}
      
      {hasNextPage && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full py-4 text-sm text-primary font-medium hover:bg-muted/30 transition-colors"
        >
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: ChampionshipLeaderboardEntry }) {
  const navigate = useNavigate();

  const initials = entry.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${entry.user_id}?tab=top100`)}
      className={cn(
        'w-full px-4 py-3 flex items-center gap-3 transition-colors',
        entry.is_current_user && 'bg-primary/5',
        'hover:bg-muted/20 active:bg-muted/30'
      )}
    >
      {/* Rank Badge */}
      <MedalBadge rank={entry.current_rank} size="md" />

      {/* Avatar with Division Ring */}
      <StatusRing
        divisionSlug={entry.division_slug}
        divisionColor={entry.division_color}
        size="md"
      >
        <SquircleAvatar
          size={40}
          src={entry.avatar_url}
          alt={entry.display_name}
          fallback={initials}
        />
      </StatusRing>

      {/* Name & Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            entry.is_current_user && 'font-semibold'
          )}>
            {entry.display_name}
          </span>
          {entry.zone && entry.zone !== 'safe' && (
            <ZoneIndicator zone={entry.zone} size="sm" showLabel={false} />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{entry.courses_this_season} courses</span>
          {entry.home_club && (
            <>
              <span>·</span>
              <span className="truncate">{entry.home_club}</span>
            </>
          )}
        </div>
      </div>

      {/* Movement Indicator */}
      <RankMovementIndicator
        movement={entry.rank_movement}
        period={entry.movement_period}
        size="sm"
      />
    </button>
  );
}
