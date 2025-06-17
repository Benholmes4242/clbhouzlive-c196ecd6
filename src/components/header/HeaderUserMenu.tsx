
import React from 'react';
import { User } from 'lucide-react';
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

  const handleProfileClick = () => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/profile');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Force navigation to auth page after logout
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      // Still navigate to auth page even if logout fails
      navigate('/auth', { replace: true });
    }
  };

  const currentUsername = userProfile?.username || userProfile?.display_name || 'User';

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled className="text-muted-foreground cursor-default">
            {currentUsername}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleProfileClick}
    >
      <User className="h-5 w-5" />
    </Button>
  );
};

export default HeaderUserMenu;
