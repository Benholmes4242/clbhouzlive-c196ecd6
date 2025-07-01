
import React from 'react';
import ProfilePageLayout from './ProfilePageLayout';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import { useNavigate } from 'react-router-dom';

interface UserProfileContentProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
    friendStatus: 'pending' | 'accepted' | null;
  } | null;
}

const UserProfileContent: React.FC<UserProfileContentProps> = ({
  profile,
  currentUser,
  relationshipStatus
}) => {
  const navigate = useNavigate();
  const isOwnProfile = currentUser?.id === profile?.id;

  const { regionProgress } = useTop100CoursesData(
    profile?.id || '',
    isOwnProfile
  );

  const handleRegionClick = (region: string) => {
    if (profile.username) {
      navigate(`/user/${profile.username}/courses`);
    }
  };

  const handleEGConnect = () => {
    // Not applicable for viewing other users
  };

  if (!profile) {
    return null;
  }

  return (
    <ProfilePageLayout
      profile={profile}
      currentUser={currentUser}
      relationshipStatus={relationshipStatus}
      regionProgress={regionProgress}
      onRegionClick={handleRegionClick}
      onEGConnect={handleEGConnect}
    />
  );
};

export default UserProfileContent;
