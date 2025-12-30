import { useState } from 'react';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubTabs, type TourHubTab } from '../components/TourHubTabs';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { OverviewTab, ScheduleTab, PlayersTab, PlayerStatsTab } from '../components/tabs';
import { useSearchParams } from 'react-router-dom';

export function TourHubMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');
  
  const handleTabChange = (tab: TourHubTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'schedule':
        return <ScheduleTab />;
      case 'players':
        return <PlayersTab />;
      case 'player-stats':
        return <PlayerStatsTab />;
      case 'leaderboards':
        return <TourHubEmptyState variant="leaderboard" />;
      case 'summary':
        return <TourHubEmptyState variant="summary" />;
      case 'tee-times':
        return <TourHubEmptyState variant="tee-times" />;
      case 'hole-stats':
        return <TourHubEmptyState variant="hole-stats" />;
      default:
        return <OverviewTab />;
    }
  };
  
  return (
    <TourHubShell>
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Tour Hub</h1>
        <p className="text-muted-foreground mt-1">PGA Tour • 2025 Season</p>
      </header>
      
      <TourHubTabs activeTab={activeTab} onTabChange={handleTabChange} className="mb-6" />
      
      <div className="pb-24">
        {renderTab()}
      </div>
    </TourHubShell>
  );
}
