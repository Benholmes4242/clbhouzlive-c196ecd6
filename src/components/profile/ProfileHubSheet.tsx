/**
 * ProfileHubSheet — Account hub bottom sheet for mobile.
 * Full rebuild. Semantic tokens only. framer-motion animations.
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[9999] w-full rounded-t-[24px] bg-background flex flex-col md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[560px]"
            style={{
              maxHeight: '92dvh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
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

                <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground/60 mb-2.5">
                  Switch Profile
                </div>
                <div
                  className="flex gap-3 overflow-x-auto pb-1 no-scrollbar"
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
                          <div className="rounded-[34%]">
                            <SquircleAvatar
                              size={48}
                              src={profile.avatarUrl}
                              alt={profile.name}
                              fallback={profile.name?.charAt(0)?.toUpperCase()}
                              hideRing
                            />
                          </div>
                          {isActive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                              <Check className="w-3 h-3 text-primary-foreground" />
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

              {/* ── Quick actions ── */}
              <div className="grid grid-cols-2 gap-2 py-4">
                {quickActions.map(({ icon: Icon, label, route, badge, badgeColor, isEcho }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleNav(route)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-2xl px-4 min-h-[56px] transition-colors duration-150",
                      isEcho
                        ? "hover:opacity-90 active:opacity-70"
                        : "bg-muted hover:bg-muted/40 active:bg-muted/70"
                    )}
                    style={isEcho ? {
                      background: 'rgba(245, 158, 11, 0.10)',
                      border: '1px solid rgba(245, 158, 11, 0.22)',
                    } : undefined}
                  >
                    <div className="relative">
                      <Icon className={isEcho ? "" : "w-[18px] h-[18px] text-muted-foreground"} />
                      {badge > 0 && (
                        <span className={cn(
                          'absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center',
                          badgeColor
                        )}>
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </div>
                    <span className={cn("text-[13px] font-medium", isEcho ? "text-[#B45309]" : "text-foreground")}>{label}</span>
                  </button>
                ))}
              </div>

              {/* ── Divider ── */}
              <div className="h-px bg-border/50 -mx-4" />

              {/* ── Account section ── */}
              <div className="py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground/60 mb-1">
                  Account
                </div>
                {accountRows.map(({ icon: Icon, label, route }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleNav(route)}
                    className="w-full flex items-center gap-3 min-h-[48px] hover:bg-muted/40 active:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors duration-150"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-left text-[14px] font-medium text-foreground">{label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </button>
                ))}
              </div>

              {/* ── Admin section ── */}
              {isAdmin && (
                <>
                  <div className="h-px bg-border/50 -mx-4" />
                  <div className="py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground/60 mb-1">
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

              {/* ── Logout ── */}
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
                      className="flex-1 min-h-[44px] rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 active:bg-muted/50 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 min-h-[44px] rounded-xl bg-destructive text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 transition-colors duration-150"
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
