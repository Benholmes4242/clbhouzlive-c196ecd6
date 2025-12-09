
import React, { useRef } from 'react';
import { User, Settings, Shield } from 'lucide-react';
import { IoMdNotificationsOutline } from "react-icons/io";
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdaptiveTextColor } from "@/hooks/useAdaptiveTextColor";
import { useHeader } from "@/contexts/GlobalHeaderContext";
import { cn } from "@/lib/utils";
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
  const { variant } = useHeader();
  
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

  const handleProfileClick = () => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/profile');
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
        {/* Notifications bell icon with badge-ready wrapper */}
        <div className="relative">
          <Button
            variant="ghost"
            className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())}
            onClick={() => navigate('/notificationmessages')}
          >
            <IoMdNotificationsOutline className="h-5 w-5" />
          </Button>
          {/* Unread badge (future-ready; not displayed yet) */}
          {/* <span className="absolute top-2 right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">3</span> */}
        </div>

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
      {/* Notifications bell icon with badge-ready wrapper */}
      <div className="relative">
        <Button
          variant="ghost"
          className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())}
          onClick={() => navigate('/notificationmessages')}
        >
          <IoMdNotificationsOutline className="h-5 w-5" />
        </Button>
        {/* Unread badge (future-ready; not displayed yet) */}
        {/* <span className="absolute top-2 right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">3</span> */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-action="profile" variant="ghost" className={cn("p-2 md:p-3 flex-shrink-0 mt-3 transition-colors", getIconColorClass())}>
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 mr-2 bg-white border shadow-lg z-50">
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
        <DropdownMenuContent align="end" className="w-48 mr-2">
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
