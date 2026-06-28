import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubShellTabs } from '../components/TourHubShellTabs';
import { ShellSlot } from '@/components/header/ShellSlot';
import type { TourHubTab } from '../components/types';
import { OverviewTab, ScheduleTab, PlayersTab, LeadersTab, LiveLeaderboardTab } from '../components/tabs';
import { ScheduleShellRow } from '../components/shell/ScheduleShellRow';
import { PlayersShellRow } from '../components/shell/PlayersShellRow';
import { LeadersShellRow } from '../components/shell/LeadersShellRow';
import { useTournamentStatusRealtime } from '../hooks/useTournamentStatusRealtime';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import { TourSelectionProvider } from '../context/TourSelectionContext';
import { useHeroFullBleed } from '../_shared/heroFullBleedSignal';
import { setFloatingHeaderActive } from '../_shared/floatingHeaderSignal';
import { FloatingTourHeader } from '../components/FloatingTourHeader';
import { TourSideMenu } from '../components/TourSideMenu';
import { TourSwitcherAffordance } from '../components/TourSwitcherAffordance';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { useLogout } from '@/hooks/useLogout';

export function TourHubMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');
  const [menuOpen, setMenuOpen] = useState(false);

  // Subscribe to tournament status changes (live/completed transitions)
  useTournamentStatusRealtime();

  const { data: liveTournaments, isFetched: liveFetched } = useLiveTournaments();
  const showLive = (liveTournaments?.length ?? 0) > 0;

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

  // Dead-tab guard: if the user lands on `?tab=live` but no events are live, bounce to overview.
  useEffect(() => {
    if (activeTab === 'live' && liveFetched && !showLive) {
      setSearchParams({ tab: 'overview' }, { replace: true });
      setActiveTab('overview');
    }
  }, [activeTab, liveFetched, showLive, setSearchParams]);

  // Reset to default tab when bottom-nav icon is re-tapped on this route
  useEffect(() => {
    const onRetap = (e: Event) => {
      if ((e as CustomEvent).detail?.tabId !== 'tourhub') return;
      setActiveTab('overview');
      setSearchParams({}, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('clbhouz-active-tab-retap', onRetap);
    return () => window.removeEventListener('clbhouz-active-tab-retap', onRetap);
  }, [setSearchParams]);

  // Cinematic full-bleed hero is on iff Overview tab AND hero is in cinematic mode.
  const heroIsCinematic = useHeroFullBleed();
  const fullBleedHero = activeTab === 'overview' && heroIsCinematic;

  // Tell GlobalHeader to suppress CompactHeader on this surface.
  useEffect(() => {
    setFloatingHeaderActive(fullBleedHero);
    return () => setFloatingHeaderActive(false);
  }, [fullBleedHero]);

  // Handicap value for the floating row + side menu.
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { data: trendData } = useHandicapTrend(connection?.id);
  const handicapValue =
    trendData?.current != null ? Number(trendData.current).toFixed(1) : '—';

  const { logout } = useLogout();

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'live':
        return <LiveLeaderboardTab />;
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

  const handleSelectTab = (id: string) => {
    if (id === 'college') {
      navigate('/tourhub/college-golf');
      return;
    }
    const tab = id as TourHubTab;
    setActiveTab(tab);
    setSearchParams({ tab: id }, { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <TourSelectionProvider>
      <TourHubShell showBack={false} immersiveStatusBar={fullBleedHero}>
        {fullBleedHero ? (
          // Cinematic overview: hero bleeds into the notch behind the floating
          // pill row. No ShellSlot tabs — destinations live in the side menu.
          <>
            <div>{renderTab()}</div>
            <FloatingTourHeader
              handicapValue={handicapValue}
              onMenuTap={() => setMenuOpen(true)}
              onSearchTap={() => navigate('/search')}
              onAvatarTap={() => navigate('/profile')}
              onHandicapTap={() => navigate('/handicap')}
              endSlot={<TourSwitcherAffordance />}
            />
            <TourSideMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              handicapValue={handicapValue}
              onSettings={() => navigate('/settings')}
              onProfile={() => navigate('/profile')}
              onSignOut={() => { void logout(); }}
            />
          </>
        ) : (
          <>
            <ShellSlot>
              <TourHubShellTabs />
              {renderShellRow()}
            </ShellSlot>
            <div style={{ paddingTop: 'calc(var(--chrome-total-h, 0px) - 1px)' }}>
              {renderTab()}
            </div>
          </>
        )}
      </TourHubShell>
    </TourSelectionProvider>
  );
}
