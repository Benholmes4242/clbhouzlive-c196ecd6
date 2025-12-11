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

  if (!isOpen) return null;

  const displayName = userProfile?.display_name || user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';

  return (
    <>
      {/* Backdrop */}
      <button
        className="fixed inset-0 z-[199] bg-black/40"
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
          top: 'calc(56px + env(safe-area-inset-top))',
          transform: 'translateZ(0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
      >
        <div 
          className="mx-3 rounded-sq-lg bg-white shadow-xl border border-slate-200 overflow-hidden"
          style={{
            '--foreground': '210 13% 18%',
            '--muted-foreground': '210 10% 38%',
            '--muted': '240 5% 92%',
            '--border': '210 8% 89%',
          } as React.CSSProperties}
        >
          {/* Top identity summary */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <SquircleAvatar
                size={36}
                src={activeActor?.avatarUrl}
                alt={displayName}
                fallback={getInitials(displayName)}
                hideRing
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {displayName}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  {email}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500">
                  Posting as{' '}
                  <span className="font-medium text-slate-700">
                    {activeActor?.name}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Posting-as selector */}
          <div className="px-2 py-2">
            <span className="px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
              Switch profile
            </span>
            <div className="mt-1 space-y-0.5">
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
                      "flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2",
                      isActive ? "bg-slate-100" : "hover:bg-slate-50"
                    )}
                  >
                    <SquircleAvatar
                      size={24}
                      src={actor.avatarUrl}
                      alt={actor.name}
                      fallback={getInitials(actor.name)}
                      hideRing
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-800 truncate">
                          {actor.name}
                        </span>
                        {actor.type === 'business' ? (
                          <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        ) : (
                          <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {actor.type === 'personal' ? 'Personal' : 'Business'}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-slate-100" />
          
          {/* Menu items */}
          <nav className="px-2 py-2 space-y-0.5">
            {/* Notifications */}
            <button
              onClick={() => {
                navigate('/notificationmessages');
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-sq-md px-3 py-2.5 hover:bg-slate-50 text-left"
            >
              <span className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">Notifications</span>
              </span>
              {hasUnread && (
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              )}
            </button>
            
            {/* View profile */}
            <button
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5 hover:bg-slate-50 text-left"
            >
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700">View profile</span>
            </button>
            
            {/* Business profiles */}
            <button
              onClick={() => {
                navigate('/businesses/manage');
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5 hover:bg-slate-50 text-left"
            >
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700">Business profiles</span>
            </button>
            
            {/* Settings */}
            <button
              onClick={() => {
                navigate('/settings');
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5 hover:bg-slate-50 text-left"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700">Profile & settings</span>
            </button>

            {/* Admin Dashboard */}
            {hasAdminAccess && (
              <button
                onClick={() => {
                  navigate('/admin');
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5 hover:bg-slate-50 text-left"
              >
                <Shield className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">Admin Dashboard</span>
              </button>
            )}
            
            {/* Log out */}
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-sq-md px-3 py-2.5 hover:bg-red-50 text-left"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Log out</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
