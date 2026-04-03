import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, Building2, User, Settings, LogOut, Shield, Bell, Pencil, Plus, CloudUpload, X, Sparkles, MessageCircle } from 'lucide-react';
import { UploadCenterPanel } from '@/components/uploads/UploadCenterPanel';
import { useUploadJobs } from '@/uploads/useUploadJobs';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { postingAsCopy } from '@/lib/postingAsCopy';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLogout } from '@/hooks/useLogout';
import ProfileHubSheet from '@/components/profile/ProfileHubSheet';

interface PostingAsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  useLightTheme?: boolean;
  /** Ref to the pill element for desktop anchor positioning */
  anchorRef?: React.RefObject<HTMLElement>;
}

export function PostingAsMenu({ isOpen, onClose, useLightTheme = false, anchorRef }: PostingAsMenuProps) {
  const navigate = useNavigate();
  const { activeActor, setActiveActor, availableActors } = useActiveActor();
  const { user } = useSupabaseSession();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(user?.id);
  const { hasUnread, unreadCount: unreadNotificationCount } = useUnreadNotifications();
  
  // Get unread messages from shared messaging context
  const { conversations } = useMessagingContext();
  const unreadMessageCount = conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
  
  const [uploadCenterOpen, setUploadCenterOpen] = useState(false);
  const { hasPending, hasFailed } = useUploadJobs();
  const showUploadIndicator = hasPending || hasFailed;
  const isMobile = useIsMobile();
  const menuRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // Check admin status
  const { data: adminStatus } = useQuery({
    queryKey: ['adminStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, isLimitedAdmin: false };
      const { data: isAdmin } = await supabase.rpc('is_admin');
      const { data: isLimitedAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'limited_admin'
      });
      return { isAdmin: isAdmin || false, isLimitedAdmin: isLimitedAdmin || false };
    },
    enabled: !!user?.id,
  });

  const hasAdminAccess = adminStatus?.isAdmin || adminStatus?.isLimitedAdmin;

  // Calculate popover position for desktop
  useLayoutEffect(() => {
    if (!isOpen || isMobile || !anchorRef?.current || !menuRef.current) return;

    const calculatePosition = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const menuWidth = 360;
      const menuHeight = menuRef.current!.offsetHeight || 500;
      const padding = 12;
      const gap = 10;

      let top = rect.bottom + gap;
      let left = rect.right - menuWidth;

      // Clamp left edge
      if (left < padding) {
        left = padding;
      }
      // Clamp right edge
      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - padding - menuWidth;
      }

      // Flip upward if overflow at bottom
      if (top + menuHeight > window.innerHeight - padding) {
        top = rect.top - gap - menuHeight;
        // If still overflows top, just clamp to top
        if (top < padding) {
          top = padding;
        }
      }

      setPopoverPosition({ top, left });
    };

    calculatePosition();
    // Recalculate on resize
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [isOpen, isMobile, anchorRef]);

  // Click outside to close (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Also check if click is on the anchor
        if (anchorRef?.current && anchorRef.current.contains(e.target as Node)) {
          return; // Let the pill handle its own toggle
        }
        onClose();
      }
    };

    // Delay to avoid immediate close on open click
    const timeout = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, isMobile, onClose, anchorRef]);

  // Handle escape key (desktop)
  useEffect(() => {
    if (!isOpen || isMobile) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isMobile]);

  const { logout: handleLogout } = useLogout();

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const displayName = userProfile?.display_name || user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';

  // Build profiles array for ProfileHubSheet
  const profiles = availableActors.map(actor => ({
    id: actor.id,
    type: actor.type as 'personal' | 'business',
    name: actor.name,
    avatarUrl: actor.avatarUrl,
    subtitle: actor.type === 'personal' ? email : 'Business',
  }));

  // Current actor for ProfileHubSheet
  const currentActorData = {
    type: (activeActor?.type || 'personal') as 'personal' | 'business',
    id: activeActor?.id || user?.id || '',
    name: activeActor?.name || displayName,
    avatarUrl: activeActor?.avatarUrl,
    subtitle: email,
  };

  // Handle profile switch in ProfileHubSheet
  const handleSwitchProfile = async (profileId: string) => {
    const actor = availableActors.find(a => a.id === profileId);
    if (actor && (activeActor?.id !== actor.id)) {
      setActiveActor(actor);
    }
  };

  // Handle navigation from ProfileHubSheet
  const handleAccountHubNavigate = (route: string) => {
    if (route === '/upload') {
      setUploadCenterOpen(true);
    } else if (route === '/logout') {
      handleLogout();
    } else if (route === '/settings/business') {
      navigate('/businesses/manage');
    } else if (route === '/settings/profile') {
      navigate('/edit-profile');
    } else if (route === `/profile/${currentActorData.id}`) {
      handleNavigate('/profile');
    } else {
      navigate(route);
    }
  };

  // ===========================================
  // MOBILE: ProfileHubSheet bottom sheet
  // ===========================================
  if (isMobile) {
    return (
      <>
        {uploadCenterOpen && (
          <UploadCenterPanel 
            isOpen={uploadCenterOpen} 
            onClose={() => setUploadCenterOpen(false)} 
          />
        )}
        <ProfileHubSheet
          open={isOpen}
          onClose={onClose}
          currentActor={currentActorData}
          profiles={profiles}
          onSwitchProfile={handleSwitchProfile}
          onNavigate={handleAccountHubNavigate}
          isAdmin={hasAdminAccess || false}
        />
      </>
    );
  }

  // Desktop menu content
  const menuContent = (
    <>
      {/* Identity summary card */}
      <div 
        className={cn(
          "px-4 py-4 border-b flex-shrink-0",
          useLightTheme ? "border-border/80" : "border-white/8"
        )}
        style={{ background: useLightTheme ? 'hsl(var(--muted) / 0.3)' : 'rgba(255, 255, 255, 0.04)' }}
      >
        <div className="flex items-center gap-3">
          <SquircleAvatar
            size={44}
            src={activeActor?.avatarUrl}
            alt={displayName}
            fallback={getInitials(displayName)}
            hideRing
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className={cn(
              "text-sm font-semibold truncate",
              useLightTheme ? "text-foreground" : "text-white"
            )}>
              {displayName}
            </span>
            <span className={cn(
              "text-xs truncate",
              useLightTheme ? "text-muted-foreground" : "text-white/50"
            )}>
              {email}
            </span>
            <span className={cn(
              "mt-0.5 text-[11px]",
              useLightTheme ? "text-muted-foreground/60" : "text-white/40"
            )}>
              {postingAsCopy.headerPill.label}{' '}
              <span className={cn(
                "font-medium",
                useLightTheme ? "text-muted-foreground" : "text-white/60"
              )}>
                {activeActor?.name}
              </span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Scrollable content area */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: '12px' }}
      >
        {/* Switch profile section */}
        <div className="px-3 py-2">
          <div className="px-2 mb-1">
            <span className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              useLightTheme ? "text-muted-foreground/60" : "text-white/45"
            )}>
              {postingAsCopy.dropdown.sectionTitle}
            </span>
            <p className={cn(
              "text-[10px] mt-0.5",
              useLightTheme ? "text-muted-foreground/60" : "text-white/30"
            )}>
              {postingAsCopy.dropdown.helper}
            </p>
          </div>
          <div className="mt-2 space-y-0.5">
            {/* Group by actor type with section headers */}
            {(() => {
              const personalActors = availableActors.filter(a => a.type === 'personal');
              const businessActors = availableActors.filter(a => a.type === 'business');
              
              const renderActorButton = (actor: typeof availableActors[0]) => {
                const isActive = activeActor?.type === actor.type && activeActor?.id === actor.id;
                
                return (
                  <button
                    key={`${actor.type}-${actor.id}`}
                    onClick={() => {
                      if (!isActive) {
                        setActiveActor(actor);
                        toast.success(postingAsCopy.toasts.switchedToBusiness(actor.name));
                      }
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5",
                      "transition-all duration-150 active:scale-[0.98]",
                      useLightTheme 
                        ? isActive 
                          ? "bg-muted border border-border" 
                          : "hover:bg-muted/50 border border-transparent"
                        : isActive 
                          ? "bg-white/10 border border-white/12" 
                          : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <SquircleAvatar
                      size={28}
                      src={actor.avatarUrl}
                      alt={actor.name}
                      fallback={getInitials(actor.name)}
                      hideRing
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-xs font-medium truncate",
                          useLightTheme ? "text-foreground" : "text-white"
                        )}>
                          {actor.name}
                        </span>
                        {actor.type === 'business' ? (
                          <Building2 className={cn("h-3 w-3 flex-shrink-0", useLightTheme ? "text-muted-foreground" : "text-white/40")} />
                        ) : (
                          <User className={cn("h-3 w-3 flex-shrink-0", useLightTheme ? "text-muted-foreground" : "text-white/40")} />
                        )}
                      </div>
                      <span className={cn("text-[10px]", useLightTheme ? "text-muted-foreground/60" : "text-white/40")}>
                        {actor.type === 'personal' ? postingAsCopy.actorLabels.personal 
                          : postingAsCopy.actorLabels.business}
                      </span>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                  </button>
                );
              };

              return (
                <>
                  {/* Personal */}
                  {personalActors.map(renderActorButton)}
                  
                  {/* Business Section */}
                  {businessActors.length > 0 && (
                    <>
                      <div className={cn("pt-2 pb-1 px-2", useLightTheme ? "text-muted-foreground" : "text-white/40")}>
                        <span className="text-[10px] uppercase tracking-wider font-medium">{postingAsCopy.sectionLabels.businesses}</span>
                      </div>
                      {businessActors.map(renderActorButton)}
                      <button
                        onClick={() => handleNavigate('/businesses/manage')}
                        className={cn("flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium", "text-primary hover:text-primary/80")}
                      >
                        <Settings className="h-3 w-3" />
                        {postingAsCopy.managementLinks.businesses}
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        
        {/* Divider */}
        <div className={cn(
          "border-t mx-3",
          useLightTheme ? "border-border/60" : "border-white/6"
        )} />
        
        {/* Core action items */}
        <nav className="px-3 py-1.5 space-y-0.5">
          {/* Messages */}
          <MenuRow
            icon={<MessageCircle className="h-[18px] w-[18px]" />}
            label="Messages"
            onClick={() => handleNavigate('/messages')}
            useLightTheme={useLightTheme}
            trailing={unreadMessageCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            )}
          />
          
          {/* Notifications */}
          <MenuRow
            icon={<Bell className="h-[18px] w-[18px]" />}
            label="Notifications"
            onClick={() => handleNavigate('/notificationmessages')}
            useLightTheme={useLightTheme}
            trailing={hasUnread && unreadNotificationCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: '#F7931E' }}>
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          />
          
          {/* Upload Center */}
          <MenuRow
            icon={<CloudUpload className="h-[18px] w-[18px]" />}
            label="Upload Center"
            onClick={() => {
              setUploadCenterOpen(true);
              onClose();
            }}
            useLightTheme={useLightTheme}
            trailing={showUploadIndicator && (
              <span className={cn(
                "h-2.5 w-2.5 rounded-full",
                hasFailed ? "bg-red-500" : "bg-primary"
              )} />
            )}
          />
          
          {/* View profile */}
          <MenuRow
            icon={<User className="h-[18px] w-[18px]" />}
            label="View profile"
            onClick={() => handleNavigate('/profile')}
            useLightTheme={useLightTheme}
          />
          
          {/* Edit profile */}
          <MenuRow
            icon={<Pencil className="h-[18px] w-[18px]" />}
            label="Edit profile"
            onClick={() => handleNavigate('/edit-profile')}
            useLightTheme={useLightTheme}
          />
          
          {/* Business profiles */}
          <MenuRow
            icon={<Building2 className="h-[18px] w-[18px]" />}
            label="Business profiles"
            onClick={() => handleNavigate('/businesses/manage')}
            useLightTheme={useLightTheme}
          />
          
          {/* Settings */}
          <MenuRow
            icon={<Settings className="h-[18px] w-[18px]" />}
            label="Settings"
            onClick={() => handleNavigate('/settings')}
            useLightTheme={useLightTheme}
          />

          {/* Admin Dashboard */}
          {hasAdminAccess && (
            <MenuRow
              icon={<Shield className="h-[18px] w-[18px]" />}
              label="Admin Dashboard"
              onClick={() => handleNavigate('/admin-v2/dashboard')}
              useLightTheme={useLightTheme}
            />
          )}
        </nav>
        
        {/* Logout section */}
        <div className="px-3 pt-1 pb-3">
          <div className={cn(
            "border-t pt-2",
            useLightTheme ? "border-border/60" : "border-white/6"
          )}>
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5",
                "hover:bg-red-500/10 transition-colors active:scale-[0.98]"
              )}
            >
              <LogOut className="h-[18px] w-[18px] text-red-500" />
              <span className="text-sm text-red-500 font-medium">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (!isOpen) {
    return uploadCenterOpen ? (
      <UploadCenterPanel 
        isOpen={uploadCenterOpen} 
        onClose={() => setUploadCenterOpen(false)} 
      />
    ) : null;
  }

  // ===========================================
  // DESKTOP: Anchored Popover (rendered via portal)
  // ===========================================
  return (
    <>
      {uploadCenterOpen && (
        <UploadCenterPanel 
          isOpen={uploadCenterOpen} 
          onClose={() => setUploadCenterOpen(false)} 
        />
      )}
      {createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
            width: '360px',
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 24px)',
            borderRadius: '20px',
            overflow: 'hidden',
            background: useLightTheme ? 'hsl(var(--background))' : 'rgba(16, 16, 16, 0.96)',
            backdropFilter: 'blur(40px) saturate(150%)',
            WebkitBackdropFilter: 'blur(40px) saturate(150%)',
            boxShadow: useLightTheme 
              ? '0 24px 60px rgba(0, 0, 0, 0.15), inset 0 0 0 1px hsl(var(--border) / 0.3)'
              : '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
          }}
        >
          {menuContent}
        </div>,
        document.body
      )}
    </>
  );
}

// Reusable menu row component
interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  trailing?: React.ReactNode;
  useLightTheme?: boolean;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, label, onClick, trailing, useLightTheme = false }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center justify-between rounded-sq-md px-3 h-11",
      "transition-colors active:scale-[0.98]",
      useLightTheme ? "hover:bg-muted/50" : "hover:bg-white/5"
    )}
  >
    <span className="flex items-center gap-2.5">
      <span className={useLightTheme ? "text-muted-foreground" : "text-white/50"}>{icon}</span>
      <span className={cn(
        "text-sm",
        useLightTheme ? "text-foreground" : "text-white/80"
      )}>{label}</span>
    </span>
    {trailing}
  </button>
);

export default PostingAsMenu;
