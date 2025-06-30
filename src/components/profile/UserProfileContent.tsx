
import React, { useState } from 'react';
import ProfileCoverSection from '@/components/profile/ProfileCoverSection';
import ProfilePhotoManager from '@/components/profile/ProfilePhotoManager';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfileStatusSection from '@/components/profile/ProfileStatusSection';
import HandicapCard from '@/components/profile/HandicapCard';
import Top100Interactive from '@/components/profile/Top100Interactive';
import AchievementsSection from '@/components/profile/AchievementsSection';
import ProfileTabs from '@/components/profile/ProfileTabs';
import EnhancedSocialActivity from '@/components/profile/EnhancedSocialActivity';
import ProfileSections from '@/components/profile/ProfileSections';
import UserProfileActions from '@/components/profile/UserProfileActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import { useNavigate } from 'react-router-dom';
import { Trophy, MapPin, Users } from 'lucide-react';

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
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const isOwnProfile = user?.id === profile.id;

  const { regionProgress } = useTop100CoursesData(
    profile?.id || '',
    isOwnProfile
  );

  console.log('UserProfileContent - profile:', profile);
  console.log('UserProfileContent - isOwnProfile:', isOwnProfile);
  console.log('UserProfileContent - user.id:', user?.id, 'profile.id:', profile?.id);

  if (!profile) {
    console.log('UserProfileContent - No profile data');
    return null;
  }

  // Mock data for badges and achievements (in real implementation, fetch from backend)
  const userBadges = [
    { id: '1', type: 'club_member' as const, label: 'Club Member', icon: <Users className="h-3 w-3" /> },
  ];

  const achievements = [
    {
      id: '1',
      type: 'first_top100' as const,
      title: 'First Top 100',
      description: 'Played their first Top 100 course',
      icon: <Trophy className="h-4 w-4" />,
      isUnlocked: true,
      unlockedAt: '2024-01-15'
    }
  ];

  const handleRegionClick = (region: string) => {
    if (profile.username) {
      navigate(`/user/${profile.username}/courses`);
    }
  };

  const handleEGConnect = () => {
    // Not applicable for viewing other users
  };

  const handleCoverUpdate = () => {
    // Not applicable for viewing other users
  };

  const handleStatusUpdate = () => {
    // Not applicable for viewing other users
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover Section */}
      <ProfileCoverSection 
        coverImageUrl={profile.cover_image_url}
        isOwnProfile={false}
        onCoverUpdate={handleCoverUpdate}
      />
      
      {/* Profile Photo (overlapping cover) */}
      <div className="relative -mt-20 px-4">
        <ProfilePhotoManager
          user={null}
          profile={profile}
          onProfileUpdate={() => {}}
        />
      </div>

      <div className="px-4 mt-4">
        {/* Basic Profile Info */}
        <ProfileInfo
          profile={profile}
          userEmail={profile.display_name || profile.username}
          userId={profile.id}
          onProfileUpdate={() => {}}
        />

        {/* Status & Badges */}
        <ProfileStatusSection
          statusTagline={profile?.bio}
          badges={userBadges}
          isOwnProfile={false}
          onStatusUpdate={handleStatusUpdate}
        />

        {/* User Actions (Follow/Friend buttons) */}
        {!isOwnProfile && currentUser && (
          <div className="mt-4">
            <UserProfileActions
              targetUserId={profile.id}
              currentUserId={currentUser.id}
              isFollowing={relationshipStatus?.isFollowing || false}
              friendStatus={relationshipStatus?.friendStatus || null}
              username={profile.username || profile.display_name || 'User'}
              targetUserType={profile.user_type || 'individual'}
              currentUserType={currentUser.user_type || 'individual'}
            />
          </div>
        )}

        {/* Tabs Navigation */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          children={{
            overview: (
              <div className="space-y-6">
                {profile.user_type === 'individual' && (
                  <>
                    <HandicapCard
                      handicapIndex={profile?.eg_handicap_index}
                      egAppConnected={profile?.eg_app_connected || false}
                      lastUpdated={profile?.updated_at}
                      isOwnProfile={false}
                      onEGConnect={handleEGConnect}
                    />
                    
                    <Top100Interactive
                      regionProgress={regionProgress}
                      onRegionClick={handleRegionClick}
                      isOwnProfile={false}
                    />
                    
                    <AchievementsSection
                      achievements={achievements}
                      isOwnProfile={false}
                    />
                  </>
                )}
              </div>
            ),
            top100: (
              <ProfileSections
                profile={profile}
                user={profile}
                onEGVisibilityToggle={() => {}}
                isOwnProfile={false}
              />
            ),
            activity: (
              <EnhancedSocialActivity
                userId={profile.id}
                isOwnProfile={false}
                profileDisplayName={profile?.display_name}
              />
            ),
            stats: (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Stats not available</p>
              </div>
            ),
            courses: (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Course details not available</p>
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

export default UserProfileContent;
