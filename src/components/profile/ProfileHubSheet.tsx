/**
 * ProfileHubSheet — Account hub bottom sheet for mobile.
 * Full rebuild. Semantic tokens only. framer-motion animations.
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  ChevronRight, LogOut,
  Shield, Plus, Check,
  User, MessageCircle, Bell,
  Pencil, Building2, Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useLogout } from '@/hooks/useLogout';
import { Skeleton } from '@/components/ui/skeleton';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';
import HandicapTile from '@/components/handicap/HandicapTile';
import { isHandicapPromotedForUser } from '@/config/featureFlags';
import { analyticsEvents } from '@/utils/analyticsEvents';

// ── Types ──

interface Profile {
  id: string;
  type: 'personal' | 'business';
  name: string;
  avatarUrl?: string;
  subtitle?: string;
}

interface CurrentActor {
  type: 'personal' | 'business';
  id: string;
  name: string;
  avatarUrl?: string;
  subtitle?: string;
}

interface ProfileHubSheetProps {
  open: boolean;
  onClose: () => void;
  currentActor: CurrentActor;
  profiles: Profile[];
  onSwitchProfile: (profileId: string) => Promise<void> | void;
  onNavigate: (route: string) => void;
  isAdmin: boolean;
  isLoading?: boolean;
}

// ── Dispatch Rule Marker ──
function RuleMarker({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 8 }}>
      <div style={{ width: 3, height: 12, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
        {label}
      </span>
    </div>
  );
}

// ── Skeleton ──

function ProfileHubSheetSkeleton() {
  return (
    <div className="px-4">
      {/* ── Profile row skeleton ── */}
      <div className="flex items-center gap-3 pt-2 pb-3">
        <Skeleton className="w-[52px] h-[52px] rounded-[34%]" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-3 w-20 rounded-lg" />
        </div>
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      </div>
      {/* Echo card skeleton */}
      <Skeleton className="h-[48px] w-full rounded-[12px] mb-3" />

      {/* ── Switch Profile skeleton ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 8 }}>
          <div style={{ width: 3, height: 12, borderRadius: 1, background: 'rgba(15,23,42,0.08)', flexShrink: 0 }} />
          <Skeleton className="h-2.5 w-24 rounded" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[72px]">
              <Skeleton className="w-[48px] h-[48px] rounded-[34%]" />
              <Skeleton className="h-3 w-14 rounded-lg" />
              <Skeleton className="h-2.5 w-10 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '0 -16px' }} />

      {/* ── Quick action tiles skeleton — 3 columns ── */}
      <div className="grid grid-cols-3 gap-2 py-4">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-[80px] rounded-2xl" />
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '0 -16px' }} />

      {/* ── Account rows skeleton ── */}
      <div className="py-3 space-y-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 8 }}>
          <div style={{ width: 3, height: 12, borderRadius: 1, background: 'rgba(15,23,42,0.08)', flexShrink: 0 }} />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 min-h-[48px] px-2">
            <Skeleton className="w-[34px] h-[34px] rounded-[10px]" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 2×2 grid generic tile (Messages / Notifications) ──
