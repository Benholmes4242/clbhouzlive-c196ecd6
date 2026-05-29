import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubShellTabs } from '../components/TourHubShellTabs';
import { ShellSlot } from '@/components/header/ShellSlot';
import type { TourHubTab } from '../components/types';
import { OverviewTab, ScheduleTab, PlayersTab, LeadersTab } from '../components/tabs';
import { ScheduleShellRow } from '../components/shell/ScheduleShellRow';
import { PlayersShellRow } from '../components/shell/PlayersShellRow';
import { LeadersShellRow } from '../components/shell/LeadersShellRow';
import { useTournamentStatusRealtime } from '../hooks/useTournamentStatusRealtime';
import { TourSelectionProvider } from '../context/TourSelectionContext';

export function TourHubMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');

  // Subscribe to tournament status changes (live/completed transitions)
  useTournamentStatusRealtime();

  // Sync tab with URL + redirect legacy player-stats to leaderboards
  useEffect(() => {
    if (tabParam === ('player-stats' as string)) {
      setSearchParams({ tab: 'leaderboards' }, { replace: true });
      setActiveTab('leaderboards');
      return;
    }

    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      window.scrollTo(0, 0);
    }
  }, [tabParam]);

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

  const renderShellRow = () => {
    switch (activeTab) {
      case 'schedule':    return <ScheduleShellRow />;
      case 'players':     return <PlayersShellRow />;
      case 'leaderboards':return <LeadersShellRow />;
      default:            return null;
    }
  };

  return (
    <TourHubShell>
      <ShellSlot dark>
        <TourHubShellTabs />
        {renderShellRow()}
      </ShellSlot>

      <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
        {renderTab()}
      </div>
    </TourHubShell>
  );
}
