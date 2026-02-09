import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubHeader } from '../components/TourHubHeader';
import { TourHubNavOverlay } from '../components/TourHubNavOverlay';
import type { TourHubTab } from '../components/TourHubTabs';
// TourHubEmptyState available if needed for future tab variants
import { OverviewTab, ScheduleTab, PlayersTab, LeadersTab } from '../components/tabs';
import { TourNavProvider, useTourNav } from '../contexts/TourNavContext';
import { useLiveTournamentSync } from '../hooks/useLiveTournamentSync';

function TourHubMainPageInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');
  const { isNavOpen, closeNav } = useTourNav();
  
  // Background live tournament sync - runs in background every 60s when live tournaments exist
  const { isLive, liveTournaments } = useLiveTournamentSync();
  
  useEffect(() => {
    if (isLive) {
      console.log(`[TourHub] ${liveTournaments.length} live tournament(s) detected, background sync active`);
    }
  }, [isLive, liveTournaments.length]);
  
  // Sync tab with URL + redirect legacy player-stats to leaderboards
  useEffect(() => {
    // Legacy redirect: player-stats → leaderboards (using string comparison to avoid type error)
    if (tabParam === ('player-stats' as string)) {
      setSearchParams({ tab: 'leaderboards' }, { replace: true });
      setActiveTab('leaderboards');
      return;
    }
    
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
      case 'leaderboards':
        return <LeadersTab />;
      default:
        return <OverviewTab />;
    }
  };
  
  return (
    <TourHubShell>
      <TourHubHeader activeTab={activeTab} />
      
      <div className="pb-24">
        {renderTab()}
      </div>
      
      {/* Navigation Overlay */}
      <TourHubNavOverlay
        isOpen={isNavOpen}
        onClose={closeNav}
        activeTab={activeTab}
        onNavigate={handleTabChange}
      />
    </TourHubShell>
  );
}

export function TourHubMainPage() {
  return (
    <TourNavProvider>
      <TourHubMainPageInner />
    </TourNavProvider>
  );
}
