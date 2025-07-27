import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import HandicapSection from '@/components/profile/HandicapSection';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import { useProfileData } from '@/hooks/useProfileData';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('activity');
  
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
      {/* Header with conditional frosted glass effect - only when cover photo exists */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${
        profile?.cover_photo_url 
          ? 'backdrop-blur-[2px] bg-white/0 supports-[backdrop-filter]:bg-white/0' 
          : 'bg-background'
      }`}>
        <Header />
      </div>
      
      <div className="max-w-4xl mx-auto">
        <HeroProfileHeader 
          profile={profile}
          onProfileUpdate={refreshProfile}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Render section content based on active section */}
        {activeSection === 'handicap' && (
          <div className="px-8 pt-4 pb-8">
            <div className="bg-white rounded-lg p-6 shadow-lg border">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-semibold text-gray-800">Handicap Section Active</h2>
              </div>
              <HandicapSection 
                userId={user?.id || ''}
                profile={profile}
              />
            </div>
          </div>
        )}
        
        {activeSection === 'top100' && (
          <div className="px-8 pb-8">
            {/* Title positioned like ActivityHeader - right after the cards */}
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-3xl font-bold text-white">Top 100 courses</h2>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg border">
              <UserCoursesContent 
                username={profile?.username || ''}
                isOwnProfile={true}
                displayName={profile?.display_name || 'User'}
              />
            </div>
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
