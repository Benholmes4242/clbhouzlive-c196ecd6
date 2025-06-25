
import React from 'react';
import { User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const HeaderUserMenu = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  // Fetch user profile for username/display name
  const { data: userProfile } = useQuery({
    queryKey: ['currentUserProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user is admin
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      console.log('Admin check result:', data);
      return data || false;
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

  const handleAdminClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Admin dashboard clicked, isAdmin:', isAdmin);
    console.log('User ID:', user?.id);
    console.log('Current URL:', window.location.href);
    
    if (!isAdmin) {
      console.error('User is not admin, cannot access admin dashboard');
      return;
    }
    
    try {
      console.log('Navigating to /admin...');
      // Use replace to avoid back button issues
      navigate('/admin', { replace: true });
      console.log('Navigation command executed');
    } catch (error) {
      console.error('Error navigating to admin:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      }
      console.log('Logout successful, navigating to home...');
      // Navigate to the home page (landing page) after logout
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      // Still navigate to home page even if logout fails
      navigate('/', { replace: true });
    }
  };

  const currentUsername = userProfile?.username || userProfile?.display_name || 'User';

  console.log('HeaderUserMenu render - user:', !!user, 'isAdmin:', isAdmin, 'isAdminLoading:', isAdminLoading);

  if (user) {
    return (
      <div className="group relative">
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <User className="h-5 w-5" />
        </Button>
        
        <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-1">
            <div className="px-2 py-1.5 text-sm text-muted-foreground cursor-default">
              {currentUsername}
            </div>
            <div className="-mx-1 my-1 h-px bg-muted"></div>
            <button 
              onClick={() => navigate('/profile')}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              My Profile
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Settings
            </button>
            {isAdmin && !isAdminLoading && (
              <>
                <div className="-mx-1 my-1 h-px bg-muted"></div>
                <button 
                  onClick={handleAdminClick}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </button>
              </>
            )}
            <div className="-mx-1 my-1 h-px bg-muted"></div>
            <button 
              onClick={handleLogout}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleProfileClick}
      className="cursor-pointer"
    >
      <User className="h-5 w-5" />
    </Button>
  );
};

export default HeaderUserMenu;
