import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { TourHubShell } from '../components/TourHubShell';
import type { TourHubTab } from '../components/types';
import { OverviewTab } from '../components/tabs';
import { LeadersTab as LeadersTabV2 } from '@/features/tourhub/leaders-v2/LeadersTab';
import { PlayersTab as PlayersTabV2 } from '@/features/tourhub/players-v2/PlayersTab';
import { ScheduleTab as ScheduleTabV2 } from '@/features/tourhub/schedule-v2/ScheduleTab';
import { LeaderboardTab } from '@/features/tourhub/leaderboard/LeaderboardTab';
import { useTournamentStatusRealtime } from '../hooks/useTournamentStatusRealtime';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import { TourSelectionProvider } from '../context/TourSelectionContext';
import { useHeroFullBleed } from '../_shared/heroFullBleedSignal';
import { TourSideMenu } from '../components/TourSideMenu';
import { TourIslandLeft } from '../components/TourIslandLeft';
import { TourPickerSheet, useTourShortLabel } from '../components/TourPickerSheet';
import { useSetChromeLeftSlot } from '@/features/chrome-v2/leftOverride';
import { GlassHeaderPlate } from '@/components/chrome/GlassHeaderPlate';
import { scrollPageToTop } from '@/lib/getScrollParent';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { useLogout } from '@/hooks/useLogout';

/**
 * TourHubChromeBridge — registers the ChromeIsland left-capsule slot with
 * a burger + short tour label. Mounted inside TourSelectionProvider so
 * useTourShortLabel resolves. Owns the menu + picker sheet state so the
 * slot node stays a stable, prop-driven element.
 */
function TourHubChromeBridge({
  activeTab,
  onSelectTab,
  handicapValue,
  onSettings,
  onProfile,
  onSignOut,
}: {
  activeTab: TourHubTab;
  onSelectTab: (tabId: string) => void;
  handicapValue: string;
  onSettings: () => void;
  onProfile: () => void;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const label = useTourShortLabel();
  const isOverview = activeTab === 'overview';

  // Auto-close the picker if the user leaves the overview tab while it is open.
  useEffect(() => {
    if (!isOverview && pickerOpen) setPickerOpen(false);
  }, [isOverview, pickerOpen]);

  const slot = useMemo(
    () => (
      <TourIslandLeft
        label={label}
        onMenuTap={() => setMenuOpen(true)}
        onPickerTap={() => {
          // Picker is scoped to the overview tab only.
          if (isOverview) setPickerOpen(true);
        }}
        showPicker={isOverview}
      />
    ),
    [label, isOverview],
  );
  useSetChromeLeftSlot(slot);

  return (
    <>
      <TourSideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={(id) => {
          onSelectTab(id);
          setMenuOpen(false);
        }}
        handicapValue={handicapValue}
        onSettings={onSettings}
        onProfile={onProfile}
        onSignOut={onSignOut}
      />
      {isOverview && (
        <TourPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} />
      )}
    </>
  );
}

export function TourHubMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');
  const [searchOpen, setSearchOpen] = useState(false);

  useTournamentStatusRealtime();

  const { data: liveTournaments, isFetched: liveFetched } = useLiveTournaments();
  const showLive = (liveTournaments?.length ?? 0) > 0;

  useEffect(() => {
    if (tabParam === ('player-stats' as string)) {
      setSearchParams({ tab: 'leaderboards' }, { replace: true });
      setActiveTab('leaderboards');
      return;
    }

    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      scrollPageToTop('auto');
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === 'live' && liveFetched && !showLive) {
      setSearchParams({ tab: 'overview' }, { replace: true });
      setActiveTab('overview');
    }
  }, [activeTab, liveFetched, showLive, setSearchParams]);

  useEffect(() => {
    const onRetap = (e: Event) => {
      if ((e as CustomEvent).detail?.tabId !== 'tourhub') return;
      setActiveTab('overview');
      setSearchParams({}, { replace: true });
      scrollPageToTop('smooth');
    };
    window.addEventListener('clbhouz-active-tab-retap', onRetap);
    return () => window.removeEventListener('clbhouz-active-tab-retap', onRetap);
  }, [setSearchParams]);

  const heroIsCinematic = useHeroFullBleed();
  const fullBleedHero = activeTab === 'overview' && heroIsCinematic;

  // H4a: no longer suppress the global island on cinematic overview — the
  // ChromeIsland paints with a page-provided left capsule (see TourHubChromeBridge).

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
        return <LeaderboardTab />;
      case 'schedule':
        return <ScheduleTabV2 />;
      case 'players':
        return <PlayersTabV2 />;
      case 'leaderboards':
        return <LeadersTabV2 />;
      default:
        return <OverviewTab />;
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
    scrollPageToTop('auto');
  };

  return (
    <TourSelectionProvider>
      <TourHubShell showBack={false} immersiveStatusBar={fullBleedHero}>
        <TourHubChromeBridge
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          handicapValue={handicapValue}
          onSettings={() => navigate('/edit-profile?tab=settings')}
          onProfile={() => navigate('/profile')}
          onSignOut={() => { void logout(); }}
        />
        {/* Glass plate: mounted for every non-overview tab. Overview keeps
            its own cinematic hero overlay chrome. Height 70 matches tour
            island HEADER_H (see ChromeIsland.tsx). */}
        <GlassHeaderPlate visible={activeTab !== 'overview'} />
        {fullBleedHero ? (
          <>
            <div>{renderTab()}</div>
            <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          </>
        ) : (
          <div>{renderTab()}</div>
        )}
      </TourHubShell>
    </TourSelectionProvider>
  );
}
