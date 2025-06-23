
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
  onProfileUpdate: () => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profile,
  userEmail,
  userId,
  onProfileUpdate
}) => {
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;

  if (!profile && !userEmail) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No profile information available</p>
      </div>
    );
  }

  const userType = profile?.user_type || 'individual';
  const isIndividual = userType === 'individual';
  const displayName = profile?.display_name || profile?.username || userEmail?.split('@')[0] || 'User';
  const username = profile?.username ? `@${profile.username}` : '';
  const bio = profile?.bio || '';
  const homeClub = profile?.home_club || '';

  return (
    <div className="space-y-4">
      <ProfileHeader
        displayName={displayName}
        username={username}
        userType={userType}
        profileId={profile?.id}
        isIndividual={isIndividual}
        bio={bio}
      />

      {/* Home Club - Only show for individual users */}
      {isIndividual && (homeClub || isOwnProfile) && (
        <HomeClubSection
          homeClub={homeClub}
          isOwnProfile={isOwnProfile}
          userId={userId}
          onProfileUpdate={onProfileUpdate}
        />
      )}

      {/* Business Information Section - Only show for non-individual users */}
      {!isIndividual && (
        <BusinessInfoSection
          profile={profile}
          bio={bio}
        />
      )}

      {/* Show follower stats for individual profiles only */}
      {isIndividual && profile?.id && (
        <FollowerStats userId={profile.id} userType={userType} />
      )}
    </div>
  );
};

export default ProfileInfo;
