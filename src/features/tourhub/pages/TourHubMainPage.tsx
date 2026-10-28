import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';
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
import { TourIsland, useTourIslandDescriptor } from '../components/TourIsland';
import { TourGlance } from '@/features/chrome-v2/TourGlance';
import { TourIcon } from '../components/tourIslandIcons';
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
 * TourHubChromeBridge — registers the ChromeIsland left-capsule slot with the
 * ONE tour control (BRIEF_TOUR_ISLAND): the TourIsland showing the tour in
 * view plus one line of context, opening TourGlance. The burger drawer and
 * the picker sheet are no longer rendered by this page; Profile, Settings and
 * Sign out live in the account tile. SeasonStatsIndex and
 * TourSwitcherAffordance still open TourPickerSheet, and NewsChromeBridge
 * still opens TourSideMenu — those surfaces are unchanged.
 */
function TourHubChromeBridge({
  activeTab,
  onSelectTab,
  backMode,
  onBack,
  glanceAnchor,
  glanceOpen,
  openGlance,
  closeGlance,
}: {
  activeTab: TourHubTab;
  onSelectTab: (tabId: string) => void;
  backMode: boolean;
  onBack: () => void;
  glanceAnchor: HTMLElement | null;
  glanceOpen: boolean;
  openGlance: (anchor: HTMLElement) => void;
  closeGlance: () => void;
}) {
  const d = useTourIslandDescriptor(activeTab);

  const slot = useMemo(
    () => (
      <TourIsland
        label={d.label}
        caption={d.caption}
        captionLive={d.captionLive}
        logoSlug={d.logoSlug}
        glyph={d.glyph}
        mode={backMode ? 'back' : 'menu'}
        onBackTap={onBack}
        onOpen={openGlance}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d.label, d.caption, d.captionLive, d.logoSlug, d.glyph, backMode, onBack, openGlance],
  );
  useSetChromeLeftSlot(slot);

  if (!glanceOpen || !glanceAnchor) return null;
  return (
    <TourGlance
      onClose={closeGlance}
      anchorRef={{ current: glanceAnchor }}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      sectionsOnly={activeTab === 'live'}
    />
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
  /* Owned here, not in the bridge: the sub-page shell suppresses the island, so
     its own header carries the tour control and needs the same tile state. */
  const [glanceOpen, setGlanceOpen] = useState(false);
  const [glanceAnchor, setGlanceAnchor] = useState<HTMLElement | null>(null);
  const openGlance = useCallback((anchor: HTMLElement) => {
    setGlanceAnchor(anchor);
    setGlanceOpen(true);
  }, []);
  const closeGlance = useCallback(() => setGlanceOpen(false), []);

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

  const { logout } = useLogout();

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'news':
        return <NewsTab immersiveHero={false} />;
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
      <TourHubShell showBack={false} immersiveStatusBar={isHubRoot}>
        <TourHubChromeBridge
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          backMode={backMode}
          onBack={() => safeGoBack(navigate, '/tourhub')}
          glanceAnchor={glanceAnchor}
          glanceOpen={glanceOpen}
          openGlance={openGlance}
          closeGlance={closeGlance}
        />
        {/* The overview is the immersive exception: the hero starts at the
            physical top and the shared left/right islands float over it. Legacy
            pushed tabs retain their solid in-flow AppHeader until retirement. */}
        {isHubRoot ? renderTab() : (
          /* Route immersion is path-based, so query-param tabs share the
             overview's y=0 shell. Their own opaque header therefore becomes
             the single safe-area owner while the overview remains full bleed. */
          <div style={{ paddingTop: 'var(--tour-header-h, 0px)' }}>
            <TourPageShell
              title={tabTitle}
              showBack
              onBack={() => handleSelectTab('overview')}
              backFallback="/tourhub"
              leftSlot={
                /* BRIEF_TOUR_ISLAND §1: one control everywhere — the sub-tab
                   header carries the same tour label, opening the same
                   TourGlance tile. The burger drawer is gone from the hub. */
                <SubTabTourControl activeTab={activeTab} onOpen={openGlance} />
              }
            >
              {renderTab()}
            </TourPageShell>
          </div>
        )}
      </TourHubShell>
    </TourSelectionProvider>

  );
}
