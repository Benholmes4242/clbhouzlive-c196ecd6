import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { TourHubTab } from './types';
import { TourSwitcherAffordance } from './TourSwitcherAffordance';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import { useTourSelection } from '../context/TourSelectionContext';
import { useHeroFullBleed } from '../_shared/heroFullBleedSignal';
import { HeaderAvatarButton } from '@/components/header/HeaderAvatarButton';

type TabId = TourHubTab | 'college';

interface TabDef {
  id: TabId;
  label: string;
}

function computeActiveTab(pathname: string, searchParams: URLSearchParams): TabId {
  if (pathname.startsWith('/tourhub/college-golf')) return 'college';
  const tab = searchParams.get('tab');
  if (tab === 'live') return 'live';
  if (tab === 'schedule') return 'schedule';
  if (tab === 'players') return 'players';
  if (tab === 'leaderboards') return 'leaderboards';
  return 'overview';
}

/**
 * TourHubShellTabs — Canonical 5-destination tab strip for the Tour Hub shell.
 */
export interface TourHubShellTabsProps {
  /** When true, paint transparent with white text — for use over the
   *  cinematic full-bleed hero on the Overview tab. */
  overlay?: boolean;
}

export const TourHubShellTabs: React.FC<TourHubShellTabsProps> = ({ overlay = false }) => {
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
  // Immersive surface (cinematic hero overview): persist one-row chrome even
  // after scroll-to-opaque so we never re-sprout the logo/pill row.
  const heroFullBleed = useHeroFullBleed();
  const immersiveSurface = active === 'overview' && heroFullBleed;

  const { viewingTourSlug, selectedTourSlug } = useTourSelection();
  const tourSettled = (viewingTourSlug ?? selectedTourSlug) != null;
  // Show the switcher only on Overview, and only once the hero has reported a
  // real tour — so it fades in already correct, never flashing PGA then jumping.
  const showSwitcher = active === 'overview' && tourSettled;

  const { data: liveTournaments } = useLiveTournaments();
  const showLive = (liveTournaments?.length ?? 0) > 0;

  const tabs = useMemo<TabDef[]>(() => {
    const base: TabDef[] = [{ id: 'overview', label: 'Overview' }];
    if (showLive) base.push({ id: 'live', label: 'Leaderboards' });
    base.push(
      { id: 'schedule', label: 'Schedule' },
      { id: 'players', label: 'Players' },
      { id: 'leaderboards', label: 'Leaders' },
      { id: 'college', label: 'College' },
    );
    return base;
  }, [showLive]);

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
        background: overlay ? 'transparent' : '#F8FAFC',
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: overlay
          ? '0.5px solid rgba(255,255,255,0.18)'
          : '0.5px solid rgba(15,23,42,0.08)',
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
          {tabs.map((tab) => {
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
                  color: overlay
                    ? (isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)')
                    : (isActive ? '#0A0E14' : '#64748B'),
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
              background: overlay
                ? 'linear-gradient(to right, rgba(15,23,42,0), rgba(15,23,42,0.001))'
                : 'linear-gradient(to right, rgba(248,250,252,0), #F8FAFC)',
            }}
          />
        )}
      </div>
      <AnimatePresence initial={false} mode="wait">
        {showSwitcher && (
          <motion.div
            key="tour-switcher"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{
              opacity: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
              width: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
            }}
            style={{ overflow: 'hidden', flex: '0 0 auto', display: 'flex' }}
          >
            <TourSwitcherAffordance />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TourHubShellTabs;
