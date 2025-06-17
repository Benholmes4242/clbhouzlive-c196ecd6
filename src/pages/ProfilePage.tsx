
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfilePhotoManager from '@/components/profile/ProfilePhotoManager';
import ProfileSections from '@/components/profile/ProfileSections';
import { useProfileData } from '@/hooks/useProfileData';

const ProfilePage = () => {
  const {
    user,
    profile,
    loading,
    trackerStats,
    totalStats,
    setProfile,
    fetchProfile,
    fetchTrackerStats
  } = useProfileData();

  const handleTrackerVisibilityToggle = async (checked: boolean) => {
    if (!user) return;
    await supabase
      .from("user_profiles")
      .update({ tracker_visible: checked })
      .eq("id", user.id);
    setProfile(prev => prev ? { ...prev, tracker_visible: checked } : prev);
  };

  const handleEGVisibilityToggle = async (checked: boolean) => {
    if (!user) return;
    const updateData: any = { eg_visible: checked };
    await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", user.id);
    setProfile(prev => prev ? { ...prev, eg_visible: checked } : prev);
  };

  const handleProfileUpdate = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  const handleTrackerUpdate = () => {
    if (user) {
      fetchTrackerStats(user.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground text-base">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      <div className="max-w-2xl mx-auto px-4">
        <ProfilePhotoManager
          user={user}
          profile={profile}
          onProfileUpdate={setProfile}
        />
        
        <ProfileInfo
          profile={profile}
          userEmail={user?.email}
          userId={user?.id}
          onProfileUpdate={handleProfileUpdate}
        />

        <ProfileSections
          profile={profile}
          user={user}
          trackerStats={trackerStats}
          totalStats={totalStats}
          onEGVisibilityToggle={handleEGVisibilityToggle}
          onTrackerVisibilityToggle={handleTrackerVisibilityToggle}
          onTrackerUpdate={handleTrackerUpdate}
        />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
