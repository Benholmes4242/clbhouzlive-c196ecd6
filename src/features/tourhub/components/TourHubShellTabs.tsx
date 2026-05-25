import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
      }}
    >
      <div
        ref={scrollerRef}
        className="segmented-scroller"
        role="tablist"
        aria-label="Tour Hub navigation"
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 8,
          padding: '6px 16px',
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
                padding: '0 11px',
                borderRadius: 15,
                border: isActive ? '1px solid rgba(255,255,255,0.55)' : '1px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--hcp-t-60)',
                fontFamily: 'inherit',
                fontSize: 14,
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
            width: 28,
            pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(10,14,20,0), #0A0E14)',
          }}
        />
      )}
    </section>
  );
};

export default TourHubShellTabs;
