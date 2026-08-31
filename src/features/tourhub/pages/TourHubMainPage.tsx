import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Menu } from 'lucide-react';
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

/**
 * TourPickerTrigger — the tour label + chevron beside the back chevron in
 * TourPageShell's header on the tour sub-pages. It mirrors TourIslandLeft's
 * picker language (divider, 12.5/700 label, small chevron) because it does the
 * same job: the shell suppresses the global ChromeIsland, so the island's own
 * left capsule is not on screen on these tabs.
 */
function TourPickerTrigger({ onTap }: { onTap: () => void }) {
  const label = useTourShortLabel();
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span
        aria-hidden
        style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)', flexShrink: 0 }}
      />
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Switch tour \u2014 current ${label}`}
        onClick={onTap}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
        className="active:scale-[0.96]"
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <ChevronDown size={10} color="rgba(255,255,255,0.62)" strokeWidth={2.4} aria-hidden />
      </button>
    </div>
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

  const heroIsCinematic = useHeroFullBleed();
  const fullBleedHero = activeTab === 'overview' && heroIsCinematic;

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
          pickerOpen={pickerOpen}
          setPickerOpen={setPickerOpen}
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
            leftAccessory={
              activeTab === 'live'
                ? undefined
                : <TourPickerTrigger onTap={() => setPickerOpen(true)} />
            }
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
