import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import { CorsConfigTool } from '@/components/admin/CorsConfigTool';
import { useProfileData } from '@/hooks/useProfileData';
import { useQueryClient } from '@tanstack/react-query';

const ProfileTestPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('activity');
  const queryClient = useQueryClient();
  
  // Only invalidate profile cache on initial page load, not on remounts
  useEffect(() => {
    // Only invalidate if we're coming from a different route or initial load
    const hasInitialized = sessionStorage.getItem('profile-test-initialized');
    if (!hasInitialized) {
      console.log('ProfileTestPage initial load - invalidating profile cache');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      sessionStorage.setItem('profile-test-initialized', 'true');
    }
  }, []); // Remove queryClient dependency to prevent retriggering
  
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderBottomColor: '#6e9277' }}
            ></div>
            <span className="text-muted-foreground text-base">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Test Page Banner */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center">
        <span className="text-yellow-600 font-medium text-sm">TEST PAGE - Profile Clone</span>
      </div>
      
      <HeroProfileHeader 
        profile={profile}
        isOwnProfile={true} // This is always the user's own profile on this route
        onProfileUpdate={refreshProfile}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Activity content is now handled by ActivityFeed within HeroProfileHeader */}
    </div>
  );
};

export default ProfileTestPage;