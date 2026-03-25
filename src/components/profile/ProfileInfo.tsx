
import React from 'react';
import FollowerStats from './FollowerStats';
import ProfileHeader from './components/ProfileHeader';
import HomeClubSection from './components/HomeClubSection';
import BusinessInfoSection from './components/BusinessInfoSection';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface ProfileInfoProps {
  profile: any;
  userEmail?: string;
  userId?: string;
  onProfileUpdate?: () => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profile,
  userEmail,
  userId,
  onProfileUpdate
}) => {
  const { user } = useSupabaseSession();
  // Enhanced isOwnProfile check to handle username-based profile access
  const isOwnProfile = user?.id === profile?.id ||
                       (user && profile?.username && user.user_metadata?.username === profile.username) ||
                       (user && profile?.username === user.email?.split('@')[0]);

  console.log('ProfileInfo - profile:', profile, 'userId:', userId, 'profile.id:', profile?.id);

  if (!profile && !userEmail) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No profile information available</p>
      </div>
    );
  }

  // All profiles are now personal profiles
  const displayName = profile?.display_name || profile?.username || userEmail?.split('@')[0] || 'User';
  const username = profile?.username ? `@${profile.username}` : '';
  const bio = profile?.bio || '';
  const homeClub = profile?.home_club || '';

  // Use profile.id as the primary userId for stats
  const profileUserId = profile?.id || userId;

  console.log('ProfileInfo - using profileUserId:', profileUserId, 'for stats');

  // Create a no-op function if onProfileUpdate wasn't provided
  const handleProfileUpdate = onProfileUpdate || (() => {});

  return (
    <div className="space-y-4">
      <ProfileHeader
        displayName={displayName}
        username={username}
        profileId={profile?.id}
        bio={bio}
        profileUsername={profile?.username}
        instagramHandle={profile?.instagram_handle}
        twitterHandle={profile?.twitter_handle}
        tiktokHandle={profile?.tiktok_handle}
        youtubeHandle={profile?.youtube_handle}
      />

      {/* Home Club - Show for all personal profiles */}
      {(homeClub || isOwnProfile) && (
        <HomeClubSection
          homeClub={homeClub}
          isOwnProfile={isOwnProfile}
          userId={userId}
          onProfileUpdate={handleProfileUpdate}
          userType="individual"
        />
      )}

      {/* Show follower stats for all personal profiles */}
      {profileUserId && (
        <FollowerStats 
          userId={profileUserId} 
          userType="individual"
          username={profile?.username}
        />
      )}
    </div>
  );
};

export default ProfileInfo;
