
import React from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';

interface UserProfileLoaderProps {
  isLoading: boolean;
  profile: any;
}

const UserProfileLoader: React.FC<UserProfileLoaderProps> = ({ isLoading, profile }) => {
  console.log('UserProfileLoader - isLoading:', isLoading, 'profile:', profile);
  
  if (isLoading) {
    return <ClubhouzLoading />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-muted-foreground text-base">User not found or profile is private</span>
          <p className="text-sm text-muted-foreground mt-2">
            The profile you're looking for might not exist or isn't public.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default UserProfileLoader;
