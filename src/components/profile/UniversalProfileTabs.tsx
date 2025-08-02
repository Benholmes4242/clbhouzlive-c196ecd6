import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import SocialActivity from './SocialActivity';
import HandicapSection from './HandicapSection';
import UserCoursesContent from '@/components/courses/UserCoursesContent';

interface UniversalProfileTabsProps {
  userId: string;
  profile: any;
  isOwnProfile: boolean;
}

const UniversalProfileTabs: React.FC<UniversalProfileTabsProps> = ({
  userId,
  profile,
  isOwnProfile
}) => {
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState('activity');

  const firstName = profile?.display_name?.split(' ')[0] || profile?.username || 'User';
  const top100Title = isOwnProfile ? 'My Top 100 Golf Courses' : `${firstName}'s Top 100 Golf Courses`;
  const isBusinessAccount = profile?.user_type !== 'individual';

  // For business accounts, only show activity tab
  const showIndividualTabs = !isBusinessAccount;

  return (
    <div className="mt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full mb-6 ${showIndividualTabs ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <TabsTrigger value="activity" className="text-sm font-medium">
            Activity
          </TabsTrigger>
          {showIndividualTabs && (
            <>
              <TabsTrigger value="handicap" className="text-sm font-medium">
                Handicap & Rounds
              </TabsTrigger>
              <TabsTrigger value="top100" className="text-sm font-medium">
                Top 100
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="activity" className="mt-0">
          <SocialActivity
            userId={userId}
            isOwnProfile={isOwnProfile}
            activityVisible={true}
            profileDisplayName={profile?.display_name}
            userType={profile?.user_type || 'individual'}
          />
        </TabsContent>

        {showIndividualTabs && (
          <>
            <TabsContent value="handicap" className="mt-0">
              <HandicapSection userId={userId} profile={profile} />
            </TabsContent>

            <TabsContent value="top100" className="mt-0 relative">
              {/* Backdrop blur overlay that extends down to cover first two cards */}
              <div 
                className="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20 pointer-events-none"
                style={{
                  height: '1000px',
                  borderRadius: '16px',
                  zIndex: 1
                }}
              />
              
              {/* Content with higher z-index */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-white">Top 100 courses</h2>
                </div>
                <UserCoursesContent 
                  username={profile?.username} 
                  isOwnProfile={isOwnProfile}
                  displayName={profile?.display_name}
                />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default UniversalProfileTabs;