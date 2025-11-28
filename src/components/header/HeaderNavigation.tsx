
import React, { useRef } from 'react';
import { Bell, User, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdaptiveTextColor } from "@/hooks/useAdaptiveTextColor";
import { useHeader } from "@/contexts/GlobalHeaderContext";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HeaderNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { unreadCount } = useNotifications();
  const { variant } = useHeader();
  
  // Fetch current user's profile to get username
  const { data: currentUserProfile } = useUserProfile(user?.id);
  
  // Create refs for adaptive text color detection
  const navigationRef = useRef<HTMLDivElement>(null);
  const isDiscoverPage = location.pathname === '/discover';
  const isProfilePage = location.pathname.includes('/profile');
  
  // Use adaptive text color for profile page, fallback to existing logic for other pages
  const shouldUseDarkText = useAdaptiveTextColor(navigationRef);
  
  // Always use white icons for global header
  const getIconColorClass = () => {
    return 'text-white/70 hover:text-white transition-colors';
  };

  // Check if user is admin or limited admin
  const { data: adminStatus } = useQuery({
    queryKey: ['adminStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, isLimitedAdmin: false };
      
      // Check for admin role
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (adminError) {
        console.error('Error checking admin status:', adminError);
      }

      // Check for limited admin role
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

  const handleNotificationsClick = () => {
    navigate('/notifications');
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 50);
  };

  const handleProfileClick = () => {
    if (!user) {
      navigate('/auth');
    } else {
      // Navigate to user's profile using their username
      const username = currentUserProfile?.username;
      if (username) {
        navigate(`/profile/${username}`);
      } else {
        // Fallback to user ID if username not yet loaded
        navigate(`/profile`);
      }
    }
  };

  const handleAdminClick = () => {
    const hasAdminAccess = adminStatus?.isAdmin || adminStatus?.isLimitedAdmin;
    
    if (!hasAdminAccess) {
      console.error('User does not have admin access');
      return;
    }
    
    navigate('/admin', { replace: true });
  };

  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during Supabase logout:', error);
        // Continue with logout process even if Supabase logout fails
      } else {
        console.log('Supabase logout successful');
      }
      
      // Clear any cached data in localStorage and sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      
      // Force navigation to landing page and reload
      console.log('Redirecting to landing page...');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  const hasAdminAccess = adminStatus?.isAdmin || adminStatus?.isLimitedAdmin;

  if (!user) {
    return (
      <div ref={navigationRef} className="flex items-center space-x-1 md:space-x-4">
        <Button data-action="notifications" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())} onClick={handleNotificationsClick}>
          <Bell className="h-5 w-5" />
        </Button>

        <Button data-action="profile" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())} onClick={handleProfileClick}>
          <User className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-action="settings" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())}>
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mr-2">
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
      <Button data-action="notifications" variant="ghost" className={cn("relative p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())} onClick={handleNotificationsClick}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-action="profile" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())}>
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 mr-2 bg-white border shadow-lg z-[10001]">
          <DropdownMenuItem onClick={handleProfileClick}>
            View Profile
          </DropdownMenuItem>
          {/* Add Edit Profile option only when on profile page */}
          {isProfilePage && (
            <DropdownMenuItem onClick={() => {
              // Trigger edit profile modal using the hidden trigger
              const editButton = document.querySelector('[data-edit-profile-trigger]') as HTMLButtonElement;
              if (editButton) {
                editButton.click();
              }
            }}>
              Edit Profile
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-action="settings" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())}>
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 mr-2 z-[10001]">
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
    </div>
  );
};

export default HeaderNavigation;
