
import React, { useState, useEffect } from 'react';
import HeroProfileHeader from './HeroProfileHeader';
import ImmersiveProfileModal from './immersive/ImmersiveProfileModal';
import GlassProfileCard from './GlassProfileCard';
import StickyProfileHeader from './StickyProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileStats from './ProfileStats';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import { useIsMobile } from '@/hooks/useIsMobile';


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
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('activity');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Use the immersive profile hook
  const {
    isImmersiveOpen,
    currentMediaIndex,
    hasImmersiveMedia,
    mediaItems,
    loading: mediaLoading,
    shouldAutoOpen,
    openImmersive,
    closeImmersive,
    previewImmersive
  } = useImmersiveProfile(profile?.id || '', isOwnProfile);

  // Handle scroll events for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const primaryStats = {
    handicap: profile?.handicap || 'N/A',
    posts: profile?.post_count || 0,
    followers: profile?.followers_count || 0,
    following: profile?.following_count || 0
  };

  const secondaryStats = {
    coursesRated: profile?.courses_rated || 0,
    avgRating: profile?.avg_rating || 0,
    achievements: profile?.achievements_count || 0,
    totalRounds: profile?.total_rounds || 0
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

  // Auto-open immersive for others (not own profile)
  useEffect(() => {
    if (shouldAutoOpen && !mediaLoading) {
      openImmersive(0);
    }
  }, [shouldAutoOpen, mediaLoading, openImmersive]);

  return (
    <>
      {/* Immersive Media Modal */}
      <ImmersiveProfileModal
        isOpen={isImmersiveOpen}
        mediaItems={mediaItems.map(item => ({
          id: item.id,
          media_type: (item.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url,
          duration: item.duration,
          display_order: item.display_order,
          header_extended_url: item.header_extended_url,
          header_strip_url: item.header_strip_url,
          header_metadata: item.header_metadata,
          video_method: item.video_method,
          file_name: item.file_name,
          created_at: item.created_at
        }))}
        onClose={closeImmersive}
        userId={profile.id}
        profile={profile}
        isOwnProfile={isOwnProfile}
        onCurrentIndexChange={(index: number) => {}}
      />

      {/* Sticky Profile Header - only when not in immersive mode */}
      {!isImmersiveOpen && (
        <StickyProfileHeader
          profile={profile}
          stats={primaryStats}
          isScrolled={isScrolled}
        />
      )}

      {/* Main Profile Content - only when not in immersive mode */}
      {!isImmersiveOpen && (
        <div className="relative min-h-screen">
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

          {/* Profile Stats Section */}
          <div className="px-4 pb-6">
            <ProfileStats 
              stats={primaryStats}
              secondaryStats={secondaryStats}
              isMobile={isMobile}
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

          {/* Preview Immersive Mode Button for Own Profile */}
          {isOwnProfile && hasImmersiveMedia && (
            <div className="fixed bottom-20 right-4 z-50">
              <button
                onClick={previewImmersive}
                className="bg-primary/80 backdrop-blur-lg border border-primary/30 rounded-full px-4 py-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 font-medium"
              >
                Preview Profile
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UserProfileContent;
