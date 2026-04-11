/**
 * TourHubNavOverlay - Command Centre bottom sheet for Tour Hub navigation
 * Light editorial design with live ticker, world rankings strip, and clean nav rows
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
} from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useTopWorldRanked, toTitleCase, getInitials } from '../hooks/useWorldRankings';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { 
  useLiveTournamentCount, 
  useLiveLeaderTeaser, 
  useTopCollegeTeaser 
} from '../hooks/useNavMenuData';
import { TOUR_COLORS } from '../constants/colors';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { TourHubTab } from './TourHubTabs';

interface NavItem {
  value: TourHubTab;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface LinkItem {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { value: 'overview', label: 'Overview', subtitle: 'The global golf season at a glance.', icon: <span className="text-xl">🌍</span> },
  { value: 'schedule', label: 'Schedule', subtitle: 'What\'s happening - past, present, and upcoming.', icon: <span className="text-xl">📅</span> },
  { value: 'players', label: 'Players', subtitle: 'The names shaping the season across every tour.', icon: <span className="text-xl">🏌️</span> },
  { value: 'leaderboards', label: 'Performance Rankings', subtitle: 'Statistical leaders across every category.', icon: <span className="text-xl">🏆</span> },
];

const LINK_ITEMS: LinkItem[] = [
  { 
    id: 'college-golf', 
    label: 'College Franchise Rankings', 
    subtitle: 'From campus standout to Tour contender.',
    path: '/tourhub/college-golf',
    icon: <span className="text-xl">🎓</span>,
  },
];

const ITEM_EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

interface TourHubNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TourHubTab;
  onNavigate: (tab: TourHubTab) => void;
}

export function TourHubNavOverlay({ 
  isOpen, 
  onClose, 
  activeTab, 
  onNavigate 
}: TourHubNavOverlayProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const { data: topPlayers, isLoading: rankingsLoading } = useTopWorldRanked(5);
  const { data: liveCount } = useLiveTournamentCount();
  const { data: leaderTeaser } = useLiveLeaderTeaser();
  const { data: topCollege } = useTopCollegeTeaser();
  
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ drawer: true }, '');
    const handlePopState = () => { onClose(); };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;
    const overlay = overlayRef.current;
    const focusableEls = overlay.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableEls.length === 0) return;
    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];
    firstEl.focus();
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      } else {
        if (document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);
  
  const handleItemClick = useCallback((tab: TourHubTab) => {
    haptic('light');
    onNavigate(tab);
    onClose();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [onNavigate, onClose]);

  const handleLinkClick = useCallback((path: string) => {
    haptic('light');
    onClose();
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [onClose, navigate]);

  const handleViewAllRankings = useCallback(() => {
    haptic('light');
    onNavigate('leaderboards');
    onClose();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [onNavigate, onClose]);

  const handlePlayerClick = useCallback((playerId: string) => {
    haptic('light');
    onClose();
    navigate(`/tourhub/player/${playerId}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [onClose, navigate]);


  // Cycle ticker index when multiple live tournaments
  const hasLive = (liveCount ?? 0) > 0;
  useEffect(() => {
    if (!hasLive || (liveCount ?? 0) <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex(i => (i + 1) % (liveCount ?? 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [hasLive, liveCount]);
  // TODO: extend useLiveLeaderTeaser to return array for multi-tournament cycling

  if (typeof document === 'undefined') return null;
  
  const portalRoot = document.getElementById('portal-root') || document.body;

  const displayPlayers = topPlayers?.slice(0, 5) || [];

  const scheduleSubtitle = hasLive
    ? `${liveCount} tournament${(liveCount ?? 0) > 1 ? 's' : ''} live right now.`
    : "What's happening - past, present, and upcoming.";

  const getAriaLabel = (item: NavItem) => {
    switch (item.value) {
      case 'overview': return 'Overview — The global golf season at a glance';
      case 'schedule': return hasLive ? `Schedule — ${liveCount} tournament${(liveCount ?? 0) > 1 ? 's' : ''} live right now` : 'Schedule - What\'s happening past, present, and upcoming';
      case 'players': return 'Players — The names shaping the season';
      case 'leaderboards': return 'Performance Rankings — Statistical leaders across every category';
      default: return item.label;
    }
  };

  const renderTeaser = (item: NavItem) => {
    if (item.value === 'overview' && hasLive && !leaderTeaser) {
      return (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 12, width: '75%', borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} className="animate-pulse" />
          <div style={{ height: 12, width: '50%', borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} className="animate-pulse" />
        </div>
      );
    }
    if (item.value === 'overview' && leaderTeaser && hasLive) {
      const scoreStr = leaderTeaser.score !== null
        ? (leaderTeaser.score < 0 ? `${leaderTeaser.score}` : `${leaderTeaser.score > 0 ? '+' : ''}${leaderTeaser.score}`)
        : null;
      return (
        <p style={{ fontSize: 11, marginTop: 2, color: '#64748b' }}>
          {leaderTeaser.isTied ? (
            <span style={{ fontWeight: 500 }}>{leaderTeaser.playerName}</span>
          ) : (
            <button
              type="button"
              style={{ fontWeight: 500, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              className="transition-opacity active:opacity-70 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                if (leaderTeaser.playerId) handlePlayerClick(leaderTeaser.playerId);
              }}
            >
              {leaderTeaser.playerName}
            </button>
          )}
          {leaderTeaser.isTied ? ' at ' : ' leads at '}
          {scoreStr !== null && (
            <span style={{ color: leaderTeaser.score !== null && leaderTeaser.score < 0 ? TOUR_COLORS.scoreUnderPar : undefined }}>
              {scoreStr}
            </span>
          )}
          <br />
          <button
            type="button"
            style={{ color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            className="truncate transition-opacity active:opacity-70 focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              if (leaderTeaser.tournamentId) {
                haptic('light');
                onClose();
                navigate(`/tourhub/tournament/${leaderTeaser.tournamentId}`);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }
            }}
          >
            {leaderTeaser.tournamentName}
          </button>
        </p>
      );
    }
    return null;
  };

  const renderBadge = (item: NavItem) => {
    if (item.value === 'schedule' && hasLive) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <motion.span
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#22C55E' }}>
            {liveCount} LIVE
          </span>
        </div>
      );
    }
    return null;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(0, 0, 0, 0.35)' }}
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Bottom sheet panel */}
          <motion.div
            ref={overlayRef}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-[10000] flex flex-col overflow-hidden"
            style={{
              width: '100%',
              borderRadius: '20px 20px 0 0',
              background: '#F8FAFC',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              maxHeight: '88vh',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Tour Hub navigation menu"
          >
            {/* Grab bar */}
            <div style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 48, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto min-h-0"
              style={{ overscrollBehavior: 'contain' }}
            >
              {/* Live Ticker */}
              {hasLive && leaderTeaser && (
                <div style={{
                  margin: '14px 18px 0',
                  background: 'linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)',
                  border: '1px solid rgba(34,197,94,0.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.span
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#22C55E', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Live now</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{leaderTeaser.tournamentName}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.35)' }}>Leader</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                      {leaderTeaser.playerName.split(' ').pop()}{' '}
                      <span style={{ color: '#0f172a' }}>
                        {leaderTeaser.score !== null
                          ? leaderTeaser.score < 0 ? `${leaderTeaser.score}` : leaderTeaser.score > 0 ? `+${leaderTeaser.score}` : 'E'
                          : ''}
                      </span>
                    </div>
                    {(liveCount ?? 0) > 1 && (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 6 }}>
                        {Array.from({ length: liveCount ?? 0 }).map((_, i) => (
                          <div key={i} style={{
                            width: i === tickerIndex ? 14 : 5,
                            height: 5,
                            borderRadius: 3,
                            background: i === tickerIndex ? '#16a34a' : 'rgba(0,103,71,0.2)',
                            transition: 'width 0.3s ease',
                          }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* World Rankings Strip */}
              {(rankingsLoading || displayPlayers.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 18px 8px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                      World Rankings
                    </span>
                    <button onClick={handleViewAllRankings} style={{ fontSize: 10, color: '#F7931E', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      View all ›
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div
                      ref={scrollRef}
                      className="scrollbar-hide"
                      style={{
                        display: 'flex',
                        gap: 8,
                        overflowX: 'auto',
                        paddingBottom: 4,
                        paddingLeft: 50,
                        paddingRight: 18,
                        scrollPaddingLeft: 50,
                        scrollPaddingRight: 18,
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {rankingsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="animate-pulse"
                            style={{
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 10px',
                              borderRadius: 10,
                              minWidth: 130,
                              background: 'rgba(255,255,255,0.80)',
                              border: '1px solid rgba(0,0,0,0.07)',
                            }}
                          >
                            <div style={{ width: 14, height: 12, borderRadius: 4, background: 'rgba(0,0,0,0.08)' }} />
                            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(0,0,0,0.08)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                              <div style={{ height: 12, width: 48, borderRadius: 4, background: 'rgba(0,0,0,0.08)' }} />
                              <div style={{ height: 10, width: 36, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        displayPlayers.map((player, index) => {
                          const isFirst = index === 0;
                          const lastName = player.playerName.split(' ').slice(-1)[0];
                          const country = toTitleCase(player.country);
                          
                          return (
                            <motion.button
                              key={player.playerId}
                              initial={false}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handlePlayerClick(player.playerId)}
                              style={{
                                scrollSnapAlign: 'start',
                                background: isFirst ? 'rgba(245,166,35,0.09)' : 'rgba(255,255,255,0.80)',
                                border: isFirst ? '1.5px solid rgba(245,166,35,0.22)' : '1px solid rgba(0,0,0,0.07)',
                                borderRadius: 10,
                                padding: '8px 10px',
                                paddingLeft: 10,
                                marginLeft: 0,
                                minWidth: 130,
                                display: 'flex', alignItems: 'center', gap: 8,
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13, fontWeight: 800,
                                  color: isFirst ? '#F7931E' : 'rgba(0,0,0,0.3)',
                                  minWidth: 14,
                                  fontVariantNumeric: 'tabular-nums',
                                  flexShrink: 0,
                                }}
                              >
                                {player.worldRank}
                              </span>
                              {(() => {
                                const headshot = getPlayerHeadshotUrl(player.playerName, (player as any).tourCode ?? 'pga');
                                const initials = getInitials(player.playerName);
                                return (
                                  <AvatarWithInitials
                                    src={headshot}
                                    alt={player.playerName}
                                    initials={initials}
                                    size={36}
                                  />
                                );
                              })()}
                              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                <p style={{ color: '#0f172a', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                                  {lastName}
                                </p>
                                <p style={{ color: '#64748b', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                                  {country || 'Unknown'}
                                </p>
                              </div>
                            </motion.button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '14px 18px' }} />

              {/* Nav Items + Link Items */}
              <div style={{ padding: '0 18px' }}>
                {NAV_ITEMS.map((item, index) => {
                  const isActive = activeTab === item.value;
                  const dynamicSubtitle = item.value === 'schedule' ? scheduleSubtitle : item.subtitle;
                  
                  return (
                    <motion.button
                      key={item.value}
                      initial={{ opacity: 0, x: 16, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.15 + index * 0.05,
                        duration: 0.3,
                        ease: ITEM_EASE,
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleItemClick(item.value)}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 0',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: index < NAV_ITEMS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                        cursor: 'pointer',
                        opacity: 1,
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={getAriaLabel(item)}
                    >
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.3px' }}>
                            {item.label}
                          </span>
                          {renderBadge(item)}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {dynamicSubtitle}
                        </div>
                        {renderTeaser(item)}
                      </div>
                      <span style={{ fontSize: 16, color: 'rgba(0,0,0,0.2)', flexShrink: 0, marginLeft: 8 }}>›</span>
                    </motion.button>
                  );
                })}

                <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '4px 0' }} />

                {LINK_ITEMS.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 16, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.15 + (NAV_ITEMS.length + index) * 0.05 + 0.08,
                      duration: 0.3,
                      ease: ITEM_EASE,
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleLinkClick(item.path)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 0',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label={`${item.label} — ${item.subtitle}`}
                  >
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.3px' }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            color: '#fff', background: '#F7931E',
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {item.subtitle}
                      </div>
                      {item.id === 'college-golf' && !topCollege && (
                        <div className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ height: 12, width: 96, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ height: 12, width: 64, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} />
                        </div>
                      )}
                      {item.id === 'college-golf' && topCollege && (
                        <p style={{ fontSize: 11, marginTop: 4, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '4px 0 0' }}>
                          <button
                            type="button"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0f172a' }}
                            className="transition-opacity active:opacity-70 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic('light');
                              onClose();
                              navigate('/tourhub/college-golf');
                              window.scrollTo({ top: 0, behavior: 'instant' });
                            }}
                          >
                            {topCollege.logoUrl && (
                              <img 
                                src={topCollege.logoUrl} 
                                alt="" 
                                style={{ width: 20, height: 20, borderRadius: 3, objectFit: 'contain', flexShrink: 0 }}
                              />
                            )}
                            <span style={{ fontWeight: 500 }}>{topCollege.name}</span>
                          </button>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {' leads • '}
                            {formatCurrency(topCollege.earnings)} earned
                          </span>
                        </p>
                      )}
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, flexShrink: 0, color: 'rgba(0,0,0,0.2)' }} />
                  </motion.button>
                ))}
              </div>

              {/* Bottom safe area */}
              <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

/** Avatar with initials fallback */
function AvatarWithInitials({ src, alt, initials, size }: { src: string | null | undefined; alt: string; initials: string; size: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const radius = `${Math.round(size * 0.306)}px`;

  if (!src || imgFailed) {
    return (
      <div 
        style={{
          width: size, height: size, borderRadius: radius,
          border: '1px solid rgba(0,0,0,0.07)',
          background: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{initials}</span>
      </div>
    );
  }

  return (
    <div 
      style={{
        width: size, height: size, borderRadius: radius,
        border: '1px solid rgba(0,0,0,0.07)',
        flexShrink: 0, overflow: 'hidden',
      }}
    >
      <img 
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loading="lazy"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}
