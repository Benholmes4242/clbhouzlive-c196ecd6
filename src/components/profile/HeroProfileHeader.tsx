import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

// Import content components
import ActivityFeed from '@/components/profile/ActivityFeed';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import AchievementsPane from '@/components/profile/AchievementsPane';
import ThomasHandicapLayout from './handicap/ThomasHandicapLayout';

interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  profile_photo_url?: string | null;
  bio?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
}

interface HeroProfileHeaderProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onProfileUpdate?: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const HeroProfileHeader: React.FC<HeroProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onProfileUpdate,
  activeSection,
  onSectionChange
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Mock stats for now - can be replaced with real data later
  const mockStats = {
    totalPosts: 22,
    totalXp: 2500,
    following: 10,
    followers: 9
  };
  
  // Cover photo - using a default golf course image for now
  const coverPhotoUrl = profile?.profile_photo_url || '/lovable-uploads/c5942847-3fa2-4d88-910f-c6e3724268d8.png';
  
  // Format stats for display
  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatXP = (xp: number | undefined): string => {
    if (!xp) return '0';
    if (xp >= 1000) {
      return `${Math.floor(xp / 100) / 10}k`;
    }
    return xp.toString();
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'courses':
        return <UserCoursesContent username={profile?.username} isOwnProfile={isOwnProfile} />;
      case 'achievements':
        return (
          <AchievementsPane 
            userId={user?.id}
            userDisplayName={profile?.display_name}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            isCurrentUser={isOwnProfile}
          />
        );
      case 'handicap':
        return <ThomasHandicapLayout />;
      case 'activity':
      default:
        return (
          <ActivityFeed 
            userId={user?.id || ''} 
            isOwnProfile={isOwnProfile}
            profileDisplayName={profile?.display_name}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
          />
        );
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <>
      {/* Full-bleed cover photo */}
      <div 
        className="relative w-full bg-gradient-to-br from-green-50 to-green-100"
        style={{ 
          height: isMobile ? '44vh' : '48vh',
          minHeight: '320px',
          maxHeight: '520px'
        }}
      >
        <img 
          src={coverPhotoUrl}
          alt="Profile cover"
          className="w-full h-full object-cover"
        />
        {/* Subtle fade at bottom for smooth card overlap */}
        <div 
          className="absolute left-0 right-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white pointer-events-none"
        />
      </div>

      {/* Overlapping white card */}
      <div className="relative -mt-14 mx-3 mb-6 transform">
        <Card 
          className="bg-white border border-[#EEF1F4]"
          style={{
            borderRadius: '24px 24px 20px 20px',
            boxShadow: 'var(--profile-card-shadow)'
          }}
        >
          <CardContent className="p-5">
            {/* Name and handle - centered */}
            <div className="text-center mb-4">
              <h1 
                className="font-bold leading-8 mb-1.5"
                style={{ 
                  color: 'hsl(var(--profile-text-primary))',
                  fontSize: isMobile ? '24px' : '28px',
                  lineHeight: '32px'
                }}
              >
                {profile.display_name}
              </h1>
              <div 
                className="font-medium"
                style={{ 
                  color: 'hsl(var(--profile-text-secondary))',
                  fontSize: '15px',
                  lineHeight: '22px'
                }}
              >
                @{profile.username}
              </div>
            </div>

            {/* Home Club and Handicap - two columns */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <div 
                  className="font-semibold mb-1"
                  style={{ 
                    color: 'hsl(var(--profile-text-secondary))',
                    fontSize: '12px',
                    lineHeight: '16px'
                  }}
                >
                  Home Club
                </div>
                <div 
                  className="font-semibold"
                  style={{ 
                    color: 'hsl(var(--profile-text-primary))',
                    fontSize: '16px',
                    lineHeight: '22px'
                  }}
                >
                  {profile.home_club || 'Not set'}
                </div>
              </div>
              <div>
                <div 
                  className="font-semibold mb-1"
                  style={{ 
                    color: 'hsl(var(--profile-text-secondary))',
                    fontSize: '12px',
                    lineHeight: '16px'
                  }}
                >
                  Handicap
                </div>
                <div 
                  className="font-semibold"
                  style={{ 
                    color: 'hsl(var(--profile-text-primary))',
                    fontSize: '16px',
                    lineHeight: '22px'
                  }}
                >
                  {profile.eg_handicap_index ? profile.eg_handicap_index.toFixed(1) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Edit Profile button */}
            {isOwnProfile && (
              <Button
                variant="outline"
                className="w-full h-11 font-semibold border-[#E9ECF1] hover:bg-gray-50"
                style={{ 
                  borderRadius: '12px',
                  fontSize: '16px',
                  lineHeight: '22px'
                }}
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats tiles */}
      <div className={`mx-3 mb-4 ${isMobile && window.innerWidth < 375 ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-4 gap-2.5'}`}>
        {[
          { label: 'Posts', value: formatNumber(mockStats?.totalPosts) },
          { label: 'Total XP', value: formatXP(mockStats?.totalXp) },
          { label: 'Following', value: formatNumber(mockStats?.following) },
          { label: 'Followers', value: formatNumber(mockStats?.followers) }
        ].map((stat, index) => (
          <Card 
            key={index}
            className="bg-white border border-[#F1F3F6]"
            style={{ 
              borderRadius: '14px',
              minHeight: '74px',
              boxShadow: 'var(--stats-tile-shadow)'
            }}
          >
            <CardContent className="p-3 text-center flex flex-col justify-center h-full">
              <div 
                className="font-bold mb-0.5"
                style={{ 
                  color: 'hsl(var(--profile-text-primary))',
                  fontSize: '20px',
                  lineHeight: '24px'
                }}
              >
                {stat.value}
              </div>
              <div 
                className="font-medium"
                style={{ 
                  color: 'hsl(var(--profile-text-secondary))',
                  fontSize: '13px',
                  lineHeight: '18px'
                }}
              >
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs navigation */}
      <div className="mx-3 mb-4">
        <Tabs value={activeSection} onValueChange={onSectionChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-transparent p-0 gap-1">
            {['activity', 'courses', 'achievements', 'handicap'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={`
                  h-full capitalize rounded-lg relative
                  data-[state=active]:bg-transparent data-[state=active]:shadow-none
                  data-[state=inactive]:text-[hsl(var(--profile-text-secondary))]
                  hover:text-[hsl(var(--profile-text-primary))] transition-colors
                  ${activeSection === tab ? 
                    'text-[hsl(var(--profile-brand))] border-b-2 border-[hsl(var(--profile-brand))] rounded-b-none' : 
                    'text-[hsl(var(--profile-text-secondary))]'
                  }
                `}
                style={{ 
                  fontSize: '15px',
                  fontWeight: '600',
                  lineHeight: '20px'
                }}
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content sections */}
      <div className="mx-3">
        {renderContent()}
      </div>
    </>
  );
};

export default HeroProfileHeader;