import { Eye, Heart, MessageCircle, Users, MousePointer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CreatorWeeklyStats } from './hooks/useCreatorProfile';

interface CreatorWeeklyStatsBarProps {
  stats: CreatorWeeklyStats;
  isOwnProfile: boolean;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

const statItems = [
  { key: 'views' as const, icon: Eye, label: 'views' },
  { key: 'likes' as const, icon: Heart, label: 'likes' },
  { key: 'comments' as const, icon: MessageCircle, label: 'comments' },
  { key: 'newFollowers' as const, icon: Users, label: 'new followers' },
] as const;

export function CreatorWeeklyStatsBar({ stats, isOwnProfile }: CreatorWeeklyStatsBarProps) {
  const navigate = useNavigate();

  if (!isOwnProfile) return null;

  const allZero = stats.views === 0 && stats.likes === 0 && stats.comments === 0 && stats.newFollowers === 0;

  return (
    <button
      type="button"
      onClick={() => navigate('/insights')}
      className="w-full bg-muted/50 rounded-xl px-3 py-2.5 text-left hover:bg-muted/70 transition-colors"
    >
      <span className="text-xs font-semibold text-foreground">This Week</span>

      {allZero ? (
        <p className="text-xs text-muted-foreground mt-1">
          Start posting to see your stats here
        </p>
      ) : (
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {statItems.map(({ key, icon: Icon, label }) => {
            const value = stats[key];
            if (value === 0) return null;
            return (
              <span key={key} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                {formatCompact(value)} {label}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}
