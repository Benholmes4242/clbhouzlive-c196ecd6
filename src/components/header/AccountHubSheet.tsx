import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Plus, User, Bell, Upload, Settings, Building2, Shield, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

// ============================================
// ACCOUNT HUB SHEET
// A world-class bottom sheet with two snap states (Peek/Full)
// Features: profile carousel, quick actions, grouped menu
// Starts below header, covers bottom nav
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
const SNAP_PEEK = 0.48; // 48% for peek
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
  const [showToast, setShowToast] = useState<string | null>(null);
  
  // Touch/drag state
  const dragStartY = useRef<number>(0);
  const dragCurrentY = useRef<number>(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

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
    }, 200);
  }, [onClose]);

  // Handle profile switch
  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === currentActor.id) return;
    
    setSwitchingProfileId(profileId);
    try {
      await onSwitchProfile(profileId);
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setShowToast(`Now posting as ${profile.name}`);
        setTimeout(() => setShowToast(null), 2000);
      }
      // Auto-close after switch
      setTimeout(() => handleClose(), 350);
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
    const threshold = 50;
    
    if (snap === 'peek') {
      if (delta < -threshold) {
        // Swipe up -> expand to full
        setSnap('full');
      } else if (delta > threshold) {
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

  if (!open) return null;

  const backdropClasses = cn(
    'fixed inset-0 z-[9998] transition-opacity duration-200',
    isClosing ? 'opacity-0' : 'opacity-100'
  );

  const sheetClasses = cn(
    'fixed left-0 right-0 bottom-0 z-[9999] flex flex-col transition-all duration-200 ease-out',
    isClosing && 'translate-y-full opacity-0'
  );

  // Calculate sheet top position and transform
  const sheetTop = headerHeight + (availableHeight - currentHeight) + dragOffset;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={backdropClasses}
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
        aria-label="Close menu"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={sheetClasses}
        style={{
          top: sheetTop,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          background: useLightTheme 
            ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)'
            : 'linear-gradient(180deg, rgba(28,28,30,0.98) 0%, rgba(18,18,20,0.98) 100%)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          boxShadow: useLightTheme
            ? '0 -8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          height: `calc(100vh - ${sheetTop}px)`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div 
            className="w-10 h-1 rounded-full"
            style={{
              background: useLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
            }}
          />
        </div>

        {/* Top Bar - Sticky */}
        <div 
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{
            borderColor: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            background: 'inherit',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div 
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'
              }}
            >
              {currentActor.avatarUrl ? (
                <img 
                  src={currentActor.avatarUrl} 
                  alt={currentActor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 opacity-60" />
              )}
            </div>
            <div>
              <div 
                className="font-semibold text-[15px]"
                style={{ color: useLightTheme ? '#1a1a1a' : '#ffffff' }}
              >
                {currentActor.name}
              </div>
              <div 
                className="text-[13px]"
                style={{ color: useLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
              >
                Posting as {currentActor.name}
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: useLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'
            }}
          >
            <X className="w-5 h-5" style={{ color: useLightTheme ? '#666' : '#999' }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
          }}
        >
          {/* Profile Switcher Section */}
          <div className="px-5 pt-4 pb-3">
            <div 
              className="text-xs font-medium uppercase tracking-wider mb-3"
              style={{ color: useLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
            >
              Switch profile
            </div>
            
            {/* Horizontal Carousel */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {profiles.map((profile) => {
                const isSelected = profile.id === currentActor.id;
                const isSwitching = switchingProfileId === profile.id;
                
                return (
                  <button
                    key={profile.id}
                    onClick={() => handleSwitchProfile(profile.id)}
                    disabled={isSwitching}
                    className="flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl transition-all duration-150"
                    style={{
                      width: '170px',
                      background: isSelected 
                        ? (useLightTheme ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.15)')
                        : (useLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'),
                      border: isSelected 
                        ? '1.5px solid rgba(59,130,246,0.4)'
                        : '1.5px solid transparent',
                    }}
                  >
                    {/* Avatar */}
                    <div 
                      className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      {profile.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : profile.type === 'business' ? (
                        <Building2 className="w-5 h-5 opacity-60" />
                      ) : (
                        <User className="w-5 h-5 opacity-60" />
                      )}
                      
                      {/* Selected check */}
                      {isSelected && !isSwitching && (
                        <div 
                          className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: '#3b82f6' }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      {/* Loading spinner */}
                      {isSwitching && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div 
                        className="font-medium text-[14px] truncate"
                        style={{ color: useLightTheme ? '#1a1a1a' : '#ffffff' }}
                      >
                        {profile.name}
                      </div>
                      <div 
                        className="text-[12px]"
                        style={{ color: useLightTheme ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)' }}
                      >
                        {profile.type === 'personal' ? 'Personal' : 'Business'}
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {/* Add Business Card */}
              <button
                onClick={() => handleNavigate('/settings/business')}
                className="flex-shrink-0 flex items-center justify-center gap-2 p-3 rounded-2xl transition-colors"
                style={{
                  width: '140px',
                  background: useLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                  border: `1.5px dashed ${useLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`,
                }}
              >
                <Plus 
                  className="w-5 h-5" 
                  style={{ color: useLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
                />
                <span 
                  className="text-[13px] font-medium"
                  style={{ color: useLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
                >
                  Add business
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div 
            className="mx-5 h-px"
            style={{ background: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
          />

          {/* Quick Actions Row */}
          <div className="px-5 py-4">
            <div className="flex gap-3">
              <QuickActionButton
                icon={<User className="w-[18px] h-[18px]" />}
                label="View profile"
                onClick={() => handleNavigate(`/profile/${currentActor.id}`)}
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
                label="Upload"
                onClick={() => handleNavigate('/upload')}
                useLightTheme={useLightTheme}
              />
            </div>
          </div>

          {/* Divider */}
          <div 
            className="mx-5 h-px"
            style={{ background: useLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
          />

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

            {/* Admin Section */}
            {isAdmin && (
              <MenuSection title="Admin" useLightTheme={useLightTheme}>
                <MenuItem
                  icon={<Shield className="w-5 h-5" />}
                  label="Admin Dashboard"
                  onClick={() => handleNavigate('/admin')}
                  useLightTheme={useLightTheme}
                />
              </MenuSection>
            )}

            {/* Danger Section */}
            <MenuSection title="" useLightTheme={useLightTheme}>
              <MenuItem
                icon={<LogOut className="w-5 h-5" />}
                label="Log out"
                onClick={() => handleNavigate('/logout')}
                useLightTheme={useLightTheme}
                danger
              />
            </MenuSection>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            bottom: 'calc(100px + env(safe-area-inset-bottom))',
            background: useLightTheme ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
            color: useLightTheme ? '#fff' : '#000',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          {showToast}
        </div>
      )}
    </>,
    document.body
  );
};

// Quick Action Button Component
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
    className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-colors"
    style={{
      background: useLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
      color: useLightTheme ? '#1a1a1a' : '#ffffff',
    }}
  >
    <span className="relative" style={{ opacity: 0.7 }}>
      {icon}
      {showBadge && (
        <span 
          className={cn(
            "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500",
            useLightTheme ? "ring-[1.5px] ring-slate-50" : "ring-[1.5px] ring-[rgb(10,10,10)]"
          )}
          aria-label="Unread notifications"
        />
      )}
    </span>
    <span className="text-[12px] font-medium">{label}</span>
  </button>
);

// Menu Section Component
interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
  useLightTheme: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, children, useLightTheme }) => (
  <div className="px-5 py-1">
    {title && (
      <div 
        className="text-xs font-medium uppercase tracking-wider mb-1 px-4"
        style={{ color: useLightTheme ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

// Menu Item Component
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
    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors"
    style={{
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

export default AccountHubSheet;
