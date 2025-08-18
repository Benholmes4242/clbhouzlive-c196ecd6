
import React, { useState, useEffect } from 'react';
import HeroProfileHeader from './HeroProfileHeader';
import ImmersiveProfileModal from './immersive/ImmersiveProfileModal';
import GlassProfileCard from './GlassProfileCard';
import StickyProfileHeader from './StickyProfileHeader';
import ProfileTabs from './ProfileTabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';


interface UserProfileContentProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
  } | null;
}

const UserProfileContent: React.FC<UserProfileContentProps> = ({ 
  profile, 
  currentUser, 
  relationshipStatus 
}) => {
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;
  const [activeSection, setActiveSection] = useState('activity');
  const [showImmersive, setShowImmersive] = useState(!isOwnProfile); // Show immersive by default for other profiles
  const [isScrolled, setIsScrolled] = useState(false);
  const { isOpen, currentMedia, openMedia, closeMedia } = useFullscreenMedia();

  // Handle scroll events for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock media data - in real app, this would come from profile
  const mediaItems = profile?.media_items || [
    {
      type: 'image' as const,
      url: profile?.profile_photo_url || '/placeholder.svg',
      duration: 3000
    }
  ];

  const profileStats = {
    handicap: profile?.handicap || 'N/A',
    posts: profile?.post_count || 0,
    followers: profile?.followers_count || 0,
    following: profile?.following_count || 0
  };

  console.log('UserProfileContent - Debug isOwnProfile:', {
    userId: user?.id,
    profileId: profile?.id,
    isOwnProfile,
    user,
    profile
  });

  if (!profile) {
    return null;
  }

  return (
    <>
      {/* Immersive Media Modal */}
      {showImmersive && mediaItems.length > 0 && (
        <ImmersiveProfileModal
          isOpen={showImmersive}
          mediaItems={mediaItems}
          onClose={() => setShowImmersive(false)}
          userId={profile.id}
          profile={profile}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* Sticky Profile Header */}
      {!showImmersive && (
        <StickyProfileHeader
          profile={profile}
          stats={profileStats}
          isScrolled={isScrolled}
        />
      )}

      {/* Main Profile Content */}
      {!showImmersive && (
        <div className="relative">
          {/* Hero Header with Glass Profile Card */}
          <div className="relative">
            <HeroProfileHeader 
              profile={profile}
              isOwnProfile={isOwnProfile}
              onProfileUpdate={() => {}}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
            
            {/* Glass Profile Card overlaying the header */}
            <GlassProfileCard
              profile={profile}
              isOwnProfile={isOwnProfile}
              onEditProfile={() => {}}
            />
          </div>

          {/* Profile Tabs and Content */}
          <div className="relative bg-background">
            <ProfileTabs
              activeTab={activeSection}
              onTabChange={setActiveSection}
              userId={profile.id}
              userDisplayName={profile.display_name}
              userHandicap={profile.handicap}
              userProfilePhotoUrl={profile.profile_photo_url}
              isCurrentUser={isOwnProfile}
              transitionState="idle"
            >
              {{
                activity: <div className="p-4">Activity content coming soon...</div>,
                courses: <div className="p-4">Courses content coming soon...</div>,
                achievements: <div className="p-4">Achievements content coming soon...</div>,
                stats: <div className="p-4">Stats content coming soon...</div>
              }}
            </ProfileTabs>
          </div>

          {/* View Immersive Mode Button for Own Profile */}
          {isOwnProfile && mediaItems.length > 0 && (
            <div className="fixed bottom-20 right-4 z-50">
              <button
                onClick={() => setShowImmersive(true)}
                className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-4 py-2 text-white shadow-lg hover:bg-white/30 transition-all"
              >
                View Immersive Mode
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UserProfileContent;
