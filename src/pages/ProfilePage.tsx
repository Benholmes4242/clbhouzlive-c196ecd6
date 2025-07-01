import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import ProfilePageLayout from '@/components/profile/ProfilePageLayout';
import { useProfileData } from '@/hooks/useProfileData';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';

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

  const { regionProgress, isLoading: isLoadingTop100 } = useTop100CoursesData(
    user?.id || '',
    true
  );

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleRegionClick = (region: string) => {
    navigate('/courses?tab=my-courses');
  };

  const handleEGConnect = () => {
    // TODO: Implement EG App connection
    console.log('Connect to EG App');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderBottomColor: '#b66b41' }}
            ></div>
            <span className="text-muted-foreground text-base">Loading...</span>
          </div>
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <ProfilePageLayout
        profile={profile}
        currentUser={user}
        relationshipStatus={null} // Own profile, no relationship status needed
        regionProgress={regionProgress}
        onRegionClick={handleRegionClick}
        onEGConnect={handleEGConnect}
      />
      
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
