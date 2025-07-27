import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import SlidingProfileSections from '@/components/profile/SlidingProfileSections';
import { useProfileData } from '@/hooks/useProfileData';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('activity'); // State for section control
  
  // Functions to handle card clicks and scroll to sections
  const scrollToHandicap = () => {
    setActiveSection('handicap');
    const element = document.getElementById('profile-sections');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const scrollToTop100 = () => {
    setActiveSection('top100');
    const element = document.getElementById('profile-sections');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
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
          onHandicapClick={scrollToHandicap}
          onTop100Click={scrollToTop100}
        />
        
        <div id="profile-sections" className="mt-6">
          <SlidingProfileSections
            userId={profile?.id}
            profile={profile}
            isOwnProfile={true}
            activeSection={activeSection}
          />
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
