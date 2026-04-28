import React, { useRef, useState } from 'react';
import { User, Settings, Shield, Plus, Briefcase, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdaptiveTextColor } from "@/hooks/useAdaptiveTextColor";
import { useHeader } from "@/contexts/GlobalHeaderContext";
import { useMyBusinesses, useHasBusinesses } from "@/hooks/useMyBusinesses";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateBusinessProfileIntroModal } from '@/components/profile/CreateBusinessProfileIntroModal';
import { IdentitySelector } from '@/components/identity/IdentitySelector';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';

interface HeaderNavigationProps {
  onInteraction?: () => void;
  useLightTheme?: boolean;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ onInteraction, useLightTheme = false }) => {
  const navigate = useNavigate();
  const editRoute = useEditProfileRoute();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { variant } = useHeader();
  const { prefetchHandlers } = useProfilePrefetch(user?.id);
  
  // Wrap navigation actions to trigger interaction callback
  const handleNavigation = (path: string) => {
    onInteraction?.();
    navigate(path);
  };
  
  // Create refs for adaptive text color detection
  const navigationRef = useRef<HTMLDivElement>(null);
  const isDiscoverPage = location.pathname === '/discover';
  const isProfilePage = location.pathname.includes('/profile');
  
  // Use adaptive text color for profile page, fallback to existing logic for other pages
  const shouldUseDarkText = useAdaptiveTextColor(navigationRef);
  
  // Icon color based on theme — semantic tokens
  const getIconColorClass = () => {
    if (useLightTheme) {
      return 'text-muted-foreground hover:text-foreground transition-colors';
    }
    return 'text-white/70 hover:text-white transition-colors';
  };

  // Check if user is admin or limited admin
  const { data: adminStatus } = useQuery({
    queryKey: ['adminStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, isLimitedAdmin: false };
      
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (adminError) {
        console.error('Error checking admin status:', adminError);
      }

      const { data: isLimitedAdmin, error: limitedAdminError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'limited_admin'
      });
      
      if (limitedAdminError) {
        console.error('Error checking limited admin status:', limitedAdminError);
      }

      return { 
        isAdmin: isAdmin || false, 
        isLimitedAdmin: isLimitedAdmin || false 
      };
    },
    enabled: !!user?.id,
  });

  const { hasBusinesses } = useHasBusinesses(user?.id);
  const { data: businesses } = useMyBusinesses(user?.id);

  const [showBusinessIntroModal, setShowBusinessIntroModal] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile-creator-only', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('creator_only')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const handleProfileClick = () => {
    onInteraction?.();
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/profile');
    }
  };

  const handleCreateBusinessProfile = () => {
    onInteraction?.();
    navigate('/business/intro');
  };

  const handleBusinessIntroContinue = () => {
    navigate('/business/create');
  };

  const handleAdminClick = () => {
    onInteraction?.();
    const hasAdminAccess = adminStatus?.isAdmin || adminStatus?.isLimitedAdmin;
    
    if (!hasAdminAccess) {
      console.error('User does not have admin access');
      return;
    }
    
    navigate('/admin-v2/dashboard', { replace: true });
  };

  const handleSettingsClick = () => {
    onInteraction?.();
    navigate('/settings');
  };

  const handleLogout = async () => {
    onInteraction?.();
    try {
      console.log('Starting logout process...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during Supabase logout:', error);
      } else {
        console.log('Supabase logout successful');
      }
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      
      console.log('Redirecting to landing page...');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/';
    }
  };

  const hasAdminAccess = adminStatus?.isAdmin || adminStatus?.isLimitedAdmin;

  if (!user) {
    return (
      <div ref={navigationRef} className="flex items-center space-x-1 md:space-x-4">
        <Button data-action="profile" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 transition-colors active:scale-[0.95]", getIconColorClass())} onClick={handleProfileClick}>
          <User className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-action="settings" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 transition-colors active:scale-[0.95]", getIconColorClass())}>
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mr-2 bg-card border-border shadow-lg">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/auth')}>
              Login
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div ref={navigationRef} className="flex items-center space-x-1 md:space-x-4">
      {/* Identity Selector - only shown when user has multiple identities */}
      <div className="hidden sm:block">
        <IdentitySelector />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-action="profile" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 transition-colors active:scale-[0.95]", getIconColorClass())}>
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 mr-2 bg-card border-border shadow-lg z-50 max-h-none overflow-visible">
          <DropdownMenuItem 
            onClick={handleProfileClick}
            onMouseEnter={prefetchHandlers.onMouseEnter}
            onTouchStart={prefetchHandlers.onTouchStart}
          >
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(editRoute)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {hasBusinesses && businesses && businesses.length > 0 ? (
            <DropdownMenuItem onClick={() => navigate('/businesses/manage')}>
              <Briefcase className="h-4 w-4 mr-2" />
              Business profiles
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleCreateBusinessProfile}>
              <Plus className="h-4 w-4 mr-2" />
              Create business profile
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-action="settings" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 transition-colors active:scale-[0.95]", getIconColorClass())}>
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 mr-2 bg-card border-border shadow-lg">
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            Settings
          </DropdownMenuItem>
          {hasAdminAccess && (
            <DropdownMenuItem onClick={handleAdminClick}>
              <Shield className="h-4 w-4 mr-2" />
              Admin Dashboard
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Business Profile Intro Modal */}
      <CreateBusinessProfileIntroModal
        open={showBusinessIntroModal}
        onClose={() => setShowBusinessIntroModal(false)}
        onContinue={handleBusinessIntroContinue}
      />
    </div>
  );
};

export default HeaderNavigation;
