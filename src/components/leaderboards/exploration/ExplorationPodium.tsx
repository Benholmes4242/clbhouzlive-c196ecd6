import { Link } from 'react-router-dom';
import { Crown, Globe } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/clbhouzAchievementPalette';
import type { ExplorationLeaderboardEntry, ExplorationMetric } from '@/types/leaderboards';
import { cn } from '@/lib/utils';

interface ExplorationPodiumProps {
  entries: ExplorationLeaderboardEntry[];
  metric: ExplorationMetric;
  currentUserId?: string;
}

const getMetricValue = (entry: ExplorationLeaderboardEntry, metric: ExplorationMetric): number => {
  switch (metric) {
    case 'continents':
      return entry.continents_count;
    default:
      return entry.countries_count;
  }
};

const getMetricLabel = (metric: ExplorationMetric): string => {
  switch (metric) {
    case 'continents':
      return 'continents';
    default:
      return 'countries';
  }
};

export function ExplorationPodium({ entries, metric, currentUserId }: ExplorationPodiumProps) {
  if (entries.length < 3) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
          <Globe className="w-8 h-8 text-teal-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Not enough explorers yet!
        </p>
      </div>
    );
  }

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  const arranged = [second, first, third];
  const positions = [2, 1, 3] as const;

  return (
    <div className="relative pt-10 pb-4">
      {/* Crown above #1 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
        <Crown className="w-7 h-7 text-amber-500" />
      </div>

      {/* Teal ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center 30%, rgba(20, 184, 166, 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Podium layout: 2nd - 1st - 3rd */}
      <div className="relative flex items-end justify-center gap-3">
        {arranged.map((entry, idx) => {
          const position = positions[idx];
          const isFirst = position === 1;
          const isCurrentUser = entry.user_id === currentUserId;
          const metricValue = getMetricValue(entry, metric);
          
          // Size based on position (matching Championship)
          const avatarSize = isFirst ? 80 : 64;
          
          // Ring color based on courses played (matching Championship)
          const ringColor = getRingColorForTotalPlayed(entry.courses_count);

          const initials = (entry.display_name || 'G')
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';

          return (
            <Link
              key={entry.user_id}
              to={`/profile/${entry.user_id}`}
              className={cn(
                'flex flex-col items-center transition-transform hover:scale-105',
                isFirst ? 'mb-4' : ''
              )}
            >
              {/* Avatar with milestone-based ring */}
              <div className="relative">
                <SquircleAvatar
                  size={avatarSize}
                  src={entry.avatar_url}
                  alt={entry.display_name || 'Golfer'}
                  fallback={initials}
                  ringColor={ringColor}
                />
                
                {/* Position badge - squircle shape (matching Championship) */}
                <div 
                  className={cn(
                    "absolute -bottom-2 left-1/2 -translate-x-1/2",
                    "flex items-center justify-center",
                    "text-sm font-bold text-white shadow-md",
                    position === 1 && "bg-amber-500",
                    position === 2 && "bg-slate-400",
                    position === 3 && "bg-orange-400",
                  )}
                  style={{
                    width: '28px',
                    aspectRatio: '1 / 1.05',
                    borderRadius: '34%',
                  }}
                >
                  {position}
                </div>
              </div>

              {/* Name */}
              <div className="text-center mt-3">
                <p className={cn(
                  "font-semibold truncate max-w-[100px]",
                  isFirst ? "text-sm" : "text-xs",
                  isCurrentUser && "text-primary"
                )}>
                  {entry.display_name || 'Golfer'}
                </p>
                
                {/* Metric value */}
                <p className={cn(
                  "font-bold",
                  isFirst ? "text-xl text-amber-600" : "text-lg text-muted-foreground"
                )}>
                  {metricValue}
                  <span className="text-xs font-normal ml-1">{getMetricLabel(metric)}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
