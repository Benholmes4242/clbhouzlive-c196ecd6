import React from 'react';
import { useOptimizedProfileData } from '@/hooks/useOptimizedProfileData';
import { ProfileHeaderSkeleton } from '@/components/skeletons/ProfileSkeleton';
import HeroProfileHeader from './HeroProfileHeader';

interface OptimizedProfileLoaderProps {
  userId: string;
  isOwnProfile: boolean;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const OptimizedProfileLoader: React.FC<OptimizedProfileLoaderProps> = ({
  userId,
  isOwnProfile,
  activeSection = 'activity',
  onSectionChange
}) => {
  const { data, isLoading, error } = useOptimizedProfileData(userId);

  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (error || !data?.profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const { profile } = data;

  // Use the same HeroProfileHeader component for consistent layout
  return (
    <HeroProfileHeader 
      profile={profile}
      isOwnProfile={isOwnProfile}
      onProfileUpdate={() => {
        // Profile update will be handled by the HeroProfileHeader component
      }}
      activeSection={activeSection}
      onSectionChange={onSectionChange}
    />
  );
};

export default OptimizedProfileLoader;