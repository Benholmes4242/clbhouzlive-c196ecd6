import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubHeader } from '../components/TourHubHeader';
import { TourHubNavOverlay } from '../components/TourHubNavOverlay';
import type { TourHubTab } from '../components/TourHubTabs';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { OverviewTab, ScheduleTab, PlayersTab, PlayerStatsTab, LeadersTab } from '../components/tabs';

export function TourHubMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Sync tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
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
        return <LeadersTab />;
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
      <TourHubHeader 
        activeTab={activeTab} 
        onMenuOpen={() => setIsNavOpen(true)} 
      />
      
      <div className="pb-24">
        {renderTab()}
      </div>
      
      {/* Navigation Overlay */}
      <TourHubNavOverlay
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        activeTab={activeTab}
        onNavigate={handleTabChange}
      />
    </TourHubShell>
  );
}
