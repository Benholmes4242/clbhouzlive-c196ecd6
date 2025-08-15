import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('activity');
  const queryClient = useQueryClient();
  const { user, session, loading } = useSupabaseSession();
  
  // Force invalidate profile cache on page load to ensure fresh data
  useEffect(() => {
    console.log('ProfilePage mounted - invalidating profile cache');
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  }, [queryClient]);
  
  // Debug log for activeSection changes
  useEffect(() => {
    console.log('Active section changed to:', activeSection);
  }, [activeSection]);

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

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Header */}
      <Header />
      
      <div className="md:container md:mx-auto md:px-8">
        <HeroProfileHeader 
          profile={null} // Will be handled within HeroProfileHeader
          isOwnProfile={true} // This is always the user's own profile on this route
          onProfileUpdate={() => {
            // Refresh profile data
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
          }}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Activity content is now handled by ActivityFeed within HeroProfileHeader */}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
