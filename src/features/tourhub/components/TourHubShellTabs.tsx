import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { TourHubTab } from './types';
import { TourSwitcherAffordance } from './TourSwitcherAffordance';

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
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <div style={{ position: 'relative', minWidth: 0, flex: '1 1 auto' }}>
        <div
          ref={scrollerRef}
          className="segmented-scroller"
          role="tablist"
          aria-label="Tour Hub navigation"
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: 8,
            padding: '0 16px',
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
                  height: 44,
                  padding: '0 4px',
                  borderRadius: 0,
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#0F172A' : '#64748B',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 600,
                  letterSpacing: '-0.005em',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  position: 'relative',
                  transition: 'color 0.15s',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    paddingBottom: 4,
                    borderBottom: isActive ? '1.5px solid #0F172A' : '1.5px solid transparent',
                  }}
                >
                  {tab.label}
                </span>
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
              background: 'linear-gradient(to right, rgba(248,250,252,0), #F8FAFC)',
            }}
          />
        )}
      </div>
      <TourSwitcherAffordance />
    </section>
  );
};


export default TourHubShellTabs;
