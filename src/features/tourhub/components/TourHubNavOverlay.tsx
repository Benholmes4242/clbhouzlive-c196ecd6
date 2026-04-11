/**
 * TourHubNavOverlay - Editorial newspaper-style bottom sheet for Tour Hub navigation
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useTopWorldRanked, toTitleCase, getInitials } from '../hooks/useWorldRankings';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import {
  useLiveTournamentCount,
  useLiveLeaderTeaser,
  useTopCollegeTeaser,
} from '../hooks/useNavMenuData';
import { TOUR_COLORS } from '../constants/colors';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { TourHubTab } from './TourHubTabs';

// Typography constants
const SERIF = "'Georgia', 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";
const ACCENT = '#c8392b';
const MUTED = '#94a3b8';
const BODY = '#64748b';
const PRIMARY = '#111';

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
  { value: 'schedule', label: 'Schedule', subtitle: "What's happening - past, present, and upcoming.", icon: <span className="text-xl">📅</span> },
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

// Section header label style
const sectionLabelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: MUTED,
  fontFamily: SANS,
};

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
  onNavigate,
}: TourHubNavOverlayProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const { data: topPlayers, isLoading: rankingsLoading } = useTopWorldRanked(5);
  const { data: liveCount } = useLiveTournamentCount();
  const { data: leaderTeaser } = useLiveLeaderTeaser();
  const { data: topCollege } = useTopCollegeTeaser();

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [isOpen]);

  // ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Android back button
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ drawer: true }, '');
    const handlePopState = () => { onClose(); };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [isOpen, onClose]);

  // Focus trap
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

  const hasLive = (liveCount ?? 0) > 0;

  // Cycle ticker for multi-tournament
  useEffect(() => {
    if (!hasLive || (liveCount ?? 0) <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex(i => (i + 1) % (liveCount ?? 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [hasLive, liveCount]);

  if (typeof document === 'undefined') return null;

  const portalRoot = document.getElementById('portal-root') || document.body;
  const displayPlayers = topPlayers?.slice(0, 5) || [];

  const scheduleSubtitle = hasLive
    ? `${liveCount} tournament${(liveCount ?? 0) > 1 ? 's' : ''} live right now.`
    : "What's happening - past, present, and upcoming.";

  const getAriaLabel = (item: NavItem) => {
    switch (item.value) {
      case 'overview': return 'Overview — The global golf season at a glance';
      case 'schedule': return hasLive ? `Schedule — ${liveCount} tournament${(liveCount ?? 0) > 1 ? 's' : ''} live right now` : "Schedule - What's happening past, present, and upcoming";
      case 'players': return 'Players — The names shaping the season';
      case 'leaderboards': return 'Performance Rankings — Statistical leaders across every category';
      default: return item.label;
    }
  };

  // Overview teaser renderer
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
        <p style={{ fontSize: 12, marginTop: 4, color: BODY, fontFamily: SANS, margin: '4px 0 0' }}>
          {leaderTeaser.isTied ? (
            <span style={{ fontWeight: 600, color: PRIMARY }}>{leaderTeaser.playerName}</span>
          ) : (
            <button
              type="button"
              style={{ fontWeight: 600, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: SANS, fontSize: 12 }}
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
            <span style={{ fontWeight: 700, color: leaderTeaser.score !== null && leaderTeaser.score < 0 ? ACCENT : undefined }}>
              {scoreStr}
            </span>
          )}
          <br />
          <button
            type="button"
            style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: SANS, fontSize: 12 }}
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

  // Live badge for schedule row
  const renderBadge = (item: NavItem) => {
    if (item.value === 'schedule' && hasLive) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <motion.span
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#22c55e', fontFamily: SANS }}>
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
              ref={scrollRef}
              className="flex-1 overflow-y-auto min-h-0"
              style={{ overscrollBehavior: 'contain' }}
            >
              {/* ── SECTION 1: LIVE NOW BANNER ── */}
              {hasLive && leaderTeaser && (
                <div style={{
                  margin: '14px 20px 0',
                  borderTop: '2px solid #111',
                  borderBottom: '1px solid #ddd',
                  padding: '10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  {/* Left: pill + tournament name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{
                      background: PRIMARY,
                      color: '#fff',
                      padding: '3px 10px',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      borderRadius: 99,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                      fontFamily: SANS,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
                        display: 'inline-block',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }} />
                      Live Now
                    </div>
                    <button
                      type="button"
                      style={{
                        fontFamily: SANS, fontSize: 13, fontWeight: 500, color: '#222',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                      className="transition-opacity active:opacity-70 focus:outline-none"
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
                  </div>

                  {/* Right: leader */}
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 10, color: MUTED, fontFamily: SANS }}>Leader</div>
                    <button
                      type="button"
                      style={{
                        fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: PRIMARY,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}
                      className="transition-opacity active:opacity-70 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (leaderTeaser.playerId) handlePlayerClick(leaderTeaser.playerId);
                      }}
                    >
                      {leaderTeaser.playerName.split(' ').pop()}{' '}
                      <span style={{
                        color: leaderTeaser.score !== null && leaderTeaser.score < 0 ? ACCENT : PRIMARY,
                      }}>
                        {leaderTeaser.score !== null
                          ? leaderTeaser.score < 0 ? `${leaderTeaser.score}` : leaderTeaser.score > 0 ? `+${leaderTeaser.score}` : 'E'
                          : ''}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECTION 2: WORLD RANKINGS (editorial table) ── */}
              {(rankingsLoading || displayPlayers.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  style={{ margin: '0 20px' }}
                >
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 10px' }}>
                    <span style={sectionLabelStyle}>World Rankings</span>
                    <button
                      onClick={handleViewAllRankings}
                      style={{ fontSize: 12, color: ACCENT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}
                    >
                      View all →
                    </button>
                  </div>

                  {/* Rankings list */}
                  <div style={{ borderTop: '2px solid #111' }}>
                    {rankingsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse"
                          style={{
                            padding: '12px 0',
                            borderBottom: '1px solid #e8e8e4',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                          }}
                        >
                          <div style={{ width: 26, height: 20, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ height: 14, width: 80, borderRadius: 4, background: 'rgba(0,0,0,0.08)' }} />
                            <div style={{ height: 10, width: 50, borderRadius: 4, background: 'rgba(0,0,0,0.05)' }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      displayPlayers.map((player, index) => {
                        const isFirst = index === 0;
                        const lastName = player.playerName.split(' ').slice(-1)[0];
                        const country = toTitleCase(player.country);
                        const headshot = getPlayerHeadshotUrl(player.playerName, (player as any).tourCode ?? 'pga');
                        const initials = getInitials(player.playerName);

                        return (
                          <motion.button
                            key={player.playerId}
                            initial={false}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handlePlayerClick(player.playerId)}
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              borderBottom: '1px solid #e8e8e4',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              background: 'transparent',
                              border: 'none',
                              borderBottomStyle: 'solid',
                              borderBottomWidth: 1,
                              borderBottomColor: '#e8e8e4',
                              cursor: 'pointer',
                            }}
                          >
                            {/* Rank */}
                            <span style={{
                              fontFamily: SERIF,
                              fontSize: 26,
                              fontWeight: 700,
                              color: isFirst ? ACCENT : '#ccc',
                              minWidth: 26,
                              flexShrink: 0,
                              textAlign: 'center',
                            }}>
                              {player.worldRank}
                            </span>

                            {/* Avatar */}
                            <AvatarWithInitials
                              src={headshot}
                              alt={player.playerName}
                              initials={initials}
                              size={36}
                              isFirst={isFirst}
                            />

                            {/* Name + Country */}
                            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                              <div style={{
                                fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: PRIMARY,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {lastName}
                              </div>
                              <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>
                                {country || 'Unknown'}
                              </div>
                            </div>

                            {/* Right rank badge */}
                            <span style={{
                              fontSize: 10, fontWeight: 700, fontFamily: SANS,
                              color: isFirst ? ACCENT : '#bbb',
                              flexShrink: 0,
                            }}>
                              #{player.worldRank}
                            </span>
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── SECTION 3: DIVIDER ── */}
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '20px 20px 0' }} />

              {/* ── SECTION 4: NAVIGATE ── */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Navigate</div>

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
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '14px 0',
                        borderBottom: '1px solid #e8e8e4',
                        background: 'transparent',
                        border: 'none',
                        borderBottomStyle: 'solid',
                        borderBottomWidth: 1,
                        borderBottomColor: '#e8e8e4',
                        cursor: 'pointer',
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={getAriaLabel(item)}
                    >
                      {/* Left accent bar */}
                      <div style={{
                        width: 3,
                        alignSelf: 'stretch',
                        borderRadius: 2,
                        background: isActive ? ACCENT : 'transparent',
                        marginRight: 14,
                        flexShrink: 0,
                        minHeight: 24,
                      }} />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontFamily: SERIF, fontSize: 16, fontWeight: 700,
                            color: isActive ? ACCENT : PRIMARY,
                          }}>
                            {item.label}
                          </span>
                          {renderBadge(item)}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 3 }}>
                          {dynamicSubtitle}
                        </div>
                        {renderTeaser(item)}
                      </div>

                      {/* Chevron */}
                      <ChevronRight style={{ width: 14, height: 14, color: '#cbd5e1', flexShrink: 0, marginLeft: 12, marginTop: 2 }} />
                    </motion.button>
                  );
                })}
              </div>

              {/* ── SECTION 5: LINK ITEMS ── */}
              <div style={{ padding: '0 20px' }}>
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
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '14px 0',
                      borderBottom: '1px solid #e8e8e4',
                      background: 'transparent',
                      border: 'none',
                      borderBottomStyle: 'solid',
                      borderBottomWidth: 1,
                      borderBottomColor: '#e8e8e4',
                      cursor: 'pointer',
                    }}
                    aria-label={`${item.label} — ${item.subtitle}`}
                  >
                    {/* Spacer (no accent bar) */}
                    <div style={{ width: 3, marginRight: 14, flexShrink: 0 }} />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <span style={{
                        fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: PRIMARY,
                      }}>
                        {item.label}
                      </span>

                      {/* College teaser */}
                      {item.id === 'college-golf' && !topCollege && (
                        <div className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ height: 12, width: 96, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ height: 12, width: 64, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} />
                        </div>
                      )}
                      {item.id === 'college-golf' && topCollege && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
                                style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'contain', flexShrink: 0 }}
                              />
                            )}
                            <span style={{ fontFamily: SANS, fontWeight: 600, color: PRIMARY, fontSize: 12 }}>{topCollege.name}</span>
                          </button>
                          <span style={{ fontFamily: SANS, fontSize: 12, color: BODY }}>
                            {' leads • '}
                            {formatCurrency(topCollege.earnings)} earned
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight style={{ width: 14, height: 14, color: '#cbd5e1', flexShrink: 0, marginLeft: 12, marginTop: 2 }} />
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
    portalRoot,
  );
}

/** Avatar with initials fallback — editorial style */
function AvatarWithInitials({ src, alt, initials, size, isFirst = false }: { src: string | null | undefined; alt: string; initials: string; size: number; isFirst?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: isFirst ? '1.5px solid rgba(200,57,43,0.15)' : '1px solid rgba(0,0,0,0.06)',
    background: isFirst ? '#fef3e2' : '#f0f0ec',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  };

  if (!src || imgFailed) {
    return (
      <div style={containerStyle}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{initials}</span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
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
