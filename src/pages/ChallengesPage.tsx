import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveChallenges } from '@/hooks/useActiveChallenges';
import { useChallengeProgress } from '@/hooks/useChallengeProgress';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Zap } from 'lucide-react';

const ChallengesPage: React.FC = () => {
  const { user } = useSupabaseSession();
  const { data: challenges, isLoading } = useActiveChallenges(user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 md:max-w-[620px] md:mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 rounded mb-2" />
            <Skeleton className="h-5 w-96 rounded" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-sq-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weeklyChallenges = challenges?.filter(c => c.type === 'weekly') || [];
  const monthlyChallenges = challenges?.filter(c => c.type === 'monthly') || [];
  const personalChallenges = challenges?.filter(c => c.type === 'personal') || [];
  const regionalChallenges = challenges?.filter(c => c.type === 'regional') || [];
  const globalChallenges = challenges?.filter(c => c.type === 'global') || [];

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:max-w-[620px] md:mx-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Challenges</h1>
          <p className="text-muted-foreground">
            Complete challenges to earn XP, shop currency, and exclusive rewards
          </p>
        </div>

        <Tabs defaultValue="weekly" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="weekly">
              Weekly
              {weeklyChallenges.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {weeklyChallenges.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="monthly">
              Monthly
              {monthlyChallenges.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {monthlyChallenges.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <ChallengeList challenges={weeklyChallenges} userId={user?.id} />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <ChallengeList challenges={monthlyChallenges} userId={user?.id} />
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <ChallengeList challenges={personalChallenges} userId={user?.id} />
          </TabsContent>

          <TabsContent value="regional" className="space-y-4">
            <ChallengeList challenges={regionalChallenges} userId={user?.id} />
          </TabsContent>

          <TabsContent value="global" className="space-y-4">
            <ChallengeList challenges={globalChallenges} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface ChallengeListProps {
  challenges: any[];
  userId?: string;
}

const ChallengeList: React.FC<ChallengeListProps> = ({ challenges, userId }) => {
  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No challenges available</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {challenges.map(challenge => (
        <ChallengeCard key={challenge.id} challenge={challenge} userId={userId} />
      ))}
    </div>
  );
};

interface ChallengeCardProps {
  challenge: any;
  userId?: string;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, userId }) => {
  const { data: progress } = useChallengeProgress(challenge.id, userId);

  const requirement = challenge.requirements?.[0];
  const currentValue = progress?.currentValue || 0;
  const target = requirement?.target || 0;
  const percent = progress?.percent || 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exploration': return '🗺️';
      case 'skill': return '⛳';
      case 'social': return '👥';
      default: return '🎯';
    }
  };

  return (
    <Card className={`p-6 ${progress?.isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getCategoryIcon(challenge.category)}</span>
            <h3 className="font-semibold text-lg">{challenge.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Progress: {currentValue}/{target}
            </span>
            <span className="font-medium">{Math.round(percent)}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{challenge.xp_reward} XP</span>
            </div>
            {challenge.shop_currency_reward > 0 && (
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-medium">{challenge.shop_currency_reward}</span>
              </div>
            )}
          </div>
          
          {progress && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{progress.remainingTime}</span>
            </div>
          )}
        </div>

        {progress?.isCompleted && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-sq-xs p-3 text-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              ✅ Completed!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChallengesPage;
