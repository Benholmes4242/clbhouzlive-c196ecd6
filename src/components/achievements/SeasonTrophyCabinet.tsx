import React from 'react';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { useUserSeasonResults } from '@/hooks/useUserSeasonResults';
import { formatDistanceToNow } from 'date-fns';

interface SeasonTrophyCabinetProps {
  userId: string;
  isOwnProfile?: boolean;
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'diamond':
    case 'platinum':
    case 'gold':
      return <Trophy className="w-6 h-6" />;
    case 'silver':
    case 'bronze':
      return <Medal className="w-6 h-6" />;
    default:
      return <TrendingUp className="w-6 h-6" />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'diamond':
      return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30';
    case 'platinum':
      return 'from-slate-400/20 to-slate-600/20 border-slate-400/30';
    case 'gold':
      return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    case 'silver':
      return 'from-gray-300/20 to-gray-400/20 border-gray-400/30';
    case 'bronze':
      return 'from-orange-600/20 to-orange-800/20 border-orange-600/30';
    default:
      return 'from-muted/20 to-muted/30 border-border';
  }
};

export const SeasonTrophyCabinet: React.FC<SeasonTrophyCabinetProps> = ({
  userId,
  isOwnProfile = false,
}) => {
  const { data: seasonResults, isLoading } = useUserSeasonResults(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Season Trophy Cabinet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!seasonResults || seasonResults.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Season Trophy Cabinet</h2>
        <div className="bg-muted/10 rounded-xl p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {isOwnProfile
              ? "You haven't completed any seasons yet — your first trophy will appear here."
              : "No completed seasons yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="trophies">
      <h2 className="text-2xl font-bold">Season Trophy Cabinet</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seasonResults.map((result) => (
          <div
            key={result.id}
            className={`bg-gradient-to-br ${getTierColor(result.reward_tier)} border rounded-xl p-6 space-y-3`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background/50 rounded-lg">
                  {getTierIcon(result.reward_tier)}
                </div>
                <div>
                  <h3 className="font-semibold">{result.season?.name || 'Season'}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {result.reward_tier} Tier
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Final Rank</span>
                <span className="font-semibold">#{result.final_rank}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Final XP</span>
                <span className="font-semibold">{result.final_xp.toLocaleString()} XP</span>
              </div>
            </div>

            {result.season?.ends_at && (
              <p className="text-xs text-muted-foreground">
                Completed {formatDistanceToNow(new Date(result.season.ends_at), { addSuffix: true })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
