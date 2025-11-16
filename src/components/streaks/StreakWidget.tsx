import React from 'react';
import { Card } from '@/components/ui/card';
import { useStreaks } from '@/hooks/useStreaks';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Flame, Calendar, TrendingUp } from 'lucide-react';

export const StreakWidget: React.FC = () => {
  const { user } = useSupabaseSession();
  const { data: streaks } = useStreaks(user?.id);

  if (!streaks) return null;

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getStreakGlow = (streak: number) => {
    if (streak >= 7) return 'animate-pulse';
    return '';
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Streaks</h3>
        <p className="text-sm text-muted-foreground">
          Keep your streak alive by playing golf regularly
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Daily Streak */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mb-2 ${getStreakGlow(streaks.dailyStreak)}`}>
            <Flame className={`w-8 h-8 ${getStreakColor(streaks.dailyStreak)}`} />
          </div>
          <p className="text-2xl font-bold">{streaks.dailyStreak}</p>
          <p className="text-xs text-muted-foreground">Daily Streak</p>
        </div>

        {/* Weekly Streak */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <p className="text-2xl font-bold">{streaks.weeklyStreak}</p>
          <p className="text-xs text-muted-foreground">Weekly Streak</p>
        </div>

        {/* Monthly Streak */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-2">
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{streaks.monthlyStreak}</p>
          <p className="text-xs text-muted-foreground">Monthly Streak</p>
        </div>
      </div>

      {streaks.nextReward && (
        <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm text-center">
            <span className="font-medium">Next reward:</span>{' '}
            <span className="text-primary font-semibold">{streaks.nextReward.reward}</span> coins at{' '}
            <span className="font-medium">{streaks.nextReward.at}-day streak</span>
          </p>
        </div>
      )}

      {!streaks.isActive && streaks.dailyStreak > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-center text-yellow-700 dark:text-yellow-300">
            ⚠️ Play today to keep your streak alive!
          </p>
        </div>
      )}
    </Card>
  );
};
