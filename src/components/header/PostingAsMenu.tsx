import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Building2, User, Settings, LogOut, Shield, Bell, Pencil, Plus, CloudUpload } from 'lucide-react';
import { UploadCenterPanel } from '@/components/uploads/UploadCenterPanel';
import { useUploadJobs } from '@/uploads/useUploadJobs';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';
import { postingAsCopy } from '@/lib/postingAsCopy';
import { toast } from 'sonner';

interface PostingAsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Routes that use dark theme
const CLUBHOUSE_ROUTES = ['/', '/clubhouse'];

export function PostingAsMenu({ isOpen, onClose }: PostingAsMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeActor, setActiveActor, availableActors } = useActiveActor();
  const { user } = useSupabaseSession();
  const { data: userProfile } = useUserProfile(user?.id);
  const { hasUnread } = useUnreadNotifications();
  const [uploadCenterOpen, setUploadCenterOpen] = useState(false);
  const { hasPending, hasFailed } = useUploadJobs();
  const showUploadIndicator = hasPending || hasFailed;

  // Determine if we should use light theme
  const useLightTheme = !CLUBHOUSE_ROUTES.includes(location.pathname);

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const displayName = userProfile?.display_name || user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';

  // Theme-aware styles
  const styles = useLightTheme ? {
    backdrop: 'bg-black/20',
    panelBg: '#FFFFFF',
    panelBorder: 'var(--chrome-light-border)',
    panelShadow: '0 24px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--chrome-light-border)',
    headerBg: 'var(--chrome-light-hover)',
    divider: 'var(--chrome-light-border)',
    textPrimary: 'var(--chrome-light-text)',
    textSecondary: 'var(--chrome-light-text-dim)',
    textMuted: 'rgba(94, 102, 109, 0.6)',
    iconColor: 'var(--chrome-light-icon-dim)',
    hoverBg: 'var(--chrome-light-hover)',
    activeBg: 'var(--chrome-light-active)',
    activeBorder: 'var(--chrome-light-border)',
    checkColor: '#10b981',
  } : {
    backdrop: 'bg-black/60',
    panelBg: 'rgba(16, 16, 16, 0.92)',
    panelBorder: 'rgba(255, 255, 255, 0.08)',
    panelShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
    headerBg: 'rgba(255, 255, 255, 0.04)',
    divider: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    iconColor: 'rgba(255, 255, 255, 0.5)',
    hoverBg: 'rgba(255, 255, 255, 0.05)',
    activeBg: 'rgba(255, 255, 255, 0.1)',
    activeBorder: 'rgba(255, 255, 255, 0.12)',
    checkColor: '#34d399',
  };

  return (
    <>
      {/* Upload Center Panel - rendered outside menu so it persists when menu closes */}
      <UploadCenterPanel 
        isOpen={uploadCenterOpen} 
        onClose={() => setUploadCenterOpen(false)} 
      />

      {/* Menu content - only render when open */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            className={cn("fixed inset-0 z-[199] backdrop-blur-sm", styles.backdrop)}
            onClick={onClose}
            aria-label="Close profile menu"
          />
          
          {/* Menu panel */}
          <div 
            className={cn(
              "fixed inset-x-0 z-[200]",
              "animate-in fade-in slide-in-from-top-2 duration-200"
            )}
            style={{ 
              top: 'calc(56px + env(safe-area-inset-top) + 8px)',
              transform: 'translateZ(0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
              willChange: 'transform'
            }}
          >
            <div 
              className="mx-2 sm:mx-3 overflow-hidden"
              style={{
                borderRadius: '24px',
                background: styles.panelBg,
                backdropFilter: useLightTheme ? 'blur(20px)' : 'blur(40px) saturate(150%)',
                WebkitBackdropFilter: useLightTheme ? 'blur(20px)' : 'blur(40px) saturate(150%)',
                boxShadow: styles.panelShadow,
              }}
            >
              {/* Identity summary card */}
              <div 
                className="px-4 py-4 border-b"
                style={{ 
                  background: styles.headerBg,
                  borderColor: styles.divider
                }}
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
                    <span 
                      className="text-sm font-semibold truncate"
                      style={{ color: styles.textPrimary }}
                    >
                      {displayName}
                    </span>
                    <span 
                      className="text-xs truncate"
                      style={{ color: styles.textSecondary }}
                    >
                      {email}
                    </span>
                    <span 
                      className="mt-0.5 text-[11px]"
                      style={{ color: styles.textMuted }}
                    >
                      {postingAsCopy.headerPill.label}{' '}
                      <span 
                        className="font-medium"
                        style={{ color: styles.textSecondary }}
                      >
                        {activeActor?.name}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Switch profile section */}
              <div className="px-3 py-2">
                <div className="px-2 mb-1">
                  <span 
                    className="text-[11px] font-medium uppercase tracking-wider"
                    style={{ color: styles.textMuted }}
                  >
                    {postingAsCopy.dropdown.sectionTitle}
                  </span>
                  <p 
                    className="text-[10px] mt-0.5"
                    style={{ color: styles.textMuted }}
                  >
                    {postingAsCopy.dropdown.helper}
                  </p>
                </div>
                <div className="mt-2 space-y-0.5">
                  {availableActors.map((actor) => {
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
                          "transition-all duration-150 active:scale-[0.98] border"
                        )}
                        style={{
                          background: isActive ? styles.activeBg : 'transparent',
                          borderColor: isActive ? styles.activeBorder : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = styles.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
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
                            <span 
                              className="text-xs font-medium truncate"
                              style={{ color: styles.textPrimary }}
                            >
                              {actor.name}
                            </span>
                            {actor.type === 'business' ? (
                              <Building2 className="h-3 w-3 flex-shrink-0" style={{ color: styles.textMuted }} />
                            ) : (
                              <User className="h-3 w-3 flex-shrink-0" style={{ color: styles.textMuted }} />
                            )}
                          </div>
                          <span 
                            className="text-[10px]"
                            style={{ color: styles.textMuted }}
                          >
                            {actor.type === 'personal' 
                              ? postingAsCopy.actorLabels.personal 
                              : postingAsCopy.actorLabels.business}
                          </span>
                        </div>
                        {isActive && (
                          <Check className="h-4 w-4 flex-shrink-0" style={{ color: styles.checkColor }} />
                        )}
                      </button>
                    );
                  })}
                  
                  {/* Empty state when no businesses */}
                  {availableActors.filter(a => a.type === 'business').length === 0 && (
                    <div 
                      className="px-3 py-3 rounded-sq-md border border-dashed mt-2"
                      style={{ borderColor: styles.divider }}
                    >
                      <p 
                        className="text-xs font-medium"
                        style={{ color: styles.textSecondary }}
                      >
                        {postingAsCopy.emptyState.title}
                      </p>
                      <p 
                        className="text-[10px] mt-0.5"
                        style={{ color: styles.textMuted }}
                      >
                        {postingAsCopy.emptyState.body}
                      </p>
                      <button
                        onClick={() => handleNavigate('/business/intro')}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {postingAsCopy.emptyState.cta}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Divider */}
              <div style={{ borderTop: `1px solid ${styles.divider}` }} />
              
              {/* Core action items */}
              <nav className="px-3 py-1.5 space-y-0.5">
                {/* Notifications */}
                <MenuRow
                  icon={<Bell className="h-[18px] w-[18px]" />}
                  label="Notifications"
                  onClick={() => handleNavigate('/notificationmessages')}
                  trailing={hasUnread && (
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  )}
                  styles={styles}
                />
                
                {/* Upload Center */}
                <MenuRow
                  icon={<CloudUpload className="h-[18px] w-[18px]" />}
                  label="Upload Center"
                  onClick={() => {
                    setUploadCenterOpen(true);
                    onClose();
                  }}
                  trailing={showUploadIndicator && (
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      hasFailed ? "bg-red-500" : "bg-primary"
                    )} />
                  )}
                  styles={styles}
                />
                
                {/* View profile */}
                <MenuRow
                  icon={<User className="h-[18px] w-[18px]" />}
                  label="View profile"
                  onClick={() => handleNavigate('/profile')}
                  styles={styles}
                />
                
                {/* Edit profile */}
                <MenuRow
                  icon={<Pencil className="h-[18px] w-[18px]" />}
                  label="Edit profile"
                  onClick={() => handleNavigate('/edit-profile')}
                  styles={styles}
                />
                
                {/* Business profiles */}
                <MenuRow
                  icon={<Building2 className="h-[18px] w-[18px]" />}
                  label="Business profiles"
                  onClick={() => handleNavigate('/businesses/manage')}
                  styles={styles}
                />
                
                {/* Settings */}
                <MenuRow
                  icon={<Settings className="h-[18px] w-[18px]" />}
                  label="Settings"
                  onClick={() => handleNavigate('/settings')}
                  styles={styles}
                />

                {/* Admin Dashboard */}
                {hasAdminAccess && (
                  <MenuRow
                    icon={<Shield className="h-[18px] w-[18px]" />}
                    label="Admin Dashboard"
                    onClick={() => handleNavigate('/admin')}
                    styles={styles}
                  />
                )}
              </nav>
              
              {/* Logout section */}
              <div className="px-3 pt-1 pb-3">
                <div style={{ borderTop: `1px solid ${styles.divider}` }} className="pt-2">
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
                    <LogOut className="h-[18px] w-[18px] text-red-400" />
                    <span className="text-sm text-red-400 font-medium">Log out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
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
  styles: {
    iconColor: string;
    textSecondary: string;
    hoverBg: string;
  };
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, label, onClick, trailing, styles }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center justify-between rounded-sq-md px-3 h-11",
      "transition-colors active:scale-[0.98]"
    )}
    onMouseEnter={(e) => e.currentTarget.style.background = styles.hoverBg}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <span className="flex items-center gap-2.5">
      <span style={{ color: styles.iconColor }}>{icon}</span>
      <span className="text-sm" style={{ color: styles.textSecondary }}>{label}</span>
    </span>
    {trailing}
  </button>
);

export default PostingAsMenu;