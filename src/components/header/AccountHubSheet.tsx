import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Plus, User, Bell, Upload, Settings, Building2, Shield, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

// ============================================
// ACCOUNT HUB SHEET - FINAL POLISH PASS
// World-class bottom sheet with premium glass styling
// Features: profile carousel, quick actions, grouped menu
// Starts below header, covers bottom nav, desktop responsive
// ============================================

type SnapState = 'peek' | 'full';

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

interface AccountHubSheetProps {
  open: boolean;
  onClose: () => void;
  currentActor: CurrentActor;
  profiles: Profile[];
  onSwitchProfile: (profileId: string) => Promise<void> | void;
  onNavigate: (route: string) => void;
  isAdmin: boolean;
  headerHeight: number;
  useLightTheme?: boolean;
}

// Snap point percentages (of available height below header)
const SNAP_PEEK = 0.52; // 52% for peek
const SNAP_FULL = 0.94; // 94% for full

export const AccountHubSheet: React.FC<AccountHubSheetProps> = ({
  open,
  onClose,
  currentActor,
  profiles,
  onSwitchProfile,
  onNavigate,
  isAdmin,
  headerHeight,
  useLightTheme = false,
}) => {
  const navigate = useNavigate();
  const { hasUnread } = useUnreadNotifications();
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<SnapState>('peek');
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  // Track active actor locally for instant UI update
  const [localActiveId, setLocalActiveId] = useState<string>(currentActor.id);
  
  // Touch/drag state
  const dragStartY = useRef<number>(0);
  const dragCurrentY = useRef<number>(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Sync localActiveId with currentActor when it changes externally
  useEffect(() => {
    setLocalActiveId(currentActor.id);
  }, [currentActor.id]);

  // Check for desktop viewport
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 900);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Calculate available height (viewport - header)
  const availableHeight = typeof window !== 'undefined' 
    ? window.innerHeight - headerHeight 
    : 600;

  // Sheet heights based on snap state
  const peekHeight = availableHeight * SNAP_PEEK;
  const fullHeight = availableHeight * SNAP_FULL;
  const currentHeight = snap === 'peek' ? peekHeight : fullHeight;

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setSnap('peek');
      setIsClosing(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  // Close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSnap('peek');
    }, 220);
  }, [onClose]);

  // Handle profile switch
  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === localActiveId) return;
    
    // Optimistic UI update - instant
    setLocalActiveId(profileId);
    setSwitchingProfileId(profileId);
    
    try {
      await onSwitchProfile(profileId);
      // Sheet stays open, no toast
    } catch {
      // Revert on failure
      setLocalActiveId(currentActor.id);
    } finally {
      setSwitchingProfileId(null);
    }
  };

  // Handle navigation
  const handleNavigate = (route: string) => {
    handleClose();
    setTimeout(() => {
      onNavigate(route);
    }, 100);
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start drag on header area or when content is scrolled to top
    const content = contentRef.current;
    if (content && content.scrollTop > 0) return;
    
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    dragCurrentY.current = e.touches[0].clientY;
    const delta = dragCurrentY.current - dragStartY.current;
    
    // Only allow dragging down in peek, or up/down in full
    if (snap === 'peek' && delta < 0) {
      // Dragging up from peek -> expand
      setDragOffset(Math.max(delta, -(fullHeight - peekHeight)));
    } else if (delta > 0) {
      // Dragging down -> allow with resistance
      setDragOffset(Math.min(delta, currentHeight * 0.4));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const delta = dragCurrentY.current - dragStartY.current;
    const velocity = Math.abs(delta) > 80; // High velocity threshold
    const threshold = 50;
    
    if (snap === 'peek') {
      if (delta < -threshold) {
        // Swipe up -> expand to full
        setSnap('full');
      } else if (delta > threshold || (velocity && delta > 25)) {
        // Swipe down from peek -> close
        handleClose();
      }
    } else {
      if (delta > threshold) {
        // Swipe down from full -> collapse to peek
        setSnap('peek');
      }
    }
    
    setDragOffset(0);
    dragStartY.current = 0;
    dragCurrentY.current = 0;
  };

  // Get active profile for header display
  const activeProfile = profiles.find(p => p.id === localActiveId) || currentActor;

  if (!open) return null;

  // Calculate sheet position
  const sheetTop = isDesktop 
    ? headerHeight + 12 
    : headerHeight + (availableHeight - currentHeight) + dragOffset;

  // Theme colors
  const colors = {
    bg: useLightTheme 
      ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)'
      : 'linear-gradient(180deg, rgba(28,28,30,0.96) 0%, rgba(18,18,20,0.98) 100%)',
    shadow: useLightTheme
      ? '0 -8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)'
      : '0 -8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
    border: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    text: useLightTheme ? '#1a1a1a' : '#ffffff',
    textMuted: useLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    sectionLabel: useLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    cardBg: useLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
    cardBorder: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    grabHandle: useLightTheme ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.25)',
    closeBg: useLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
    closeHover: useLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
    closeIcon: useLightTheme ? '#666' : '#999',
  };

  // Sheet content padding constant for alignment
  const SHEET_PADDING = 16;

  return createPortal(
    <>
      {/* Backdrop - tap to dismiss */}
      <div
        className={cn(
          'fixed inset-0 z-[9998] transition-all',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          background: 'rgba(0, 0, 0, 0.38)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          transitionDuration: '220ms',
        }}
        onClick={handleClose}
        aria-label="Close menu"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed z-[9999] flex flex-col transition-all',
          isClosing && 'opacity-0'
        )}
        style={{
          // Mobile: full-width bottom sheet
          // Desktop: anchored popover
          top: sheetTop,
          left: isDesktop ? 'auto' : 0,
          right: isDesktop ? 16 : 0,
          bottom: isDesktop ? 'auto' : 0,
          width: isDesktop ? 420 : 'auto',
          // Content-driven height with max cap
          height: isDesktop ? 'auto' : 'auto',
          maxHeight: isDesktop ? 'min(640px, calc(100vh - 100px))' : `calc(100vh - ${sheetTop}px)`,
          borderTopLeftRadius: isDesktop ? 22 : 24,
          borderTopRightRadius: isDesktop ? 22 : 24,
          borderBottomLeftRadius: isDesktop ? 22 : 0,
          borderBottomRightRadius: isDesktop ? 22 : 0,
          background: colors.bg,
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          boxShadow: colors.shadow,
          paddingBottom: isDesktop ? 0 : 'env(safe-area-inset-bottom)',
          transform: isClosing ? 'translateY(24px)' : 'translateY(0)',
          transitionDuration: isClosing ? '180ms' : '220ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grab Handle */}
        <div className="flex flex-col items-center pt-2.5 pb-1">
          <div 
            className="w-9 h-1 rounded-full"
            style={{ background: colors.grabHandle }}
          />
        </div>

        {/* Header Row - Sticky */}
        <div 
          className="flex items-center justify-between py-2.5"
          style={{
            paddingLeft: SHEET_PADDING,
            paddingRight: SHEET_PADDING,
            borderBottom: `1px solid ${colors.border}`,
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar - SQUIRCLE */}
            <div 
              className="w-10 h-10 overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ 
                background: colors.cardBg,
                borderRadius: 12, // SDS squircle
              }}
            >
              {activeProfile.avatarUrl ? (
                <img 
                  src={activeProfile.avatarUrl} 
                  alt={activeProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" style={{ opacity: 0.6, color: colors.text }} />
              )}
            </div>
            <div>
              <div 
                className="font-semibold text-[16px] leading-tight"
                style={{ color: colors.text }}
              >
                {activeProfile.name}
              </div>
              <div 
                className="text-[13px] leading-tight mt-0.5"
                style={{ color: colors.textMuted }}
              >
                Posting as {activeProfile.name}
              </div>
            </div>
          </div>
          
          {/* Close button - glass circle */}
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{
              background: colors.closeBg,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <X className="w-[18px] h-[18px]" style={{ color: colors.closeIcon }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: isDesktop ? 16 : 'calc(24px + env(safe-area-inset-bottom))',
          }}
        >
          {/* Profile Switcher Section */}
          <div className="pt-3 pb-2" style={{ paddingLeft: SHEET_PADDING, paddingRight: SHEET_PADDING }}>
            <div 
              className="text-[12px] font-medium uppercase tracking-[0.06em] mb-2.5"
              style={{ color: colors.sectionLabel }}
            >
              Switch profile
            </div>
            
            {/* Horizontal Carousel with snap - aligned with quick actions */}
            <div 
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ 
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                marginLeft: 0,
                marginRight: 0,
              }}
            >
              {profiles.map((profile) => {
                const isSelected = profile.id === localActiveId;
                const isSwitching = switchingProfileId === profile.id;
                
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    isSelected={isSelected}
                    isSwitching={isSwitching}
                    onClick={() => handleSwitchProfile(profile.id)}
                    useLightTheme={useLightTheme}
                  />
                );
              })}
              
              {/* Add Business Card */}
              <button
                onClick={() => handleNavigate('/settings/business')}
                className="flex-shrink-0 flex items-center justify-center gap-2 p-3 transition-all active:scale-[0.98]"
                style={{
                  scrollSnapAlign: 'start',
                  width: 140,
                  height: 74,
                  background: colors.cardBg,
                  border: `1.5px dashed ${useLightTheme ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)'}`,
                  opacity: 0.85,
                  borderRadius: 14,
                }}
              >
                <Plus 
                  className="w-5 h-5" 
                  style={{ color: colors.textMuted }}
                />
                <span 
                  className="text-[13px] font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Add business
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <Divider useLightTheme={useLightTheme} />

          {/* Quick Actions Row */}
          <div style={{ padding: `12px ${SHEET_PADDING}px` }}>
            <div className="grid grid-cols-3 gap-3">
              <QuickActionButton
                icon={<User className="w-[18px] h-[18px]" />}
                label="View profile"
                onClick={() => handleNavigate(`/profile/${localActiveId}`)}
                useLightTheme={useLightTheme}
              />
              <QuickActionButton
                icon={<Bell className="w-[18px] h-[18px]" />}
                label="Notifications"
                onClick={() => handleNavigate('/notificationmessages')}
                useLightTheme={useLightTheme}
                showBadge={hasUnread}
              />
              <QuickActionButton
                icon={<Upload className="w-[18px] h-[18px]" />}
                label="Upload Center"
                onClick={() => handleNavigate('/upload')}
                useLightTheme={useLightTheme}
              />
            </div>
          </div>

          {/* Divider */}
          <Divider useLightTheme={useLightTheme} />

          {/* Menu Sections */}
          <div className="py-2">
            {/* Account Section */}
            <MenuSection title="Account" useLightTheme={useLightTheme}>
              <MenuItem
                icon={<User className="w-5 h-5" />}
                label="Edit profile"
                onClick={() => handleNavigate('/settings/profile')}
                useLightTheme={useLightTheme}
              />
              <MenuItem
                icon={<Building2 className="w-5 h-5" />}
                label="Business profiles"
                onClick={() => handleNavigate('/settings/business')}
                useLightTheme={useLightTheme}
              />
              <MenuItem
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
                onClick={() => handleNavigate('/settings')}
                useLightTheme={useLightTheme}
              />
            </MenuSection>

            {/* Admin Section - Premium privileged highlight with symmetric borders */}
            {isAdmin && (
              <MenuSection title="Admin" useLightTheme={useLightTheme}>
                <AdminMenuItem
                  icon={<Shield className="w-5 h-5" />}
                  label="Admin Dashboard"
                  onClick={() => handleNavigate('/admin')}
                  useLightTheme={useLightTheme}
                />
              </MenuSection>
            )}

            {/* Danger Zone - Logout */}
            <div style={{ padding: `16px ${SHEET_PADDING}px 0` }}>
              <button
                onClick={() => handleNavigate('/logout')}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-[14px] transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(255, 91, 91, 0.06)',
                  border: '1px solid rgba(255, 91, 91, 0.14)',
                  color: '#ef4444',
                }}
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[15px] font-medium">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// ============================================
// PROFILE CARD COMPONENT
// Squircle avatars, frosted white active state, tick on avatar bottom-right
// 2-line name clamp for longer names
// ============================================

