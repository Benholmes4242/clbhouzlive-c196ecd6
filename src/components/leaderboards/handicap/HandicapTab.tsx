import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { HandicapImprovementLeaderboard } from './HandicapImprovementLeaderboard';
import { LowestHandicapLeaderboard } from './LowestHandicapLeaderboard';
import { SeasonImprovementLeaderboard } from './SeasonImprovementLeaderboard';
import type { HandicapTab as HandicapTabType } from '@/types/leaderboards';

export function HandicapTab() {
  const [activeTab, setActiveTab] = useState<HandicapTabType>('improvement-30d');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HandicapTabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="improvement-30d" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            30-Day
          </TabsTrigger>
          <TabsTrigger value="lowest" className="gap-1.5 text-xs">
            <Award className="h-3.5 w-3.5" />
            Lowest
          </TabsTrigger>
          <TabsTrigger value="season" className="gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Season
          </TabsTrigger>
        </TabsList>

        <TabsContent value="improvement-30d" className="mt-4">
          <HandicapImprovementLeaderboard days={30} />
        </TabsContent>

        <TabsContent value="lowest" className="mt-4">
          <LowestHandicapLeaderboard />
        </TabsContent>

        <TabsContent value="season" className="mt-4">
          <SeasonImprovementLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
