
import React from 'react';
import { Bell, CircleUserRound, Ellipsis, Shield } from 'lucide-react';
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
      
      // Clear any localStorage items that might contain user data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('user') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeKey(key));
      
      // Clear sessionStorage as well
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('user') || key.includes('auth'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during Supabase logout:', error);
      } else {
        console.log('Supabase logout successful');
      }
      
      // Force navigation to landing page
      console.log('Redirecting to landing page...');
      navigate('/', { replace: true });
      
      // Force page reload to ensure complete state reset
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate to home page even if logout fails
      navigate('/', { replace: true });
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  const hasAdminAccess = adminStatus?.isAdmin || adminStatus?.isLimitedAdmin;

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="icon" onClick={handleNotificationsClick}>
          <Bell className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleProfileClick}>
          <CircleUserRound className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Ellipsis className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
      <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationsClick}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Button variant="ghost" size="icon" onClick={handleProfileClick}>
        <CircleUserRound className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Ellipsis className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
