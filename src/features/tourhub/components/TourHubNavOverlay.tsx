/**
 * TourHubNavOverlay - Premium frosted-glass overlay menu for Tour Hub navigation
 * Glassmorphic card-style nav items with live data teasers and cinematic animations
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  LayoutGrid, 
  Calendar, 
  Users, 
  Trophy, 
  GraduationCap 
} from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useTopWorldRanked, toTitleCase, getInitials } from '../hooks/useWorldRankings';
import { getPgaTourHeadshotUrl } from '../utils/resolvePhotoUrl';
import { 
  useLiveTournamentCount, 
  useLiveLeaderTeaser, 
  usePlayerCount, 
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
  { value: 'overview', label: 'Overview', subtitle: 'The global golf season at a glance.', icon: <LayoutGrid className="w-5 h-5" /> },
  { value: 'schedule', label: 'Schedule', subtitle: 'What\'s happening — past, present, and upcoming.', icon: <Calendar className="w-5 h-5" /> },
  { value: 'players', label: 'Players', subtitle: 'The names shaping the season across every tour.', icon: <Users className="w-5 h-5" /> },
  { value: 'leaderboards', label: 'Leaders', subtitle: 'Who\'s on top — and who\'s chasing them.', icon: <Trophy className="w-5 h-5" /> },
];

const LINK_ITEMS: LinkItem[] = [
  { 
    id: 'college-golf', 
    label: 'College Golf', 
    subtitle: 'From campus standout to Tour contender.',
    path: '/tourhub/college-golf',
    icon: <GraduationCap className="w-5 h-5" />,
    
  },
];

// Animation config
const ITEM_SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 };
const ITEM_EASE = [0.25, 0.46, 0.45, 0.94] as const;

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
  const { data: topPlayers } = useTopWorldRanked(5);
  const { data: liveCount } = useLiveTournamentCount();
  const { data: leaderTeaser } = useLiveLeaderTeaser();
  const { data: playerCount } = usePlayerCount();
  const { data: topCollege } = useTopCollegeTeaser();
  
  // World #1 name from the rankings data
  const worldNumber1 = topPlayers?.[0];
  
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
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
    
    // Focus close button on open
    firstEl.focus();
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);
  
  const handleItemClick = useCallback((tab: TourHubTab) => {
    haptic('light');
    onNavigate(tab);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate, onClose]);

  const handleLinkClick = useCallback((path: string) => {
    haptic('light');
    onClose();
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onClose, navigate]);

  const handleViewAllRankings = useCallback(() => {
    haptic('light');
    onNavigate('leaderboards');
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate, onClose]);

  const handlePlayerClick = useCallback((playerId: string) => {
    haptic('light');
    onClose();
    navigate(`/tourhub/player/${playerId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onClose, navigate]);
  
  if (typeof document === 'undefined') return null;
  
  const portalRoot = document.getElementById('portal-root') || document.body;

  const displayPlayers = topPlayers?.slice(0, 5) || [];
  const hasLive = (liveCount ?? 0) > 0;

  // Generate dynamic subtitle for Schedule
  const scheduleSubtitle = hasLive
    ? `${liveCount} tournament${(liveCount ?? 0) > 1 ? 's' : ''} live right now`
    : "What's happening — past, present, and upcoming.";

  // Helper: render card teaser text
  const renderTeaser = (item: NavItem) => {
    if (item.value === 'overview' && leaderTeaser && hasLive) {
      const scoreStr = leaderTeaser.score !== null
        ? (leaderTeaser.score < 0 ? `${leaderTeaser.score}` : `${leaderTeaser.score > 0 ? '+' : ''}${leaderTeaser.score}`)
        : null;
      return (
        <p className="text-xs mt-1 text-muted-foreground">
          <span className="font-medium">{leaderTeaser.playerName}</span>
          {' leads at '}
          {scoreStr !== null && (
            <span style={{ color: leaderTeaser.score !== null && leaderTeaser.score < 0 ? TOUR_COLORS.scoreUnderPar : undefined }}>
              {scoreStr}
            </span>
          )}
          {' • '}
          <span className="truncate">{leaderTeaser.tournamentName}</span>
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
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: TOUR_COLORS.liveGreen }}
          >
            {liveCount} LIVE
          </span>
        </div>
      );
    }
    if (item.value === 'players') {
      return null;
    }
    if (item.value === 'leaderboards' && worldNumber1) {
      const lastName = worldNumber1.playerName.split(' ').slice(-1)[0];
      return (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          #{worldNumber1.worldRank} {lastName}
        </span>
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
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Menu Panel - frosted glass */}
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
            className="fixed inset-0 z-[10000] flex flex-col overflow-hidden"
            style={{
              background: 'rgba(248, 250, 252, 0.85)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              borderLeft: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.08)',
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
                width: '380px',
                height: '380px',
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
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Header with glass close button */}
            <div className="flex items-center justify-between px-5 py-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.2 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  haptic('light');
                  onClose();
                }}
                className="w-11 h-11 flex items-center justify-center rounded-full transition-all outline-none focus:outline-none focus-visible:ring-0"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </motion.button>
              
              <div className="w-11" />
            </div>
            
            {/* World Rankings Strip */}
            {displayPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="px-5 pb-4"
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" style={{ color: TOUR_COLORS.intelligenceGoldLight }} />
                    <h3 className="text-sm font-semibold text-foreground">
                      World Rankings
                    </h3>
                  </div>
                  
                  <motion.button
                    onClick={handleViewAllRankings}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-opacity active:opacity-70"
                  >
                    View all
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
                
                {/* Glass Cards Row with fade edges */}
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
                    {displayPlayers.map((player, index) => {
                      const isFirst = index === 0;
                      const lastName = player.playerName.split(' ').slice(-1)[0];
                      const country = toTitleCase(player.country);
                      
                      return (
                        <motion.button
                          key={player.playerId}
                          initial={{ opacity: 0, x: 15, scale: 0.97 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: 0.12 + index * 0.06, duration: 0.3, ease: ITEM_EASE }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handlePlayerClick(player.playerId)}
                          className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-all"
                          style={{
                            scrollSnapAlign: 'start',
                            background: isFirst 
                              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)'
                              : 'rgba(255, 255, 255, 0.6)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: isFirst 
                              ? '1.5px solid rgba(245, 158, 11, 0.35)'
                              : '1px solid rgba(255, 255, 255, 0.5)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.08)',
                            minWidth: '140px',
                          }}
                        >
                          {/* Rank Badge */}
                          <div
                            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{
                              background: isFirst 
                                ? `linear-gradient(135deg, ${TOUR_COLORS.rankGold[0]} 0%, ${TOUR_COLORS.rankGold[1]} 100%)`
                                : index === 1
                                ? `linear-gradient(135deg, ${TOUR_COLORS.rankSilver[0]} 0%, ${TOUR_COLORS.rankSilver[1]} 100%)`
                                : `linear-gradient(135deg, ${TOUR_COLORS.rankBronze[0]} 0%, ${TOUR_COLORS.rankBronze[1]} 100%)`,
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <span className="text-xs font-bold text-white">
                              {player.worldRank}
                            </span>
                          </div>
                          
                          {/* Avatar — squircle matching world rankings leaderboard */}
                          {(() => {
                            const pgaTourId = player.player?.pga_tour_id;
                            const headshot = pgaTourId ? getPgaTourHeadshotUrl(pgaTourId) : player.photoUrl;
                            const initials = getInitials(player.playerName);
                            return (
                              <div 
                                className="flex-shrink-0 overflow-hidden border border-border/50"
                                style={{ width: '36px', height: '36px', borderRadius: '11px' }}
                              >
                                {headshot ? (
                                  <div className="relative w-full h-full">
                                    <div className="absolute inset-0 bg-muted" />
                                    <img 
                                      src={headshot}
                                      alt={player.playerName}
                                      className="relative z-10 w-full h-full object-cover"
                                      loading="lazy"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-muted" />
                                )}
                              </div>
                            );
                          })()}
                          
                          {/* Name & Country */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {country || 'Unknown'}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Divider */}
            <div className="h-px mx-5 border-t border-border/60" />
            
            {/* Menu Items */}
            <div 
              className="flex-1 overflow-y-auto px-5 py-5"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="space-y-3">
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
                      className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left relative overflow-hidden"
                      style={{
                        background: isActive 
                          ? 'rgba(255, 255, 255, 0.8)' 
                          : 'rgba(255, 255, 255, 0.5)',
                        border: isActive
                          ? '1px solid rgba(0, 0, 0, 0.08)'
                          : '1px solid rgba(0, 0, 0, 0.04)',
                        boxShadow: isActive
                          ? '0 2px 8px rgba(0, 0, 0, 0.04)'
                          : '0 1px 2px rgba(0, 0, 0, 0.02)',
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Icon in circle */}
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: isActive 
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.06))'
                            : 'rgba(0, 0, 0, 0.03)',
                          color: isActive ? '#D97706' : undefined,
                        }}
                      >
                        <div className={isActive ? '' : 'text-muted-foreground'}>
                          {item.icon}
                        </div>
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-base font-semibold"
                          style={{ 
                            color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.8)',
                          }}
                        >
                          {item.label}
                        </div>
                        <div className="text-[12px] mt-0.5 leading-relaxed text-muted-foreground">
                          {dynamicSubtitle}
                        </div>
                        {renderTeaser(item)}
                      </div>
                      
                      {/* Right badge */}
                      {renderBadge(item)}
                    </motion.button>
                  );
                })}
               </div>

              {/* Divider before link items — matches the overview divider width */}
              <div className="h-px my-4 border-t border-border/60" />

              {/* Link Items (College Golf, etc.) */}
              <div className="space-y-3">
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
                    className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left"
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {/* Icon in circle */}
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground"
                      style={{ background: 'rgba(0, 0, 0, 0.03)' }}
                    >
                      {item.icon}
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-base font-semibold"
                          style={{ color: 'hsl(var(--foreground) / 0.8)' }}
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
                      <div className="text-[12px] mt-0.5 leading-relaxed text-muted-foreground">
                        {item.subtitle}
                      </div>
                      {/* College #1 teaser */}
                      {item.id === 'college-golf' && topCollege && (
                        <p className="text-xs mt-1 text-muted-foreground flex items-center gap-1.5">
                          {topCollege.logoUrl && (
                            <img 
                              src={topCollege.logoUrl} 
                              alt="" 
                              className="w-5 h-5 rounded-sm object-contain flex-shrink-0" 
                            />
                          )}
                          <span>
                            <span className="font-medium">{topCollege.name}</span>
                            {' leads • '}
                            {formatCurrency(topCollege.earnings)} in earnings
                          </span>
                        </p>
                      )}
                    </div>
                    
                    {/* Chevron - keep for link items */}
                    <ChevronRight 
                      className="w-4.5 h-4.5 flex-shrink-0 text-muted-foreground"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
