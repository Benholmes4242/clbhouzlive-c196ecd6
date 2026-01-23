import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Map } from 'lucide-react';
import { CountriesLeaderboard } from './CountriesLeaderboard';
import { RegionsLeaderboard } from './RegionsLeaderboard';
import type { ExplorationTab as ExplorationTabType } from '@/types/leaderboards';

export function ExplorationTab() {
  const [activeTab, setActiveTab] = useState<ExplorationTabType>('countries');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ExplorationTabType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="countries" className="gap-2">
            <Globe className="h-4 w-4" />
            Countries
          </TabsTrigger>
          <TabsTrigger value="regions" className="gap-2">
            <Map className="h-4 w-4" />
            Regions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="mt-4">
          <CountriesLeaderboard />
        </TabsContent>

        <TabsContent value="regions" className="mt-4">
          <RegionsLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
