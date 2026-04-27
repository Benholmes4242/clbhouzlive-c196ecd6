/**
 * TourHubNavOverlay - Command Centre bottom sheet for Tour Hub navigation
 * Light editorial design with live ticker, world rankings strip, and clean nav rows
 * Uses the shared BottomSheet component for consistent UI across the app.
 */

import React, { useEffect, useCallback, useRef, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Globe,
  Calendar,
  Users,
  Trophy,
  GraduationCap,
  type LucideProps,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { haptic } from '@/utils/haptics';
import { useTopWorldRanked, toTitleCase, getInitials } from '../hooks/useWorldRankings';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import {
  useLiveTournamentCount,
  useLiveLeaderTeaser,
  useTopCollegeTeaser,
  useMoneyListLeader,
} from '../hooks/useNavMenuData';
import { useUpcomingTournaments } from '../hooks/useUpcomingTournaments';
import { TOUR_COLORS } from '../constants/colors';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatCountdown } from '../utils/formatCountdown';
import type { TourHubTab } from './TourHubTabs';

type LucideIcon = ComponentType<LucideProps>;

interface NavItem {
  value: TourHubTab;
  label: string;
  subtitle: string;
  iconComponent: LucideIcon;
  iconColor: string;
}

interface LinkItem {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  iconComponent: LucideIcon;
  iconColor: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { value: 'overview',     label: 'Overview',    subtitle: 'The global golf season at a glance.',     iconComponent: Globe,    iconColor: '#F7931E' },
  { value: 'schedule',     label: 'Schedule',    subtitle: 'Past, present, and the road ahead.',      iconComponent: Calendar, iconColor: '#0A5A3C' },
  { value: 'players',      label: 'Players',     subtitle: 'The names shaping the season.',           iconComponent: Users,    iconColor: '#3B82F6' },
  { value: 'leaderboards', label: 'Stat Watch',  subtitle: 'Every stat, every category, every tour.', iconComponent: Trophy,   iconColor: '#F7931E' },
];

const LINK_ITEMS: LinkItem[] = [
  {
    id: 'college-golf',
    label: 'College Franchise Rankings',
    subtitle: 'Where college legacies battle on tour.',
    path: '/tourhub/college-golf',
    iconComponent: GraduationCap,
    iconColor: '#7C3AED',
  },
];

/** Reusable 40×40 colored squircle holding a Lucide icon. */
function MenuRowIcon({ Icon, color }: { Icon: LucideIcon; color: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${color}14`, // 8% alpha tint
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={20} color={color} strokeWidth={2.2} />
    </div>
  );
}

/** Reusable teaser line — leading element + optional label + value. */
function MenuRowTeaser({
  leadingElement,
  label,
  labelColor,
  children,
}: {
  leadingElement?: React.ReactNode;
  label?: string;
  labelColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        color: '#334155',
        marginTop: 6,
        minWidth: 0,
      }}
    >
      {leadingElement}
      {label && (
        <span style={{ color: labelColor ?? '#64748B', fontWeight: 800 }}>{label}</span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
    </div>
  );
}




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
  
  const [tickerIndex, setTickerIndex] = useState(0);

  const { data: topPlayers, isLoading: rankingsLoading } = useTopWorldRanked(5);
  const { data: liveCount } = useLiveTournamentCount();
  const { data: leaderTeaser } = useLiveLeaderTeaser();
  const { data: topCollege } = useTopCollegeTeaser();
  
  // BottomSheet handles scroll lock and ESC key

  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ drawer: true }, '');
    const handlePopState = () => { onClose(); };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [isOpen, onClose]);

  // Focus trap not needed — BottomSheet handles dialog role
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

  return (
    <BottomSheet
      open={isOpen}
      onClose={onClose}
      zIndexBase={9998}
      ariaLabelledBy="tour-nav-menu-title"
      style={{ maxHeight: '88vh' }}
    >
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
          <div>
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
                  paddingLeft: 18,
                  paddingRight: 18,
                  scrollPaddingLeft: 18,
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
                      <button
                        key={player.playerId}
                        onClick={() => handlePlayerClick(player.playerId)}
                        className="active:scale-[0.97] transition-transform"
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
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '6px 20px 14px' }}>
          <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Navigate</div>
          <div id="tour-nav-menu-title" style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Tour Hub</div>
        </div>

        {/* Nav Items + Link Items — Dispatch flat rows */}
        <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.value;
            const dynamicSubtitle = item.value === 'schedule' ? scheduleSubtitle : item.subtitle;
            
            return (
              <button
                key={item.value}
                onClick={() => handleItemClick(item.value)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  background: isActive ? 'rgba(247,147,30,0.04)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #F7931E' : '3px solid transparent',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer', textAlign: 'left' as const,
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={getAriaLabel(item)}
              >
                {/* Icon */}
                <div style={{ width: 36, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>

                {/* Label + subtitle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 800 : 500, color: '#0F172A' }}>
                      {item.label}
                    </span>
                    {renderBadge(item)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    {dynamicSubtitle}
                  </div>
                  {renderTeaser(item)}
                </div>

                {/* Active dot */}
                {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />}
              </button>
            );
          })}

          {LINK_ITEMS.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => handleLinkClick(item.path)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderLeft: '3px solid transparent',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer', textAlign: 'left' as const,
                }}
                aria-label={`${item.label} — ${item.subtitle}`}
              >
                {/* Icon */}
                <div style={{ width: 36, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>

                {/* Label + subtitle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
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
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
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
              </button>
            );
          })}
        </div>

        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </div>
    </BottomSheet>
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
