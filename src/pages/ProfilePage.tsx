
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfilePhotoManager from '@/components/profile/ProfilePhotoManager';
import ProfileSections from '@/components/profile/ProfileSections';
import { useProfileData } from '@/hooks/useProfileData';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading,
    error,
    setProfile,
    fetchProfile,
    updateProfileField
  } = useProfileData();

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleEGVisibilityToggle = async (checked: boolean) => {
    if (!user) return;
    try {
      const updateData: any = { eg_visible: checked };
      await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", user.id);
      updateProfileField('eg_visible', checked);
    } catch (error) {
      console.error('Error updating EG visibility:', error);
    }
  };

  const handleProfileUpdate = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="text-muted-foreground text-base">Loading...</span>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <span className="text-destructive text-base">Error loading profile</span>
            <button 
              onClick={() => window.location.reload()} 
              className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
            >
              Try refreshing the page
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
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
          onEGVisibilityToggle={handleEGVisibilityToggle}
          isOwnProfile={true}
        />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
