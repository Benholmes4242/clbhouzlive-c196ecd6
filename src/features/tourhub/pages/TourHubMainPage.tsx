import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { applyShieldColor } from '@/hooks/useMedianStatusBar';

export function TourHubMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TourHubTab | null;
  const [activeTab, setActiveTab] = useState<TourHubTab>(tabParam || 'overview');

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

  // ───────── Cinematic full-bleed hero overlay machinery ─────────
  // HybridHero (inside OverviewTab → OverviewHero) flips the heroFullBleed
  // signal when it is rendering CinematicHeroFullBleed (live/results).
  const heroIsCinematic = useHeroFullBleed();
  const fullBleedHero = activeTab === 'overview' && heroIsCinematic;

  // heroCovering = the hero still covers the top of the viewport.
  // Scroll-threshold based: true at mount; flips false after scrolling past
  // the hero. (Hero height ≈ 528px; chrome ≈ 96px.)
  const [heroCovering, setHeroCovering] = useState(true);
  useEffect(() => {
    if (!fullBleedHero) {
      setHeroCovering(false);
      return;
    }
    setHeroCovering(true);
    const HERO_HEIGHT = 528;
    const CHROME = 96;
    const threshold = HERO_HEIGHT - CHROME;
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setHeroCovering(y < threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [fullBleedHero]);

  // Drive the global chrome flag (CompactHeader + ShellSlot read this).
  useEffect(() => {
    const on = fullBleedHero && heroCovering;
    document.documentElement.style.setProperty('--tour-hero-overlay', on ? '1' : '0');
    window.dispatchEvent(new CustomEvent('tour-hero-overlay', { detail: on }));
    return () => {
      document.documentElement.style.setProperty('--tour-hero-overlay', '0');
      window.dispatchEvent(new CustomEvent('tour-hero-overlay', { detail: false }));
    };
  }, [fullBleedHero, heroCovering]);

  const overlay = fullBleedHero && heroCovering;

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

  return (
    <TourSelectionProvider>
      <TourHubShell showBack={false}>
        <ShellSlot>
          <TourHubShellTabs overlay={overlay} />
          {renderShellRow()}
        </ShellSlot>

        {fullBleedHero ? (
          // Hero bleeds into the notch behind the (now-transparent) chrome.
          <div>{renderTab()}</div>
        ) : (
          <div style={{ paddingTop: 'calc(var(--chrome-total-h, 0px) - 1px)' }}>
            {renderTab()}
          </div>
        )}
      </TourHubShell>
    </TourSelectionProvider>
  );
}
