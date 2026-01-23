import React from 'react';
import { cn } from '@/lib/utils';
import { Users, Swords } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { RivalMomentumBadge } from '../primitives';
import type { UserRival, UserChampionshipStatus } from '@/types/championship';

interface RivalsSectionProps {
  rivals: UserRival[];
  closestRival: UserChampionshipStatus['closest_rival'];
  isLoading?: boolean;
  className?: string;
}

/**
 * RivalsSection - Shows rivals above and below the user in rankings.
 */
export function RivalsSection({ 
  rivals, 
  closestRival, 
  isLoading,
  className 
}: RivalsSectionProps) {
  if (isLoading) {
    return (
      <div className={cn('px-4 py-3', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!rivals.length && !closestRival) {
    return null; // No rivals to show
  }

  return (
    <div className={cn('px-4 py-3', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Your Rivals</h3>
      </div>

      {/* Closest Rival Callout */}
      {closestRival && (
        <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  {closestRival.display_name}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {closestRival.gap > 0 
                    ? `${closestRival.gap} courses ahead` 
                    : `${Math.abs(closestRival.gap)} courses behind`}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              Closest Rival
            </span>
          </div>
        </div>
      )}

      {/* Rivals List */}
      {rivals.length > 0 && (
        <div className="space-y-2">
          {rivals.map((rival) => (
            <RivalRow key={rival.rival_user_id} rival={rival} />
          ))}
        </div>
      )}
    </div>
  );
}

function RivalRow({ rival }: { rival: UserRival }) {
  const initials = rival.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <SquircleAvatar
        size={40}
        src={rival.avatar_url}
        alt={rival.display_name}
        fallback={initials}
      />
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{rival.display_name}</div>
        <div className="text-xs text-muted-foreground">
          #{rival.current_rank} · {rival.courses_this_season} courses
        </div>
      </div>

      <div className="flex items-center gap-2">
        <RivalMomentumBadge 
          timesOvertaken={rival.times_overtaken}
          timesBeenOvertaken={rival.times_been_overtaken}
          size="sm"
        />
        <div className={cn(
          'text-sm font-semibold px-2 py-1 rounded-full',
          rival.gap > 0 
            ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
        )}>
          {rival.gap > 0 ? `+${rival.gap}` : rival.gap}
        </div>
      </div>
    </div>
  );
}
