
import React from 'react';
import FollowerStats from '../FollowerStats';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  userType: string;
  profileId?: string;
  isIndividual: boolean;
  bio: string;
  profileUsername?: string; // Add profile username for navigation
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  username,
  userType,
  profileId,
  isIndividual,
  bio,
  profileUsername
}) => {
  return (
    <div className="text-center space-y-2">
      {/* Add more spacing for business profiles */}
      <div className={isIndividual ? "mt-0" : "mt-8"}>
        <h1 className="text-2xl font-bold">{displayName}</h1>
      </div>
      
      {/* Only show username for individual users */}
      {isIndividual && username && (
        <p className="text-muted-foreground text-lg">{username}</p>
      )}
      
      {/* Show follower stats under name for non-individual users */}
      {!isIndividual && profileId && (
        <FollowerStats 
          userId={profileId} 
          userType={userType} 
          username={profileUsername}
        />
      )}
      
      {/* Bio - Only show for individual users here */}
      {isIndividual && bio && (
        <p className="text-sm max-w-md mx-auto">{bio}</p>
      )}
    </div>
  );
};

export default ProfileHeader;
