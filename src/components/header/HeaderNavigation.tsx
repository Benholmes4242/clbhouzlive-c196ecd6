
import React from 'react';
import { Bell, CircleUserRound, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HeaderNavigation = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { unreadCount } = useNotifications();

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
      <>
        <Button variant="ghost" size="sm" className="p-2 md:p-3 flex-shrink-0" onClick={handleNotificationsClick}>
          <Bell className="h-5 w-5 text-black" />
        </Button>

        <Button variant="ghost" size="sm" className="p-2 md:p-3 flex-shrink-0" onClick={handleProfileClick}>
          <CircleUserRound className="h-5 w-5 md:h-6 md:w-6 text-black" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2 md:p-3 flex-shrink-0">
              <Settings className="h-5 w-5 md:h-6 md:w-6 text-black" />
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
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="relative p-2 md:p-3 flex-shrink-0" onClick={handleNotificationsClick}>
        <Bell className="h-5 w-5 text-black" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Button variant="ghost" size="sm" className="p-2 md:p-3 flex-shrink-0" onClick={handleProfileClick}>
        <CircleUserRound className="h-5 w-5 md:h-6 md:w-6 text-black" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2 md:p-3 flex-shrink-0">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-black" />
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
    </>
  );
};

export default HeaderNavigation;
