import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TourHubShell } from '../components/TourHubShell';
import { TourPageShell } from '../components/TourPageShell';
import type { TourHubTab } from '../components/types';
import { OverviewTab } from '../components/tabs';
import { LeadersTab as LeadersTabV2 } from '@/features/tourhub/leaders-v2/LeadersTab';
import { PlayersTab as PlayersTabV2 } from '@/features/tourhub/players-v2/PlayersTab';
import { ScheduleTab as ScheduleTabV2 } from '@/features/tourhub/schedule-v2/ScheduleTab';
import { LeaderboardTab } from '@/features/tourhub/leaderboard/LeaderboardTab';
import { NewsTab } from '@/features/tourhub/news/NewsTab';
import { useTournamentStatusRealtime } from '../hooks/useTournamentStatusRealtime';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import { TourSelectionProvider } from '../context/TourSelectionContext';
import { useHeroFullBleed } from '../_shared/heroFullBleedSignal';
import { TourSideMenu } from '../components/TourSideMenu';
import { TourIslandLeft } from '../components/TourIslandLeft';
import { TourPickerSheet, useTourShortLabel } from '../components/TourPickerSheet';
import { TourPickerControl } from '../components/TourPickerControl';
import { AppHeaderBurger } from '@/components/chrome/AppHeader';
import { useSetChromeLeftSlot } from '@/features/chrome-v2/leftOverride';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { safeGoBack } from '@/utils/navigation';

import { useLogout } from '@/hooks/useLogout';

const TAB_TITLES: Record<string, string> = {
  news: 'News',
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
  pickerOpen,
  setPickerOpen,
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
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
}) {
  const label = useTourShortLabel();

  const slot = useMemo(
    () => (
      <TourIslandLeft
        label={label}
        mode={backMode ? 'back' : 'menu'}
        onBackTap={onBack}
        onMenuTap={() => setMenuOpen(true)}
        onPickerTap={() => {
          /* The picker is NO LONGER scoped to the overview. The sub-pages used
             to carry their own sticky tour-pills row; that row is gone, so the
             island IS the tour control on every tour tab EXCEPT the live
             leaderboard, which is deliberately cross-tour (concurrent events on
             several tours at once) and uses its tournament pills as its own
             selector. A tour label there would state something false. */
          setPickerOpen(true);
        }}
        showPicker={activeTab !== 'live'}
      />
    ),
    [label, backMode, onBack, setMenuOpen, setPickerOpen, activeTab],
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
      <TourPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} />

    </>
  );
}

export function TourHubMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  /* The left capsule on the hub is ALWAYS the burger. The hub is a bottom-nav
     destination, so a back chevron there is wrong regardless of how the member
     arrived. */
  const backMode = false;
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');
  const [menuOpen, setMenuOpen] = useState(false);
  /* Owned here, not in the bridge: the sub-page shell suppresses the island, so
     its own header carries the picker trigger and needs the same state. */
  const [pickerOpen, setPickerOpen] = useState(false);

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

  /* BRIEF_TOUR_FIXED_HEADER S4: nothing on the hub bleeds any more. The hero
     signal is still read by the hero bands themselves; the SHELL is flatly
     non-immersive on every tab. */
  const fullBleedHero = false;

  // H4a: no longer suppress the global island on cinematic overview — the
  // ChromeIsland paints with a page-provided left capsule (see TourHubChromeBridge).

  const { logout } = useLogout();

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'news':
        return <NewsTab />;
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


  /**
   * TOUR HUB TAB MEASUREMENT (7 Sep 2026). `?tab=` is written with replace:true,
   * so every section collapsed into one /tourhub page_view and the six sections
   * could not be ranked against each other. Same two-event shape as Discover:
   *  - `tourhub_tab_viewed` on arrival (default or deep link) and on each switch.
   *  - `tourhub_tab_changed` with destination and origin.
   * Deliberately NOT instrumented beneath this: the Leaders tour lens, the
   * Players lens and the live event switcher stay silent until we know these
   * sections are opened at all.
   */
  const tourArrivalTracked = useRef(false);
  useEffect(() => {
    if (tourArrivalTracked.current) return;
    tourArrivalTracked.current = true;
    analyticsEvents.track('tourhub_tab_viewed', {
      tab: activeTab,
      source: tabParam ? 'deep_link' : 'arrival',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTab = (id: string) => {
    if (id === 'college') {
      /* College is a route, not a tab: page_view on /tourhub/college-golf
         already measures it, so no tab event here. */
      navigate('/tourhub/college-golf');
      return;
    }
    const tab = id as TourHubTab;
    if (tab !== activeTab) {
      analyticsEvents.track('tourhub_tab_changed', { tab, from: activeTab });
      analyticsEvents.track('tourhub_tab_viewed', { tab, source: 'switch' });
    }
    setActiveTab(tab);
    setSearchParams({ tab: id }, { replace: true });
    scrollPageToTop('auto');
  };

  const tabTitle = TAB_TITLES[activeTab] ?? 'Tour';
  /* Overview IS the hub: no back control there (see TourPageShell.showBack). */
  const isHubRoot = activeTab === 'overview';

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
          pickerOpen={pickerOpen}
          setPickerOpen={setPickerOpen}
        />
        {/* ONE header for every tab, overview included (S3): opaque 42px row,
            back chevron except on the hub root, tour picker off the live board,
            burger for the tour menu. */}
        <TourPageShell
            title={tabTitle}
            showBack={!isHubRoot}
            onBack={() => handleSelectTab('overview')}
            backFallback="/tourhub"
            leftSlot={
              /* The left slot is the variant slot: burger + tour picker as one
                 left-aligned group. NOTHING renders between the header border
                 and the hero — the chip rail that used to sit there is gone. */
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <AppHeaderBurger onTap={() => setMenuOpen(true)} label="Tour menu" />
                {activeTab !== 'live' && <TourPickerControl onTap={() => setPickerOpen(true)} />}
              </div>
            }
          >
            {renderTab()}
          </TourPageShell>
      </TourHubShell>
    </TourSelectionProvider>

  );
}
