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
  User, MessageCircle, Bell, Pencil,
  Building2, Settings, ChevronRight, LogOut,
  Shield, Plus, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useLogout } from '@/hooks/useLogout';

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
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M1 10h2M4 7v6M7 5v10M10 3v14M13 5v10M16 7v6M19 10h-2"
            stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
      label: 'Echo',
      route: '/echo',
      badge: 0,
      badgeColor: '',
      isEcho: true,
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      route: '/messages',
      badge: unreadMessageCount,
      badgeColor: 'bg-primary',
    },
    {
      icon: Bell,
      label: 'Notifications',
      route: '/notificationmessages',
      badge: unreadNotificationCount,
      badgeColor: 'bg-destructive',
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

              {/* ── Profile header ── */}
              <div className="flex items-center gap-3 py-3">
                <SquircleAvatar
                  size={52}
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name}
                  fallback={activeProfile.name?.charAt(0)?.toUpperCase() ?? '?'}
                  hideRing
                />
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-foreground truncate">
                    {activeProfile.name}
                  </div>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {activeProfile.type === 'business' ? 'Business account' : 'Personal account'}
                  </p>
                </div>
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
                        className="flex flex-col items-center gap-1.5 shrink-0 min-w-[72px]"
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
                    className="flex flex-col items-center gap-1.5 shrink-0 min-w-[72px]"
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

              {/* ── Quick actions — #3 vertical card layout ── */}
              <div className="grid grid-cols-2 gap-2.5 py-4">
                {quickActions.map(({ icon: Icon, label, route, badge, badgeColor, isEcho }) => (
                  isEcho ? (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleNav(route)}
                      className="relative flex flex-col items-start justify-between p-3.5 rounded-2xl active:scale-[0.97] transition-all duration-150 overflow-hidden"
                      style={{
                        height: 80,
                        background: 'linear-gradient(135deg, #F5A623 0%, #E8920A 100%)',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(245,166,35,0.40), 0 1px 4px rgba(0,0,0,0.08)',
                      }}
                    >
                      {/* Sheen overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
                        }}
                      />

                      <AnimatedEchoWave size={28} color="#ffffff" active={true} />

                      <span
                        className="text-[13px] font-extrabold leading-none w-full text-left"
                        style={{ color: '#ffffff', letterSpacing: '-0.1px' }}
                      >
                        {label}
                      </span>
                    </button>
                  ) : (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleNav(route)}
                      className="relative flex flex-col items-start justify-between p-3.5 rounded-2xl transition-colors duration-150 active:scale-[0.97]"
                      style={{
                        height: 80,
                        background: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.07)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      {badge > 0 && (
                        <span
                          className="absolute top-2.5 right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                          style={{ background: badgeColor === 'bg-primary' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}

                      <div
                        className="flex items-center justify-center rounded-[10px]"
                        style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.05)' }}
                      >
                        <Icon className="w-[18px] h-[18px]" style={{ color: '#475569' }} strokeWidth={2} />
                      </div>

                      <span
                        className="text-[13px] font-bold leading-none w-full text-left"
                        style={{ color: '#0f172a', letterSpacing: '-0.1px' }}
                      >
                        {label}
                      </span>
                    </button>
                  )
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
              <div className="py-3 pb-6">
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

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}

export { ProfileHubSheet };
export default memo(ProfileHubSheet);
