
import React from 'react';
import FollowerStats from '../FollowerStats';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  profileId?: string;
  bio: string;
  profileUsername?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  username,
  profileId,
  bio,
  profileUsername
}) => {
  console.log('ProfileHeader - profileId:', profileId, 'profileUsername:', profileUsername);

  return (
    <div className="text-center space-y-2">
      <div className="mt-0">
        <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
      </div>
      
      {/* Show username for all personal profiles */}
      {username && (
        <p className="font-display text-foreground text-lg">{username}</p>
      )}
      
      {/* Bio - Show for all personal profiles */}
      {bio && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{bio}</p>
      )}
    </div>
  );
};

export default ProfileHeader;
