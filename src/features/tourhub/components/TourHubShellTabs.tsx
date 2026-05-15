import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { TourHubTab } from './types';

type TabId = TourHubTab | 'college';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'players', label: 'Players' },
  { id: 'leaderboards', label: 'Leaders' },
  { id: 'college', label: 'College' },
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
 *
 * Tour-Hub variant of the Discover tab strip: 15px font / 24px gap / ~36px
 * row height. All other specs (padding, 2.5px amber underline, weights,
 * letter-spacing) match Discover.
 *
 * Tabs 1–4 update ?tab= on /tourhub. Tab 5 (College) navigates to
 * /tourhub/college-golf and reads as active across all college sub-paths.
 */
export const TourHubShellTabs: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const active = computeActiveTab(location.pathname, searchParams);

  const handleTap = (id: TabId) => {
    if (id === 'college') {
      navigate('/tourhub/college-golf');
      return;
    }
    if (location.pathname !== '/tourhub') {
      navigate(`/tourhub?tab=${id}`);
    } else {
      setSearchParams({ tab: id });
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  };

  return (
    <section className="py-0 px-4 bg-background flex justify-center">
      <div
        role="tablist"
        aria-label="Tour Hub navigation"
        style={{
          borderBottom: '1px solid hsl(var(--border))',
          display: 'inline-flex',
          gap: 24,
          justifyContent: 'center',
        }}
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTap(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 4px 9px',
                fontSize: 15,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                letterSpacing: isActive ? '-0.025em' : '0',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.18s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default TourHubShellTabs;