interface ProfileCardProps {
  profile: Profile;
  isSelected: boolean;
  isSwitching: boolean;
  onClick: () => void;
  useLightTheme: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isSelected,
  isSwitching,
  onClick,
  useLightTheme,
}) => {
  const colors = {
    text: useLightTheme ? '#1a1a1a' : '#ffffff',
    textMuted: useLightTheme ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)',
    cardBg: useLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
    avatarBg: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
  };

  // Frosted white active state (no blue)
  const activeCardBg = useLightTheme 
    ? 'rgba(0,0,0,0.06)' 
    : 'rgba(255,255,255,0.10)';
  const activeCardBorder = useLightTheme 
    ? 'rgba(0,0,0,0.12)' 
    : 'rgba(255,255,255,0.22)';

  return (
    <button
      onClick={onClick}
      disabled={isSwitching}
      className="relative flex-shrink-0 flex items-center gap-2 p-2 transition-all active:scale-[0.98]"
      style={{
        scrollSnapAlign: 'start',
        width: 160, // Wider for less truncation
        height: 74,
        background: isSelected ? activeCardBg : colors.cardBg,
        border: isSelected 
          ? `1.5px solid ${activeCardBorder}`
          : `1.5px solid ${useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        // No blue glow - clean frosted white
      }}
    >
      {/* Selected checkmark - top-right of card, frosted white */}
      {isSelected && !isSwitching && (
        <div 
          className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full flex items-center justify-center"
          style={{ 
            background: useLightTheme ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.20)',
            border: `1px solid ${useLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.28)'}`,
          }}
        >
          <Check className="w-2.5 h-2.5" style={{ color: useLightTheme ? '#1a1a1a' : 'rgba(255,255,255,0.9)' }} />
        </div>
      )}

      {/* Avatar - SQUIRCLE */}
      <div className="relative flex-shrink-0">
        <div 
          className="w-9 h-9 overflow-hidden flex items-center justify-center"
          style={{ 
            background: colors.avatarBg,
            borderRadius: 10, // SDS squircle for smaller avatar
          }}
        >
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : profile.type === 'business' ? (
            <Building2 className="w-4 h-4" style={{ opacity: 0.6, color: colors.text }} />
          ) : (
            <User className="w-4 h-4" style={{ opacity: 0.6, color: colors.text }} />
          )}
          
          {/* Loading spinner */}
          {isSwitching && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40" style={{ borderRadius: 10 }}>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
      
      {/* Info - 2-line name clamp */}
      <div className="flex-1 min-w-0 text-left pr-1">
        <div 
          className="font-medium text-[13px] leading-tight"
          style={{ 
            color: colors.text,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {profile.name}
        </div>
        <div 
          className="text-[11px] leading-tight mt-0.5"
          style={{ color: colors.textMuted }}
        >
          {profile.type === 'personal' ? 'Personal' : 'Business'}
        </div>
      </div>
    </button>
  );
};

// ============================================
// QUICK ACTION BUTTON COMPONENT
// Equal-width grid button with gradient
// ============================================

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  useLightTheme: boolean;
  showBadge?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  useLightTheme,
  showBadge = false,
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-[14px] transition-all active:scale-[0.98]"
    style={{
      background: useLightTheme 
        ? 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      border: `1px solid ${useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
      color: useLightTheme ? '#1a1a1a' : '#ffffff',
      height: 56,
    }}
  >
    <span className="relative" style={{ opacity: 0.7 }}>
      {icon}
      {showBadge && (
        <span 
          className={cn(
            "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500",
            useLightTheme ? "ring-[1.5px] ring-slate-50" : "ring-[1.5px] ring-[rgb(28,28,30)]"
          )}
          aria-label="Unread notifications"
        />
      )}
    </span>
    <span className="text-[12px] font-medium">{label}</span>
  </button>
);

// ============================================
// DIVIDER COMPONENT
// Very subtle horizontal line
// ============================================

interface DividerProps {
  useLightTheme: boolean;
}

const Divider: React.FC<DividerProps> = ({ useLightTheme }) => (
  <div 
    className="mx-4 h-px"
    style={{ background: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
  />
);

// ============================================
// MENU SECTION COMPONENT
// ============================================

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
  useLightTheme: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, children, useLightTheme }) => (
  <div className="px-4 py-1">
    {title && (
      <div 
        className="text-[12px] font-medium uppercase tracking-[0.06em] mb-1 px-3"
        style={{ color: useLightTheme ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

// ============================================
// MENU ITEM COMPONENT
// Clean row with 52px height
// ============================================

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  useLightTheme: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  label, 
  onClick, 
  useLightTheme,
  danger = false 
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-3 py-3 rounded-[12px] transition-colors active:bg-black/5 dark:active:bg-white/5"
    style={{
      height: 52,
      color: danger 
        ? '#ef4444' 
        : (useLightTheme ? '#1a1a1a' : '#ffffff'),
    }}
  >
    <span style={{ opacity: danger ? 1 : 0.6 }}>{icon}</span>
    <span className="flex-1 text-left text-[15px] font-medium">{label}</span>
    {!danger && (
      <ChevronRight 
        className="w-5 h-5" 
        style={{ opacity: 0.3 }} 
      />
    )}
  </button>
);

// ============================================
// ADMIN MENU ITEM COMPONENT
// Premium gold accent highlight - SYMMETRIC BORDERS
// ============================================

interface AdminMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  useLightTheme: boolean;
}

const AdminMenuItem: React.FC<AdminMenuItemProps> = ({ 
  icon, 
  label, 
  onClick, 
  useLightTheme,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-3 py-3 rounded-[12px] transition-colors"
    style={{
      height: 52,
      background: 'rgba(245, 185, 66, 0.06)',
      // Symmetric left + right borders
      borderLeft: '2px solid rgba(245, 185, 66, 0.55)',
      borderRight: '2px solid rgba(245, 185, 66, 0.55)',
      color: useLightTheme ? '#1a1a1a' : '#ffffff',
    }}
  >
    <span style={{ opacity: 0.8, color: 'rgba(245, 185, 66, 0.9)' }}>{icon}</span>
    <span className="flex-1 text-left text-[15px] font-medium">{label}</span>
    <span 
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: 'rgba(245, 185, 66, 0.15)',
        color: 'rgba(245, 185, 66, 0.9)',
      }}
    >
      Admin
    </span>
  </button>
);

export default AccountHubSheet;
