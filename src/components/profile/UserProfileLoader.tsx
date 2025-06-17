
import React from 'react';

interface UserProfileLoaderProps {
  isLoading: boolean;
  profile: any;
}

const UserProfileLoader: React.FC<UserProfileLoaderProps> = ({ isLoading, profile }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground text-base">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground text-base">User not found or profile is private</span>
      </div>
    );
  }

  return null;
};

export default UserProfileLoader;
