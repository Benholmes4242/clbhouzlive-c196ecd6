/**
 * ProfileHubSheet — sports-data redesign.
 *
 * Sections, top → bottom:
 *   1. Identity strip (avatar, name, @handle · {hcp} HCP, Switch ⌄)
 *   2. Handicap masthead (no card chrome, 6-state)
 *   3. Stat strip (4-col full / 2-col limited)
 *   4. Quick action icon row (Echo / Messages / Alerts)
 *   5. Account section (Profile & businesses / Settings)
 *   6. Admin / Command Center
 *   7. Sign out (muted text → confirm reveal)
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  ChevronRight, ChevronDown, LogOut, Shield,
  MessageCircle, Bell, Settings as SettingsIcon, UserCog,
} from 'lucide-react';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useLogout } from '@/hooks/useLogout';
import { Skeleton } from '@/components/ui/skeleton';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import HandicapMasthead from '@/components/profile/HandicapMasthead';

import { ProfileSwitcherPopover } from '@/components/profile/ProfileSwitcherPopover';
import { useProfileSheetStats } from '@/hooks/useProfileSheetStats';
import { useHasBusinesses } from '@/hooks/useMyBusinesses';
import { analyticsEvents } from '@/utils/analyticsEvents';

// ── Tokens ──
const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_FAINT = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const HAIRLINE_SOFT = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';

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

// ── Skeleton ──
function ProfileHubSheetSkeleton() {
  return (
    <div className="px-4">
      {/* Identity strip skeleton */}
      <div className="flex items-center gap-3 pt-2 pb-3">
        <Skeleton className="w-[40px] h-[40px] rounded-[34%]" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-3 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-16 rounded-md flex-shrink-0" />
      </div>
      <div style={{ height: '0.5px', background: HAIRLINE, margin: '0 -16px' }} />

      {/* Masthead scorecard skeleton (2-col split) */}
      <div className="pt-3.5">
        <div
          className="rounded-[14px] overflow-hidden grid grid-cols-2"
          style={{ border: `0.5px solid ${HAIRLINE}`, background: '#FFFFFF' }}
        >
          <div style={{ padding: '16px 18px 16px 20px', borderRight: `0.5px solid ${HAIRLINE}` }}>
            <Skeleton className="h-2.5 w-20 rounded mb-2" />
            <Skeleton className="h-12 w-16 rounded" />
          </div>
          <div className="flex flex-col">
            <div style={{ padding: '10px 18px', borderBottom: `0.5px solid ${HAIRLINE}` }}>
              <Skeleton className="h-2.5 w-12 rounded mb-1.5" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
            <div style={{ padding: '10px 18px' }}>
              <Skeleton className="h-2.5 w-14 rounded mb-1.5" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip skeleton */}
      <div
        style={{
          marginLeft: -16, marginRight: -16, padding: '14px 16px',
          borderTop: `0.5px solid ${HAIRLINE}`,
          borderBottom: `0.5px solid ${HAIRLINE}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-8 rounded mb-2" />
            <Skeleton className="h-2.5 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Quick action row skeleton */}
      <div className="flex justify-around py-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-2.5 w-10 rounded" />
          </div>
        ))}
      </div>

      {/* Account rows skeleton */}
      <div className="py-3 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="w-4 h-4 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-2.5 w-44 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick action icon tile ──
function QuickActionTile({
  label, badge, onClick, children, ariaLabel,
}: {
  label: string;
  badge: number;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 active:scale-[0.98] transition-transform"
      style={{
        background: '#FFFFFF',
        border: `0.5px solid ${HAIRLINE}`,
        borderRadius: 14,
        padding: '14px 0',
        cursor: 'pointer',
        flex: 1,
      }}
      aria-label={ariaLabel}
    >
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        {children}
        {badge > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: INK,
              color: '#FFFFFF',
              fontSize: 9.5,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        style={{
          marginTop: 6,
          fontSize: 10.5,
          fontWeight: 600,
          color: INK_SOFT,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ── Account row ──
function AccountRow({
  Icon, label, sub, onClick,
}: {
  Icon: React.ComponentType<any>;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 active:bg-[rgba(15,23,42,0.03)] transition-colors"
      style={{ padding: '14px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <Icon size={16} color={INK_SOFT} strokeWidth={1.8} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{label}</div>
        <div style={{ fontSize: 11.5, fontWeight: 400, color: INK_FAINT, marginTop: 1 }}>{sub}</div>
      </div>
      <ChevronRight size={13} color="rgba(15,23,42,0.30)" />
    </button>
  );
}

// ── Grouped list primitives (iOS settings style) ──
function SheetGroup({
  label, children, style,
}: {
  label?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      {label && (
        <div
          style={{
            padding: '0 4px 6px',
            fontSize: 10.5,
            fontWeight: 800,
            color: INK_FAINT,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          background: '#FFFFFF',
          border: `0.5px solid ${HAIRLINE}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function GroupedRow({
  Icon, label, onClick, isFirst, isLast,
}: {
  Icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 active:bg-[rgba(15,23,42,0.03)] transition-colors"
      style={{
        padding: '14px 14px',
        background: 'transparent',
        border: 'none',
        borderTop: isFirst ? 'none' : `0.5px solid ${HAIRLINE_SOFT}`,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Icon size={16} color={INK_SOFT} strokeWidth={1.8} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: INK }}>{label}</div>
      <ChevronRight size={13} color="rgba(15,23,42,0.30)" />
    </button>
  );
}


function ProfileHubSheet({
  open, onClose, currentActor, profiles,
  onSwitchProfile, onNavigate, isAdmin, isLoading,
}: ProfileHubSheetProps) {
  const navigate = useNavigate();
  const editRoute = useEditProfileRoute();
  const { logout: handleLogout } = useLogout();
  const { unreadCount: unreadNotificationCount } = useUnreadNotifications();
  const { conversations } = useMessagingContext();
  const unreadMessageCount = conversations?.reduce(
    (sum, conv) => sum + (conv.unread_count || 0), 0,
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
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // ── Profile (for @handle) ──
  const activeProfileType = profiles.find(p => p.id === localActiveId)?.type || currentActor.type;
  const personalId = activeProfileType === 'personal' ? localActiveId : null;
  const { data: userProfile } = useUserProfile(personalId);
  const username = userProfile?.username || null;

  // ── Handicap data (for sub-copy + stat strip variant) ──
  const { data: whsConnection } = useWhsConnection(localActiveId);
  const { data: trend } = useHandicapTrend(whsConnection?.id);
  const stats = useProfileSheetStats(localActiveId);

  // ── Business ownership (always resolved against the personal account,
  // regardless of which actor is currently selected) ──
  const personalOwnerId =
    profiles.find(p => p.type === 'personal')?.id ??
    (currentActor.type === 'personal' ? currentActor.id : undefined);
  const { hasBusinesses } = useHasBusinesses(personalOwnerId);

  // Sub-copy & variant inference
  const hasHandicapRecord =
    !!whsConnection && !!trend && trend.current !== null && trend.totalRoundsInRecord >= 8;
  const handicapState: 'connect' | 'nodata' | 'data' =
    !whsConnection ? 'connect' : (hasHandicapRecord ? 'data' : 'nodata');

  const handicapSubCopy = (() => {
    if (handicapState === 'connect') return 'No handicap';
    if (handicapState === 'nodata') return 'WHS connected';
    const v = trend!.current as number;
    const formatted = v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
    return `${formatted} HCP`;
  })();

  // Sync localActiveId when currentActor changes externally
  useEffect(() => { setLocalActiveId(currentActor.id); }, [currentActor.id]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset confirm + switcher when closing
  useEffect(() => {
    if (!open) {
      setShowLogoutConfirm(false);
      setSwitcherOpen(false);
    }
  }, [open]);

  // Escape closes the sheet (popover handles its own ESC first)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !switcherOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, switcherOpen]);

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

  // Telemetry: sheet opened
  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('profile_hub_sheet_opened', {
      actor_type: currentActor.type,
    });
  }, [open, currentActor.type]);

  // Connect-handicap CTA tap (Connect variant)
  const handleConnectHandicap = useCallback(() => {
    analyticsEvents.track('handicap_tile_tapped', { source: 'profile_hub_sheet' });
    handleNav('/handicap');
  }, [handleNav]);

  // Sub-copy line: `@{username} · {hcp/connect/England Golf}`
  const identitySubLine = (() => {
    const handlePart = username ? `@${username}` : (activeProfile.subtitle || '');
    const parts = activeProfileType === 'business'
      ? [handlePart]
      : [handlePart, handicapSubCopy];
    return parts.filter(Boolean).join(' · ');
  })();

  // Stat strip variant
  const stripVariant: 'full' | 'limited' =
    handicapState === 'data' ? 'full' : 'limited';

  // TODO: When the "Profile & businesses" merge brief lands, route to a
  // unified /account screen. For now, this row routes to the edit-profile flow.

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

          {/* Panel */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleSheetDragEnd}
            style={{
              y: sheetY,
              maxHeight: '78dvh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-[9999] w-full rounded-t-[16px] bg-[#F4F6F9] flex flex-col md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[560px]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0 touch-none cursor-grab active:cursor-grabbing">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: HAIRLINE }} />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4">
              {isLoading ? (
                <ProfileHubSheetSkeleton />
              ) : (
                <>
                  {/* ── 1. Identity strip ── */}
                  <div style={{ position: 'relative' }}>
                    <div className="flex items-center gap-3 pt-2 pb-3">
                      <SquircleAvatar
                        size={40}
                        src={activeProfile.avatarUrl}
                        alt={activeProfile.name}
                        fallback={activeProfile.name?.charAt(0)?.toUpperCase() ?? '?'}
                        hideRing
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: INK,
                            letterSpacing: '-0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {activeProfile.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: INK_SOFT,
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {identitySubLine}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSwitcherOpen((v) => !v)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          padding: '6px 8px',
                          background: '#FFFFFF',
                          border: `0.5px solid ${HAIRLINE}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        aria-haspopup="menu"
                        aria-expanded={switcherOpen}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: INK_SOFT, letterSpacing: '0.02em' }}>
                          Profiles
                        </span>
                        <ChevronDown size={12} color={INK_SOFT} strokeWidth={2} />
                      </button>
                    </div>

                    <ProfileSwitcherPopover
                      open={switcherOpen}
                      onClose={() => setSwitcherOpen(false)}
                      profiles={profiles}
                      activeId={localActiveId}
                      onSelectProfile={handleSwitchProfile}
                      onAddBusiness={() => handleNav('/businesses/manage')}
                    />
                  </div>

                  {/* ── 2. Handicap masthead — personal profiles only (business has no handicap) ── */}
                  {activeProfileType === 'personal' && (
                    <>
                      <div style={{ height: '0.5px', background: HAIRLINE, margin: '0 -16px' }} />
                      <div style={{ marginTop: 18 }}>
                        <HandicapMasthead userId={localActiveId} onConnectTap={handleConnectHandicap} />
                      </div>
                    </>
                  )}

                  {/* View handicap link (data state only, personal only) */}
                  {activeProfileType === 'personal' && stripVariant === 'full' && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        paddingTop: 12,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNav('/handicap');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: AMBER,
                        }}
                      >
                        View handicap
                        <ChevronRight size={13} color={AMBER} strokeWidth={2.4} />
                      </button>
                    </div>
                  )}

                  {/* ── 4. Quick action carded row ── */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                    <QuickActionTile
                      label="Echo"
                      badge={0}
                      onClick={() => handleNav('/echo')}
                      ariaLabel="Open Echo"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `linear-gradient(135deg, ${AMBER}, #E8920A)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(247,147,30,0.30)',
                        }}
                      >
                        <AnimatedEchoWave size={16} color="#FFFFFF" active={true} />
                      </div>
                    </QuickActionTile>

                    <QuickActionTile
                      label="Messages"
                      badge={unreadMessageCount}
                      onClick={() => handleNav('/messages')}
                      ariaLabel="Open Messages"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: 'transparent',
                          border: `1px solid ${HAIRLINE}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MessageCircle size={17} color={INK_SOFT} strokeWidth={1.8} />
                      </div>
                    </QuickActionTile>

                    <QuickActionTile
                      label="Alerts"
                      badge={unreadNotificationCount}
                      onClick={() => handleNav('/notificationmessages')}
                      ariaLabel="Open Alerts"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: 'transparent',
                          border: `1px solid ${HAIRLINE}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Bell size={17} color={INK_SOFT} strokeWidth={1.8} />
                      </div>
                    </QuickActionTile>
                  </div>

                  {/* ── 5a. Account group ── */}
                  <SheetGroup label="Account" style={{ marginTop: 18 }}>
                    <GroupedRow
                      Icon={UserCog}
                      label="View profile"
                      onClick={() => handleNav(`/profile/${localActiveId}`)}
                      isFirst
                    />
                    <GroupedRow
                      Icon={UserCog}
                      label="Edit profile"
                      onClick={() => handleNav(editRoute)}
                    />
                    <GroupedRow
                      Icon={SettingsIcon}
                      label="Settings"
                      onClick={() => handleNav('/settings')}
                      isLast
                    />
                  </SheetGroup>

                  {/* ── 5b. Businesses group (only for existing owners) ── */}
                  {hasBusinesses && (
                    <SheetGroup label="Businesses" style={{ marginTop: 18 }}>
                      <GroupedRow
                        Icon={Shield}
                        label="Manage businesses"
                        onClick={() => handleNav('/businesses/manage')}
                        isFirst
                        isLast
                      />
                    </SheetGroup>
                  )}

                  {/* ── 6. Admin / Command Center ── */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleNav('/admin/command-center')}
                      style={{
                        marginTop: 18,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        minHeight: 48,
                        background: 'rgba(247,147,30,0.06)',
                        border: '1px solid rgba(247,147,30,0.18)',
                        borderRadius: 14,
                        padding: '0 14px',
                        cursor: 'pointer',
                      }}
                    >
                      <Shield className="w-5 h-5" style={{ color: AMBER }} />
                      <div className="flex-1 text-left">
                        <div style={{ fontSize: 14, fontWeight: 700, color: AMBER }}>Command Center</div>
                        <div style={{ fontSize: 11, color: 'rgba(247,147,30,0.55)' }}>Manage site settings</div>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: 'rgba(247,147,30,0.40)' }} />
                    </button>
                  )}

                  {/* ── 7. Sign out ── */}
                  <div
                    style={{
                      marginTop: 18,
                      paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
                    }}
                  >
                    {!showLogoutConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="active:opacity-90 transition-opacity"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '12px 14px',
                          borderRadius: 14,
                          background: '#FEF2F2',
                          border: '1px solid rgba(159,29,29,0.22)',
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={15} color="#9F1D1D" strokeWidth={2.2} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#9F1D1D', letterSpacing: '-0.005em' }}>
                          Sign out
                        </span>
                      </button>
                    ) : (
                      <div className="flex gap-3 w-full">
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(false)}
                          style={{ flex: 1, minHeight: 50, borderRadius: 25, background: 'rgba(15,23,42,0.04)', border: '0.5px solid rgba(15,23,42,0.12)', fontSize: 14, fontWeight: 600, color: INK_SOFT, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="active:opacity-90 transition-opacity"
                          style={{ flex: 1, minHeight: 50, borderRadius: 25, background: '#9F1D1D', border: 'none', fontSize: 14, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <LogOut size={16} />
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

  return typeof window !== 'undefined'
    ? createPortal(content, document.body)
    : null;
}

export { ProfileHubSheet };
export default memo(ProfileHubSheet);
