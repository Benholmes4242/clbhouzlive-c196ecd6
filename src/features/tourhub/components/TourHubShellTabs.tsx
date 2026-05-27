import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { getTourLogo } from '../utils/tourLogos';
import { useAllToursTickerData } from '../hooks/useOverviewModules';
import type { TourHubTab } from './types';

type TabId = TourHubTab | 'college';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'schedule',     label: 'Schedule' },
  { id: 'players',      label: 'Players' },
  { id: 'leaderboards', label: 'Leaders' },
  { id: 'college',      label: 'College' },
];

function computeActiveTab(pathname: string, searchParams: URLSearchParams): TabId {
  if (pathname.startsWith('/tourhub/college-golf')) return 'college';
  const tab = searchParams.get('tab');
  if (tab === 'schedule') return 'schedule';
  if (tab === 'players') return 'players';
  if (tab === 'leaderboards') return 'leaderboards';
  return 'overview';
}

/**
 * TourHubShellTabs — Canonical 5-destination tab strip for the Tour Hub shell.
 * Soft-squircle pills (8px radius, cream-fill active) on a horizontally
 * scrollable rail. Shares the canonical spec with Discover's SegmentedControl.
 *
 * Tabs 1–4 update ?tab= on /tourhub. Tab 5 (College) navigates to
 * /tourhub/college-golf and reads as active across all college sub-paths.
 */
export const TourHubShellTabs: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const active = computeActiveTab(location.pathname, searchParams);

  const handleTap = (id: TabId, btn: HTMLButtonElement | null) => {
    if (id === 'college') {
      navigate('/tourhub/college-golf');
    } else {
      if (location.pathname !== '/tourhub') {
        navigate(`/tourhub?tab=${id}`);
      } else {
        setSearchParams({ tab: id });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }
    if (btn) {
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative"
      style={{
        background: '#0A0E14',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <div style={{ position: 'relative', minWidth: 0, flexShrink: 1 }}>
        <div
          ref={scrollerRef}
          className="segmented-scroller"
          role="tablist"
          aria-label="Tour Hub navigation"
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: 6,
            padding: '3px 16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={(e) => handleTap(tab.id, e.currentTarget)}
                style={{
                  flex: '0 0 auto',
                  height: 30,
                  padding: '0 12px',
                  borderRadius: 15,
                  border: isActive ? '1px solid rgba(255,255,255,0.55)' : '1px solid transparent',
                  background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--hcp-t-60)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {overflowing && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 34,
              pointerEvents: 'none',
              background: 'linear-gradient(to right, rgba(10,14,20,0), #0A0E14)',
            }}
          />
        )}
      </div>

      <TourSwitcherAffordance />
    </section>
  );
};

/**
 * TourSwitcherAffordance — discreet tour-switch button in the page chrome.
 * Pass 7: visual scaffold only. Tour switching itself is a Pass 7.1 task.
 */
const TOUR_LABEL: Record<string, string> = {
  pga: 'PGA',
  euro: 'DPWT',
  liv: 'LIV',
  lpga: 'LPGA',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
};

const TourSwitcherAffordance: React.FC = () => {
  const { data } = useAllToursTickerData();
  const [open, setOpen] = useState(false);

  // TODO Pass 7.1: derive from app state once tour filtering is wired.
  const activeTourSlug = 'pga';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Switch tour"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '0 14px 0 10px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.55)',
            cursor: 'pointer',
            fontFamily: 'Geist, system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            height: 36,
          }}
        >
          <span>{TOUR_LABEL[activeTourSlug]}</span>
          <span aria-hidden="true">↔</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        style={{
          background: '#0A0E14',
          border: 'none',
          padding: 0,
          maxHeight: '70vh',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            margin: '10px auto 4px',
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.20)',
          }}
        />
        <div
          style={{
            padding: '14px 18px 8px',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontFamily: 'Geist, system-ui, sans-serif',
          }}
        >
          ↔ Switch Tour
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Object.entries(TOUR_LABEL).map(([slug, label]) => {
            const isActive = slug === activeTourSlug;
            const liveCount = data?.live.filter((c) => c.tourSlug === slug).length ?? 0;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => {
                  // TODO Pass 7.1: implement tour filtering in HeroCarousel.
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.70)',
                  fontFamily: 'Geist, system-ui, sans-serif',
                  fontSize: 16,
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span>{label}</span>
                {liveCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.16em',
                        color: '#10B981',
                      }}
                    >
                      LIVE
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TourHubShellTabs;
