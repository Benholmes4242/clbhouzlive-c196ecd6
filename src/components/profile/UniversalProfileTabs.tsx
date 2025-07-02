import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import SocialActivity from './SocialActivity';
import Top100Courses from './Top100Courses';
import HandicapSection from './HandicapSection';

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

  return (
    <div className="mt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-2'} mb-6`}>
          <TabsTrigger value="activity" className="text-sm font-medium">
            Activity
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="handicap" className="text-sm font-medium">
              Handicap & Rounds
            </TabsTrigger>
          )}
          <TabsTrigger value="top100" className="text-sm font-medium">
            Top 100
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-0">
          <SocialActivity
            userId={userId}
            isOwnProfile={isOwnProfile}
            activityVisible={true}
            profileDisplayName={profile?.display_name}
          />
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="handicap" className="mt-0">
            <HandicapSection userId={userId} profile={profile} />
          </TabsContent>
        )}

        <TabsContent value="top100" className="mt-0">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{top100Title}</h2>
              <p className="text-sm text-muted-foreground">
                Track and showcase the world's best golf courses
              </p>
            </div>
            <Top100Courses 
              userId={userId} 
              isOwnProfile={isOwnProfile}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UniversalProfileTabs;