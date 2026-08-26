import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { TourHubShell } from '../components/TourHubShell';
import { TourPageShell } from '../components/TourPageShell';
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
import { scrollPageToTop } from '@/lib/getScrollParent';
import { safeGoBack } from '@/utils/navigation';

import { useLogout } from '@/hooks/useLogout';

const TAB_TITLES: Record<string, string> = {
  live: 'Live',
  schedule: 'Schedule',
  players: 'Players',
  leaderboards: 'Leaders',
};

/**
 * TourHubChromeBridge — registers the ChromeIsland left-capsule slot with
 * a burger + short tour label. Mounted inside TourSelectionProvider so
 * useTourShortLabel resolves. Owns the menu + picker sheet state so the
 * slot node stays a stable, prop-driven element.
 */
function TourHubChromeBridge({
  activeTab,
  onSelectTab,
  onSettings,
  onProfile,
  onSignOut,
  backMode,
  onBack,
  menuOpen,
  setMenuOpen,
}: {
  activeTab: TourHubTab;
  onSelectTab: (tabId: string) => void;
  onSettings: () => void;
  onProfile: () => void;
  onSignOut: () => void;
  backMode: boolean;
  onBack: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
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
        mode={backMode ? 'back' : 'menu'}
        onBackTap={onBack}
        onMenuTap={() => setMenuOpen(true)}
        onPickerTap={() => {
          // Picker is scoped to the overview tab only.
          if (isOverview) setPickerOpen(true);
        }}
        showPicker={isOverview}
      />
    ),
    [label, isOverview, backMode, onBack, setMenuOpen],
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
  const location = useLocation();
  /* BACK vs BURGER. The left capsule is a page-owned slot (useSetChromeLeftSlot),
     so the registry's `left: { kind: 'logo' }` for /tour and /tourhub never
     reaches the screen — this predicate is the real control.
     A member who navigated TO the hub (bottom nav, which tags state.from='nav')
     or who deep-linked straight in (location.key === 'default', no history to
     return to) gets the burger. A member who arrived AT it from a tournament
     card, a share or any other in-app link gets a back chevron, because
     otherwise the hub strands them. */
  const navState = (location.state as { from?: string } | null)?.from;
  const backMode = location.key !== 'default' && navState !== 'nav';
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');
  const [menuOpen, setMenuOpen] = useState(false);

  useTournamentStatusRealtime();

  const { data: liveTournaments, isFetched: liveFetched, isError: liveError } = useLiveTournaments();
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
    if (activeTab === 'live' && liveFetched && !liveError && !showLive) {
      setSearchParams({ tab: 'overview' }, { replace: true });
      setActiveTab('overview');
    }
  }, [activeTab, liveFetched, liveError, showLive, setSearchParams]);

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

  const tabTitle = TAB_TITLES[activeTab] ?? 'Tour';

  return (
    <TourSelectionProvider>
      <TourHubShell showBack={false} immersiveStatusBar={fullBleedHero}>
        <TourHubChromeBridge
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onSettings={() => navigate('/edit-profile?tab=settings')}
          onProfile={() => navigate('/profile')}
          onSignOut={() => { void logout(); }}
          backMode={backMode}
          onBack={() => safeGoBack(navigate, '/tourhub')}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
        {activeTab === 'overview' ? (
          <>
            {/* Overview keeps its cinematic hero overlay chrome (the island). */}
            <div>{renderTab()}</div>
          </>
        ) : (
          /* Every other tab is an Activity-style opaque header page: one
             sticky chrome that owns the safe area, back chevron to the
             overview, and a burger for the tour menu. */
          <TourPageShell
            title={tabTitle}
            onBack={() => handleSelectTab('overview')}
            backFallback="/tourhub"
            right={
              <button
                type="button"
                aria-label="Tour menu"
                onClick={() => setMenuOpen(true)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <Menu size={17} strokeWidth={2.2} color="#F8FAFC" />
              </button>
            }
          >
            {renderTab()}
          </TourPageShell>
        )}
      </TourHubShell>
    </TourSelectionProvider>

  );
}
