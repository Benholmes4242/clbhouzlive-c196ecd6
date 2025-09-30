import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProfilePageHeader from '@/components/profile/ProfilePageHeader';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import { useProfileData } from '@/hooks/useProfileData';
import { useQueryClient } from '@tanstack/react-query';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    // Initialize from URL params, default to 'activity'
    return searchParams.get('tab') || 'activity';
  });
  const queryClient = useQueryClient();
  
  // Only invalidate profile cache on initial page load, not on remounts
  useEffect(() => {
    // Only invalidate if we're coming from a different route or initial load
    const hasInitialized = sessionStorage.getItem('profile-initialized');
    if (!hasInitialized) {
      console.log('ProfilePage initial load - invalidating profile cache');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      sessionStorage.setItem('profile-initialized', 'true');
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
      <div className="min-h-screen bg-background page-with-header">
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
      <div className="min-h-screen bg-background page-with-header">
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

  // Handle section changes with URL sync
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    
    // Update URL without full page reload
    const newSearchParams = new URLSearchParams(searchParams);
    if (section === 'activity') {
      // Remove tab param for default tab
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', section);
    }
    
    // Use replace to avoid adding to browser history for each tab change
    setSearchParams(newSearchParams, { replace: true });
  };

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ProfilePageHeader />
      
      <HeroProfileHeader
        profile={profile}
        isOwnProfile={true} // This is always the user's own profile on this route
        onProfileUpdate={refreshProfile}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      {/* Activity content is now handled by ActivityFeed within HeroProfileHeader */}
    </div>
  );
};

export default ProfilePage;
