import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { usePremiumTrackRewards } from '@/hooks/usePremiumTrackRewards';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Check, Coins, Trophy, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PremiumRewardsTrack() {
  const [userId, setUserId] = useState<string | undefined>();
  const { data: currentSeason } = useCurrentSeason();
  const { freeRewards, premiumRewards, currentXP, hasPremiumPass } = usePremiumTrackRewards(
    currentSeason?.id,
    userId
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'currency':
        return <Coins className="w-4 h-4" />;
      case 'cosmetic':
        return <Sparkles className="w-4 h-4" />;
      case 'badge':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Reward Track</h3>
      
      <ScrollArea className="w-full">
        <div className="space-y-6 min-w-[600px]">
          {/* Free Track */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h4 className="font-semibold">Free Track</h4>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {freeRewards.map((reward, index) => (
                <div
                  key={`free-${index}`}
                  className="relative flex-shrink-0 w-32"
                >
                  <Card className={`
                    p-3 text-center
                    ${reward.isUnlocked ? 'bg-blue-500/10 border-blue-500/50' : 'bg-muted'}
                    transition-all duration-300
                  `}>
                    {reward.isUnlocked ? (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    ) : null}
                    
                    <div className="mb-2 flex justify-center text-muted-foreground">
                      {getRewardIcon(reward.reward.type)}
                    </div>
                    
                    <p className="text-xs font-semibold mb-1 line-clamp-2">
                      {reward.reward.name}
                    </p>
                    
                    {reward.reward.amount && (
                      <Badge variant="secondary" className="text-xs">
                        {reward.reward.amount}
                      </Badge>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {reward.xpRequired} XP
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Track */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Premium Track
              </h4>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {premiumRewards.map((reward, index) => {
                const isLocked = !hasPremiumPass;
                
                return (
                  <div
                    key={`premium-${index}`}
                    className="relative flex-shrink-0 w-32"
                  >
                    <Card className={`
                      p-3 text-center
                      ${reward.isUnlocked && !isLocked 
                        ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/50' 
                        : 'bg-muted'}
                      ${isLocked ? 'opacity-50' : ''}
                      transition-all duration-300
                    `}>
                      {isLocked ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : reward.isUnlocked ? (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      ) : null}
                      
                      <div className="mb-2 flex justify-center text-yellow-500">
                        {getRewardIcon(reward.reward.type)}
                      </div>
                      
                      <p className="text-xs font-semibold mb-1 line-clamp-2">
                        {reward.reward.name}
                      </p>
                      
                      {reward.reward.amount && (
                        <Badge variant="secondary" className="text-xs">
                          {reward.reward.amount}
                        </Badge>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {reward.xpRequired} XP
                      </p>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* Current Progress Indicator */}
      <div className="mt-4 text-sm text-center text-muted-foreground">
        Current Progress: {currentXP} XP
      </div>
    </Card>
  );
}
