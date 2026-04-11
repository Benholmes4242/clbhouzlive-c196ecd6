/**
 * TourHubNavOverlay - Premium overlay menu for Tour Hub navigation
 * Card-style nav items with live data teasers and cinematic animations
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

// Clbhouz brand orange
const CLBHOUZ_ORANGE = '#F59E0B';

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

// Animation config
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

  // Only fetch data when overlay is open (lazy-mount)
  const { data: topPlayers, isLoading: rankingsLoading } = useTopWorldRanked(5);
  const { data: liveCount } = useLiveTournamentCount();
  const { data: leaderTeaser } = useLiveLeaderTeaser();
  const { data: topCollege } = useTopCollegeTeaser();
  
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);
  
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // TM-10: Android back button handler
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ drawer: true }, '');
    const handlePopState = () => { onClose(); };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [isOpen, onClose]);

  // Simple focus trap
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
  
  if (typeof document === 'undefined') return null;
  
  const portalRoot = document.getElementById('portal-root') || document.body;

  const displayPlayers = topPlayers?.slice(0, 5) || [];
  const hasLive = (liveCount ?? 0) > 0;

  // Generate dynamic subtitle for Schedule
  const scheduleSubtitle = hasLive
    ? `${liveCount} tournament${(liveCount ?? 0) > 1 ? 's' : ''} live right now.`
    : "What's happening - past, present, and upcoming.";

  // TM-08: aria-labels for each card
  const getAriaLabel = (item: NavItem) => {
    switch (item.value) {
      case 'overview': return 'Overview — The global golf season at a glance';
      case 'schedule': return hasLive ? `Schedule — ${liveCount} tournament${(liveCount ?? 0) > 1 ? 's' : ''} live right now` : 'Schedule - What\'s happening past, present, and upcoming';
      case 'players': return 'Players — The names shaping the season';
      case 'leaderboards': return 'Performance Rankings — Statistical leaders across every category';
      default: return item.label;
    }
  };

  // Helper: render card teaser text — TM-04: player + tournament names tappable
  const renderTeaser = (item: NavItem) => {
    // Show skeleton while leader data is loading
    if (item.value === 'overview' && hasLive && !leaderTeaser) {
      return (
        <div className="mt-1 flex flex-col gap-1.5 animate-pulse">
          <div className="h-3 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      );
    }
    if (item.value === 'overview' && leaderTeaser && hasLive) {
      const scoreStr = leaderTeaser.score !== null
        ? (leaderTeaser.score < 0 ? `${leaderTeaser.score}` : `${leaderTeaser.score > 0 ? '+' : ''}${leaderTeaser.score}`)
        : null;
      return (
        <p className="text-[13px] mt-1 text-muted-foreground">
          {leaderTeaser.isTied ? (
            <span className="font-medium">{leaderTeaser.playerName}</span>
          ) : (
            <button
              type="button"
              className="font-medium transition-opacity active:opacity-70 focus:outline-none"
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
            className="truncate transition-opacity active:opacity-70 focus:outline-none text-left"
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

  // Helper: render right-side badge for nav items
  const renderBadge = (item: NavItem) => {
    if (item.value === 'schedule' && hasLive) {
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ background: TOUR_COLORS.liveGreen }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span 
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: TOUR_COLORS.liveGreen }}
          >
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
          {/* Backdrop - tap to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[9998]"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
            }}
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Full-width overlay panel */}
          <motion.div
            ref={overlayRef}
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ 
              type: 'spring',
              damping: 28,
              stiffness: 300,
            }}
            className="fixed inset-y-0 right-0 z-[10000] flex flex-col overflow-hidden"
            style={{
              width: '100vw',
              maxWidth: '480px',
              marginLeft: 'auto',
              background: '#F8FAFC',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Tour Hub navigation menu"
          >
            {/* Clbhouz Logo Mark Watermark */}
            <div
              className="fixed pointer-events-none"
              style={{
                right: '-100px',
                bottom: '-80px',
                width: 'min(380px, 100vw)',
                height: 'min(380px, 100vw)',
                zIndex: 0,
              }}
            >
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.04, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                src="/assets/logomark-orange.png"
                alt=""
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Grab bar — top of sheet, no close button needed */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 10,
              paddingBottom: 6,
              flexShrink: 0,
            }}>
              <div style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                background: 'rgba(0,0,0,0.12)',
              }} />
            </div>

            {/* Header spacer for safe area */}
            <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)' }} />
            
            {/* Scrollable content — rankings + nav items together */}
            <div
              className="flex-1 overflow-y-auto min-h-0"
              style={{
                overscrollBehavior: 'contain',
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
              }}
            >
            
            {/* World Rankings Strip */}
            {(rankingsLoading || displayPlayers.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="px-5 pb-4 pt-4"
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏆</span>
                    <span className="text-[11px] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "#94a3b8" }}>
                      World Rankings
                    </span>
                  </div>
                  
                  <motion.button
                    onClick={handleViewAllRankings}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-0.5 text-[13px] font-semibold transition-opacity active:opacity-70 outline-none focus:outline-none focus-visible:outline-none"
                    style={{ color: "#F5A623" }}
                  >
                    View all
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
                
                {/* Glass Cards Row — with right-side fade overlay */}
                <div className="relative">
                  <div
                    ref={scrollRef}
                    className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide"
                    style={{
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
                          className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl animate-pulse"
                          style={{
                            minWidth: '155px',
                            background: 'rgba(255,255,255,0.80)',
                            border: '1px solid rgba(0,0,0,0.07)',
                          }}
                        >
                          <div className="w-5 h-3 rounded-full bg-slate-200 flex-shrink-0" />
                          <div className="w-9 h-9 rounded-[11px] bg-slate-200 flex-shrink-0" />
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="h-3 w-16 rounded bg-slate-200" />
                            <div className="h-2.5 w-12 rounded bg-slate-200" />
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
                            className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-all"
                            style={{
                              scrollSnapAlign: 'start',
                              background: isFirst 
                                ? 'rgba(245,166,35,0.09)'
                                : 'rgba(255,255,255,0.80)',
                              border: isFirst 
                                ? '1.5px solid rgba(245,166,35,0.22)'
                                : '1px solid rgba(0,0,0,0.07)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                              minWidth: '155px',
                            }}
                          >
                            <span
                              className="flex-shrink-0 text-center"
                              style={{
                                width: '20px',
                                fontSize: '13px',
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                                color: index === 0
                                  ? 'hsl(var(--accent-amber))'
                                  : 'hsl(var(--muted-foreground))',
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
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {lastName}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
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
            <div className="h-px mx-5" style={{ background: 'rgba(0,0,0,0.07)' }} />
            
            {/* Nav + Link items */}
            <div className="px-5 py-5">
              <div className="space-y-2">
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
                      className="w-full flex items-center gap-3.5 p-4 rounded-[18px] text-left relative overflow-hidden"
                      style={{
                        background: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                        border: isActive ? '1.5px solid rgba(245,166,35,0.22)' : '1px solid rgba(0,0,0,0.06)',
                        boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={getAriaLabel(item)}
                    >
                      {/* Icon in circle */}
                      <div 
                        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          background: isActive ? 'rgba(245,166,35,0.14)' : 'rgba(0,0,0,0.04)',
                          color: isActive ? '#d97706' : '#64748b',
                        }}
                      >
                        {item.icon}
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        {/* Title row — badge inline on the right */}
                        <div className="flex items-center justify-between gap-2">
                          <div 
                          className="text-[15px] font-bold"
                          style={{ 
                            color: '#0f172a',
                            letterSpacing: '-0.2px',
                          }}
                          >
                            {item.label}
                          </div>
                          {renderBadge(item)}
                        </div>
                        <div className="text-[13px] mt-1 leading-relaxed text-muted-foreground">
                          {dynamicSubtitle}
                        </div>
                        {renderTeaser(item)}
                      </div>
                    </motion.button>
                  );
                })}

              {/* Link Items (College Golf, etc.) — unified list continues */}
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
                    className="w-full flex items-center gap-3.5 p-4 rounded-[18px] text-left"
                    style={{
                      background: 'rgba(255,255,255,0.60)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                    aria-label={`${item.label} — ${item.subtitle}`}
                  >
                    {/* Icon in circle */}
                    <div 
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.04)', color: '#64748b' }}
                    >
                      {item.icon}
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[15px] font-bold"
                          style={{ color: '#0f172a' }}
                        >
                          {item.label}
                        </span>
                        {item.badge && (
                          <span 
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide text-white"
                            style={{ background: CLBHOUZ_ORANGE }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] mt-1 leading-relaxed text-muted-foreground">
                        {item.subtitle}
                      </div>
                      {/* TM-06: College #1 teaser — school name tappable */}
                      {item.id === 'college-golf' && !topCollege && (
                        <div className="flex items-center gap-2 mt-1 animate-pulse">
                          <div className="w-5 h-5 rounded-sm bg-slate-100 flex-shrink-0" />
                          <div className="h-3 w-24 rounded bg-slate-100" />
                          <div className="h-3 w-16 rounded bg-slate-100" />
                        </div>
                      )}
                      {item.id === 'college-golf' && topCollege && (
                        <p className="text-[13px] mt-1 text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 transition-opacity active:opacity-70 focus:outline-none"
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
                                className="w-5 h-5 rounded-sm object-contain flex-shrink-0" 
                              />
                            )}
                            <span className="font-medium">{topCollege.name}</span>
                          </button>
                          <span className="truncate">
                            {' leads • '}
                            {formatCurrency(topCollege.earnings)} earned
                          </span>
                        </p>
                      )}
                    </div>
                    
                    {/* Chevron */}
                    <ChevronRight 
                      className="w-4.5 h-4.5 flex-shrink-0 text-muted-foreground/50"
                    />
                  </motion.button>
                ))}

              </div>{/* close space-y-2 */}
            </div>{/* close px-5 py-5 wrapper */}
            </div>{/* close scroll container */}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

/** TM-11: Avatar with initials fallback */
function AvatarWithInitials({ src, alt, initials, size }: { src: string | null | undefined; alt: string; initials: string; size: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const radius = `${Math.round(size * 0.306)}px`; // 34% squircle

  if (!src || imgFailed) {
    return (
      <div 
        className="flex-shrink-0 overflow-hidden border border-border/50 bg-muted flex items-center justify-center"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <span className="text-[11px] font-semibold text-muted-foreground">{initials}</span>
      </div>
    );
  }

  return (
    <div 
      className="flex-shrink-0 overflow-hidden border border-border/50"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <img 
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}
