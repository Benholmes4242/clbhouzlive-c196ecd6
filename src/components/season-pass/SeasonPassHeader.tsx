import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useUserSeasonXP } from '@/hooks/useUserSeasonXP';
import { useSeasonPass } from '@/hooks/useSeasonPass';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Sparkles, TrendingUp } from 'lucide-react';

export function SeasonPassHeader() {
  const [userId, setUserId] = useState<string | undefined>();
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasonXP } = useUserSeasonXP(userId, currentSeason?.id);
  const { hasPremiumPass, upgrade, isUpgrading } = useSeasonPass(userId, currentSeason?.id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const currentXP = seasonXP?.total_xp || 0;
  const nextMilestone = [100, 250, 500, 750, 1000, 1500, 2000].find(m => m > currentXP) || 2000;
  const progressPercent = (currentXP / nextMilestone) * 100;

  return (
    <Card className={`
      relative overflow-hidden mb-6
      ${hasPremiumPass ? 'bg-gradient-to-br from-yellow-500/10 via-background to-background' : ''}
    `}>
      {hasPremiumPass && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-bl-full" />
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              {hasPremiumPass && <Crown className="w-6 h-6 text-yellow-500" />}
              Season Pass
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasPremiumPass ? 'Premium Pass Active' : 'Free Pass'}
            </p>
          </div>

          {!hasPremiumPass && (
            <Button
              onClick={() => upgrade()}
              disabled={isUpgrading}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}
        </div>

        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">{currentXP} XP</span>
            </div>
            <span className="text-muted-foreground">Next: {nextMilestone} XP</span>
          </div>
          
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Pass Benefits */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${hasPremiumPass ? 'bg-green-500' : 'bg-muted'}`} />
            <span>Free Track Rewards</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${hasPremiumPass ? 'bg-yellow-500' : 'bg-muted'}`} />
            <span>{hasPremiumPass ? 'Premium Track Active' : 'Premium Track Locked'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${hasPremiumPass ? 'bg-purple-500' : 'bg-muted'}`} />
            <span>{hasPremiumPass ? 'Exclusive Cosmetics' : 'Premium Shop Locked'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
