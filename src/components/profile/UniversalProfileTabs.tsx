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
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  hideActivityTab?: boolean;
}

const UniversalProfileTabs: React.FC<UniversalProfileTabsProps> = ({
  userId,
  profile,
  isOwnProfile,
  activeTab: externalActiveTab,
  onTabChange,
  hideActivityTab = false
}) => {
  const { user } = useSupabaseSession();
  const [internalActiveTab, setInternalActiveTab] = useState('handicap'); // Default to handicap since activity is hidden
  
  // Use external tab state if provided, otherwise use internal state
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  const firstName = profile?.display_name?.split(' ')[0] || profile?.username || 'User';
  const top100Title = isOwnProfile ? 'My Top 100 Golf Courses' : `${firstName}'s Top 100 Golf Courses`;
  const isBusinessAccount = profile?.user_type !== 'individual';

  // For business accounts, only show activity tab (but activity is hidden, so show handicap)
  const showIndividualTabs = !isBusinessAccount;
  
  // Calculate grid columns based on visible tabs
  const gridCols = hideActivityTab && showIndividualTabs ? 'grid-cols-2' : 
                   showIndividualTabs ? 'grid-cols-3' : 'grid-cols-1';

  return (
    <div className="mt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full mb-6 ${gridCols}`}>
          {!hideActivityTab && (
            <TabsTrigger value="activity" className="text-sm font-medium">
              Activity
            </TabsTrigger>
          )}
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

        {!hideActivityTab && (
          <TabsContent value="activity" className="mt-0">
            <SocialActivity
              userId={userId}
              isOwnProfile={isOwnProfile}
              activityVisible={true}
              profileDisplayName={profile?.display_name}
              userType={profile?.user_type || 'individual'}
            />
          </TabsContent>
        )}

        {showIndividualTabs && (
          <>
            <TabsContent value="handicap" className="mt-0">
              <HandicapSection userId={userId} profile={profile} />
            </TabsContent>

            <TabsContent value="top100" className="mt-0">
              <UserCoursesContent 
                username={profile?.username} 
                isOwnProfile={isOwnProfile}
                displayName={profile?.display_name}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default UniversalProfileTabs;