import { Link } from 'react-router-dom';
import { Crown, Globe } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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
    case 'regions':
      return entry.regions_count;
    default:
      return entry.countries_count;
  }
};

const getMetricLabel = (metric: ExplorationMetric): string => {
  switch (metric) {
    case 'continents':
      return 'continents';
    case 'regions':
      return 'regions';
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
    <div className="relative px-4 pt-10 pb-4">
      {/* Crown above #1 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
        <Crown className="w-7 h-7 text-amber-400 fill-amber-400" />
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
          
          // Size based on position
          const avatarSize = isFirst ? 96 : 77;
          const ringWidth = isFirst ? '3px' : '2px';
          
          // Ring colors by position
          const ringColor = position === 1 
            ? 'rgba(251, 191, 36, 0.8)' // Gold
            : position === 2 
              ? 'rgba(148, 163, 184, 0.7)' // Silver
              : 'rgba(180, 83, 9, 0.7)'; // Bronze

          return (
            <Link
              key={entry.user_id}
              to={`/profile/${entry.user_id}`}
              className={cn(
                'flex flex-col items-center transition-transform hover:scale-105',
                isFirst ? 'mb-4' : ''
              )}
            >
              {/* Avatar with ring */}
              <div 
                className="relative mb-2"
                style={{
                  width: avatarSize,
                  height: avatarSize * 1.05,
                }}
              >
                <div
                  className="absolute inset-0 rounded-[34%]"
                  style={{
                    boxShadow: `0 0 0 ${ringWidth} ${ringColor}, 0 0 20px ${ringColor}`,
                  }}
                />
                <SquircleAvatar
                  src={entry.avatar_url}
                  alt={entry.display_name || 'Golfer'}
                  size={avatarSize}
                  className={cn(
                    'w-full h-full',
                    isCurrentUser && 'ring-2 ring-teal-500 ring-offset-2'
                  )}
                />
                
                {/* Position badge */}
                <div 
                  className={cn(
                    'absolute -bottom-2 left-1/2 -translate-x-1/2',
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    'text-xs font-bold shadow-md',
                    position === 1 && 'bg-amber-400 text-amber-900',
                    position === 2 && 'bg-slate-300 text-slate-700',
                    position === 3 && 'bg-amber-600 text-amber-100',
                  )}
                >
                  {position}
                </div>
              </div>

              {/* Name */}
              <div className="text-center mt-2">
                <div className={cn(
                  'text-sm font-semibold truncate max-w-[90px]',
                  isCurrentUser ? 'text-teal-600' : 'text-foreground'
                )}>
                  {entry.display_name || 'Golfer'}
                </div>
                
                {/* Metric value */}
                <div className="text-xs text-muted-foreground mt-0.5">
                  {metricValue} {getMetricLabel(metric)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
