import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Building2, User, Settings, LogOut, Shield } from 'lucide-react';
import { useActiveActor, ActiveActor } from '@/context/ActiveActorContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';

interface PostingAsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostingAsMenu({ isOpen, onClose }: PostingAsMenuProps) {
  const navigate = useNavigate();
  const { activeActor, setActiveActor, availableActors } = useActiveActor();
  const { user } = useSupabaseSession();

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

  const renderAvatar = (actor: ActiveActor) => {
    if (actor.avatarUrl) {
      return (
        <img
          src={actor.avatarUrl}
          alt={actor.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
        {getInitials(actor.name)}
      </div>
    );
  };

  if (!isOpen) return null;

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
        style={{ top: 'calc(56px + env(safe-area-inset-top))' }}
      >
        <div className="mx-3 rounded-sq-lg shadow-xl border border-border overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          {/* Profile list section */}
          <div className="px-4 pt-3 pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Posting as
            </span>
          </div>
          
          <div className="px-2 pb-2 space-y-1">
            {availableActors.map((actor) => {
              const isActive = activeActor?.type === actor.type && activeActor?.id === actor.id;
              
              return (
                <button
                  key={`${actor.type}-${actor.id}`}
                  onClick={() => {
                    if (!isActive) setActiveActor(actor);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-sq-md px-3 py-2.5 hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  {renderAvatar(actor)}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {actor.name}
                      </span>
                      {actor.type === 'business' ? (
                        <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {actor.type === 'personal' ? 'Personal profile' : 'Business'}
                    </span>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Divider */}
          <div className="border-t border-border" />
          
          {/* Account & settings section */}
          <div className="px-2 py-2 space-y-1">
            <button
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-sq-md px-3 py-2.5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">View profile</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/businesses/manage');
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-sq-md px-3 py-2.5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Business profiles</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/settings');
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-sq-md px-3 py-2.5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Settings</span>
            </button>

            {hasAdminAccess && (
              <button
                onClick={() => {
                  navigate('/admin');
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-sq-md px-3 py-2.5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
              >
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Admin Dashboard</span>
              </button>
            )}
            
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-sq-md px-3 py-2.5 hover:bg-red-50 active:bg-red-100 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
