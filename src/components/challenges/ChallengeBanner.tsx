import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, ArrowRight } from 'lucide-react';
import { useActiveChallenges } from '@/hooks/useActiveChallenges';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const ChallengeBanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: challenges } = useActiveChallenges(user?.id);

  // Find a challenge that's close to completion
  const nearCompletionChallenge = challenges?.find(c => {
    if (!c.progress) return false;
    const percent = c.progress.current_value / (c.requirements[0]?.target || 1) * 100;
    return percent >= 70 && percent < 100;
  });

  // Check if there are new weekly challenges
  const weeklyChallenges = challenges?.filter(c => c.type === 'weekly') || [];
  const hasNewWeekly = weeklyChallenges.length > 0;

  if (!nearCompletionChallenge && !hasNewWeekly) return null;

  if (nearCompletionChallenge && nearCompletionChallenge.progress) {
    const requirement = nearCompletionChallenge.requirements[0];
    const remaining = requirement.target - nearCompletionChallenge.progress.current_value;

    return (
      <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                You're {remaining} {requirement.metric.replace('_', ' ')} away from completing
              </h3>
              <p className="text-sm text-muted-foreground">
                "{nearCompletionChallenge.title}" — Earn {nearCompletionChallenge.xp_reward} XP
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/challenges')} variant="outline">
            View Challenges
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-transparent border-yellow-500/20 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">🔥 New weekly challenges are live!</h3>
            <p className="text-sm text-muted-foreground">
              {weeklyChallenges.length} challenges available this week
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/challenges')} className="bg-yellow-600 hover:bg-yellow-700">
          See Challenges
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
