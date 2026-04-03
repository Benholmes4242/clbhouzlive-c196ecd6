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
  Shield, Plus, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useLogout } from '@/hooks/useLogout';
import { Skeleton } from '@/components/ui/skeleton';

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
      {/* ── Dark header card skeleton ── */}
      <div
        className="relative rounded-[20px] overflow-hidden mb-4 mt-1 p-4 sm:p-[18px]"
        style={{ background: 'linear-gradient(135deg, #1C1C1E, #2d2d30)' }}
      >
        {/* Profile row */}
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar */}
          <Skeleton variant="dark" className="w-[52px] h-[52px] rounded-[34%]" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton variant="dark" className="h-4 w-28 rounded-lg" />
            <Skeleton variant="dark" className="h-3 w-20 rounded-lg" />
          </div>
          {/* Search pill */}
          <Skeleton variant="dark" className="w-9 h-9 rounded-full flex-shrink-0" />
        </div>
        {/* Echo card */}
        <Skeleton variant="dark" className="h-[62px] w-full rounded-[14px]" />
      </div>

      {/* ── Switch Profile skeleton ── */}
      <div className="pb-3">
        <Skeleton className="h-3 w-24 rounded-lg mb-2" />
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
      <div className="h-px bg-border/50 -mx-4" />

      {/* ── Quick action tiles skeleton — 3 columns ── */}
      <div className="grid grid-cols-3 gap-2 py-4">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-[80px] rounded-2xl" />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 -mx-4" />

      {/* ── Account rows skeleton ── */}
      <div className="py-3 space-y-1">
        <Skeleton className="h-3 w-16 rounded-lg mb-2" />
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

  // ── Quick actions config ──
  const quickActions = [
    {
      icon: User,
      label: 'View Profile',
      route: `/profile/${localActiveId}`,
      badge: 0,
      badgeColor: '',
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      route: '/messages',
      badge: unreadMessageCount,
      badgeColor: 'emerald',
    },
    {
      icon: Bell,
      label: 'Notifications',
      route: '/notificationmessages',
      badge: unreadNotificationCount,
      badgeColor: 'amber',
    },
  ];

  const accountRows = [
    { icon: Pencil, label: 'Edit profile', route: '/edit-profile' },
    { icon: Building2, label: 'Manage business profiles', route: '/businesses/manage' },
    { icon: Settings, label: 'Settings', route: '/settings' },
  ];

  // ── Section label class ──
  const sectionLabelClass = "text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2";

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
              <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4">

              {isLoading ? (
                <ProfileHubSheetSkeleton />
              ) : (
                <>
              {/* ── Dark editorial header card ── */}
              <div
                className="relative rounded-[20px] overflow-hidden mb-4 mt-1 p-4 sm:p-[18px]"
                style={{ background: 'linear-gradient(135deg, #1C1C1E, #2d2d30)' }}
              >
                {/* Ambient amber glow */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: -20, right: -20,
                    width: 120, height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(247,147,30,0.25) 0%, transparent 70%)',
                  }}
                />

                {/* Profile row */}
                <div className="relative flex items-center gap-3 mb-4">
                  <SquircleAvatar
                    size={52}
                    src={activeProfile.avatarUrl}
                    alt={activeProfile.name}
                    fallback={activeProfile.name?.charAt(0)?.toUpperCase() ?? '?'}
                    hideRing
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-extrabold truncate" style={{ color: '#ffffff', letterSpacing: '-0.3px' }}>
                      {activeProfile.name}
                    </div>
                    <p className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
                      background: 'rgba(247,147,30,0.18)',
                      border: '1px solid rgba(247,147,30,0.28)',
                    }}
                    aria-label="Search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F7931E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.3-4.3"/>
                    </svg>
                  </button>
                </div>

                {/* Echo AI Assistant feature card */}
                <button
                  type="button"
                  onClick={() => handleNav('/echo')}
                  className="relative w-full flex items-center gap-3 active:scale-[0.97] transition-all duration-150 overflow-hidden min-h-[56px]"
                  style={{
                    minHeight: 62, borderRadius: 14, padding: '0 16px',
                    background: 'linear-gradient(135deg, #F7931E, #FBBC2E)',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(247,147,30,0.35)',
                  }}
                >
                  {/* Sheen overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 60%)' }}
                  />
                  {/* Icon container */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <AnimatedEchoWave size={22} color="#ffffff" active={true} />
                  </div>
                  {/* Text */}
                  <div className="flex-1 text-left">
                    <div className="text-[15px] font-extrabold" style={{ color: '#ffffff', letterSpacing: '-0.3px' }}>
                      Echo AI Assistant
                    </div>
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
                      Playing tips · course knowledge · advice
                    </div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </div>

              {/* ── Switch profile ── */}
              <div className="pb-3">

                <div className={sectionLabelClass}>
                  Switch Profile
                </div>
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
              <div className="h-px bg-border/50 -mx-4" />

              {/* ── Quick actions — 3 column grid ── */}
              <div className="grid grid-cols-3 gap-2 py-4">
                {quickActions.map(({ icon: Icon, label, route, badge, badgeColor }) => (
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
                              ? 'rgba(16,185,129,0.10)'
                              : 'rgba(247,147,30,0.10)'
                            : 'rgba(0,0,0,0.05)',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <Icon
                          className="w-[18px] h-[18px]"
                          style={{
                            color: badge > 0
                              ? badgeColor === 'emerald'
                                ? '#10b981'
                                : '#F7931E'
                              : '#475569',
                            transition: 'color 0.2s ease',
                          }}
                          strokeWidth={2}
                        />
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

              {/* ── Divider ── */}
              <div className="h-px bg-border/50 -mx-4" />

              {/* ── Account section — #4 icon boxes ── */}
              <div className="py-3">
                <div className={sectionLabelClass}>
                  Account
                </div>
                {accountRows.map(({ icon: Icon, label, route }, index) => (
                  <div key={label}>
                    {index > 0 && <div className="h-px bg-border/30 mx-1" />}
                    <button
                      type="button"
                      onClick={() => handleNav(route)}
                      className="w-full flex items-center gap-3 min-h-[48px] hover:bg-muted/40 active:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors duration-150"
                    >
                      <div
                        className="flex items-center justify-center rounded-[10px]"
                        style={{
                          width: 34,
                          height: 34,
                          background: 'rgba(0,0,0,0.05)',
                        }}
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
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
                  <div className="h-px bg-border/50 -mx-4" />
                  <div className="py-3">
                    <div className={sectionLabelClass}>
                      Admin
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNav('/admin/command-center')}
                      className="w-full flex items-center gap-3 min-h-[48px] bg-primary/10 rounded-2xl px-4 hover:bg-primary/15 active:bg-primary/20 transition-colors duration-150"
                    >
                      <Shield className="w-5 h-5 text-primary" />
                      <div className="flex-1 text-left">
                        <div className="text-[14px] font-semibold text-primary">Command Center</div>
                        <div className="text-[11px] text-primary/60">Manage site settings</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary/60" />
                    </button>
                  </div>
                </>
              )}

              {/* ── Divider ── */}
              <div className="h-px bg-border/50 -mx-4" />

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
                      className="flex-1 min-h-[50px] rounded-full border border-border/60 bg-black/[0.04] text-[14px] font-semibold text-muted-foreground hover:bg-muted/40 active:bg-muted/50 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 min-h-[50px] rounded-full bg-destructive text-[14px] font-bold text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 transition-colors duration-150"
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
