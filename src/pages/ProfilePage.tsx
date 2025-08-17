import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import { useProfileData } from '@/hooks/useProfileData';
import { useQueryClient } from '@tanstack/react-query';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('activity');
  const [bleedContent, setBleedContent] = useState<React.ReactNode>(null);
  const queryClient = useQueryClient();
  
  // Force invalidate profile cache on page load to ensure fresh data
  useEffect(() => {
    console.log('ProfilePage mounted - invalidating profile cache');
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [queryClient]);
  
  // Debug log for activeSection changes
  useEffect(() => {
    console.log('Active section changed to:', activeSection);
  }, [activeSection]);
  
  const {
    user,
    profile,
    loading,
    error,
    setProfile,
    fetchProfile,
    refreshProfile,
    updateProfileField
  } = useProfileData();

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderBottomColor: '#6e9277' }}
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
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Header */}
      <Header bleedContent={bleedContent} />
      
      <div className="md:container md:mx-auto md:px-8">
        <HeroProfileHeader 
          profile={profile}
          isOwnProfile={true} // This is always the user's own profile on this route
          onProfileUpdate={refreshProfile}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onBleedContentChange={setBleedContent}
        />
        
        {/* Activity content is now handled by ActivityFeed within HeroProfileHeader */}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