function GridTile({
  Icon, iconColor, iconBg, label, sub, badge, onClick,
}: {
  Icon: React.ComponentType<any>;
  iconColor: string;
  iconBg: string;
  label: string;
  sub: string;
  badge: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col justify-between text-left active:scale-[0.97] transition-transform"
      style={{
        minHeight: 110,
        padding: '14px 14px 16px',
        borderRadius: 14,
        background: '#ffffff',
        border: '0.5px solid rgba(15,23,42,0.10)',
        cursor: 'pointer',
      }}
      aria-label={label}
    >
      <div className="flex items-center justify-between w-full">
        <div
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 10, background: iconBg }}
        >
          <Icon size={20} color={iconColor} strokeWidth={2.2} />
        </div>
        {badge > 0 && (
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              padding: '2px 8px',
              minWidth: 18,
              background: '#EF4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <div className="w-full">
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}

// ── Component ──

function ProfileHubSheet({
  open,
  onClose,
  currentActor,
  profiles,
  onSwitchProfile,
  onNavigate,
  isAdmin,
  isLoading,
}: ProfileHubSheetProps) {
  const navigate = useNavigate();
  const editRoute = useEditProfileRoute();
  const { logout: handleLogout } = useLogout();
  const { unreadCount: unreadNotificationCount } = useUnreadNotifications();
  const { conversations } = useMessagingContext();
  const unreadMessageCount = conversations?.reduce(
    (sum, conv) => sum + (conv.unread_count || 0), 0
  ) || 0;

  const sheetY = useMotionValue(0);
  const handleSheetDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      animate(sheetY, 0, { type: 'spring', damping: 25, stiffness: 300 });
    }
  };

  const [localActiveId, setLocalActiveId] = useState(currentActor.id);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Sync localActiveId when currentActor changes externally
  useEffect(() => {
    setLocalActiveId(currentActor.id);
  }, [currentActor.id]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset logout confirm when closing
  useEffect(() => {
    if (!open) setShowLogoutConfirm(false);
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSwitchProfile = useCallback(async (profileId: string) => {
    if (profileId === localActiveId) return;
    const prev = localActiveId;
    setLocalActiveId(profileId);
    try {
      await onSwitchProfile(profileId);
    } catch {
      setLocalActiveId(prev);
    }
  }, [localActiveId, onSwitchProfile]);

  const handleNav = useCallback((route: string) => {
    onNavigate(route);
    onClose();
  }, [onNavigate, onClose]);


  const activeProfile = profiles.find(p => p.id === localActiveId) || currentActor;
  const isPersonal = currentActor.type === 'personal';
  const handicapPromoted = isPersonal && isHandicapPromotedForUser(currentActor.id);

  // Telemetry: track which sheet variant rendered when it opens
  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('profile_hub_sheet_opened', {
      variant: handicapPromoted ? 'v2_grid' : 'v1_row',
      actor_type: currentActor.type,
    });
  }, [open, handicapPromoted, currentActor.type]);

  const handleViewProfile = useCallback(() => {
    handleNav(`/profile/${localActiveId}`);
  }, [handleNav, localActiveId]);

  const handleHandicapTileTap = useCallback(() => {
    analyticsEvents.track('handicap_tile_tapped', { source: 'profile_hub_sheet' });
    handleNav('/handicap');
  }, [handleNav]);

  // ── Quick actions config (legacy 3-up) ──
  const quickActions = [
    {
      Icon: User,
      iconColor: '#3B82F6',
      label: 'View Profile',
      route: `/profile/${localActiveId}`,
      badge: 0,
      badgeColor: '',
    },
    {
      Icon: MessageCircle,
      iconColor: '#10B981',
      label: 'Messages',
      route: '/messages',
      badge: unreadMessageCount,
      badgeColor: 'emerald',
    },
    {
      Icon: Bell,
      iconColor: '#F7931E',
      label: 'Notifications',
      route: '/notificationmessages',
      badge: unreadNotificationCount,
      badgeColor: 'amber',
    },
  ];

  const accountRows = [
    ...(handicapPromoted
      ? [{ Icon: User, iconColor: '#3B82F6', label: 'View profile', route: `/profile/${localActiveId}` }]
      : []),
    { Icon: Pencil, iconColor: '#F7931E', label: 'Edit profile', route: editRoute },
    { Icon: Building2, iconColor: '#0A5A3C', label: 'Manage business profiles', route: '/businesses/manage' },
    { Icon: SettingsIcon, iconColor: '#64748B', label: 'Settings', route: '/settings' },
  ];

  // ── Portal content ──

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={onClose}
          />

          {/* Panel — #1 bg-[#F8FAFC] */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleSheetDragEnd}
            style={{
              y: sheetY,
              maxHeight: '92dvh',
              minHeight: 'min(72dvh, 520px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-[9999] w-full rounded-t-[24px] bg-[#F8FAFC] flex flex-col md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[560px]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0 touch-none cursor-grab active:cursor-grabbing">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4">

              {isLoading ? (
                <ProfileHubSheetSkeleton />
              ) : (
                <>
              {/* ── Profile row — sits on sheet background ── */}
              <div className="flex items-center gap-3 pt-2 pb-3">
                <SquircleAvatar
                  size={52}
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name}
                  fallback={activeProfile.name?.charAt(0)?.toUpperCase() ?? '?'}
                  hideRing
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-extrabold truncate text-foreground" style={{ letterSpacing: '-0.3px' }}>
                    {activeProfile.name}
                  </div>
                  <p className="text-[12px] truncate text-muted-foreground">
                    {activeProfile.type === 'business' ? 'Business account' : 'Personal account'}
                  </p>
                </div>
                {/* Search icon pill */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center justify-center flex-shrink-0 active:scale-[0.94] transition-transform"
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(247,147,30,0.12)',
                    border: '1px solid rgba(247,147,30,0.22)',
                  }}
                  aria-label="Search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F7931E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                </button>
              </div>

              {/* ── Echo AI Assistant — hidden when Handicap is promoted (Echo tile in 2×2 grid replaces it) ── */}
              {!handicapPromoted && (
                <button
                  type="button"
                  onClick={() => handleNav('/echo')}
                  className="w-full flex items-center gap-3 active:scale-[0.98] transition-all duration-150 mb-3"
                  style={{
                    padding: '11px 13px',
                    borderRadius: 12,
                    background: 'rgba(247,147,30,0.08)',
                    border: '1px solid rgba(247,147,30,0.20)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'linear-gradient(135deg, #F7931E, #E8920A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <AnimatedEchoWave size={16} color="#ffffff" active={true} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-foreground truncate">Echo AI Assistant</div>
                    <div className="text-[11px] text-muted-foreground truncate">Playing tips · course knowledge · advice</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              )}

              {/* ── Switch profile ── */}
              <div>

                <RuleMarker label="Switch Profile" />
                <div
                  className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar"
                  style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {profiles.map(profile => {
                    const isActive = profile.id === localActiveId;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleSwitchProfile(profile.id)}
                        className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] min-h-[44px] touch-manipulation"
                        style={{ scrollSnapAlign: 'start' }}
                      >
                        <div className="relative">
                          <SquircleAvatar
                            size={48}
                            src={profile.avatarUrl}
                            alt={profile.name}
                            fallback={profile.name?.charAt(0)?.toUpperCase()}
                            ringColor={isActive ? 'hsl(38,92%,50%)' : undefined}
                            hideRing={!isActive}
                            enableGlow={isActive}
                          />
                          {/* #7 — amber check badge */}
                          {isActive && (
                            <div
                              className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center ring-2 ring-[#F8FAFC]"
                              style={{ background: 'hsl(38,92%,50%)' }}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-[12px] font-medium text-foreground truncate max-w-[68px]">
                          {profile.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground -mt-1">
                          {profile.type === 'business' ? 'Business' : 'Personal'}
                        </span>
                      </button>
                    );
                  })}

                  {/* Add business */}
                  <button
                    type="button"
                    onClick={() => handleNav('/businesses/manage')}
                    className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] min-h-[44px] touch-manipulation"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="w-[52px] h-[52px] rounded-[34%] border-2 border-dashed border-border flex items-center justify-center">
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-[12px] font-medium text-muted-foreground">
                      Add business
                    </span>
                  </button>
                </div>
              </div>

              {/* ── Divider ── */}
              <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '0 -16px' }} />

              {/* ── Quick actions grid ── */}
              {handicapPromoted ? (
                /* v2: 2×2 grid (Handicap / Echo / Messages / Notifications) */
                <div className="grid grid-cols-2 gap-3 py-4">
                  {/* Handicap (top-left, primary) */}
                  <HandicapTile userId={currentActor.id} onClick={handleHandicapTileTap} />

                  {/* Echo (top-right) */}
                  <button
                    type="button"
                    onClick={() => handleNav('/echo')}
                    className="relative flex flex-col justify-between text-left p-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                    style={{
                      minHeight: 110,
                      padding: '14px 14px 16px',
                      borderRadius: 14,
                      background: '#ffffff',
                      border: '0.5px solid rgba(15,23,42,0.10)',
                    }}
                    aria-label="Echo"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'transparent',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #F7931E, #E8920A)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(247,147,30,0.30)',
                        }}>
                          <AnimatedEchoWave size={14} color="#ffffff" active={true} />
                        </div>
                      </div>
                    </div>
                    <div className="w-full">
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Echo</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Ask anything</div>
                    </div>
                  </button>

                  {/* Messages (bottom-left) */}
                  <GridTile
                    Icon={MessageCircle}
                    iconColor="#059669"
                    iconBg="rgba(5,150,105,0.10)"
                    label="Messages"
                    sub={unreadMessageCount > 0 ? `${unreadMessageCount} unread` : 'No new messages'}
                    badge={unreadMessageCount}
                    onClick={() => handleNav('/messages')}
                  />

                  {/* Notifications (bottom-right) */}
                  <GridTile
                    Icon={Bell}
                    iconColor="#0f172a"
                    iconBg="rgba(15,23,42,0.06)"
                    label="Notifications"
                    sub={unreadNotificationCount > 0 ? `${unreadNotificationCount} new` : 'No new notifications'}
                    badge={unreadNotificationCount}
                    onClick={() => handleNav('/notificationmessages')}
                  />
                </div>
              ) : (
                /* v1: legacy 3-up row */
                <div className="grid grid-cols-3 gap-2 py-4">
                  {quickActions.map(({ Icon, iconColor, label, route, badge, badgeColor }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleNav(route)}
                        className="relative flex flex-col items-start justify-between p-3.5 rounded-2xl transition-colors duration-150 active:scale-[0.97]"
                        style={{
                          minHeight: 80,
                          background: '#ffffff',
                          border: '1px solid rgba(0,0,0,0.07)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        }}
                      >
                        {badge > 0 && (
                          <span
                            className="absolute top-2.5 right-2.5 flex items-center justify-center rounded-full text-white font-bold"
                            style={{
                              minWidth: badge > 9 ? 16 : 14,
                              height: badge > 9 ? 16 : 14,
                              padding: badge > 9 ? '0 4px' : '0',
                              fontSize: 9,
                              lineHeight: 1,
                              background: badgeColor === 'emerald'
                                ? '#10b981'
                                : badgeColor === 'amber'
                                ? '#F7931E'
                                : '#10b981',
                              boxShadow: badgeColor === 'emerald'
                                ? '0 1px 4px rgba(16,185,129,0.4)'
                                : '0 1px 4px rgba(247,147,30,0.4)',
                            }}
                          >
                            <span style={{ lineHeight: 1 }}>
                              {badge > 99 ? '99+' : badge}
                            </span>
                          </span>
                        )}

                        <div
                          className="flex items-center justify-center rounded-[10px]"
                          style={{
                            width: 36,
                            height: 36,
                            background: badge > 0
                              ? badgeColor === 'emerald'
                                ? 'rgba(16,185,129,0.12)'
                                : 'rgba(247,147,30,0.12)'
                              : `${iconColor}14`,
                            boxShadow: badge > 0
                              ? badgeColor === 'emerald'
                                ? '0 0 0 1px rgba(16,185,129,0.20)'
                                : '0 0 0 1px rgba(247,147,30,0.20)'
                              : 'none',
                            transition: 'background 0.2s ease, box-shadow 0.2s ease',
                          }}
                        >
                          <Icon size={18} color={iconColor} strokeWidth={2.2} />
                        </div>

                        <span
                          className="text-[13px] font-bold leading-none w-full text-left"
                          style={{ color: '#0f172a', letterSpacing: '-0.1px' }}
                        >
                          {label}
                        </span>
                      </button>
                  ))}
                </div>
              )}

              {/* ── Divider ── */}
              <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '0 -16px' }} />

              {/* ── Account section ── */}
              <div>
                <RuleMarker label="Account" />
                {accountRows.map(({ Icon, iconColor, label, route }, index) => (
                  <div key={label}>
                    {index > 0 && <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.06)', marginLeft: 46 }} />}
                    <button
                      type="button"
                      onClick={() => handleNav(route)}
                      className="w-full flex items-center gap-3 min-h-[48px] rounded-xl active:bg-[rgba(15,23,42,0.03)] transition-colors duration-150"
                    >
                      <div
                        className="flex items-center justify-center rounded-[10px]"
                        style={{ width: 34, height: 34, background: `${iconColor}14` }}
                      >
                        <Icon size={17} color={iconColor} strokeWidth={2.2} />
                      </div>
                      <span className="flex-1 text-left text-[14px] font-medium text-foreground">{label}</span>
                      <ChevronRight className="w-[13px] h-[13px] text-muted-foreground/30" />
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Admin section ── */}
              {isAdmin && (
                <>
                  <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '0 -16px' }} />
                  <div>
                    <RuleMarker label="Admin" />
                    <button
                      type="button"
                      onClick={() => handleNav('/admin/command-center')}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, background: 'rgba(247,147,30,0.06)', border: '1px solid rgba(247,147,30,0.18)', borderRadius: 12, padding: '0 14px', cursor: 'pointer' }}
                    >
                      <Shield className="w-5 h-5" style={{ color: '#F7931E' }} />
                      <div className="flex-1 text-left">
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#F7931E' }}>Command Center</div>
                        <div style={{ fontSize: 11, color: 'rgba(247,147,30,0.55)' }}>Manage site settings</div>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: 'rgba(247,147,30,0.40)' }} />
                    </button>
                  </div>
                </>
              )}

              {/* ── Logout — #6 pill buttons ── */}
              <div className="py-3" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))' }}>
                {!showLogoutConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center gap-3 min-h-[48px] rounded-xl px-2 -mx-2 hover:bg-destructive/5 active:bg-destructive/10 transition-colors duration-150"
                  >
                    <LogOut className="w-[18px] h-[18px] text-destructive" />
                    <span className="text-[14px] font-medium text-destructive">Sign out</span>
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      style={{ flex: 1, minHeight: 50, borderRadius: 25, background: 'rgba(15,23,42,0.04)', border: '0.5px solid rgba(15,23,42,0.12)', fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="active:opacity-90 transition-opacity"
                      style={{ flex: 1, minHeight: 50, borderRadius: 25, background: '#DC2626', border: 'none', fontSize: 14, fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
                </>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(
    <>
      {content}
      <GlobalSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>,
    document.body
  ) : null;
}

export { ProfileHubSheet };
export default memo(ProfileHubSheet);
