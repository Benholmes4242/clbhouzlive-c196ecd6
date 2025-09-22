import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOptimizedProfileData } from '@/hooks/useOptimizedProfileData';
import OptimizedProfileLoader from '@/components/profile/OptimizedProfileLoader';
import OptimizedProfileTabs from '@/components/profile/OptimizedProfileTabs';
import { ProfileHeaderSkeleton } from '@/components/profile/ProfileSkeleton';

const OptimizedProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useSupabaseSession();
  const [activeSection, setActiveSection] = useState('activity');
  
  // For demo, using current user ID - in real app, resolve username to user ID
  const userId = user?.id;
  const isOwnProfile = true; // Would be determined by comparing username
  
  const { data: profileData, isLoading } = useOptimizedProfileData(userId);

  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discover-background">
      {/* Optimized Profile Header - loads instantly with all data */}
      <OptimizedProfileLoader
        userId={userId!}
        isOwnProfile={isOwnProfile}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Optimized Tabs - all data pre-loaded, instant switching */}
      <OptimizedProfileTabs
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userId={userId!}
      />
    </div>
  );
};

export default OptimizedProfilePage;