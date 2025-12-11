import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Building2, User, Settings, LogOut, Shield, Bell } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';

interface PostingAsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostingAsMenu({ isOpen, onClose }: PostingAsMenuProps) {
  const navigate = useNavigate();
  const { activeActor, setActiveActor, availableActors } = useActiveActor();
  const { user } = useSupabaseSession();
  const { data: userProfile } = useUserProfile(user?.id);
  const { hasUnread } = useUnreadNotifications();

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

  if (!isOpen) return null;

  const displayName = userProfile?.display_name || user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';

  return (
    <>
      {/* Backdrop */}
      <button
        className="fixed inset-0 z-[199] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close profile menu"
      />
      
      {/* Menu panel - Glassy dark design */}
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
            background: 'rgba(16, 16, 16, 0.92)',
            backdropFilter: 'blur(40px) saturate(150%)',
            WebkitBackdropFilter: 'blur(40px) saturate(150%)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Identity summary card */}
          <div 
            className="px-4 py-4 border-b border-white/8"
            style={{ background: 'rgba(255, 255, 255, 0.04)' }}
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
                <span className="text-sm font-semibold text-white truncate">
                  {displayName}
                </span>
                <span className="text-xs text-white/50 truncate">
                  {email}
                </span>
                <span className="mt-0.5 text-[11px] text-white/40">
                  Posting as{' '}
                  <span className="font-medium text-white/60">
                    {activeActor?.name}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Switch profile section */}
          <div className="px-3 py-3">
            <span className="px-2 text-[10px] font-medium text-white/40 uppercase tracking-wider">
              Switch profile
            </span>
            <div className="mt-2 space-y-0.5">
              {availableActors.map((actor) => {
                const isActive = activeActor?.type === actor.type && activeActor?.id === actor.id;
                
                return (
                  <button
                    key={`${actor.type}-${actor.id}`}
                    onClick={() => {
                      if (!isActive) setActiveActor(actor);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5",
                      "transition-all duration-150 active:scale-[0.98]",
                      isActive 
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
                        <span className="text-xs font-medium text-white truncate">
                          {actor.name}
                        </span>
                        {actor.type === 'business' ? (
                          <Building2 className="h-3 w-3 text-white/40 flex-shrink-0" />
                        ) : (
                          <User className="h-3 w-3 text-white/40 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-white/40">
                        {actor.type === 'personal' ? 'Personal' : 'Business'}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-white/6" />
          
          {/* Core action items */}
          <nav className="px-3 py-2 space-y-0.5">
            {/* Notifications */}
            <MenuRow
              icon={<Bell className="h-[18px] w-[18px]" />}
              label="Notifications"
              onClick={() => handleNavigate('/notificationmessages')}
              trailing={hasUnread && (
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              )}
            />
            
            {/* View profile */}
            <MenuRow
              icon={<User className="h-[18px] w-[18px]" />}
              label="View profile"
              onClick={() => handleNavigate('/profile')}
            />
            
            {/* Business profiles */}
            <MenuRow
              icon={<Building2 className="h-[18px] w-[18px]" />}
              label="Business profiles"
              onClick={() => handleNavigate('/businesses/manage')}
            />
            
            {/* Settings */}
            <MenuRow
              icon={<Settings className="h-[18px] w-[18px]" />}
              label="Profile & settings"
              onClick={() => handleNavigate('/settings')}
            />

            {/* Admin Dashboard */}
            {hasAdminAccess && (
              <MenuRow
                icon={<Shield className="h-[18px] w-[18px]" />}
                label="Admin Dashboard"
                onClick={() => handleNavigate('/admin')}
              />
            )}
          </nav>
          
          {/* Logout section */}
          <div className="px-3 pt-1 pb-3">
            <div className="border-t border-white/6 pt-2">
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
  );
}

// Reusable menu row component
interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, label, onClick, trailing }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center justify-between rounded-sq-md px-3 py-2.5",
      "hover:bg-white/5 transition-colors active:scale-[0.98]"
    )}
  >
    <span className="flex items-center gap-2.5">
      <span className="text-white/50">{icon}</span>
      <span className="text-sm text-white/80">{label}</span>
    </span>
    {trailing}
  </button>
);

export default PostingAsMenu;
