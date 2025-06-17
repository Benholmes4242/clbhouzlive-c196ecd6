
import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfilePhotoManager from '@/components/profile/ProfilePhotoManager';
import ProfileSections from '@/components/profile/ProfileSections';
import UserProfileActions from '@/components/profile/UserProfileActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch the user profile by username
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Fetch tracker stats for this user
  const { data: trackerStats } = useQuery({
    queryKey: ['trackerStats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};
      const { data } = await supabase
        .from('user_courses')
        .select('course_id, played')
        .eq('user_id', profile.id)
        .eq('played', true);
      
      const stats: { [cat: string]: number } = {};
      ['GB&I', 'Europe', 'USA', 'Global'].forEach((cat) => {
        stats[cat] = data?.length || 0;
      });
      return stats;
    },
    enabled: !!profile?.id,
  });

  // Check relationship status with current user
  const { data: relationshipStatus } = useQuery({
    queryKey: ['relationshipStatus', currentUser?.id, profile?.id],
    queryFn: async () => {
      if (!currentUser?.id || !profile?.id || currentUser.id === profile.id) return null;
      
      // Check if following
      const { data: followData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      // Check friend status
      const { data: friendData } = await supabase
        .from('user_friends')
        .select('status')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

      // Properly type the friend status
      const friendStatus = friendData?.status;
      const validFriendStatus: 'pending' | 'accepted' | null = 
        friendStatus === 'pending' || friendStatus === 'accepted' ? friendStatus as 'pending' | 'accepted' : null;

      return {
        isFollowing: !!followData,
        friendStatus: validFriendStatus
      };
    },
    enabled: !!currentUser?.id && !!profile?.id && currentUser.id !== profile.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground text-base">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground text-base">User not found or profile is private</span>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const totalStats = { 'GB&I': 100, 'Europe': 100, 'USA': 100, 'Global': 100 };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      <div className="max-w-2xl mx-auto px-4">
        <ProfilePhotoManager
          user={profile}
          profile={profile}
          onProfileUpdate={() => {}}
        />
        
        <ProfileInfo
          profile={profile}
          userEmail={profile.display_name || profile.username}
          userId={profile.id}
          onProfileUpdate={() => {}}
        />

        {!isOwnProfile && currentUser && (
          <UserProfileActions
            targetUserId={profile.id}
            currentUserId={currentUser.id}
            isFollowing={relationshipStatus?.isFollowing || false}
            friendStatus={relationshipStatus?.friendStatus || null}
          />
        )}

        <ProfileSections
          profile={profile}
          user={profile}
          trackerStats={trackerStats || {}}
          totalStats={totalStats}
          onEGVisibilityToggle={() => {}}
          onTrackerVisibilityToggle={() => {}}
          onTrackerUpdate={() => {}}
        />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default UserProfilePage;
